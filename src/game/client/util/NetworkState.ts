namespace Crate {

    /*
        Contains all client state data and manages server updates.
    */
    export class NetworkState {

        private serverPushQueue;

        constructor() {
            this.serverPushQueue = [];
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
        }
    }
}