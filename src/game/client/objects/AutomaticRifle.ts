///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export class AutomaticRifle implements IWeapon {
        fireInterval: number;
        reloadTime: number;
        magazineAmmo: number;
        remainingAmmo: number;
        damageMin: number;
        damageMax: number;
        fireSoundId: string;
        clipOutSoundId: string;
        clipInSoundId: string;
        isFiring: boolean;
        isAutomatic: boolean;

        private _isReadyToFire: boolean;
        private _isReloading: boolean;
        private _recoilFactor: number;

        private _maxRecoilAngle: number;

        constructor() {
            this.fireInterval = 100;
            this.reloadTime = 5 * 1000;
            this.magazineAmmo = 30;
            this.remainingAmmo = 90;
            this.damageMin = 4;
            this.damageMax = 9;
            this._recoilFactor = 0;
            this.fireSoundId = 'm4a1';
            this.clipOutSoundId = "clipout";
            this.clipInSoundId = "clipin";
            this._isReloading = false;
            this._isReadyToFire = true;
            this.isAutomatic = true;

            this._maxRecoilAngle = 30;

            this.reduceRecoil();
        }

        reload() {
            this._isReloading = true;
            setTimeout(() => {
                this.remainingAmmo -= (30 - this.magazineAmmo);
                var newAmmo = 30;
                if (this.remainingAmmo < 0) {
                    newAmmo += this.remainingAmmo;
                    this.remainingAmmo = 0;
                }
                this.magazineAmmo = newAmmo;
                this._isReloading = false;
                this._isReadyToFire = true;
            }, this.reloadTime);
        }

        isReloading():boolean {
            return this._isReloading;
        }

        isReadyToFire():boolean {
            return this._isReadyToFire;
        }

        fire(origin:Point, direction:Vector):Projectile {
            if (!this._isReadyToFire || this._isReloading || this.magazineAmmo <= 0) {
                return undefined;
            }

            this._isReadyToFire = false;

            setTimeout(() => {
                this._isReadyToFire = true;
            }, this.fireInterval);

            // true for left, false for right
            var recoilDirection = Math.random() > 0.5;
            
            var recoilAngle = recoilDirection
                    ? this._maxRecoilAngle * this._recoilFactor * Math.random()
                    : this._maxRecoilAngle * this._recoilFactor * Math.random();

            this._recoilFactor = Math.min(1, this._recoilFactor + 0.070);

            var damage: number = Math.random() * (this.damageMax - this.damageMin) + this.damageMin;

            this.magazineAmmo--;

            var bullet:Bullet = new Bullet(origin, VU.rotateVector(direction, recoilAngle), damage);
            bullet.soundId = this.fireSoundId;

            return bullet;
        }

        private reduceRecoil() {
            this._recoilFactor = Math.max(0, this._recoilFactor - 0.04);
            setTimeout(() => {this.reduceRecoil();}, this.fireInterval);
        }
    }
}