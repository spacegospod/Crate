namespace Crate {

    /*
        This class is a representation *.json objects
        used for arranging levels for Crate games.
        Should be used only when initializing the game.
    */
    export class Level {
        map: Map;
        spawnLocations;
        objects;

        constructor(map:Map, spawnLocations, objects) {
            this.map = map;
            this.spawnLocations = spawnLocations;
            this.objects = objects;
        }
    }
}