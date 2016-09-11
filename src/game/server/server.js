// Read the level from command line
var level = process.argv[2];
// Create the crate server
var server = new Server(level);
// Get the websocket endpoint
var io = server.getWebSocketEndpoint();

// The requestAnimationFrame method of the HTML5 canvas 2D context is capped
// at 60 fps. Therefore the game itself is capped at 60 loops per second which
// is roughly 40ms per cycle.
// While this does not guarantee that updates will be provided for each and every
// frame, it does provide frequent updates for accurate interpolation on the client side
const SERVER_PUSH_TIMEOUT = 10;
const SERVER_PUST_EVENT_ID = "serverpush";
const SERVER_PLAYER_DISCONNECTED_EVENT_ID = "playerdisconnected";

var clientsData = {};
var recentImpacts = [];

function buildPushData() {
    var data = {
        objects: [],
        projectiles: [],
        impacts: []
    };

    // removes duplicate impact events
    function filterImpacts(impacts) {

        function isImpactUnique(impact) {
            for (var j in data.impacts) {
                if (impact.object === data.impacts[j].object
                    && impact.projectile === data.impacts[j].projectile) {
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
            }
        }

        return result;
    }

    for (var i in clientsData) {
        var clientData = clientsData[i];
        data.objects.push.apply(data.objects, clientData.objects);
        data.projectiles.push.apply(data.projectiles, clientData.projectiles);
        data.impacts.push.apply(data.impacts, filterImpacts(clientData.impacts));
    }

    return data;
}

function pushToClients() {
    io.emit(SERVER_PUST_EVENT_ID, buildPushData());
    setTimeout(pushToClients, SERVER_PUSH_TIMEOUT);
}

io.sockets.on('connection', function(socket) {
    socket.on('clientUpdate', function(data) {
        clientsData[socket.id] = data;
    });
    socket.on('disconnect', function() {
        if (typeof clientsData[socket.id] !== 'undefined') {
            io.emit(SERVER_PLAYER_DISCONNECTED_EVENT_ID, clientsData[socket.id].objects);
            delete clientsData[socket.id];
        }
    });
    socket.on('error', function() {
        if (typeof clientsData[socket.id] !== 'undefined') {
            io.emit(SERVER_PLAYER_DISCONNECTED_EVENT_ID, clientsData[socket.id].objects);
            delete clientsData[socket.id];
        }
    });
    // control event handlers
    socket.on('serverTimeReq', function(data) {
        var payload = {sendTime: data.sendTime, serverTime: Date.now()};
        socket.emit('serverTimeRes', payload);
    });
});

// start push timer
setTimeout(pushToClients, SERVER_PUSH_TIMEOUT);