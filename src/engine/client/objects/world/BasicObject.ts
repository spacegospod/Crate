namespace Crate {

    /*
        A simple static map object
    */
    export class BasicObject {
        // Objects with a higher Z index will be drawn "above" other objects.
        // This means that when 2 objects have to overlap, the one with the higher
        // index will be drawn on top
        zIndex: number;
        // Whether this object can collide with another.
        // Note: in order for a collision to occur BOTH objects must have
        // this flag set to true
        collidable: boolean;

        // The bounding box is initialized if necessary during collision evaluation
        boundingBox: BoundingBox;

        networkUid: string;

        gfx: GFX;

        // The rotaton in degrees. Used for drawing the image
        private _rotation: number;
        // The key of the image for this object
        private _imageKey: string;
        // Position on the map
        private _position: Point;
        // A mostly unique identifier. Autogenerated.
        private _uid: string;

        constructor(imageKey:string = 'texture-default',
                position:Point = new Point(0, 0),
                rotation:number = 0,
                zIndex = 0,
                collidable = false) {
            this.imageKey = imageKey;
            this.gfx = new GFX();
            this.position = (position === undefined) ? new Point(0, 0) : position;
            this.rotation = rotation;
            this.zIndex = zIndex;
            this.collidable = collidable;

            // generate uid
            this._uid = this.generateUid();
            this.networkUid = this.generateUid();
        }

        // property imageKey
        get imageKey():string {
            return this._imageKey;
        }

        set imageKey(value:string) {
            this._imageKey = value;
            // invalidate bounding box
            this.boundingBox = undefined;
        }

        // property position
        get position():Point {
            // prevent using reference
            return new Point(this._position.x, this._position.y);
        }

        set position(value:Point) {
            if (!value) {
                return;
            }

            // prevent using reference
            this._position = new Point(value.x, value.y);

            if (typeof this.boundingBox !== 'undefined') {
                this.boundingBox.position = value;
            }

            this.gfx.motionBlur.addBlurEvent(value);
        }

        // property rotation
        get rotation():number {
            return this._rotation;
        }

        set rotation(value:number) {
            this._rotation = value;

            if (typeof this.boundingBox !== 'undefined') {
                this.boundingBox.rotation = value;
            }
        }

        get uid() {
            return this._uid;
        }

        // Generates a mostly unique identifier
        private generateUid() {
            function idChunk() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return idChunk() + idChunk() + idChunk() + idChunk();
        }
    }
}