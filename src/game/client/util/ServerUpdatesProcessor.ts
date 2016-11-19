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

        apply(data, projectiles): any {
            var result = {
                playerDied: false
            };

            this.updateObjects(data.objects);
            this.updateProjectiles(data.projectiles, projectiles);
            result.playerDied = this.updateImpacts(data.impacts);
            this.updateObjectsToRemove(data.objectsToRemove);

            this.playSounds(data.soundsToTrigger);

            return result;
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
                this._game.scene.addObject(newobj);
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
                    this._game.scene.addObject(bullet.object);
                }
            }
        }

        private updateImpacts(data): any {
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
                    var theta = 2 * Math.PI * Math.random();
                    var x = object.position.x + (Math.random() * 20) * Math.cos(theta);
                    var y = object.position.y + (Math.random() * 20) * Math.sin(theta);
                    this._game.scene.addObject(new BloodStain(new Point(x, y), Math.random() * 360));
                }

                if (typeof this._player.object !== 'undefined'
                    && impact.object === this._player.object.networkUid
                    && typeof impact.damage !== 'undefined') {
                    this._player.health -= impact.damage;
                }
            }

            if (this._player.health <= 0 && this._player.isAlive) {
                return true;
            }

            return false;
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
                this._game.scene.removeObject(objectsToRemove[i]);
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

                setTimeout( () => {
                    this._game.triggerEvent(EVENTS.AUDIO, {soundId: soundData.soundId, volume: volume});
                }, soundData.offset);
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
    }
}