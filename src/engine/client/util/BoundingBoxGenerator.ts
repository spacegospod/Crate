namespace Crate {

    /*
        Responsible for creating bounding boxes.
    */
    export class BoundingBoxGenerator {
        private boundingBoxSpecs;

        constructor(map) {
            this.populateSpecs(map);
        }

        generateBoundingBoxForImage(imageKey:string,
                width:number,
                height:number,
                position:Point,
                rotation:number):BoundingBox {
            var boundingBox:BoundingBox = new BoundingBox(
                        position,
                        width,
                        height,
                        0);
            var spec = this.boundingBoxSpecs[imageKey];
            if (typeof spec !== 'undefined') {
                var vertices = boundingBox.vertices;

                // top left
                vertices[0].y = position.y - spec.top;
                vertices[0].x = position.x - spec.left;
                // top right
                vertices[1].y = position.y - spec.top;
                vertices[1].x = position.x + spec.right;
                // bottom right
                vertices[2].y = position.y + spec.bottom;
                vertices[2].x = position.x + spec.right;
                // bottom left
                vertices[3].y = position.y + spec.bottom;
                vertices[3].x = position.x - spec.left;
            }

            boundingBox.rotation = rotation;
            return boundingBox;
        }

        private populateSpecs(map) {
            this.boundingBoxSpecs = [];
            for (var key in map) {
                var entry = map[key];
                this.boundingBoxSpecs[key] = new BoundingBoxSpec(
                    entry.top,
                    entry.bottom,
                    entry.left,
                    entry.right
                    );
            }
        }
    }

    class BoundingBoxSpec {
        top: number;
        bottom: number;
        left: number;
        right: number;

        constructor(top, bottom, left, right) {
            this.top = top;
            this.bottom = bottom;
            this.left = left;
            this.right = right;
        }
    }
}