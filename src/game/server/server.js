// Read the level name from command line
var levelName = process.argv[2];

// Create the crate server
var server = new Server(levelName);

// Get the websocket endpoint
var io = server.getWebSocketEndpoint();

var spawnLocations = JSON.parse(
    server.getResourceSync('/levels/' + levelName + '.json'))
    .spawnLocationsData;

// The requestAnimationFrame method of the HTML5 canvas 2D context is capped
// at 60 fps. Therefore the game itself is capped at 60 loops per second which
// is roughly 40ms per cycle.
// While this does not guarantee that updates will be provided for each and every
// frame, it does provide frequent updates for accurate interpolation on the client side
const SERVER_PUSH_TIMEOUT = 8;
const SERVER_PUST_EVENT_ID = "serverpush";
const SERVER_PLAYER_DISCONNECTED_EVENT_ID = "playerdisconnected";

var deadPlayersData = [];

var clientsData = {};
var registeredImpacts = [];

function respawnDeadPlayers() {
    function respawnPlayer(socketId) {
        var location = spawnLocations[Math.floor(Math.random() * spawnLocations.length)];
        io.to(socketId).emit('spawnPlayer', {location: location});
    }

    for (var deadPlayerInfo in deadPlayersData) {
        var info = deadPlayersData[deadPlayerInfo];
        respawnPlayer(info.socket.id);
    }

    deadPlayersData = [];
}

function registerImpact(impact) {
    registeredImpacts.push({
        data: impact,
        timestamp: Date.now()
    });
}

function clearImpacts() {
    var relevantImpacts = [];
    var now = Date.now();
    for (var i in registeredImpacts) {
        var impact = registeredImpacts[i];
        if ( (now - impact.timestamp) < 5000) {
            relevantImpacts.push(impact);
        }
    }

    registeredImpacts = relevantImpacts;
}

function buildPushData() {
    var data = {
        objects: [],
        projectiles: [],
        impacts: [],
        objectsToRemove: []
    };

    // removes duplicate impact events
    function filterImpacts(impacts) {

        function isImpactUnique(impact) {
            for (var j in registeredImpacts) {
                if (impact.object === registeredImpacts[j].data.object
                    && impact.projectile === registeredImpacts[j].data.projectile) {
                    return false;
                }
            }

            return true;
        }

        var result = [];
        for (var i in impacts) {
            var impact = impacts[i];
            if (isImpactUnique(impact)) {
                result.push(impact);
                registerImpact(impact);
            }
        }

        return result;
    }

    for (var i in deadPlayersData) {
        var info = deadPlayersData[i];
        for (var j in info.data) {
            try {
                data.objectsToRemove.push(info.data[j]);
            } catch(e) {
                console.log(e);
            }
        }
    }

    for (var j in clientsData) {
        var clientData = clientsData[j];
        if (typeof clientData === 'undefined') {
            continue;
        }

        try {
            data.objects.push.apply(data.objects, clientData.objects);
            data.projectiles.push.apply(data.projectiles, clientData.projectiles);
            data.impacts.push.apply(data.impacts, filterImpacts(clientData.impacts));
        } catch (e) {
            console.log(e);
        }
    }

    // filter out the objects which will be removed
    data.objects = data.objects.filter(function(object) {
        return data.objectsToRemove.indexOf(object.networkUid) < 0;
    });

    return data;
}

function pushToClients() {
    io.emit(SERVER_PUST_EVENT_ID, buildPushData());
    respawnDeadPlayers();
    clearImpacts();
    setTimeout(pushToClients, SERVER_PUSH_TIMEOUT);
}

function disconnectPlayer(socket) {
    try {
        io.emit(SERVER_PLAYER_DISCONNECTED_EVENT_ID, clientsData[socket.id].objects);
    } catch (e) {
        console.log('Failed to disconnect player');
    }
    delete clientsData[socket.id];
}

io.sockets.on('connection', function(socket) {
    clientsData[socket.id] = {};

    socket.on('clientUpdate', function(data) {
        if (typeof clientsData[socket.id] !== 'undefined') {
            clientsData[socket.id] = data;
        }
    });
    socket.on('playerDied', function(data) {
        deadPlayersData.push({
            socket: socket,
            data: data.objectsToRemove
        });
    });
    socket.on('disconnect', function() {
        disconnectPlayer(socket);
    });
    socket.on('error', function() {
        disconnectPlayer(socket);
    });
    // control event handlers
    socket.on('serverTimeReq', function(data) {
        var payload = {sendTime: data.sendTime, serverTime: Date.now()};
        socket.emit('serverTimeRes', payload);
    });
});

// start push timer
setTimeout(pushToClients, SERVER_PUSH_TIMEOUT);