namespace Crate {

    /*
        Motion blur effect. Stores data for past states of an object.
    */
    export class MotionBlur implements IVisualEffect {
        enabled: boolean;

        private _events: BlurData[];

        static MAX_EVENTS: number = 8;

        static EVENT_TTL: number = 100; //ms

        constructor(enabled:boolean) {
            this.enabled = enabled;
            this._events = [];
        }

        addBlurEvent(point:Point, rotation:number=0) {
            if (!point) {
                return;
            }

            if (this._events.length > MotionBlur.MAX_EVENTS) {
                this._events.shift();
            }

            var data:BlurData = new BlurData(point, rotation);

            this._events.push(data);
        }

        get blurEvents():BlurData[] {
            var events: BlurData[] = [];
            var time = Date.now();
            for (let i in this._events) {
                var event:BlurData = this._events[i];
                if ((time - event.timestamp) < MotionBlur.EVENT_TTL) {
                    events.push(event);
                }
            }
            return events;
        }
    }

    class BlurData {
        private _timestamp: number;
        private _position: Point;
        private _rotation: number;

        constructor(position:Point, rotation:number=0) {
            this._timestamp = Date.now();
            this._position = new Point(position.x, position.y);
            this._rotation = rotation;
        }

        get timestamp():number {
            return this._timestamp;
        }

        get position():Point {
            return new Point(this._position.x, this._position.y);
        }

        get rotation():number {
            return this._rotation;
        }
    }
}