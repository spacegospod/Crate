///<reference path='../../../repo/engine-client.ts' />
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
        }

        get projectileOrigin():Point {
            var aimVector:Vector = this.projectileDirection;
            return new Point(
                this.position.x + aimVector.x * 40,
                this.position.y + aimVector.y * 40);
        }

        get projectileDirection():Vector {
            return VU.rotateVector(new Vector(0, -1), -1 * this.rotation);
        }
    }
}