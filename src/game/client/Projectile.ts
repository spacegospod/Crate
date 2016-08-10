///<reference path='../../../repo/engine-client.ts' />
namespace Crate {

    /*
        A basic projectile. It is a simple ray with a BasicObject used only for
        visualization. It also has a timestamp and speed properties which are used
        to track where the projectile is on the ray.

        To visualize a projectile add its object to the scene.
    */
    export class Projectile extends Ray {
        // The object to use for visualization
        private _object: BasicObject;

        // Speed of the projectile (per second)
        private _speed: number;

        // The time in milliseconds when the projectile was fired
        private _timestamp: number;

        private _lastUpdate: number;

        constructor(origin:Point, direction:Vector, speed:number, object:BasicObject, timestamp:number=Date.now()) {
            if (!origin) {
                throw 'No origin point provided when constructing ray';
            }
            if (!direction) {
                throw 'No direction vector provided when constructing ray';
            }
            super(origin, direction);

            this._speed = speed;
            this._timestamp = timestamp;
            this._object = object;
            this._lastUpdate = this._timestamp;
        }

        update() {
            this._lastUpdate = Date.now();
        }

        get timestamp():number {
            return this._timestamp;
        }

        get lastUpdate():number {
            return this._lastUpdate;
        }

        // Read-only. If you want to change the speed clone the projectile.
        // Otherwise we would have to keep track on where along the ray the speed
        // was altered.
        get speed():number {
            return this._speed;
        }

        // Get the position of the projectile at the provided time.
        getPosition(time:number):Point {
            var elapsedSeconds:number = (time - this._timestamp) / 1000;
            return new Point(
                this.origin.x + (this.direction.x * this._speed * elapsedSeconds),
                this.origin.y + (this.direction.y * this._speed * elapsedSeconds));
        }

        set object(obj:BasicObject) {
            this._object = obj;
        }

        get object():BasicObject {
            return this._object;
        }

        get ttl() {
            var lifetime = Date.now() - this._timestamp;
            return 8 * 1000 - lifetime;
        }
    }
}