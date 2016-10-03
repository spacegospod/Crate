///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class CrateBig extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('crate',
                position,
                rotation,
                1,
                true);
            this.initSfx();
        }

        private initSfx() {
            this.sfx.onHit.sounds.push('wood1');
            this.sfx.onHit.sounds.push('wood2');
            this.sfx.onHit.sounds.push('wood3');
        }
    }
}