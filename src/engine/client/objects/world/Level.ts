namespace Crate {

    /*
        This class is a representation *.json objects
        used for arranging levels for Crate games.
        Should be used only when initializing the game.
    */
    export class Level {
        map: Map;
        objects;

        constructor(map:Map, objects) {
            this.map = map;
            this.objects = objects;
        }
    }
}