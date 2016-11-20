///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    /*
        A class for manipulating the state of a player.
    */
    export class Player {
        // we asume that 0 is the minimum
        static MAX_HEALTH: number = 100;

        private _object: BasicObject;
        private _health: number;

        weapon: IWeapon;
        grenadesLeft: number;

        isAlive: boolean = true;

        constructor(object:BasicObject) {
            this._object = object;
            this._health = Player.MAX_HEALTH;
            this.weapon = new AutomaticRifle();
            this.grenadesLeft = 2;
        }

        get object():BasicObject {
            return this._object;
        }

        set object(value:BasicObject) {
            this._object = value;
        }

        get health():number {
            return this._health;
        }

        set health(value:number) {
            this._health = Math.min(value, Player.MAX_HEALTH);
        }

        get projectileOrigin():Point {
            if (typeof this._object === 'undefined') {
                return undefined;
            }

            var aimVector:Vector = this.projectileDirection;
            return new Point(
                this._object.position.x + aimVector.x * 40,
                this._object.position.y + aimVector.y * 40);
        }

        get projectileDirection():Vector {
            return VU.rotateVector(new Vector(0, -1), -1 * this._object.rotation);
        }
    }
}