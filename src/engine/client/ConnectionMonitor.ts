namespace Crate {

    /*
        Periodically makes calls to the server to measure latency and time offset.
    */
    export class ConnectionMonitor {
        // An array of the latency values. Capped at 30 entries.
        private _latencies = [];
        // The websocket endpoint.
        private _io;

        private _serverTimeOffset: number = 0;

        private static REQUEST_TIMEOUT = 1 * 1000;

        constructor(io) {
            this._io = io;
            this._io.on('serverTimeRes', (data)=>{this.onServerTimeResponse(data)});
            setTimeout(()=>{this.requestServerTime()}, ConnectionMonitor.REQUEST_TIMEOUT);
        }

        get serverTimeOffset(): number {
            return this._serverTimeOffset;
        }

        private requestServerTime() {
            this._io.emit('serverTimeReq', {sendTime: Date.now()});
            setTimeout(()=>{this.requestServerTime()}, ConnectionMonitor.REQUEST_TIMEOUT);
        }

        private onServerTimeResponse(data) {
            var now = Date.now();
            this._latencies.unshift(now - data.sendTime);
            // cap at 30
            this._latencies = this._latencies.slice(0, 29);
            var serverTime = data.serverTime + this.getMeanLatency();
            this._serverTimeOffset = now - serverTime;
        }

        private getMeanLatency() {
            var latency = 0;
            for (var i in this._latencies) {
                latency += this._latencies[i];
            }
            return latency / this._latencies.length;
        }
    }
}