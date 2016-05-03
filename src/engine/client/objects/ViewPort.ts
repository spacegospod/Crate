namespace Crate {

    /*
        This class represents the visible area of the scene.
        Contains methods for testing whether objects lie within and should be drawn.
    */
    export class ViewPort {
        private position: Point;
        // optional object to follow
        // specified via the centerOn method
        private object: BasicObject;

        width: number;
        height: number;

        constructor(width:number, height:number) {
            this.position = new Point(0, 0);
            this.width = width;
            this.height = height;
        }

        centerOn(object:BasicObject) {
            this.object = object;
        }

        // stops following object
        release() {
            this.object = undefined;
        }

        // Determines whether the provided object is in the viewport.
        // An object is considered to be "in the viewport" when at least
        // one of its bounding box edges lies within. If there is no bounding box
        // the center of the object is used.
        testObject(object:BasicObject):boolean {
            if (!object.boundingBox) {
                return this.testPoint(object.position);
            }
            
            var self = this;
            return object.boundingBox.vertices.some(function(vertice) {
                return self.testPoint(vertice);
            });
        }

        // Determins whether a point is in the viewport.
        testPoint(point:Point):boolean {
            var center:Point = this.getCenter();
            return (point.x > center.x - this.width / 2
                && point.y > center.y - this.height / 2
                && point.x < center.x + this.width / 2
                && point.y < center.y + this.height / 2);
        }

        // Translates the provided point in viewport coordinates.
        // Used for rendering.
        translateInViewport(point:Point):Point {
            var center:Point = this.getCenter();
            return new Point(
                point.x - (center.x - this.width / 2),
                point.y - (center.y - this.height / 2));
        }

        private getCenter():Point {
            if (typeof this.object !== 'undefined') {
                // todo: use copy
                this.position = new Point(this.object.position.x,
                    this.object.position.y);
            }

            return this.position;
        }
    }
}