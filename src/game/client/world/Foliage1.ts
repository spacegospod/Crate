///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class Foliage1 extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('foliage-1',
                position,
                rotation,
                101,
                false);
        }
    }
}