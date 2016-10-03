///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class Plant3 extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('plant-3',
                position,
                rotation,
                9,
                false);
        }
    }
}