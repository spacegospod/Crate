namespace Crate {

    /* 2D point */
    export class Point {
        x: number;
        y: number;

        constructor(x:number, y:number) {
            if (isNaN(x) || isNaN(y)) {
                throw 'Invalid coordinates provided when constructing point';
            }
            this.x = x;
            this.y = y;
        }
    }
}