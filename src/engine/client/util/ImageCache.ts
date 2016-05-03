namespace Crate {

    /*
        Responsible for preloading game images
    */
    export class ImageCache {
        private images;

        constructor(imageMap) {
            this.preloadImages(imageMap);
        }

        getImageByKey(key:string) {
            return this.images[key];
        }

        private preloadImages(map) {
            this.images = [];

            for (var key in map) {
                var src = '/resources/images/' + map[key];

                var img = new Image();
                img.src = src;
                this.images[key] = img;
            }
        }
    }
}