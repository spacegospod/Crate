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
    var firedProjectiles: Projectile[] = [];

    var networkPayloadBuilder: NetworkPayloadBuilder = new NetworkPayloadBuilder();
    var inputController: InputController;

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

        inputController = new InputController(game.inputRegistry);

        player = new Player(new Soldier(new Point(0, 0), new Vector(1, 0)));

        // request spawn
        player.isAlive = false;
        sendPlayerDied();

        attachListeners();
        attachNetworkHandlers();

        game.begin([
            applyServerPushData,
            userInputCallback,
            processProjectiles], [
            sendClientState,
            drawHud,
            clearFrameState]);
    }

    function attachListeners() {
        addEventListener('objectExpired', (e: any) => {
            game.scene.remove(e.detail.object);
        });
    }

    function attachNetworkHandlers() {
        game.attachNetworkHandler('serverpush', onServerPush);

        game.attachNetworkHandler('spawnPlayer', onPlayerSpawned);

        game.attachNetworkHandler('playerdisconnected', onPlayerDisconnected);
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
                        object: object.networkUid,
                        damage: projectile.damage
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

        context.fillText('HEALTH: ' + Math.floor(player.health), 25, viewPort.height - 20);
        context.fillText('AMMO: ' + Math.floor(player.weapon.magazineAmmo) + ' / ' + Math.floor(player.weapon.remainingAmmo),
            668, viewPort.height - 20);

        // reset globals
        context.fillStyle = originalFillStyle;
        context.globalAlpha = originalAlpha;
    }

    function clearFrameState(environment) {
        firedProjectiles = [];
        impacts = [];
        serverPushQueue = [];
        // temporary
        player.health = Math.min(Player.MAX_HEALTH, player.health + (1 * environment.delta.getDelta()));
    }

    /*------ Input handlers ------*/

    function userInputCallback(environment) {
        processKeys(environment);
        processMouse(environment);
    }

    function processKeys(environment) {
        (<DynamicObject>player.object).speed = 0;
        var movementVector:Vector = inputController.processMovement();
        var directionVectors = [];
        if (typeof movementVector !== 'undefined' && VU.length(movementVector) != 0) {
            (<DynamicObject>player.object).direction = movementVector;
            (<DynamicObject>player.object).speed = Soldier.SPEED;
        }

        if (!player.weapon.isReloading() && inputController.isKeyPressed('R')) {
            player.weapon.reload();
        }
    }

    function processMouse(environment) {
        player.object.rotation = inputController.processRotation(viewPort, _canvas, player.object.position);
        if (inputController.isLeftMouseBtnPressed() && player.weapon.isReadyToFire && !player.weapon.isFiring) {
            weaponFireHandler();
        }
    }

    /*------ Network functions ------*/
    function sendClientState() {
        try {
            var objects = [];
            if (player.isAlive) {
                objects.push({object: player.object});
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

        player.weapon.remainingAmmo = 90;
        player.weapon.magazineAmmo = 30;

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
                    var objectToRemove:BasicObject = game.scene.objects[j];
                    // The timeout is needed because the server might push some leftover updates
                    // and re-place the disconnected player on the scene
                    setTimeout(() => {
                        game.scene.remove(objectToRemove);
                    }, 5000);
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
                    proj.damage,
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

        var objectsByNetworkUid = {};
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
                && impact.object === player.object.networkUid
                && typeof impact.damage !== 'undefined') {
                player.health -= impact.damage;
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
                var object:BasicObject = game.scene.objects[j];
                if (object.networkUid === networkUid) {
                    objectsToRemove.push(object);
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
    function weaponFireHandler() {
        if (!inputController.isLeftMouseBtnPressed()) {
            player.weapon.isFiring = false;
            return;
        }

        player.weapon.isFiring = true;

        if (player.weapon.isReadyToFire() && !player.weapon.isReloading() && player.weapon.magazineAmmo > 0) {
            var projectile:Projectile = player.weapon.fire(
                    player.projectileOrigin,
                    player.projectileDirection);

            fireProjectile(projectile, player.weapon.soundId);
        }
        setTimeout(() => {weaponFireHandler();}, player.weapon.fireInterval);
    }

    function fireProjectile(projectile:Projectile, soundId:string) {
        game.scene.add(projectile.object);

        var distance:number = VU.length(VU.createVector(player.object.position, projectile.origin));
        var volume:number = (2500 - distance) / 2500;
        game.triggerEvent(EVENTS.AUDIO, {soundId: soundId, volume: volume});

        projectiles.push(projectile);
        firedProjectiles.push(projectile);
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