namespace Crate {
    /*------ Main game file ------*/

    var _canvas;
    var player: Player;
    var game: Game;
    var viewPort: ViewPort;
    var projectiles: Projectile[] = [];
    var impacts = [];

    var serverPushQueue = [];

    // All projectiles fired during the current frame
    var firedProjectiles:Projectile[] = [];

    var networkPayloadBuilder: NetworkPayloadBuilder = new NetworkPayloadBuilder();

    export function loadGame(canvas, context, imageMap, soundMap, boundingBoxes, levelData, io) {
        _canvas = canvas;
        game = new Game(canvas, io);
        var levelParser = new LevelParser();
        levelParser.registerCustomObject('Soldier', function(data) {
            return new Soldier();
        });
        var level = levelParser.parse(levelData);

        viewPort = new ViewPort(canvas.width, canvas.height);
        game.init(imageMap, soundMap, boundingBoxes, context, viewPort, level);

        player = new Player(new Soldier(new Point(0, 0), new Vector(1, 0)));
        player.isAlive = false;

        // request spawn
        sendPlayerDied();
        viewPort.centerOn(player.object);

        game.inputRegistry.attachCustomListener(true, 'click', clickHandler);

        attachListeners();

        game.attachNetworkHandler('serverpush', onServerPush);

        game.attachNetworkHandler('spawnPlayer', onPlayerSpawned);

        game.attachNetworkHandler('playerdisconnected', onPlayerDisconnected);

        game.begin([applyServerPushData, userInputCallback, processProjectiles], [sendClientState, drawHud, clearFrameState]);
    }

    function attachListeners() {
        addEventListener('objectExpired', (e: any) => {
            game.scene.remove(e.detail.object);
        });
    }

    /*------ Game loop callbacks ------*/

    function processProjectiles(environment) {
        // for each projectile
        for (var i in projectiles) {
            var projectile:Projectile = projectiles[i];
            if (projectile.ttl <= 0) {
                projectiles.splice(projectiles.indexOf(projectile), 1);
                game.scene.remove(projectile.object);
            } else {
                // test against each collidable object
                processProjectile(projectile, environment);
                projectile.update();
            }
        }
    }

    function processProjectile(projectile:Projectile, environment) {
        var position:Point = projectile.getPosition(Date.now());
        for (var j in game.scene.objects) {
            var object:BasicObject = game.scene.objects[j];
            if (object.collidable && typeof object.boundingBox !== 'undefined') {
                var data:Point[] = environment.collision.line.getIntersectionDataForProjectile(projectile, object.boundingBox, environment.delta);
                // We use 1 bounding box per object -> we cannot have more than two intersection points
                if (typeof data === 'undefined') {
                    continue;
                } else if (data.length > 0) {
                    impacts.push({
                        projectile: projectile.object.networkUid,
                        object: object.networkUid
                    });
                    projectiles.splice(projectiles.indexOf(projectile), 1);
                    game.scene.remove(projectile.object);
                    return;
                }
            }
        }
        projectile.object.position = position;
    }

    function drawHud() {
        var context = _canvas.getContext('2d');

        var originalFillStyle = context.fillStyle;
        var originalAlpha = context.globalAlpha;
        context.font = '20px Impact';
        context.fillStyle = '#ffff00';
        context.globalAlpha = 0.7;
        context.fillText('HEALTH: ' + player.health, 25, viewPort.height - 20);

        // reset globals
        context.fillStyle = originalFillStyle;
        context.globalAlpha = originalAlpha;
    }

    function clearFrameState() {
        firedProjectiles = [];
        impacts = [];
        serverPushQueue = [];
    }

    /*------ Input handlers ------*/

    function userInputCallback(environment) {
        processKeys(environment);
        processMouse(environment);
    }

    function processKeys(environment) {
        var directionVectors = [];
        (<DynamicObject>player.object).speed = 0;

        // A
        if (environment.input.getKeyStatus(65)) {
            directionVectors.push(new Vector(-1, 0));
        }
        // W
        if (environment.input.getKeyStatus(87)) {
            directionVectors.push(new Vector(0, -1));
        }
        // D
        if (environment.input.getKeyStatus(68)) {
            directionVectors.push(new Vector(1, 0));
        }
        // S
        if (environment.input.getKeyStatus(83)) {
            directionVectors.push(new Vector(0, 1));
        }

        if (directionVectors.length > 0) {
            var direction = directionVectors[0];
            for (var i = 1; i < directionVectors.length; i++) {
                direction = VU.sumVectors(direction, directionVectors[i]);
            }
            if (typeof direction !== 'undefined' && VU.length(direction) != 0) {
                (<DynamicObject>player.object).direction = direction;
                (<DynamicObject>player.object).speed = Soldier.SPEED;
            }
        }
    }

    function processMouse(environment) {
        var mousePosition = environment.input.getMousePosition();
        // correct for canvas offset on screen
        mousePosition.x -= _canvas.getBoundingClientRect().left;
        mousePosition.y -= _canvas.getBoundingClientRect().top;
        var playerPosition = environment.viewport.translateInViewport(player.object.position);

        var directionVector:Vector = VU.createVector(mousePosition, playerPosition);

        var angle = VU.findAngle(
            new Vector(0, 1),
            directionVector);

        player.object.rotation = directionVector.x > 0 ? 360 - angle : angle;
    }

    function clickHandler(event) {
        try {
            fireBullet((<Soldier>player.object).projectileOrigin, (<Soldier>player.object).projectileDirection);
        } catch(e) {
            // player is not a soldier, can't fire
        }
    }

    /*------ Network functions ------*/
    function sendClientState() {
        try {
            var objects = [];
            if (player.isAlive) {
                objects.push({type: 'Soldier', object: player.object});
            }

            game.emitNetworkData('clientUpdate',
                networkPayloadBuilder.build(
                    objects,
                    firedProjectiles,
                    impacts,
                    game.serverTimeOffset));
        } catch(e) {
            console.error(e || e.message);
        }
    }

    function sendPlayerDied() {
        game.emitNetworkData(
            'playerDied',
            {
                objectsToRemove: [
                    player.object.networkUid
                ]
            });
    }

    function onServerPush(data) {
        serverPushQueue.push(data);
    }

    function onPlayerSpawned(data) {
        player.health = Player.MAX_HEALTH;
        player.isAlive = true;

        game.scene.remove(player.object);
        player.object = new Soldier(new Point(data.location.x, data.location.y), new Vector(0, 1));
        game.scene.add(player.object);
        viewPort.centerOn(player.object);
    }

    function applyServerPushData() {
        var objects = [];
        var projectiles = [];
        var impacts = [];
        var objectsToRemove = [];

        for (var i in serverPushQueue) {
            objects.push.apply(objects, serverPushQueue[i].objects);
            projectiles.push.apply(projectiles, serverPushQueue[i].projectiles);
            impacts.push.apply(impacts, serverPushQueue[i].impacts);
            objectsToRemove.push.apply(objectsToRemove, serverPushQueue[i].objectsToRemove);
        }

        updateObjects(objects);
        updateProjectiles(projectiles);
        updateImpacts(impacts);
        updateObjectsToRemove(objectsToRemove);
    }

    function onPlayerDisconnected(data) {
        for (let i in data) {
            for (let j in game.scene.objects) {
                if (data[i].networkUid === game.scene.objects[j].networkUid) {
                    // The timeout is needed because the server might push some leftover updates
                    // and re-place the disconnected player on the scene
                    setTimeout(() => {game.scene.remove(game.scene.objects[j]);}, 1000);
                }
            }
        }
    }

    function updateObjects(data) {
        function updateObject(data) {
            for (let i in game.scene.objects) {
                var object = game.scene.objects[i];
                if (object.networkUid != data.networkUid) {
                    continue;
                }

                if (!(data.networkUid == player.object.networkUid)) {
                    updateProperties(object, data);
                }
                return;
            }

            // object not found, create
            var newobj = createObject(data);
            if (typeof newobj !== 'undefined') {
                game.scene.add(newobj);
            }
        }

        for (let i in data) {
            updateObject(data[i]);
        }
    }

    function updateProjectiles(data) {
        for (let i in data) {
            var proj = data[i];
            if (isNetworkUIDUnique(proj.object.networkUid)) {
                var bullet = new Projectile(
                    new Point(proj.origin.x, proj.origin.y),
                    new Vector(proj.direction.x, proj.direction.y),
                    <number>proj.speed,
                    createObject(proj.object),
                    <number>proj.timestamp - game.serverTimeOffset);
                projectiles.push(bullet);
                game.scene.add(bullet.object);
                var distance:number = VU.length(VU.createVector(player.object.position, proj.origin));
                var volume:number = (2500 - distance) / 2500;
                game.triggerEvent(EVENTS.AUDIO, {soundId: 'fire', volume: volume});
            }
        }
    }

    function updateImpacts(data) {
        if (typeof data === 'undefined' || data.length === 0) {
            return;
        }

        // filters out duplicates
        function filterImpacts(impacts) {
            var result = [];
            for (var i = 0; i < impacts.length; i++) {
                var isDuplicate = false;
                var impact = impacts[i];
                for (var j = i + 1; j < impacts.length; j++) {
                    if (impact.object === impacts[j].object
                        && impact.projectile === impacts[j].projectile) {
                        isDuplicate = true;
                    }
                }

                if (!isDuplicate) {
                    result.push(impact);
                }
            }

            return result;
        }

        var objectsByNetworkUid = [];
        for (let i in game.scene.objects) {
            let object:BasicObject = game.scene.objects[i];
            objectsByNetworkUid[object.networkUid] = object;
        }

        var filteredImpacts = filterImpacts(data);

        for (let i in filteredImpacts) {
            let impact = filteredImpacts[i];
            let object:BasicObject = objectsByNetworkUid[impact.object];

            if (typeof object === 'undefined') {
                continue;
            }

            if (object.gfx && object.gfx.blood.enabled) {
                game.scene.add(new BloodStain(object.position));
            }

            if (typeof player.object !== 'undefined'
                && impact.object === player.object.networkUid) {
                player.health -= Math.floor((Math.random() * 10) + 1);
            }
        }

        if (player.health <= 0) {
            player.isAlive = false;
            game.scene.remove(player.object);
            sendPlayerDied();
        }

        return;
    }

    function updateObjectsToRemove(networkUids) {
        var objectsToRemove = [];
        for (var i in networkUids) {
            var networkUid = networkUids[i];
            for (var j in game.scene.objects) {
                if (game.scene.objects[j].networkUid === networkUid) {
                    objectsToRemove.push(game.scene.objects[j]);
                }
            }
        }

        for (var i in objectsToRemove) {
            game.scene.remove(objectsToRemove[i]);
        }
    }

    function updateProperties(object:BasicObject, props) {
        if (typeof props.position !== 'undefined') {
            object.position = props.position;
        }
        if (typeof props.rotation !== 'undefined') {
            object.rotation = props.rotation;
        }
        if (typeof props.collidable !== 'undefined') {
            object.collidable = props.collidable;
        }
        if (typeof props.networkUid !== 'undefined') {
            object.networkUid = props.networkUid;
        }
        if (typeof props.zIndex !== 'undefined') {
            object.zIndex = props.zIndex;
        }
        if (typeof props.gfx !== 'undefined') {
            object.gfx.motionBlur.enabled = props.gfx.motionBlur;
            object.gfx.blood.enabled = props.gfx.blood;
        }
        if (props.imageKey && props.imageKey != object.imageKey) {
            object.imageKey = props.imageKey;
        }
    }

    function createObject(data):BasicObject {
        var constructorFunction = Crate[data.type] || BasicObject;
        var newObject = new constructorFunction();

        updateProperties(newObject, data);
        return newObject;
    }

    /*------ Misc functions ------*/
    function fireBullet(origin:Point, direction:Vector) {
        var bullet:Projectile = new Bullet(origin, direction);
        if (typeof bullet === 'undefined') {
            return;
        }
        game.scene.add(bullet.object);

        var distance:number = VU.length(VU.createVector(player.object.position, origin));
        var volume:number = (2500 - distance) / 2500;
        game.triggerEvent(EVENTS.AUDIO, {soundId: 'fire', volume: volume});

        projectiles.push(bullet);
        firedProjectiles.push(bullet);
    }

    function isNetworkUIDUnique(uid:string) {
        for (let i in game.scene.objects) {
            if (game.scene.objects[i].networkUid === uid) {
                return false;
            }
        }

        return true;
    }
}