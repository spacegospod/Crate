namespace Crate {

    export class Tile {
        static TILE_WIDTH: number = 64;
        static TILE_HEIGHT: number = 64;
        static DEFAULT_TEXTURE: string = 'texture-default';

        textureKey:string;

        constructor(textureKey=Tile.DEFAULT_TEXTURE) {
            this.textureKey = textureKey;
        }
    }
}