namespace Crate {
    
    /*
        Provides narrow-phase SAT collision detection
    */
    export class CollisionDetector {

        // Test two objects for collision
        getCollisionData(
            testedObject:BasicMapObject,
            targetObject:BasicMapObject):CollisionData {
            var box1:BoundingBox = testedObject.boundingBox;
            var box2:BoundingBox = targetObject.boundingBox;
            if (!box1 || !box2) {
                return undefined;
            }
            var axes = this.getAxes(box1).concat(this.getAxes(box2));
            var minimumOverlap = Number.MAX_VALUE;
            var minimumAxis = undefined;
            for (var i in axes) {
                var axis:Vector = axes[i];
                var p1:Projection = this.project(box1.vertices, axis);
                var p2:Projection = this.project(box2.vertices, axis);
                var centerProjection:Projection =
                    this.project([targetObject.position, testedObject.position], axis);
                var overlap = this.overlap(centerProjection, p1, p2);
                if (overlap == 0) {
                    return undefined;
                } else if (overlap < minimumOverlap) {
                    minimumOverlap = overlap;
                    minimumAxis = axis;
                }
            }

            return new CollisionData(
                testedObject, targetObject,
                minimumAxis, minimumOverlap);
        }

        // Get collision test axes
        private getAxes(box:BoundingBox) {
            var axes = [];
            
            axes.push(this.getAxis(box.vertices[0], box.vertices[1]));
            axes.push(this.getAxis(box.vertices[1], box.vertices[2]));
            axes.push(this.getAxis(box.vertices[2], box.vertices[3]));
            axes.push(this.getAxis(box.vertices[3], box.vertices[0]));

            return axes;
        }

        private getAxis(vertice1:Point, vertice2:Point):Vector {
            return VU.getNormal(new Vector(
                vertice2.x - vertice1.x,
                vertice2.y - vertice1.y
                ));
        }

        // Project an array of vertices on an axis
        private project(vertices, axis:Vector):Projection {
            var min = VU.dotProduct(axis, vertices[0]);
            var max = min;

            for (var i = 1; i < vertices.length; i++) {
                var p = VU.dotProduct(axis, vertices[i]);
                min = (p < min) ? p : min;
                max = (p > max) ? p : max;
            }

            return new Projection(min, max);
        }

        // Test whether two projections overlap
        private overlap(
                centerProjection:Projection,
                projection1:Projection,
                projection2:Projection):number {

            var overlap = 
                (projection1.length / 2) +
                (projection2.length / 2) -
                centerProjection.length;
            return overlap > 0 ? overlap : 0;
        }
    }

    // Data which describes the result of a collision
    export class CollisionData {
        private _axis: Vector;
        private _overlapAmount: number;

        testedObject: BasicMapObject;
        targetObject: BasicMapObject

        constructor(testedObject:BasicMapObject, targetObject:BasicMapObject,
            axis:Vector, overlap:number) {
            this.testedObject = testedObject;
            this.targetObject = targetObject;
            this._axis = VU.normalize(new Vector(axis.x, axis.y));
            this._overlapAmount = overlap;
        }

        get axis():Vector {
            return new Vector(this._axis.x, this._axis.y);
        }

        get overlapAmount():number {
            return this._overlapAmount;
        }
    }

    class Projection {
        min: number;
        max: number;

        constructor(min:number, max:number) {
            this.min = min;
            this.max = max;
        }

        get length():number {
            return this.max - this.min;
        }
    }
}