///<reference path='../../../repo/engine-client.ts' />
namespace Crate {

    /*
        A class for manipulating the state of a player.
    */
    export class Player {
        // we asume that 0 is the minimum
        static MAX_HEALTH: number = 100;
        private _object: BasicObject;
        private _health: number;

        constructor(object:BasicObject) {
            this._object = object;
            this._health = Player.MAX_HEALTH;
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
    }
}