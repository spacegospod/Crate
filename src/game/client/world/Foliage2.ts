///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class Foliage2 extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('foliage-2',
                position,
                rotation,
                103,
                false);
        }
    }
}