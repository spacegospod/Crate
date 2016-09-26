///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    /*
        Custom object class for a blood stain
    */
    export class BloodStain extends BasicObject {
        static FADE_INTERVAL: number = 200;

        constructor(position:Point = new Point(0, 0)) {
            super('blood',
                position,
                0,
                2,
                false);
            setTimeout(() => {this.fadeHandler()}, BloodStain.FADE_INTERVAL);
        }

        fadeHandler() {
            this.opacity -= 0.02;
            if (this.opacity <= 0) {
                dispatchEvent(new CustomEvent('objectExpired', {'detail': {'object': this}}));
            } else {
                setTimeout(() => {this.fadeHandler()}, BloodStain.FADE_INTERVAL);
            }
        }
    }
}