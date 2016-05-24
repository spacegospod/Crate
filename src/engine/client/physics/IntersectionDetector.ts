namespace Crate {
    
    /*
        Provides methods for detecting line and ray intersection
    */
    export class IntersectionDetector {

        getIntersectionDataForProjectile(projectile:Projectile, targetBox:BoundingBox, delta:Delta) {
            if (typeof projectile === 'undefined') {
                throw new Error('Invalid projectile provided');
            }
            if (typeof targetBox === 'undefined') {
                throw new Error('Invalid bounding box provided');
            }
            var result = [];
            // Create lines from the box edges
            var boxEdges:Array<LineSegment> = [
                new LineSegment(targetBox.vertices[0], targetBox.vertices[1]),
                new LineSegment(targetBox.vertices[1], targetBox.vertices[2]),
                new LineSegment(targetBox.vertices[2], targetBox.vertices[3]),
                new LineSegment(targetBox.vertices[3], targetBox.vertices[0])
            ];

            var projectileLine:LineSegment = new LineSegment(
                projectile.getPosition(projectile.lastUpdate),
                projectile.getPosition(Date.now())
                );
            // For .. in messes up the typing system
            for (var i = 0; i < boxEdges.length; i++) {
                var point = this.getIntersectionDataForLines(projectileLine, boxEdges[i]);
                if (point) {
                    result.push(point)
                }
            }

            return result;
        }

        /*
            Returns an array of the intersection points between the provided ray and
            the bounding box. The array is empty if there is no intersection.
        */
        getIntersectionDataForBoundingBox(ray:Ray, targetBox:BoundingBox):Point[] {
            if (typeof ray === 'undefined') {
                throw new Error('Invalid ray provided');
            }
            if (typeof targetBox === 'undefined') {
                throw new Error('Invalid bounding box provided');
            }
            var result = [];
            // Create lines from the box edges
            var boxEdges:Array<LineSegment> = [
                new LineSegment(targetBox.vertices[0], targetBox.vertices[1]),
                new LineSegment(targetBox.vertices[1], targetBox.vertices[2]),
                new LineSegment(targetBox.vertices[2], targetBox.vertices[3]),
                new LineSegment(targetBox.vertices[3], targetBox.vertices[0])
            ];

            var rayLine:LineSegment = new LineSegment(
                ray.origin,
                new Point(
                    ray.origin.x + (ray.direction.x * 10000),
                    ray.origin.y + (ray.direction.y * 10000)));
            // For .. in messes up the typing system
            for (var i = 0; i < boxEdges.length; i++) {
                var point = this.getIntersectionDataForLines(rayLine, boxEdges[i]);
                if (point) {
                    result.push(point)
                }
            }

            return result;
        }

        /*
            Returns the intersection point between the provided rays.
            The point is undefined if there is no intersection.
        */
        getIntersectionDataForRays(ray:Ray, targetRay:Ray):Point {
            if (typeof ray === 'undefined' || typeof targetRay === 'undefined') {
                throw new Error('Invalid ray provided');
            }
            // stackoverflow.com/questions/2931573/determining-if-two-rays-intersect
            var dx = targetRay.origin.x - ray.origin.x;
            var dy = targetRay.origin.y - ray.origin.y;
            var determinant = 
                (targetRay.direction.x * ray.direction.y) -
                (targetRay.direction.y * ray.direction.x);
            if (determinant == 0) {
                return undefined;
            }
            var u = 
                ((dy * targetRay.direction.x) -
                (dx * targetRay.direction.y)) / determinant;
            var v =
                ((dy * ray.direction.x) -
                (dx * ray.direction.y)) / determinant;
            var doIntersect = isFinite(u) && isFinite(v) && (u * v) > 0;
            return doIntersect
                ? new Point(
                     ray.origin.x + ray.direction.x * u,
                     ray.origin.y + ray.direction.y * u)
                : undefined;
        }

        getIntersectionDataForLines(line1:LineSegment, line2:LineSegment):Point {
            if (typeof line1 === 'undefined' || typeof line2 === 'undefined') {
                throw new Error('Invalid line segment provided');
            }
            var s1:Vector = VU.createVector(line1.a, line1.b); 
            var s2:Vector = VU.createVector(line2.a, line2.b); 

            var s = (-s1.y * (line1.a.x - line2.a.x) + s1.x * (line1.a.y - line2.a.y)) / (-s2.x * s1.y + s1.x * s2.y);
            var t = (s2.x * (line1.a.y - line2.a.y) - s2.y * (line1.a.x - line2.a.x)) / (-s2.x * s1.y + s1.x * s2.y);

            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                return new Point(line1.a.x + (t * s1.x), line1.a.y + (t * s1.y));
            }

            return undefined;
        }
    }
}