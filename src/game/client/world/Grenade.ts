namespace Crate {

    /**
     * A grenade with a fixed fuse timer.
     */
    export class Grenade extends DynamicObject {
        static FUSE_TIME: number = 2 * 1000; // ms

        private _timerStart: number;
        private _target: Point;

        constructor(position:Point,
                direction:Vector,
                target:Point,
                timerStart: number = Date.now()) {
            super('grenade',
                position,
                0,
                10,
                true,
                direction,
                250,
                true);
            this._timerStart = timerStart;
            this._target = target;
            this.rotateInAir();
        }

        get exploded():boolean {
            return (Date.now() - this._timerStart) >= Grenade.FUSE_TIME;
        }

        get explosionData():ExplosionData {
            return new ExplosionData(
                new GrenadeExplosion(new Point(this.position.x - 32, this.position.y - 32)),
                'explode' + (Math.floor(Math.random() * 5) + 1));
        }

        get isOnTarget():boolean {
            return VU.length(VU.createVector(this.position, this._target)) < 16;
        }

        get target():Point {
            return new Point(this._target.x, this._target.y);
        }

        get timerStart():number {
            return this._timerStart;
        }

        private rotateInAir() {
            if (!this.exploded && this.speed > 0) {
                this.rotation += 11;
                setTimeout(() => { this.rotateInAir(); }, 20);
            }
        }
    }

    class ExplosionData {
        animation: GrenadeExplosion;
        soundid: string;

        constructor(animation:GrenadeExplosion, soundid:string) {
            this.animation = animation;
            this.soundid = soundid;
        }
    }
}