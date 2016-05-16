namespace Crate {

    /*
        Draws the scene and map textures on the canvas.
    */
    export class Renderer {
        // The 2D context of the canvas
        private context;
        // The viewport for the game
        private viewPort: ViewPort;
        // The scene containing all objects to be drawn
        private scene: Scene;
        // The map containing the floor textures
        private level:Map;
        // A cache with all images for the game
        private imageCache: ImageCache;

        constructor(context, viewPort:ViewPort, scene:Scene, level:Map, imageCache:ImageCache) {
            if (!context || !viewPort || !scene) {
                // todo handle error
            }

            this.context = context;
            this.viewPort = viewPort;
            this.scene = scene;
            this.level = level;
            this.imageCache = imageCache;

            this.context.fillStyle = '#333333';
        }

        // draw the scene
        draw() {
            // Clean up previous frame. Not needed if the next fillRect call is present
            // this.context.clearRect(0, 0, this.viewPort.width, this.viewPort.height);

            // Fill with blank background color
            this.context.fillRect(0, 0, this.viewPort.width, this.viewPort.height);

            // Draw floor textures
            this.drawLevel();

            // Get sorted objects, in order for drawing
            var objects = this.scene.getObjectsByZIndex();

            for (var i in objects) {
                var object = objects[i];
                // is the object within the viewport?
                if (this.viewPort.testObject(object)) {
                    var image = this.imageCache.getImageByKey(object.imageKey);
                    if (typeof image === 'undefined') {
                        console.error('Failed to render image for key: ' + object.imageKey);
                        continue;
                    }

                    var p = this.viewPort.translateInViewport(new Point(object.position.x, object.position.y));

                    if (object.rotation == 0) {
                        this.context.drawImage(image, p.x - (image.width / 2), p.y- (image.height / 2));
                    } else {
                        this.drawRotated(image, p.x, p.y, object.rotation);
                    }

                    if (object.boundingBox !== undefined) {
                        var a = object.boundingBox.vertices;
                        var v = [];
                        for (var i in a) {
                            v.push(this.viewPort.translateInViewport(a[i]));
                        }
                        this.context.strokeStyle = "#33ff33";

                        this.context.beginPath();
                        this.context.moveTo(v[0].x, v[0].y);
                        this.context.lineTo(v[1].x, v[1].y);
                        this.context.stroke();

                        this.context.beginPath();
                        this.context.moveTo(v[1].x, v[1].y);
                        this.context.lineTo(v[2].x, v[2].y);
                        this.context.stroke();

                        this.context.beginPath();
                        this.context.moveTo(v[2].x, v[2].y);
                        this.context.lineTo(v[3].x, v[3].y);
                        this.context.stroke();

                        this.context.beginPath();
                        this.context.moveTo(v[3].x, v[3].y);
                        this.context.lineTo(v[0].x, v[0].y);
                        this.context.stroke();
                    }
                }
            }
        }

        private drawRotated(image, x:number, y:number, rotation) {
            // save the current co-ordinate system 
            this.context.save(); 
            // move to the middle of where we want to draw our image
            this.context.translate(x, y);
            // rotate around that point, converting our 
            // angle from degrees to radians 
            this.context.rotate(VU.toRadians(rotation));
            // draw it up and to the left by half the width
            // and height of the image 
            this.context.drawImage(image, - (image.width / 2), - (image.height / 2));
            this.context.restore(); 
        }

        private drawLevel() {
            for (var row=0; row < this.level.rows; row++) {
                for (var col=0; col < this.level.columns; col++) {
                    if (this.testTile(row, col)) {
                        var tile = this.level.getTileByIndex(row, col);
                        var sprite = this.imageCache.getImageByKey("texture-sprite");
                        var location = this.viewPort.translateInViewport(
                            new Point(
                                row * Tile.TILE_WIDTH,
                                col * Tile.TILE_HEIGHT));
                        this.context.drawImage(
                            sprite,
                            tile.textureIndex.x * Tile.TILE_WIDTH,
                            tile.textureIndex.y * Tile.TILE_HEIGHT,
                            Tile.TILE_WIDTH,
                            Tile.TILE_HEIGHT,
                            location.x,
                            location.y,
                            Tile.TILE_WIDTH,
                            Tile.TILE_HEIGHT);
                    }
                }
            }
        }

        private testTile(row:number, col:number) {
            return (this.viewPort.testPoint(new Point(row * Tile.TILE_WIDTH, col * Tile.TILE_HEIGHT))
                || this.viewPort.testPoint(new Point((row + 1) * Tile.TILE_WIDTH, col * Tile.TILE_HEIGHT))
                || this.viewPort.testPoint(new Point((row + 1) * Tile.TILE_WIDTH, (col + 1) * Tile.TILE_HEIGHT))
                || this.viewPort.testPoint(new Point(row * Tile.TILE_WIDTH, (col + 1) * Tile.TILE_HEIGHT)));
        }
    }
}