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
    }
}