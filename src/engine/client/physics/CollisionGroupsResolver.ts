namespace Crate {
    
    /*
        Provides broad-phase SAT collision detection
    */
    export class CollisionGroupsResolver {
        // Should be enough to contain the largest possible object in a game
        // in order for this component to provide acurate results
        private CELL_SIZE: number = 128;

        // Extracts groups of objects which need to be tested
        getBroadPhaseGroups(sceneObjects) {
            var result = [];

            for (var i in sceneObjects) {
                var object:DynamicObject = sceneObjects[i];
                if (!(object instanceof DynamicObject) || Math.floor((<DynamicObject> object).speed) === 0) {
                    continue;
                }

                var group:CollisionGroup = new CollisionGroup(object);
                var relevantCells = this.getRelevantCells(this.getGridCell(object));

                for (var j in sceneObjects) {
                    var objectToTest:BasicObject = sceneObjects[j];
                    if (objectToTest.uid === object.uid) {
                        continue;
                    }

                    if (objectToTest.collidable && this.isCellRelevant(this.getGridCell(objectToTest), relevantCells)) {
                        group.targets.push(objectToTest);
                    }
                }
                result.push(group);
            }

            return result;
        }

        private getGridCell(object:BasicObject):Cell {
            var x = object.position.x;
            var y = object.position.y;
            return new Cell(
                (x - (x % this.CELL_SIZE)) / this.CELL_SIZE,
                (y - (y % this.CELL_SIZE)) / this.CELL_SIZE
            );
        }

        // Returns an array of cells containing the provided one and
        // the 8 others adjacent to it
        private getRelevantCells(targetCell:Cell) {
            var result = [targetCell];
            result.push(new Cell(targetCell.x - 1, targetCell.y - 1));
            result.push(new Cell(targetCell.x, targetCell.y - 1));
            result.push(new Cell(targetCell.x + 1, targetCell.y - 1));
            result.push(new Cell(targetCell.x + 1, targetCell.y));
            result.push(new Cell(targetCell.x + 1, targetCell.y + 1));
            result.push(new Cell(targetCell.x, targetCell.y + 1));
            result.push(new Cell(targetCell.x - 1, targetCell.y + 1));
            result.push(new Cell(targetCell.x - 1, targetCell.y));
            return result;
        }

        private isCellRelevant(targetCell:Cell, relevantCells):boolean {
            return relevantCells.some(function(cell:Cell) {
                return targetCell.x == cell.x && targetCell.y == cell.y;
            });
        }
    }

    // A group of objects to be tested for collision.
    // Consists of one dynamic object and an array of static ones.
    export class CollisionGroup {
        dynamicObject: DynamicObject
        targets;

        constructor(dynamicObject:DynamicObject, targets = []) {
            this.dynamicObject = dynamicObject;
            this.targets = targets;
        }
    }

    // Represents an imaginary cell in a grid over the entire map.
    // Can also span outside the actual map limits
    class Cell {
        x: number;
        y: number;

        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }
}