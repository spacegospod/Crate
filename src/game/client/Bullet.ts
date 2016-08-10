///<reference path='Projectile.ts' />
namespace Crate {

    /*
        A bullet projectile.
    */
    export class Bullet extends Projectile {
        static BULLET_SPEED: number = 800;

        constructor(origin:Point, direction:Vector) {
            super(origin, direction, Bullet.BULLET_SPEED,
                new BasicObject('bullet',
                    origin,
                    0,
                    1,
                    false));
            this.object.gfx.motionBlur.enabled = true;
        }
    }
}