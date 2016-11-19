namespace Crate {

    export class Animation implements IRenderable {

        // the center
        position: Point;

        looping: boolean;

        zIndex: number;

        private _sprite: Sprite;

        private _frameDuration: number;

        private _done: boolean;

        private _startTime: number;

        constructor(position:Point, sprite:Sprite, frameDuration:number, looping:boolean, zIndex:number=0, startTime=Date.now()) {
            this.position = new Point(position.x, position.y);
            this._sprite = sprite;
            this.looping = looping;
            this.zIndex = zIndex;
            
            this._frameDuration = frameDuration;
            this._done = false;
            this._startTime = startTime;
        }

        get currentFrame(): FrameData {
            if (this._done) {
                return null;
            }

            var now = Date.now();
            var frameNumber:number = Math.floor( (now - this._startTime) / this._frameDuration);

            var count:number = 0;

            for (var i:number = 0; i < this._sprite.wSectors; i++) {
                for (var j:number = 0; j < this._sprite.hSectors; j++) {
                    if (count === frameNumber) {
                        var frameData:FrameData = new FrameData();
                        frameData.sprite = this._sprite;
                        frameData.x = j;
                        frameData.y = i;

                        return frameData;
                    }

                    count++;
                }
            }

            if (this.looping) {
                this._startTime = now;
            } else {
                this._done = true;
            }
        }

        get done(): boolean {
            return this._done;
        }
    }

    class FrameData {
        sprite: Sprite;
        x: number;
        y: number;
    }
}