///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class CrateBig extends BasicObject {
        constructor(position:Point = new Point(0, 0), rotation:number = 0) {
            super('crate',
                position,
                rotation,
                1,
                true);
        }
    }
}