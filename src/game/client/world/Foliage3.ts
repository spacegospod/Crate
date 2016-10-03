///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class Foliage3 extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('foliage-3',
                position,
                rotation,
                102,
                false);
        }
    }
}