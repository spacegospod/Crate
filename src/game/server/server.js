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
const SERVER_PUSH_TIMEOUT = 40;
const SERVER_PUST_EVENT_ID = "serverpush";

function pushToClients() {
    io.emit(SERVER_PUST_EVENT_ID, {});
    setTimeout(pushToClients, SERVER_PUSH_TIMEOUT);
}

io.sockets.on('connection', function(socket) {
    // control event handlers
    socket.on('serverTimeReq', function(data) {
        var payload = {sendTime: data.sendTime, serverTime: Date.now()};
        socket.emit('serverTimeRes', payload);
    });
});

// start push timer
setTimeout(pushToClients, SERVER_PUSH_TIMEOUT);