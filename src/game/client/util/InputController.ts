///<reference path='../../../../repo/engine-client.ts'/>
namespace Crate {

    /*
        Manages user input.
    */
    export class InputController {
        private _inputRegistry: Input;
        private _supressedKeys: any;

        constructor(inputRegistry:Input) {
            this._inputRegistry = inputRegistry;
            this._supressedKeys = {};
        }

        isLeftMouseBtnPressed():boolean {
            return this._inputRegistry.getMousePressed();
        }

        /**
         * Calculates the direction vector for player movement
         */
        processMovement():Vector {
            let directionVectors = [];

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

            let direction:Vector = undefined;
            if (directionVectors.length > 0) {
                direction = directionVectors[0];
                for (let i = 1; i < directionVectors.length; i++) {
                    direction = VU.sumVectors(direction, directionVectors[i]);
                }
            }

            return direction;
        }

        /**
         * Calculates the player's rotation based on mouse movement.
         */
        processRotation(viewport, canvas, playerPosition:Point):number {
            let mousePosition = this._inputRegistry.getMousePosition();

            let viewportPosition:Point = viewport.translateInViewport(playerPosition);

            let directionVector:Vector = VU.createVector(mousePosition, viewportPosition);

            let angle = VU.findAngle(
                new Vector(0, 1),
                directionVector);

            return directionVector.x > 0 ? 360 - angle : angle;
        }

        isKeyPressed(key:string) {
            let charCode = key.charCodeAt(0);
            return !this._supressedKeys[key] && this._inputRegistry.getKeyStatus(charCode);
        }

        supressKey(key:string, duration:number) {
            this._supressedKeys[key] = true;
            setTimeout( () => { delete this._supressedKeys[key]; }, duration);
        }
    }
}