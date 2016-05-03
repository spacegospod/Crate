namespace Crate {

    /*
        Set-like datastructure, therefore no duplication.
    */
    export class Scene {
        private _objects: BasicMapObject[];

        constructor() {
            this._objects = [];
        }

        get objects() {
            return this._objects;
        }

        // Adds the provided object to the scene
        add(object:BasicMapObject) {
            if (object && !this.contains(object)) {
                this._objects.push(object);
            }
        }

        // Removes the provided object from the scene
        remove(object:BasicMapObject) {
            if (object && this.contains(object)) {
                this._objects.splice(this._objects.indexOf(object), 1);
            }
        }

        // Whether the provided object has been added to the scene
        contains(object:BasicMapObject) {
            return this._objects.indexOf(object) != -1;
        }

        // Returns all objects on the scene, sorted by their Z index, lower first
        getObjectsByZIndex() {
            return this._objects.sort((a:BasicMapObject, b:BasicMapObject) => {
                if (a.zIndex < b.zIndex) {
                    return -1;
                }
                if (a.zIndex > b.zIndex) {
                    return 1;
                }

                return 0;
            });
        }
    }
}