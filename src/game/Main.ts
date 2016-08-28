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

        viewPort = new ViewPort(800, 600);
        game.init(imageMap, soundMap, boundingBoxes, context, viewPort, level);

        player = new Player(new Soldier(new Point(300, 700), new Vector(1, 0)));

        game.scene.add(player.object);
        viewPort.centerOn(player.object);

        game.inputRegistry.attachCustomListener(true, 'click', clickHandler);

        attachListeners();

        game.attachNetworkHandler('serverpush', onServerPush);

        game.attachNetworkHandler('playerdisconnected', onPlayerDisconnected);

        game.begin([applyServerPushData, userInputCallback, processProjectiles], [sendClientState, clearFrameState]);
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
            return undefined;
        }
    }

    /*------ Network functions ------*/
    function sendClientState() {
        try {
            game.emitNetworkData('clientUpdate',
                networkPayloadBuilder.build(
                    [{type: 'Soldier', object: player.object}],
                    firedProjectiles,
                    impacts,
                    game.serverTimeOffset));
        } catch(e) {
            console.error(e || e.message);
        }
    }

    function onServerPush(data) {
        serverPushQueue.push(data);
    }

    function applyServerPushData() {
        var objects = [];
        var projectiles = [];
        var impacts = [];

        for (var i in serverPushQueue) {
            objects.push.apply(objects, serverPushQueue[i].objects);
            projectiles.push.apply(projectiles, serverPushQueue[i].projectiles);
            impacts.push.apply(impacts, serverPushQueue[i].impacts);
        }

        updateObjects(objects);
        updateProjectiles(projectiles);
        updateImpacts(impacts);
    }

    function onPlayerDisconnected(data) {
        for (let i in data) {
            for (let j in game.scene.objects) {
                if (data[i].networkUid === game.scene.objects[j].networkUid) {
                    game.scene.remove(game.scene.objects[j]);
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
                    <number>proj.timestamp)
                projectiles.push(bullet);
                game.scene.add(bullet.object);
                game.triggerEvent(EVENTS.AUDIO, {soundId: 'fire'});
            }
        }
    }

    function updateImpacts(data) {
        var objectsByNetworkUid = [];
        for (let i in game.scene.objects) {
            let object:BasicObject = game.scene.objects[i];
            objectsByNetworkUid[object.networkUid] = object;
        }

        for (let i in data) {
            let impact = data[i];
            let object:BasicObject = objectsByNetworkUid[impact.object];

            if (typeof object === 'undefined') {
                continue;
            }

            if (object.gfx && object.gfx.blood.enabled) {
                game.scene.add(new BloodStain(object.position));
            }
        }
        return;
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
        var newObject;
        try {
            var template = `(function() {return new Crate.${data.type}();})()`;
            newObject = eval(template);
        } catch(e) {
            // stay silent
        }

        if (typeof newObject === 'undefined') {
            // fall back option
            newObject = new BasicObject();
        }

        updateProperties(newObject, data);
        return newObject;
    }

    /*------ Misc functions ------*/
    function fireBullet(origin:Point, direction:Vector) {
        var bullet:Projectile = new Bullet(origin, direction)
        if (typeof bullet === 'undefined') {
            return;
        }
        game.scene.add(bullet.object);
        game.triggerEvent(EVENTS.AUDIO, {soundId: 'fire'});

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