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
const SERVER_PUSH_TIMEOUT = 7;
const PLAYER_SPAWN_TIME = 3 * 1000;
const SERVER_PUST_EVENT_ID = "serverpush";
const SERVER_PLAYER_DISCONNECTED_EVENT_ID = "playerdisconnected";

var deadPlayersData = [];

var clientsData = {};
var registeredImpacts = [];

var deleteOnDisconnect = {};

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

function pushToClients() {
    io.emit(SERVER_PUST_EVENT_ID,
        buildPushData(
            clientsData,
            registeredImpacts,
            deleteOnDisconnect,
            deadPlayersData));

    respawnDeadPlayers();
    clearImpacts();
    setTimeout(pushToClients, SERVER_PUSH_TIMEOUT);
}

function respawnDeadPlayers() {
    function respawnPlayer(socket) {
        var location = spawnLocations[Math.floor(Math.random() * spawnLocations.length)];
        socket.emit('spawnPlayer', {location: location});
    }

    for (var i in deadPlayersData) {
        var info = deadPlayersData[i];
        if ((Date.now() - info.timeOfDeath) >= PLAYER_SPAWN_TIME) {
            respawnPlayer(info.socket);
            delete deadPlayersData[i];
        }
    }
}

function disconnectPlayer(socket) {
    try {
        io.emit(SERVER_PLAYER_DISCONNECTED_EVENT_ID, deleteOnDisconnect[socket.id]);
        console.log(socket.id + ' disconnected');
    } catch (e) {
        console.log('Failed to disconnect player');
    }
    delete clientsData[socket.id];
}

io.sockets.on('connection', function(socket) {
    clientsData[socket.id] = {};
    deleteOnDisconnect[socket.id] = [];
    // spawn immediately
    deadPlayersData.push({
            socket: socket,
            data: [],
            timeOfDeath: Date.now() - PLAYER_SPAWN_TIME
        });

    console.log(socket.id + ' connected');

    socket.on('clientUpdate', function(data) {
        if (typeof clientsData[socket.id] !== 'undefined') {
            clientsData[socket.id] = data;
        }
    });
    socket.on('playerDied', function(data) {
        deadPlayersData.push({
            socket: socket,
            data: data.objectsToRemove,
            timeOfDeath: Date.now()
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
        var payload = { sendTime: data.sendTime, serverTime: Date.now() };
        socket.emit('serverTimeRes', payload);
    });
    socket.on('socketIdReq', function() {
        socket.emit('socketIdRes', { socketId: socket.id });
    });
});

// start push timer
setTimeout(pushToClients, SERVER_PUSH_TIMEOUT);