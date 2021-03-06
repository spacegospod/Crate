///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    /*
        Custom object class for a blood stain
    */
    export class BloodStain extends BasicObject {
        static FADE_INTERVAL: number = 200;

        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            var imageKeys = ['blood-1', 'blood-2', 'blood-3', 'blood-4'];
            var imageKey = imageKeys[Math.floor(Math.random() * 4)];
            super(imageKey,
                position,
                rotation,
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