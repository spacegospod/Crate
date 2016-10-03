namespace Crate {

    /*
        A container for sound effects.
    */
    export class SFX  {
        // Arrays of sound IDs
        onMove;
        onHit;

        constructor() {
            this.onMove = {
                isReady: true,
                sounds: []
            };
            this.onHit = {
                isReady: true,
                sounds: []
            };
        }
    }
}