namespace Crate {

    /*
        A container for sound effects.
    */
    export class SFX  {
        // Arrays of sound IDs
        onMove: String[];
        onHit: String[];

        constructor() {
            this.onMove = [];
            this.onHit = [];
        }
    }
}