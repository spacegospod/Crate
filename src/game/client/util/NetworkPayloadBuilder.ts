///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    /*
        Constructs data objects representing the client's state.
    */
    export class NetworkPayloadBuilder {
        build(objects, projectiles:Projectile[], impacts, triggeredSounds, serverTimeOffset:number) {
            try {
                var payload = {
                    objects: [],
                    projectiles: [],
                    impacts: [],
                    triggeredSounds: []
                };

                for (let i in objects) {
                    if (typeof objects[i] !== 'undefined') {
                        payload.objects.push(this.buildObjectData(objects[i]));
                    }
                }

                for (let i in projectiles) {
                    payload.projectiles.push(this.buildProjectileData(projectiles[i], serverTimeOffset));
                }

                for (let i in impacts) {
                    // directly serializeable
                    payload.impacts = impacts;
                }

                for (let i in triggeredSounds) {
                    // directly serializeable
                    payload.triggeredSounds = triggeredSounds;
                }

                return payload;
            } catch(e) {
                throw new Error('Failed to build network payload, reason: ' + (e || e.message));
            }
        }

        private buildObjectData(objectData) {
            var object = objectData.object;
            return {
                uid: object.uid,
                position: {
                    x: object.position.x,
                    y: object.position.y
                },
                rotation: object.rotation,
                imageKey: object.imageKey,
                collidable: object.collidable,
                networkUid: object.networkUid,
                zIndex: object.zIndex,
                gfx: {
                    motionBlur: object.gfx.motionBlur.enabled,
                    blood: object.gfx.blood.enabled
                },
                type: (<any> object.constructor).name,
                deleteOnDisconnect: objectData.deleteOnDisconnect
            }
        }

        private buildProjectileData(projectile:Projectile, timeOffset:number) {
            return {
                speed: projectile.speed,
                direction: projectile.direction,
                damage: projectile.damage,
                timestamp: projectile.timestamp + timeOffset,
                origin: {x: projectile.origin.x, y: projectile.origin.y},
                object: this.buildObjectData({object: projectile.object}),
                soundId: projectile.soundId
            }
        }
    }
}