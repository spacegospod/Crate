namespace Crate {

    /*
        This component is used for managing the floor textures.
        The texturing mechanism is based on square tiles and their
        textures can be changed during runtime.
    */
    export class Map {
        private tiles: Tile[][];

        rows: number;
        columns: number;

        constructor(rows:number, cols:number) {
            this.rows = rows;
            this.columns = cols;

            this.tiles = [];
            for (var i=0; i < rows; i++) {
                var row:Tile[] = [];
                for (var j=0; j < cols; j++) {
                    row.push(new Tile());
                }

                this.tiles.push(row);
            }
        }

        // Retrieves a tile by its row and column indices
        getTileByIndex(row:number, column:number) {
            if (row < 0 || column < 0) {
                return undefined;
            }

            return this.tiles[row][column];
        }

        // Retrieves a tile based on its map coordinates
        getTileByPosition(position:Point) {
            var row = (position.x - (position.x % Tile.TILE_WIDTH)) / Tile.TILE_WIDTH;
            var col = (position.y - (position.y % Tile.TILE_HEIGHT)) / Tile.TILE_HEIGHT;

            return this.getTileByIndex(row, col);
        }

        // Iterates the provided two-dimensional array
        // and applies textures to the corresponding tiles
        applyTextures(textures) {
            for (var i = 0; i < textures.length; i++) {
                var row = textures[i];
                for (var j = 0; j < row.length; j++) {
                    var tile = this.getTileByIndex(j, i);
                    if (typeof tile !== 'undefined') {
                        tile.textureIndex = new Point(row[j].x, row[j].y);
                    }
                }
            }
        }
    }
}