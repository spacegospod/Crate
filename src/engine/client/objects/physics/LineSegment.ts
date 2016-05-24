///<reference path='Point.ts' />
namespace Crate {
    /*
        A line between two points
    */
    export class LineSegment {
        a: Point;
        b: Point;

        constructor(a:Point, b:Point) {
            this.a = new Point(a.x, a.y);
            this.b = new Point(b.x, b.y);
        }
    }
}