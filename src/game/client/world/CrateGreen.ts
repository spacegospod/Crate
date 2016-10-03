///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class CrateGreen extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('crate-green',
                position,
                rotation,
                1,
                true);
        }
    }
}