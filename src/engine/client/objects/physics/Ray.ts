namespace Crate {

    /*
        A representation of a ray. Here a ray is defined as an
        object which consists of a direction vector and a starting point.
    */
    export class Ray {
        // The point of origin for this ray
        private _origin: Point;
        // The direction vector
        private _direction: Vector;

        constructor(origin:Point, direction:Vector) {
            if (!origin) {
                throw 'No origin point provided when constructing ray';
            }
            if (!direction) {
                throw 'No direction vector provided when constructing ray';
            }
            this._origin = new Point(origin.x, origin.y);
            this._direction = VU.normalize(new Vector(direction.x, direction.y));
        }

        get origin():Point {
            return new Point(this._origin.x, this._origin.y);
        }

        get direction():Vector {
            return new Vector(this._direction.x, this._direction.y);
        }
    }
}