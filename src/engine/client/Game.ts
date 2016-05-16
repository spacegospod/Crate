namespace Crate {

    /*
        Represents a game managed by the Crate engine.

        Example of correct usage:
        1) Create new instance via the constructor. This will
        set up the basic game modules.
        2) Run the init method. This step also performs validation on
        all input data. Should be run only once, any subsequent calls have no effect
        if the input data is correct.
        3) Start the game by calling the 'begin' method. Any custom callbacks
        should be passed as arguments to this method.
    */
    export class Game {

        // Game components. See class documentation for details
        private renderer: Renderer;
        private audio: AudioManager;
        private imageCache: ImageCache;
        private boundingBoxGenerator: BoundingBoxGenerator;
        private delta: Delta;
        private viewPort: ViewPort;
        private physicsProcessor: PhysicsProcessor;

        // Custom callbacks executed before built-in game logic
        private preProcessCalls;
        // Custom callbacks executed after built-in game logic
        private postProcessCalls;

        private initialized: boolean;

        inputRegistry: Input;
        scene: Scene;

        constructor(canvas) {
            this.scene = new Scene();
            this.delta = new Delta();
            this.inputRegistry = new Input(canvas);

            this.preProcessCalls = [];
            this.postProcessCalls = [];

            this.initialized = false;
        }

        init(imageMap, audioMap, boundingBoxes, context, viewPort:ViewPort, level:Level) {
            if (this.initialized) {
                return;
            }

            this.validateInitialData(imageMap, audioMap, context, viewPort, level);

            this.viewPort = viewPort;
            this.imageCache = new ImageCache(imageMap);
            this.audio = new AudioManager(audioMap);
            this.boundingBoxGenerator = new BoundingBoxGenerator(boundingBoxes);
            this.physicsProcessor = new PhysicsProcessor(this.delta,
                this.imageCache,
                this.boundingBoxGenerator);
            this.renderer = new Renderer(context, viewPort, this.scene, level.map, this.imageCache);

            this.viewPort.detector = this.physicsProcessor.detector;

            for (var i in level.objects) {
                this.scene.add(level.objects[i]);
            }

            this.initialized = true;
        }

        begin(preProcessCalls, postProcessCalls) {
            if (!this.initialized) {
                throw new Error('Game not intialized!');
            }

            this.preProcessCalls = preProcessCalls;
            this.postProcessCalls = postProcessCalls;
            this.loop();
        }

        private loop() {
            this.delta.update(Date.now());

            this.loopCalls(this.preProcessCalls);

            this.physicsProcessor.processDynamicObjects(this.scene);
            
            this.renderer.draw();

            this.loopCalls(this.postProcessCalls);

            window.requestAnimationFrame(()=>{this.loop();});
        }

        private loopCalls(callbacks) {
            for (var i in callbacks) {
                callbacks[i]({
                    viewport: this.viewPort,
                    input: this.inputRegistry,
                    delta: this.delta,
                    audio: this.audio,
                    scene: this.scene
                });
            }
        }

        private validateInitialData(imageMap, audioMap, context, viewPort, level) {
            if (!context) {
                throw new Error('No context to render by');
            }
            if (!viewPort) {
                throw new Error('Need a viewport to draw');
            }
            if (!level) {
                throw new Error('No level loaded');
            }
            if (!imageMap) {
                throw new Error('No image map found');
            }
            if (!audioMap) {
                throw new Error('No audio map found');
            }
        }
    }
}