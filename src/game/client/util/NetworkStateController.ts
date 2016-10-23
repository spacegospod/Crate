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

            // stores the IDs of objects which have updates.
            // used for filtering out outdated update events.
            var objectNetworkUids = [];

            // same as above
            var soundEventIds = [];

            for (var i = this.serverPushQueue.length - 1; i >= 0; i--) {
                var pushData = this.serverPushQueue[i];
                for (var j in pushData.clientUpdates) {
                    var update = pushData.clientUpdates[j];
                    if (update.clientSocketId !== socketId) {
                        projectiles.push.apply(projectiles, update.projectiles);

                        for (var k in update.objects) {
                            var object = update.objects[k];
                            if (objectNetworkUids.indexOf(object.networkUid) < 0) {
                                objectNetworkUids.push(object.networkUid);
                                objects.push(object);
                            }
                        }

                        for (var m in update.triggeredSounds) {
                            var sound = update.triggeredSounds[m];
                            if (soundEventIds.indexOf(sound.eventid) < 0) {
                                soundsToTrigger.push(sound);
                                soundEventIds.push(sound.eventid);
                            }
                        }
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

        sendClientState(player:Player, createdNetworkObjects:BasicObject[]) {
            try {
                var objects = [];
                if (player.isAlive) {
                    objects.push({object: player.object, deleteOnDisconnect: true});
                }

                for (var i in createdNetworkObjects) {
                    objects.push({object: createdNetworkObjects[i], deleteOnDisconnect: false});
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