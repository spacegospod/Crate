namespace Crate {

    /*
        A state tracker for user input
    */
    export class Input {
        private keysPressed;
        private mousePressed: boolean;
        private mousePosition: Point;

        constructor(canvas) {
            this.keysPressed = {};
            this.mousePressed = false;
            this.mousePosition = new Point(0, 0);

            document.addEventListener("keydown", (e) => {this.onKeyDown(e);});
            document.addEventListener("keyup", (e) => {this.onKeyUp(e);});
            canvas.addEventListener("mousemove", (e) => {this.onMouseMove(e);});
            canvas.addEventListener("mousedown", (e) => {this.onMouseDown(e);});
            canvas.addEventListener("mouseup", (e) => {this.onMouseUp(e);});
        }

        getMousePressed() {
            return this.mousePressed;
        }

        getKeyStatus(keyCode:number) {
            return this.keysPressed.hasOwnProperty(keyCode)
                    ? this.keysPressed[keyCode]
                    : false;
        }

        getMousePosition() {
            return new Point(this.mousePosition.x, this.mousePosition.y);
        }

        private onMouseMove(event) {
            this.mousePosition.x = event.clientX;
            this.mousePosition.y = event.clientY;
        }

        private onMouseDown(event) {
            this.mousePressed = true;
        }

        private onMouseUp(event) {
            this.mousePressed = false;
        }

        private onKeyDown(event) {
            this.keysPressed[event.keyCode] = true;
        }

        private onKeyUp(event) {
            this.keysPressed[event.keyCode] = false;
        }
    }
}