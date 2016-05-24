namespace Crate {

    /* 2D vector */
    export class Vector {
        x: number;
        y: number;

        constructor(x:number, y:number) {
            if (isNaN(x) || isNaN(y)) {
                throw 'Invalid coordinates provided when constructing vector';
            }
            this.x = x;
            this.y = y;
        }
    }
}