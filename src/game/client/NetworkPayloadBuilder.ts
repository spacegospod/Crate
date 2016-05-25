namespace Crate {

    /*
        Constructs data objects representing the client's state.
    */
    export class NetworkPayloadBuilder {
        build(player:Player, projectiles:Projectile[], serverTimeOffset:number) {
            try {
                var payload = {
                    objects: [this.buildObjectData(player.object)],
                    projectiles: []
                };

                for (var i in projectiles) {
                    payload.projectiles.push(this.buildProjectileData(projectiles[i], serverTimeOffset));
                }

                return payload;
            } catch(e) {
                throw new Error('Failed to build network payload, reason: ' + (e || e.message));
            }
        }

        private buildObjectData(object:BasicObject) {
            return {
                uid: object.uid,
                position: {
                    x: object.position.x,
                    y: object.position.y
                },
                rotation: object.rotation,
                imageKey: object.imageKey,
                collidable: object.collidable,
                networkUid: object.networkUid
            }
        }

        private buildProjectileData(projectile:Projectile, timeOffset:number) {
            return {
                speed: projectile.speed,
                direction: projectile.direction,
                timestamp: projectile.timestamp + timeOffset,
                origin: {x: projectile.origin.x, y: projectile.origin.y},
                object: this.buildObjectData(projectile.object)
            }
        }
    }
}