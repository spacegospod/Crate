namespace Crate {

    /*
        Contains all client state data and manages server updates.
    */
    export class NetworkStateController {

        private serverPushQueue;

        private _game: Game;
        private _networkPayloadBuilder: NetworkPayloadBuilder;

        impacts = [];
        triggeredSounds = [];
        firedProjectiles: Projectile[] = [];

        constructor(game:Game) {
            this.serverPushQueue = [];

            this._game = game;
            this._networkPayloadBuilder = new NetworkPayloadBuilder();
        }

        getServerPushData(socketId:string): any {
            var objects = [];
            var projectiles = [];
            var impacts = [];
            var objectsToRemove = [];
            var soundsToTrigger = [];

            for (var i in this.serverPushQueue) {
                var pushData = this.serverPushQueue[i];
                for (var j in pushData.clientUpdates) {
                    var update = pushData.clientUpdates[j];
                    if (update.clientSocketId !== socketId) {
                        objects.push.apply(objects, update.objects);
                        projectiles.push.apply(projectiles, update.projectiles);
                        soundsToTrigger.push.apply(soundsToTrigger, update.triggeredSounds);
                    }
                }

                impacts.push.apply(impacts, pushData.impacts);
                objectsToRemove.push.apply(objectsToRemove, pushData.objectsToRemove);
            }

            return {
                objects: objects,
                projectiles: projectiles,
                impacts: impacts,
                objectsToRemove: objectsToRemove,
                soundsToTrigger: soundsToTrigger
            }
        }

        onServerPush(data) {
            this.serverPushQueue.push(data);
        }

        clear() {
            this.serverPushQueue = [];
            this.impacts = [];
            this.triggeredSounds = [];
            this.firedProjectiles = [];
        }

        sendClientState(player:Player) {
            try {
                var objects = [];
                if (player.isAlive) {
                    objects.push({object: player.object});
                }

                this._game.emitNetworkData('clientUpdate',
                    this._networkPayloadBuilder.build(
                        objects,
                        this.firedProjectiles,
                        this.impacts,
                        this.triggeredSounds,
                        this._game.connectionData.serverTimeOffset));
            } catch(e) {
                console.error(e || e.message);
            }
        }
    }
}