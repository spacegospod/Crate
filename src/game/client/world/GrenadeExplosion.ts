namespace Crate {

    /**
     * Grenade explosion animation.
     */
    export class GrenadeExplosion extends Animation {

        constructor(position:Point) {
            super(new Point(position.x, position.y),
                new Sprite('explosion', 64, 64, 5, 5),
                25,
                false,
                80);
        }
    }
}