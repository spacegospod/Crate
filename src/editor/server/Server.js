// Read the level name from command line
var levelName = (process.argv.length === 3)
    ? process.argv[2]
    : ' ';
// Start a server with the specified level or create a new one
var server = new Server(levelName, true);