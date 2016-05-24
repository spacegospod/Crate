namespace Crate {

    /*
        A delta timer used for synchronizing events to the framerate
    */
    export class Delta {
        // The time of the last call to the update method
        private _lastUpdate: number;
        // The cached delta time
        private _delta: number;

        constructor() {
            this._lastUpdate = Date.now();
            this._delta = 0;
        }

        // Mark the beginning of a new delta frame
        update(time:number) {
            this._delta = (time - this._lastUpdate) / 1000;
            this._lastUpdate = time;
        }

        // Get the delta for the last update
        getDelta() {
            return this._delta;
        }

        get lastUpdate():number {
            return this._lastUpdate;
        }
    }
}