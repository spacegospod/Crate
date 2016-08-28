namespace Crate {
    
    /*
        Responsible for preloading and playing game sounds.
    */
    export class AudioManager {
        private soundsMap;

        constructor(audioMap) {
            this.preloadSounds(audioMap);
        }

        play(id:string, volume:number) {
            if (typeof this.soundsMap[id] !== 'undefined') {
                if (volume < 0 || volume > 1) {
                    return;
                }

                var node = this.soundsMap[id].cloneNode(false);
                node.volume = volume;
                node.play();
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