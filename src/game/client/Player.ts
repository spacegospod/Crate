///<reference path='../../../repo/engine-client.ts' />
namespace Crate {

    /*
        A class for manipulating the state of a player.
    */
    export class Player {
        private _object: BasicObject;

        constructor(object:BasicObject) {
            this._object = object;
        }

        get object():BasicObject {
            return this._object;
        }

        set object(value:BasicObject) {
            this._object = value;
        }
    }
}