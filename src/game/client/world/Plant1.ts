///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class Plant1 extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('plant-1',
                position,
                rotation,
                9,
                false);
        }
    }
}