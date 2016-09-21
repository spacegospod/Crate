namespace Crate {

    export class AutomaticRifle implements IWeapon {
        fireInterval: number;
        reloadTime: number;
        damageMin: number;
        damageMax: number;
        soundId: string;
        isFiring: boolean;
        isAutomatic: boolean;

        private _isReadyToFire: boolean;
        private _recoilFactor: number;

        constructor() {
            this.fireInterval = 100;
            this.reloadTime = 5 * 1000;
            this.damageMin = 4;
            this.damageMax = 9;
            this._recoilFactor = 0;
            this.soundId = 'fire';
            this._isReadyToFire = true;
            this.isAutomatic = true;

            this.reduceRecoil();
        }

        reload() {
            setTimeout(() => {
                this._isReadyToFire = true;
            }, this.reloadTime);
        }

        isReadyToFire() {
            return this._isReadyToFire;
        }

        fire(origin:Point, direction:Vector):Projectile {
            if (!this.isReadyToFire) {
                return undefined;
            }

            this._isReadyToFire = false;

            setTimeout(() => {
                this._isReadyToFire = true;
            }, this.fireInterval);

            // true for left, false for right
            var recoilDirection = Math.random() > 0.5;
            
            var recoilAngle = recoilDirection
                    ? 15 * this._recoilFactor * Math.random()
                    : -15 * this._recoilFactor * Math.random();

            this._recoilFactor = Math.min(1, this._recoilFactor + 0.070);

            var damage: number = Math.random() * (this.damageMax - this.damageMin) + this.damageMin;

            return new Bullet(origin, VU.rotateVector(direction, recoilAngle), damage);
        }

        private reduceRecoil() {
            this._recoilFactor = Math.max(0, this._recoilFactor - 0.04);
            setTimeout(() => {this.reduceRecoil();}, this.fireInterval);
        }
    }
}