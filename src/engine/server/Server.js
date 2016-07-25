// Server constructor function
function Server(levelName) {
    if (!levelName) {
        throw 'No level specified!';
    }
    if (!process.env.CRATE_PATH) {
        throw 'CRATE_PATH undefined!';
    }
    var express = require('express');
    var fs = require('fs');
    var server = express();

    const PORT = 8080;

    // Host game files
    server.use('/resources/images', express.static(process.env.CRATE_PATH + '/resources/images'));
    server.use('/resources/sounds', express.static(process.env.CRATE_PATH + '/resources/sounds'));
    server.use('/sources', express.static(process.env.CRATE_PATH + '/sources'));
    server.use('/meta', express.static(process.env.CRATE_PATH + '/meta'));

    // Host index file under default path
    server.get("/", function(req, res) {
        fs.readFile(process.env.CRATE_PATH + '/sources/index.html', 'utf8', function(err, data){
            if (!err) {
                res.send(data);
            } else {
                console.error(err.message);
            }
        });
    });

    // Host level file
    server.get("/resources/level.json", function(req, res) {
        fs.readFile(process.env.CRATE_PATH + '/levels/' + levelName + '.json',
            'utf8', function(err, data) {
            if (!err) {
                res.send(data);
            } else {
                console.error(err.message);
            }
        });
    });

    // Set up websocket connection and start listening
    var io = require('socket.io').listen(server.listen(PORT, function() {
        console.log("Listening on port " + PORT);
    }));

    // Exposes the websocket connection endpoint
    this.getWebSocketEndpoint = function() {
        return io;
    };
}