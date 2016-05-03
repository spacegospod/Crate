namespace Crate {

    /*
        A delta timer used for synchronizing events to the framerate
    */
    export class Delta {
        // The time of the last call to the update method
        private lastUpdate: number;
        // The cached delta time
        private delta: number;

        constructor() {
            this.lastUpdate = Date.now();
        }

        // Mark the beginning of a new delta frame
        update(time:number) {
            this.delta = (time - this.lastUpdate) / 1000;
            this.lastUpdate = time;
        }

        // Get the delta for the last update
        getDelta() {
            return this.delta;
        }
    }
}