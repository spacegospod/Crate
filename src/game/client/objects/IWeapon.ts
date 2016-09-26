///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    export interface IWeapon {
        // in milliseconds
        fireInterval: number;
        // in milliseconds
        reloadTime: number;
        damageMin: number;
        damageMax: number;
        // whether the weapon is currently firing. Should be used along with
        // 'isAutomatic'
        isFiring: boolean;
        // whether the weapon is automatic
        isAutomatic: boolean;
        // sound to play when fired
        soundId: string;

        reload();

        isReadyToFire();

        fire(origin:Point, direction:Vector):Projectile;
    }
}