///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    /*
        Custom object class for a soldier
    */
    export class Soldier extends DynamicObject {
        static SPEED = 200;

        constructor(
                position:Point = new Point(0, 0),
                direction: Vector = new Vector(0, 1),
                speed = 0) {
            super('soldier',
                position,
                0,
                10,
                true,
                direction,
                speed);
            this.gfx.blood.enabled = true;
            this.initSfx();
        }

        private initSfx() {
            this.sfx.onMove.sounds.push('steps1');
            this.sfx.onMove.sounds.push('steps2');
            this.sfx.onMove.sounds.push('steps3');
            this.sfx.onMove.sounds.push('steps4');

            this.sfx.onHit.sounds.push('flesh1');
            this.sfx.onHit.sounds.push('flesh2');
            this.sfx.onHit.sounds.push('flesh3');
        }
    }
}