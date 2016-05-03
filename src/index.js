function loadGame(canvas, context, imageMap, soundMap, levelData) {
	var game = new Crate.Game(canvas);
	var level = new Crate.LevelParser().parse(levelData);

	game.init(imageMap, soundMap, context, new Crate.ViewPort(800, 600), level);

	// begin test code
	var player = new Crate.DynamicMapObject('soldier',
		new Crate.Point(300, 700), 45);

	game.scene.add(player);
	game.viewPort.centerOn(player);
	// end test code

	game.begin([function(env) {
		player.speed = 50;
		player.direction = new Crate.Vector(2.5, -1);
	}], []);
}