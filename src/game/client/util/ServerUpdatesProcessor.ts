namespace Crate {

    /*
        Applies server updates to clients.
    */
    export class ServerUpdatesProcessor {

        private _game: Game;
        private _player: Player;

        constructor(game:Game, player:Player) {
            this._game = game;
            this._player = player;
        }

        apply(data, projectiles) {
            this.updateObjects(data.objects);
            this.updateProjectiles(data.projectiles, projectiles);
            this.updateImpacts(data.impacts);
            this.updateObjectsToRemove(data.objectsToRemove);

            this.playSounds(data.soundsToTrigger);
        }

        private updateObjects(data) {
            for (let i in data) {
                this.updateObject(data[i]);
            }
        }

        private updateObject(data) {
            for (let i in this._game.scene.objects) {
                var object = this._game.scene.objects[i];
                if (object && object.networkUid != data.networkUid) {
                    continue;
                }

                if (!(data.networkUid == this._player.object.networkUid)) {
                    this.updateProperties(object, data);
                }
                return;
            }

            // object not found, create
            var newobj = this.createObject(data);
            if (typeof newobj !== 'undefined') {
                this._game.scene.add(newobj);
            }
        }

        private updateProjectiles(data, projectiles) {
            for (let i in data) {
                var proj = data[i];
                if (proj && this.isNetworkUIDUnique(proj.object.networkUid)) {
                    var bullet = new Projectile(
                        new Point(proj.origin.x, proj.origin.y),
                        new Vector(proj.direction.x, proj.direction.y),
                        <number>proj.speed,
                        proj.damage,
                        this.createObject(proj.object),
                        <number>proj.timestamp - this._game.connectionData.serverTimeOffset);
                    bullet.soundId = proj.soundId;
                    projectiles.push(bullet);
                    this._game.scene.add(bullet.object);
                    var distance:number = VU.length(VU.createVector(this._player.object.position, proj.origin));
                    var volume:number = (2500 - distance) / 2500;
                    this._game.triggerEvent(EVENTS.AUDIO, {soundId: bullet.soundId, volume: volume});
                }
            }
        }

        private updateImpacts(data) {
            if (typeof data === 'undefined' || data.length === 0) {
                return;
            }

            // filters out duplicates
            function filterImpacts(impacts) {
                var result = [];
                for (var i = 0; i < impacts.length; i++) {
                    var isDuplicate = false;
                    var impact = impacts[i];
                    for (var j = i + 1; j < impacts.length; j++) {
                        if (impact.object === impacts[j].object
                            && impact.projectile === impacts[j].projectile) {
                            isDuplicate = true;
                        }
                    }

                    if (!isDuplicate) {
                        result.push(impact);
                    }
                }

                return result;
            }

            var objectsByNetworkUid = {};
            for (let i in this._game.scene.objects) {
                let object:BasicObject = this._game.scene.objects[i];
                objectsByNetworkUid[object.networkUid] = object;
            }

            var filteredImpacts = filterImpacts(data);

            for (let i in filteredImpacts) {
                let impact = filteredImpacts[i];
                let object:BasicObject = objectsByNetworkUid[impact.object];

                if (typeof object === 'undefined') {
                    continue;
                }

                if (object.gfx && object.gfx.blood.enabled) {
                    this._game.scene.add(new BloodStain(object.position));
                }

                if (typeof this._player.object !== 'undefined'
                    && impact.object === this._player.object.networkUid
                    && typeof impact.damage !== 'undefined') {
                    this._player.health -= impact.damage;
                }
            }

            if (this._player.health <= 0) {
                this._player.isAlive = false;
                this._game.scene.remove(this._player.object);
                this.sendPlayerDied(this._player);
            }

            return;
        }

        private updateObjectsToRemove(networkUids) {
            var objectsToRemove = [];
            for (var i in networkUids) {
                var networkUid = networkUids[i];
                for (var j in this._game.scene.objects) {
                    var object:BasicObject = this._game.scene.objects[j];
                    if (object.networkUid === networkUid) {
                        objectsToRemove.push(object);
                    }
                }
            }

            for (var i in objectsToRemove) {
                this._game.scene.remove(objectsToRemove[i]);
            }
        }

        private updateProperties(object:BasicObject, props) {
            if (typeof props.position !== 'undefined') {
                object.position = props.position;
            }
            if (typeof props.rotation !== 'undefined') {
                object.rotation = props.rotation;
            }
            if (typeof props.collidable !== 'undefined') {
                object.collidable = props.collidable;
            }
            if (typeof props.networkUid !== 'undefined') {
                object.networkUid = props.networkUid;
            }
            if (typeof props.zIndex !== 'undefined') {
                object.zIndex = props.zIndex;
            }
            if (typeof props.gfx !== 'undefined') {
                object.gfx.motionBlur.enabled = props.gfx.motionBlur;
                object.gfx.blood.enabled = props.gfx.blood;
            }
            if (props.imageKey && props.imageKey != object.imageKey) {
                object.imageKey = props.imageKey;
            }
        }

        private createObject(data):BasicObject {
            var constructorFunction = Crate[data.type] || BasicObject;
            var newObject = new constructorFunction();

            this.updateProperties(newObject, data);
            return newObject;
        }

        private playSounds(data) {
            for (var i in data) {
                var soundData = data[i];
                var distance:number = VU.length(VU.createVector(this._player.object.position, soundData.origin));
                var volume:number = (soundData.maxRange - distance) / soundData.maxRange;
                this._game.triggerEvent(EVENTS.AUDIO, {soundId: soundData.soundId, volume: volume});
            }
        }

        private isNetworkUIDUnique(uid:string) {
            for (let i in this._game.scene.objects) {
                if (this._game.scene.objects[i].networkUid === uid) {
                    return false;
                }
            }

            return true;
        }

        // todo: move out of here
        sendPlayerDied(player:Player) {
            this._game.emitNetworkData(
                'playerDied',
                {
                    objectsToRemove: [
                        player.object.networkUid
                    ]
                });
        }
    }
}