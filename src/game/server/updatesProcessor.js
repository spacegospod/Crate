// removes duplicate impact events
function filterImpacts(impacts, registeredImpacts) {

    function isImpactUnique(impact, registeredImpacts) {
        for (var j in registeredImpacts) {
            if (impact.object === registeredImpacts[j].data.object
                && impact.projectile === registeredImpacts[j].data.projectile) {
                return false;
            }
        }

        return true;
    }

    var result = [];
    for (var i in impacts) {
        var impact = impacts[i];
        if (isImpactUnique(impact, registeredImpacts)) {
            result.push(impact);
            registerImpact(impact);
        }
    }

    return result;
}

function getObjectsToRemove(deadPlayersData) {
    var objsToRemove = [];
    for (var i in deadPlayersData) {
        var info = deadPlayersData[i];
        for (var j in info.data) {
            try {
                objsToRemove.push(info.data[j]);
            } catch(e) {
                console.log(e);
            }
        }
    }

    return objsToRemove;
}

function buildPushData(clientsData,
        registeredImpacts,
        deleteOnDisconnect,
        deadPlayersData) {
    var data = {
        impacts: [],
        objectsToRemove: getObjectsToRemove(deadPlayersData),
        clientUpdates: []
    };

    for (var socketId in clientsData) {
        var clientData = clientsData[socketId];
        if (typeof clientData === 'undefined') {
            continue;
        }

        try {
            var clientUpdateItem = {
                objects: [],
                projectiles: [],
                triggeredSounds: [],
                clientSocketId: socketId
            };

            if (typeof clientData.objects !== 'undefined') {
                var filteredObjects = clientData.objects.filter(function(object) {
                    return data.objectsToRemove.indexOf(object.networkUid) < 0;
                });

                clientUpdateItem.objects = filteredObjects;

                for (var i in clientData.objects) {
                    var object = clientData.objects[i];
                    if (object.deleteOnDisconnect) {
                        var present = false;
                        for (var j in deleteOnDisconnect[socketId]) {
                            var objToDeleteOnDisconnect = deleteOnDisconnect[socketId][j];
                            if (objToDeleteOnDisconnect.networkUid === object.networkUid) {
                                present = true;
                            }
                        }

                        if (!present) {
                            deleteOnDisconnect[socketId].push(object);
                        }
                    }
                }
            }

            if (typeof clientData.projectiles !== 'undefined') {
                clientUpdateItem.projectiles = clientData.projectiles;
            }

            if (typeof clientData.triggeredSounds !== 'undefined') {
                clientUpdateItem.triggeredSounds = clientData.triggeredSounds;
            }

            data.clientUpdates.push(clientUpdateItem);

            data.impacts.push.apply(data.impacts, filterImpacts(clientData.impacts, registeredImpacts));
        } catch (e) {
            console.log(e);
        } finally {
            clientsData[socketId] = {};
        }
    }

    return data;
}