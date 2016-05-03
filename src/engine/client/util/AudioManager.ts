namespace Crate {
    
    /*
        Responsible for preloading and playing game sounds.
    */
    export class AudioManager {
        private soundsMap;

        constructor(audioMap) {
            this.preloadSounds(audioMap);
        }

        play(id:string) {
            if (typeof this.soundsMap[id] !== 'undefined') {
                this.soundsMap[id].cloneNode(false).play();
            }
        }

        private preloadSounds(audioMap) {
            this.soundsMap = [];

            for (var key in audioMap) {
                var src = '/resources/sounds/' + audioMap[key];

                var sound = new Audio(src);
                sound.load();
                document.body.appendChild(sound);
                this.soundsMap[key] = sound;
            }
        }
    }
}