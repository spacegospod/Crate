///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class Plant2 extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('plant-2',
                position,
                rotation,
                9,
                false);
        }
    }
}