namespace Crate {

    /*
        Manages user input.
    */
    export class InputController {
        private _inputRegistry: Input;

        constructor(inputRegistry:Input) {
            this._inputRegistry = inputRegistry;
        }

        isLeftMouseBtnPressed():boolean {
            return this._inputRegistry.getMousePressed();
        }

        /**
         * Calculates the direction vector for player movement
         */
        processMovement():Vector {
            var directionVectors = [];

            // A
            if (this._inputRegistry.getKeyStatus(65)) {
                directionVectors.push(new Vector(-1, 0));
            }
            // W
            if (this._inputRegistry.getKeyStatus(87)) {
                directionVectors.push(new Vector(0, -1));
            }
            // D
            if (this._inputRegistry.getKeyStatus(68)) {
                directionVectors.push(new Vector(1, 0));
            }
            // S
            if (this._inputRegistry.getKeyStatus(83)) {
                directionVectors.push(new Vector(0, 1));
            }

            var direction:Vector = undefined;
            if (directionVectors.length > 0) {
                direction = directionVectors[0];
                for (var i = 1; i < directionVectors.length; i++) {
                    direction = VU.sumVectors(direction, directionVectors[i]);
                }
            }

            return direction;
        }

        /**
         * Calculates the player's rotation based on mouse movement.
         */
        processRotation(viewport, canvas, playerPosition:Point) {
            var mousePosition = this._inputRegistry.getMousePosition();
            // correct for canvas offset on screen
            mousePosition.x -= canvas.getBoundingClientRect().left;
            mousePosition.y -= canvas.getBoundingClientRect().top;

            var viewportPosition:Point = viewport.translateInViewport(playerPosition);

            var directionVector:Vector = VU.createVector(mousePosition, viewportPosition);

            var angle = VU.findAngle(
                new Vector(0, 1),
                directionVector);

            return directionVector.x > 0 ? 360 - angle : angle;
        }
    }
}