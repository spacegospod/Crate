namespace Crate {
    /*------ Main game file ------*/

    let _canvas;
    let player: Player;
    let game: Game;
    let viewPort: ViewPort;
    let projectiles: Projectile[] = [];
    let grenades: Grenade[] = [];

    let inputController: InputController;
    let networkState: NetworkStateController;
    let updatesProcessor: ServerUpdatesProcessor;

    let isPlayerSpawning: boolean = false;
    let frameBeginTime: number;

    let createdNetworkObjects:BasicObject[] = [];

    const SOUND_FADE_DISTANCE: number = 900;

    export function loadGame(canvas, context, imageMap, soundMap, boundingBoxes, levelData, io) {
        _canvas = canvas;
        game = new Game(canvas, io);
        let levelParser = new LevelParser();
        registerCustomObjects(levelParser);
        
        let level = levelParser.parse(levelData);

        viewPort = new ViewPort(canvas.width, canvas.height);
        game.init(imageMap, soundMap, boundingBoxes, context, viewPort, level);

        player = new Player(new Soldier(new Point(0, 0), new Vector(1, 0)));

        inputController = new InputController(game.inputRegistry);

        networkState = new NetworkStateController(game);
        updatesProcessor = new ServerUpdatesProcessor(game, player);

        // request spawn
        player.isAlive = false;
        isPlayerSpawning = true;

        attachListeners();
        attachNetworkHandlers();

        game.begin([
            prepareFrame,
            applyServerPushData,
            userInputCallback,
            processProjectiles,
            processGrenades], [
            sendClientState,
            drawHud,
            clearFrameState]);
    }

    function attachListeners() {
        addEventListener('objectExpired', (e: any) => {
            game.scene.removeObject(e.detail.object);
        });

        addEventListener('animationExpired', (e: any) => {
            game.scene.removeAnimation(e.detail.animation);
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
        for (let i in projectiles) {
            let projectile:Projectile = projectiles[i];
            if (projectile.ttl <= 0) {
                projectiles.splice(projectiles.indexOf(projectile), 1);
                game.scene.removeObject(projectile.object);
            } else {
                // test against each collidable object
                processProjectile(projectile, environment);
                projectile.update();
            }
        }
    }

    function processProjectile(projectile:Projectile, environment) {
        let position:Point = projectile.getPosition(Date.now());
        for (let j in game.scene.objects) {
            let object:BasicObject = game.scene.objects[j];
            if (object.collidable && typeof object.boundingBox !== 'undefined') {
                let data:Point[] = environment.collision.line.getIntersectionDataForProjectile(projectile, object.boundingBox, environment.delta);
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
                    game.scene.removeObject(projectile.object);

                    if (object.sfx.onHit.sounds.length > 0) {
                        let soundId = object.sfx.onHit.sounds[Math.floor(Math.random() * object.sfx.onHit.sounds.length)];
                        let distance:number = VU.length(VU.createVector(player.object.position, object.position));
                        let volume:number = (SOUND_FADE_DISTANCE - distance) / SOUND_FADE_DISTANCE;

                        game.triggerEvent(EVENTS.AUDIO, {soundId: soundId, volume: volume});

                        networkState.triggeredSounds.push(
                            createSoundNetworkEvent(soundId, object.position));
                    }
                    return;
                }
            }
        }
        projectile.object.position = position;
    }

    function processGrenades(environment) {
        let remainingGrenades: Grenade[] = [];
        for (let i in grenades) {
            let grenade:Grenade = grenades[i];
            if (grenade.exploded) {
                let explosionData: any = grenade.explosionData;

                game.scene.removeObject(grenade);

                let distance:number = VU.length(VU.createVector(player.object.position, grenade.position));
                let volume:number = (SOUND_FADE_DISTANCE - distance) / SOUND_FADE_DISTANCE;
                game.triggerEvent(EVENTS.AUDIO, {soundId: explosionData.soundid, volume: volume});

                networkState.triggeredSounds.push(
                    createSoundNetworkEvent(explosionData.soundid, grenade.position));

                game.scene.addAnimation(explosionData.animation);
            } else {
                remainingGrenades.push(grenade);
                if (grenade.isOnTarget) {
                    grenade.speed = 0;
                    grenade.collidable = false;
                }
            }
        }

        grenades = remainingGrenades;
    }

    function drawHud() {
        let context = _canvas.getContext('2d');

        let originalFillStyle = context.fillStyle;
        let originalAlpha = context.globalAlpha;
        context.font = '20px Impact';
        context.fillStyle = '#ffff00';
        context.globalAlpha = 0.7;

        if (player.isAlive) {
            context.fillText('HEALTH: ' + Math.floor(player.health), 25, viewPort.height - 20);
            context.fillText('AMMO: ' + Math.floor(player.weapon.magazineAmmo) + ' / ' + Math.floor(player.weapon.remainingAmmo),
                668, viewPort.height - 20);

            if (player.weapon.isReloading()) {
                context.fillStyle = '#dd3333';
                context.globalAlpha = Math.abs(Math.sin( (Date.now() / SOUND_FADE_DISTANCE) * Math.PI ) );

                let mousePosition:Point = game.inputRegistry.getMousePosition();
                context.fillText('RELOADING', mousePosition.x - 43, mousePosition.y + 34);
            }
        } else {
            context.fillText('DEAD', 25, viewPort.height - 20);
        }
        

        // reset globals
        context.fillStyle = originalFillStyle;
        context.globalAlpha = originalAlpha;
    }

    function prepareFrame(environment) {
        frameBeginTime = Date.now();
    }

    function clearFrameState(environment) {
        if (!player.isAlive && !isPlayerSpawning) {
            sendPlayerDied();
        }

        createdNetworkObjects = [];
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
        if (!player.isAlive) {
            return;
        }
        (<DynamicObject>player.object).speed = 0;
        let movementVector:Vector = inputController.processMovement();
        let directionVectors = [];
        if (typeof movementVector !== 'undefined' && VU.length(movementVector) != 0) {
            (<DynamicObject>player.object).direction = movementVector;
            (<DynamicObject>player.object).speed = game.inputRegistry.getKeyStatus(16)
                ? Soldier.SPEED / 2
                : Soldier.SPEED;

            if (player.object.sfx.onMove.sounds.length > 0 && player.object.sfx.onMove.isReady) {
                let soundId = player.object.sfx.onMove.sounds[Math.floor(Math.random() * player.object.sfx.onMove.sounds.length)];

                if (!game.inputRegistry.getKeyStatus(16)) {
                    game.triggerEvent(EVENTS.AUDIO, {soundId: soundId, volume: 1});

                    networkState.triggeredSounds.push(
                        createSoundNetworkEvent(soundId, player.object.position));
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

            networkState.triggeredSounds.push(
                        createSoundNetworkEvent(player.weapon.clipOutSoundId, player.object.position));

            setTimeout(function() {
                if (player.isAlive) {
                    game.triggerEvent(EVENTS.AUDIO, {soundId: player.weapon.clipInSoundId, volume: 1});
                    networkState.triggeredSounds.push(
                            createSoundNetworkEvent(player.weapon.clipInSoundId, player.object.position));
                }
            }, player.weapon.reloadTime - 200);
        }

        if (inputController.isKeyPressed('G') && player.grenadesLeft > 0 && !player.weapon.isReloading()) {
            inputController.supressKey('G', 3000);
            let playerInViewport:Point = viewPort.translateInViewport(player.object.position);
            let mouseOffset:Point = new Point(
                game.inputRegistry.getMousePosition().x - playerInViewport.x,
                game.inputRegistry.getMousePosition().y - playerInViewport.y);
            let target:Point = new Point(
                player.object.position.x + mouseOffset.x,
                player.object.position.y + mouseOffset.y);
            let grenade:Grenade = new Grenade(player.projectileOrigin, player.projectileDirection, target);

            grenades.push(grenade);
            game.scene.addObject(grenade);
        }
    }

    function processMouse(environment) {
        player.object.rotation = inputController.processRotation(viewPort, _canvas, player.object.position);
        if (inputController.isLeftMouseBtnPressed() && player.isAlive
            && player.weapon.isReadyToFire && !player.weapon.isFiring) {
            weaponFireHandler();
        }
    }

    /*------ Network functions ------*/
    function sendClientState() {
        networkState.sendClientState(player, createdNetworkObjects);
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

        game.scene.removeObject(player.object);
        player.object = new Soldier(new Point(data.location.x, data.location.y), new Vector(0, 1));
        game.scene.addObject(player.object);
        viewPort.centerOn(player.object);
    }

    function applyServerPushData() {
        let data = networkState.getServerPushData(game.connectionData.socketId);
        let result = updatesProcessor.apply(data, projectiles);

        if (result.playerDied) {
            player.isAlive = false;
            game.scene.removeObject(player.object);
            let bodyParts:BodyPart[] = createBodyParts();

            for (let i in bodyParts) {
                let part:BodyPart = bodyParts[i];
                createdNetworkObjects.push(part);
                game.scene.addObject(part);
            }

            let soundId = 'die-' + Math.ceil(Math.random() * 5);
            game.triggerEvent(EVENTS.AUDIO, {soundId: soundId, volume: 1});

            networkState.triggeredSounds.push(
                    createSoundNetworkEvent(soundId, player.object.position));
        }
    }

    function onPlayerDisconnected(data) {
        for (let i in data) {
            for (let j in game.scene.objects) {
                if (data[i].networkUid === game.scene.objects[j].networkUid) {
                    let objectToRemove:BasicObject = game.scene.objects[j];
                    // The timeout is needed because the server might push some leftover updates
                    // and re-place the disconnected player on the scene
                    setTimeout(() => {
                        game.scene.removeObject(objectToRemove);
                    }, 5000);
                }
            }
        }
    }

    /*------ Misc functions ------*/
    function createBodyParts() {
        let origin:Point = player.object.position;

        let parts = [
            'head',
            'eye',
            'hand',
            'guts',
            'bone-1',
            'bone-2',
            'bone-3',
            'bone-4'
        ];

        let maxDistance:number = 50;

        let result:BodyPart[] = [];

        for (let i in parts) {
            let theta = 2 * Math.PI * Math.random();
            let x = origin.x + (Math.random() * maxDistance) * Math.cos(theta);
            let y = origin.y + (Math.random() * maxDistance) * Math.sin(theta);

            let position:Point = new Point(x, y);
            let rotation:number = Math.random() * 180;

            result.push(new BodyPart(parts[i], position, rotation));
        }

        return result;
    }

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
            let projectile:Projectile = player.weapon.fire(
                    player.projectileOrigin,
                    player.projectileDirection);

            fireProjectile(projectile);
        }
        setTimeout(() => { weaponFireHandler(); }, player.weapon.fireInterval);
    }

    function fireProjectile(projectile:Projectile) {
        game.scene.addObject(projectile.object);

        let distance:number = VU.length(VU.createVector(player.object.position, projectile.origin));
        let volume:number = (SOUND_FADE_DISTANCE - distance) / SOUND_FADE_DISTANCE;
        game.triggerEvent(EVENTS.AUDIO, {soundId: projectile.soundId, volume: volume});

        projectiles.push(projectile);
        networkState.firedProjectiles.push(projectile);

        networkState.triggeredSounds.push(
            createSoundNetworkEvent(projectile.soundId, player.object.position));
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

    function createSoundNetworkEvent(soundid:string, origin:Point, maxRange=1000) {
        let id = Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
        return {
            soundId: soundid,
            origin: {
                x: origin.x,
                y: origin.y
            },
            maxRange: maxRange,
            offset: Date.now() - frameBeginTime,
            eventid: id
        };
    }
}