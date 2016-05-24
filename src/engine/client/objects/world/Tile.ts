namespace Crate {

    export class Tile {
        static TILE_WIDTH: number = 32;
        static TILE_HEIGHT: number = 32;

        // The position of the texture tile on the sprite
        textureIndex: Point;

        constructor(index=new Point(0, 0)) {
            this.textureIndex = new Point(index.x, index.y);
        }
    }
}