namespace Crate {

    /*
        Set-like datastructure, no duplication.
    */
    export class Scene {
        private _objects: BasicObject[];
        private _animations: Animation[];

        constructor() {
            this._objects = [];
            this._animations = [];
        }

        get objects(): BasicObject[] {
            return this._objects;
        }

        get animations(): Animation[] {
            return this._animations;
        }

        // Adds the provided object to the scene
        addObject(object:BasicObject) {
            if (object && !this.containsObject(object)) {
                this._objects.push(object);
            }
        }

        // Removes the provided object from the scene
        removeObject(object:BasicObject) {
            if (object && this.containsObject(object)) {
                this._objects.splice(this._objects.indexOf(object), 1);
            }
        }

        // Whether the provided object has been added to the scene
        containsObject(object:BasicObject) {
            return this._objects.indexOf(object) != -1;
        }

        // Adds the provided animation to the scene
        addAnimation(animation:Animation) {
            if (animation && !this.containsAnimation(animation)) {
                this._animations.push(animation);
            }
        }

        // Removes the provided animation from the scene
        removeAnimation(animation:Animation) {
            if (animation && this.containsAnimation(animation)) {
                this._animations.splice(this._animations.indexOf(animation), 1);
            }
        }

        // Whether the provided animation has been added to the scene
        containsAnimation(animation:Animation) {
            return this._animations.indexOf(animation) != -1;
        }

        // Returns all objects on the scene, sorted by their Z index, lower first
        getObjectsByZIndex(): BasicObject[] {
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

        // Returns all animations on the scene, sorted by their Z index, lower first
        getAnimationsByZIndex(): Animation[] {
            return this._animations.sort((a:Animation, b:Animation) => {
                if (a.zIndex < b.zIndex) {
                    return -1;
                }
                if (a.zIndex > b.zIndex) {
                    return 1;
                }

                return 0;
            });
        }

        getAllByZIndex(): IRenderable[] {
            return (<IRenderable[]> this._objects).concat(<IRenderable[]> this._animations)
                    .sort((a:IRenderable, b:IRenderable) => {
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