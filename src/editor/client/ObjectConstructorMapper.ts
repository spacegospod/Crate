namespace Editor {

    var classMap = {
        "blood": Crate.BloodStain,
        "crate-original": Crate.CrateOriginal,
        "soldier": Crate.Soldier,
        "crate-green": Crate.CrateGreen,
        "foliage-1": Crate.Foliage1,
        "foliage-2": Crate.Foliage2,
        "foliage-3": Crate.Foliage3,
        "plant-1": Crate.Plant1,
        "plant-2": Crate.Plant2,
        "plant-3": Crate.Plant3,
        "tree-1": Crate.Tree1,
        "car-green": Crate.CarGreen
    };

    export function getObjectClass(imageKey:string) {
        return classMap[imageKey];
    }
}