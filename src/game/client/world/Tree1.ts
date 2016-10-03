///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class Tree1 extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('tree-1',
                position,
                rotation,
                200,
                false);
        }
    }
}