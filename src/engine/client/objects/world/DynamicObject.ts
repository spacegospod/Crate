///<reference path='BasicObject.ts' />
namespace Crate {

    /*
        An extension over BasicObject which possesses
        speed and direction properties.
    */
    export class DynamicObject extends BasicObject {
        // The speed at which the object moves at each loop
        speed: number;
        // The movement direction
        protected _direction: Vector;

        constructor(imageKey:string = 'texture-default',
                position:Point = new Point(0, 0),
                rotation:number = 0,
                zIndex = 0,
                collidable = false,
                direction: Vector = new Vector(0, 1),
                speed = 0) {
            super(imageKey, position, rotation, zIndex, collidable);
            this.speed = speed;
            this.direction = (direction === undefined)
                    ? new Vector(0, 1)
                    : new Vector(direction.x, direction.y);
        }

        set direction(value) {
            if (!value) {
                return;
            }
            this._direction = new Vector(value.x, value.y);
        }

        get direction():Vector {
            // don't use reference
            return new Vector(this._direction.x, this._direction.y);
        }
    }
}