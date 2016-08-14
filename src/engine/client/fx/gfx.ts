namespace Crate {

    /*
        A container for graphics effects.
    */
    export class GFX  {
        motionBlur: MotionBlur;
        blood: Blood;

        constructor() {
            this.motionBlur = new MotionBlur(false);
            this.blood = new Blood(false);
        }
    }
}