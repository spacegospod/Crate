namespace Crate {

    // Main game file
    var player:Soldier;
    var _canvas;
    var game:Game;
    var viewPort:ViewPort;

    function userInputCallback(environment) {
        processKeys(environment);
        processMouse(environment);
    }

    function processKeys(environment) {
        var directionVectors = [];
        player.speed = 0;

        // A
        if (environment.input.getKeyStatus(65)) {
            directionVectors.push(new Crate.Vector(-1, 0));
        }
        // W
        if (environment.input.getKeyStatus(87)) {
            directionVectors.push(new Crate.Vector(0, -1));
        }
        // D
        if (environment.input.getKeyStatus(68)) {
            directionVectors.push(new Crate.Vector(1, 0));
        }
        // S
        if (environment.input.getKeyStatus(83)) {
            directionVectors.push(new Crate.Vector(0, 1));
        }

        if (directionVectors.length > 0) {

            var direction = directionVectors[0];
            for (var i = 1; i < directionVectors.length; i++) {
                direction = Crate.VU.sumVectors(direction, directionVectors[i]);
            }
            if (typeof direction !== 'undefined' && Crate.VU.length(direction) != 0) {
                player.direction = direction;
                player.speed = Crate.Soldier.SPEED;
            }
        }
    }

    function processMouse(environment) {
        var mousePosition = environment.input.getMousePosition();
        // correct for canvas offset on screen
        mousePosition.x -= _canvas.getBoundingClientRect().left;
        mousePosition.y -= _canvas.getBoundingClientRect().top;
        var playerPosition = environment.viewport.translateInViewport(player.position);

        var directionVector = Crate.VU.createVector(mousePosition, playerPosition);

        var angle = Crate.VU.findAngle(
            new Crate.Vector(0, 1),
            directionVector);

        player.rotation = directionVector.x > 0 ? 360 - angle : angle;
    }

    export function loadGame(canvas, context, imageMap, soundMap, boundingBoxes, levelData) {
        _canvas = canvas;
        game = new Crate.Game(canvas);
        var levelParser = new Crate.LevelParser();
        levelParser.registerCustomObject('Soldier', function(data) {
            return new Crate.Soldier();
        });
        var level = levelParser.parse(levelData);

        viewPort = new Crate.ViewPort(800, 600);
        game.init(imageMap, soundMap, boundingBoxes, context, viewPort, level);

        player = new Crate.Soldier(new Crate.Point(300, 700), new Crate.Vector(1, 0));

        game.scene.add(player);
        viewPort.centerOn(player);

        game.begin([userInputCallback], []);
    }
}