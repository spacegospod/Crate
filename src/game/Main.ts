namespace Crate {
    /*------ Main game file ------*/

    var _canvas;
    var player: Player;
    var game: Game;
    var viewPort: ViewPort;
    var projectiles: Projectile[] = [];

    export function loadGame(canvas, context, imageMap, soundMap, boundingBoxes, levelData) {
        _canvas = canvas;
        game = new Game(canvas);
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

        game.begin([userInputCallback, processProjectiles], []);
    }

    /*------ Game loop callbacks ------*/

    function processProjectiles(environment) {
        // for each projectile
        for (var i in projectiles) {
            var projectile:Projectile = projectiles[i];
            // test against each collidable object
            processProjectile(projectile, environment);
            projectile.update();
        }
    }

    function processProjectile(projectile:Projectile, environment) {
        var position:Point = projectile.getPosition(Date.now());
        for (var j in game.scene.objects) {
            var object:BasicObject = game.scene.objects[j];
            if (object.collidable) {
                var data:Point[] = environment.collision.line.getIntersectionDataForProjectile(projectile, object.boundingBox, environment.delta);
                // We use 1 bounding box per object -> we cannot have more than two collision points
                if (typeof data === 'undefined') {
                    continue;
                } else if (data.length > 0) {
                    projectiles.splice(projectiles.indexOf(projectile), 1);
                    game.scene.remove(projectile.object);
                    return;
                }
            }
        }
        projectile.object.position = position;
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
        var bullet:Projectile = fireProjectile(player);
        if (typeof bullet === 'undefined') {
            return;
        }
        game.scene.add(bullet.object);
        game.triggerEvent(EVENTS.AUDIO, {soundId: 'fire'});

        projectiles.push(bullet);
    }

    /*------ misc functions ------*/

    // Creates a projectile originating from the provided player.
    function fireProjectile(player:Player):Projectile {
        if (!player.object.hasOwnProperty('_direction')) {
            return;
        }
        try {
            return new Bullet((<Soldier>player.object).projectileOrigin, (<Soldier>player.object).projectileDirection);
        } catch(e) {
            // player is not a soldier, can't fire
            return undefined;
        }
        
    }
}