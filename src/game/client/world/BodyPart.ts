///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    /*
        Custom object class for a body part
    */
    export class BodyPart extends BasicObject {
        static FADE_INTERVAL: number = 200;

        constructor(imageKey:string, position:Point = new Point(0, 0), rotation:number = 0) {
            super(imageKey,
                position,
                rotation,
                2,
                false);
            setTimeout(() => {this.fadeHandler()}, BodyPart.FADE_INTERVAL);
        }

        fadeHandler() {
            this.opacity -= 0.02;
            if (this.opacity <= 0) {
                dispatchEvent(new CustomEvent('objectExpired', {'detail': {'object': this}}));
            } else {
                setTimeout(() => {this.fadeHandler()}, BodyPart.FADE_INTERVAL);
            }
        }
    }
}