namespace Crate {

    /*
        Blood on impact effect.
    */
    export class Blood implements IVisualEffect {
        enabled: boolean;

        constructor(enabled:boolean) {
            this.enabled = enabled;
        }
    }
}