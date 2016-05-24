///<reference path='../../../repo/engine-client.ts' />
namespace Crate {

    /*
        Custom object class for a soldier
    */
    export class Soldier extends DynamicObject {
        static SPEED = 200;

        constructor(
                position:Point = new Point(0, 0),
                direction: Vector = new Vector(0, 0),
                speed = 0) {
            super('soldier',
                position,
                0,
                1,
                true,
                direction,
                speed);
        }

        get projectileOrigin():Point {
            var aimVector:Vector = this.projectileDirection;
            return new Point(
                this.position.x + aimVector.x * 28,
                this.position.y + aimVector.y * 28);
        }

        get projectileDirection():Vector {
            return VU.rotateVector(new Vector(0, -1), -1 * this.rotation);
        }
    }
}