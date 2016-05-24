namespace Crate {

    /*
        Set-like datastructure, therefore no duplication.
    */
    export class Scene {
        private _objects: BasicObject[];

        constructor() {
            this._objects = [];
        }

        get objects() {
            return this._objects;
        }

        // Adds the provided object to the scene
        add(object:BasicObject) {
            if (object && !this.contains(object)) {
                this._objects.push(object);
            }
        }

        // Removes the provided object from the scene
        remove(object:BasicObject) {
            if (object && this.contains(object)) {
                this._objects.splice(this._objects.indexOf(object), 1);
            }
        }

        // Whether the provided object has been added to the scene
        contains(object:BasicObject) {
            return this._objects.indexOf(object) != -1;
        }

        // Returns all objects on the scene, sorted by their Z index, lower first
        getObjectsByZIndex() {
            return this._objects.sort((a:BasicObject, b:BasicObject) => {
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