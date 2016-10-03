///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class CarGreen extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('car-green',
                position,
                rotation,
                1,
                true);
            this.initSfx();
        }

        private initSfx() {
            this.sfx.onHit.sounds.push('ricmetal1');
            this.sfx.onHit.sounds.push('ricmetal2');
        }
    }
}