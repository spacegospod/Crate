namespace Crate {
    /*------ Main game file ------*/

    var _canvas;
    var player: Player;
    var game: Game;
    var viewPort: ViewPort;
    var projectiles: Projectile[] = [];

    var inputController: InputController;
    var networkState: NetworkStateController;
    var updatesProcessor: ServerUpdatesProcessor;

    var isPlayerSpawning: boolean = false;

    export function loadGame(canvas, context, imageMap, soundMap, boundingBoxes, levelData, io) {
        _canvas = canvas;
        game = new Game(canvas, io);
        var levelParser = new LevelParser();
        registerCustomObjects(levelParser);
        
        var level = levelParser.parse(levelData);

        viewPort = new ViewPort(canvas.width, canvas.height);
        game.init(imageMap, soundMap, boundingBoxes, context, viewPort, level);

        player = new Player(new Soldier(new Point(0, 0), new Vector(1, 0)));

        inputController = new InputController(game.inputRegistry);

        networkState = new NetworkStateController(game);
        updatesProcessor = new ServerUpdatesProcessor(game, player);

        // request spawn
        player.isAlive = false;
        isPlayerSpawning = true;
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
        game.attachNetworkHandler('serverpush', (data) => { networkState.onServerPush(data); });

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
                    networkState.impacts.push({
                        projectile: projectile.object.networkUid,
                        object: object.networkUid,
                        damage: projectile.damage
                    });
                    projectiles.splice(projectiles.indexOf(projectile), 1);
                    game.scene.remove(projectile.object);

                    if (object.sfx.onHit.sounds.length > 0) {
                        var soundId = object.sfx.onHit.sounds[Math.floor(Math.random() * object.sfx.onHit.sounds.length)];
                        var distance:number = VU.length(VU.createVector(player.object.position, object.position));
                        var volume:number = (1000 - distance) / 1000;

                        game.triggerEvent(EVENTS.AUDIO, {soundId: soundId, volume: volume});

                        networkState.triggeredSounds.push({
                            soundId: soundId,
                            origin: {
                                x: object.position.x,
                                y: object.position.y
                            },
                            maxRange: 1000
                        });
                    }
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

        if (player.weapon.isReloading()) {
            context.fillStyle = '#dd3333';
            context.globalAlpha = Math.abs(Math.sin( (Date.now() / 1500) * Math.PI ) );

            var mousePosition:Point = game.inputRegistry.getMousePosition();
            context.fillText('RELOADING', mousePosition.x - 43, mousePosition.y + 34);
        }

        // reset globals
        context.fillStyle = originalFillStyle;
        context.globalAlpha = originalAlpha;
    }

    function clearFrameState(environment) {
        if (!player.isAlive && !isPlayerSpawning) {
            sendPlayerDied();
        }

        networkState.clear();
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
            (<DynamicObject>player.object).speed = game.inputRegistry.getKeyStatus(16)
                ? Soldier.SPEED / 2
                : Soldier.SPEED;

            if (player.object.sfx.onMove.sounds.length > 0 && player.object.sfx.onMove.isReady) {
                var soundId = player.object.sfx.onMove.sounds[Math.floor(Math.random() * player.object.sfx.onMove.sounds.length)];

                if (!game.inputRegistry.getKeyStatus(16)) {
                    game.triggerEvent(EVENTS.AUDIO, {soundId: soundId, volume: 1});

                    networkState.triggeredSounds.push({
                        soundId: soundId,
                        origin: {
                            x: player.object.position.x,
                            y: player.object.position.y
                        },
                        maxRange: 1000
                    });
                }
                

                player.object.sfx.onMove.isReady = false;
                setTimeout(function() {
                    player.object.sfx.onMove.isReady = true;
                }, 450);
            }
        }

        if (inputController.isKeyPressed('R')
                && !player.weapon.isReloading()
                && !(player.weapon.remainingAmmo === 0)) {
            player.weapon.reload();
            game.triggerEvent(EVENTS.AUDIO, {soundId: player.weapon.clipOutSoundId, volume: 1});

            networkState.triggeredSounds.push({
                    soundId: player.weapon.clipOutSoundId,
                    origin: {
                        x: player.object.position.x,
                        y: player.object.position.y
                    },
                    maxRange: 1000
                });

            setTimeout(function() {
                game.triggerEvent(EVENTS.AUDIO, {soundId: player.weapon.clipInSoundId, volume: 1});
                networkState.triggeredSounds.push({
                    soundId: player.weapon.clipInSoundId,
                    origin: {
                        x: player.object.position.x,
                        y: player.object.position.y
                    },
                    maxRange: 1000
                });
            }, player.weapon.reloadTime - 200);
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
        networkState.sendClientState(player);
    }

    function sendPlayerDied() {
        isPlayerSpawning = true;
        game.emitNetworkData(
            'playerDied',
            {
                objectsToRemove: [
                    player.object.networkUid
                ]
            });
    }

    function onPlayerSpawned(data) {
        isPlayerSpawning = false;
        player.health = Player.MAX_HEALTH;
        player.isAlive = true;

        player.weapon = new AutomaticRifle();

        game.scene.remove(player.object);
        player.object = new Soldier(new Point(data.location.x, data.location.y), new Vector(0, 1));
        game.scene.add(player.object);
        viewPort.centerOn(player.object);
    }

    function applyServerPushData() {
        var data = networkState.getServerPushData(game.connectionData.socketId);
        var result = updatesProcessor.apply(data, projectiles);
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

    /*------ Misc functions ------*/
    function weaponFireHandler() {
        if (!inputController.isLeftMouseBtnPressed()) {
            player.weapon.isFiring = false;
            return;
        }

        player.weapon.isFiring = true;

        if (player.isAlive
            && player.weapon.isReadyToFire()
            && !player.weapon.isReloading()
            && player.weapon.magazineAmmo > 0) {
            var projectile:Projectile = player.weapon.fire(
                    player.projectileOrigin,
                    player.projectileDirection);

            fireProjectile(projectile);
        }
        setTimeout(() => {weaponFireHandler();}, player.weapon.fireInterval);
    }

    function fireProjectile(projectile:Projectile) {
        game.scene.add(projectile.object);

        var distance:number = VU.length(VU.createVector(player.object.position, projectile.origin));
        var volume:number = (2500 - distance) / 2500;
        game.triggerEvent(EVENTS.AUDIO, {soundId: projectile.soundId, volume: volume});

        projectiles.push(projectile);
        networkState.firedProjectiles.push(projectile);
    }

    function registerCustomObjects(parser:LevelParser) {
        parser.registerCustomObject('Soldier', function(data) {
            return new Soldier();
        });
        parser.registerCustomObject('BloodStain', function(data) {
            return new BloodStain();
        });
        parser.registerCustomObject('CarGreen', function(data) {
            return new CarGreen();
        });
        parser.registerCustomObject('CrateOriginal', function(data) {
            return new CrateOriginal();
        });
        parser.registerCustomObject('CrateGreen', function(data) {
            return new CrateGreen();
        });
        parser.registerCustomObject('Foliage1', function(data) {
            return new Foliage1();
        });
        parser.registerCustomObject('Foliage2', function(data) {
            return new Foliage2();
        });
        parser.registerCustomObject('Foliage3', function(data) {
            return new Foliage3();
        });
        parser.registerCustomObject('Plant1', function(data) {
            return new Plant1();
        });
        parser.registerCustomObject('Plant2', function(data) {
            return new Plant2();
        });
        parser.registerCustomObject('Plant3', function(data) {
            return new Plant3();
        });
        parser.registerCustomObject('Tree1', function(data) {
            return new Tree1();
        });
    }
}