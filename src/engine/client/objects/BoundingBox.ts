namespace Crate {

    /*
        Bounding box component used for collision detection
    */
    export class BoundingBox {
        // The center of the box
        private _position: Point;

        // Rotation in degrees
        private _rotation: number = 0;

        // The 4 vertices of the box
        private _vertices;

        constructor(position:Point,
            width:number, height:number,
            rotation:number=0) {
            this._position = position;

            // Create 4 points based on the provided location
            this._vertices = [];
            // top left
            this._vertices.push(
                new Point(
                    position.x - width / 2,
                    position.y - height / 2));
            // top right
            this._vertices.push(
                new Point(
                    position.x + width / 2,
                    position.y - height / 2));
            // bottom right
            this._vertices.push(
                new Point(
                    position.x + width / 2,
                    position.y + height / 2));
            // bottom left
            this._vertices.push(
                new Point(
                    position.x - width / 2,
                    position.y + height / 2));


            this.rotation = rotation;
        }

        set position(value:Point) {
            if (!value) {
                return;
            }

            // move the vertices
            var xOffset = value.x - this._position.x;
            var yOffset = value.y - this._position.y;

            for (var i in this._vertices) {
                var point:Point = this._vertices[i];
                point.x += xOffset;
                point.y += yOffset;
            }

            // prevent using reference
            this._position = new Point(value.x, value.y);
        }

        set rotation(value:number) {
            var offset = value - this._rotation;

            // save value
            this._rotation = value;

            var sin = Math.sin(VU.toRadians(offset));
            var cos = Math.cos(VU.toRadians(offset));

            for (var i in this._vertices) {
                var point:Point = this._vertices[i];
                // translate to origin
                point.x -= this._position.x;
                point.y -= this._position.y;
                // rotate
                var newX = point.x * cos - point.y * sin;
                var newY = point.x * sin + point.y * cos;
                // translate back
                point.x = newX + this._position.x;
                point.y = newY + this._position.y;
            }
        }

        get vertices() {
            return this._vertices;
        }
    }
}