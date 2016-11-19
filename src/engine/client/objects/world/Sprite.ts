namespace Crate {

    export class Sprite {
        sectorWidth: number;
        sectorHeight: number;

        wSectors: number;
        hSectors: number;

        imageKey: string;

        constructor(imageKey:string, sectorWidth:number, sectorHeight:number,
                wSectors:number, hSectors:number) {
            this.imageKey = imageKey;
            this.wSectors = wSectors;
            this.hSectors = hSectors;
            this.sectorWidth = sectorWidth;
            this.sectorHeight = sectorHeight;
        }
    }
}