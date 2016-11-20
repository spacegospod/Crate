///<reference path='ObjectConstructorMapper.ts'/>
namespace Editor {
    /*------ Main editor file ------*/
    let _canvas: any;
    let _context: any;
    let _imageMap: any;
    let _texturePicker: any;
    let _objectSelector: any;
    let _rotationInput: any;
    let _level: Crate.Level;
    let _game: Crate.Game;

    let _viewPort: Crate.ViewPort;
    let _god: Crate.DynamicObject;
    let _inputController: Crate.InputController;

    let _textureIndex: Crate.Point = new Crate.Point(0, 0);
    let _imageCache: Crate.ImageCache;

    let mode = 'texture';

    let selectedObject: Crate.BasicObject;

    export function init(canvas, context, imageMap, level:Crate.Level, boundingBoxes, socketIo) {
        document.addEventListener('keypress', onKeyPress);

        _canvas = canvas;
        _context = context;
        _imageMap = imageMap;

        _texturePicker = document.getElementById('texturePicker');
        _texturePicker.addEventListener('click', onTexturePickerClick);

        _objectSelector = document.getElementById('objectSelector');
        _rotationInput = document.getElementById('rotationInput');
        initObjectSelector(imageMap);

        _imageCache = new Crate.ImageCache(imageMap);

        _level = level;

        _game = new Crate.Game(_canvas, socketIo);
        _viewPort = new Crate.ViewPort(canvas.width, canvas.height);

        _inputController = new Crate.InputController(_game.inputRegistry);
        _game.inputRegistry.attachCustomListener(true, 'click', onClick)

        _god = new Crate.DynamicObject('invisible');

        _game.scene.add(_god);
        _viewPort.centerOn(_god);

        _game.init(_imageMap, [], boundingBoxes, context, _viewPort, level);

        _game.begin([processKeys], []);
    }

    function initObjectSelector(imageMap) {
        for (let key in imageMap) {
            let option = document.createElement("option");
            option.text = key;
            option.value = imageMap[key];
            _objectSelector.add(option);
        }

        _objectSelector.onchange = onObjectTypeSelected;
        _rotationInput.onchange = function() {
            if (selectedObject) {
                selectedObject.rotation = _rotationInput.value;
            }
        }
    }

    function processKeys(environment) {
        _god.speed = 0;
        let movementVector:Crate.Vector = _inputController.processMovement();
        let directionVectors = [];
        if (typeof movementVector !== 'undefined' && Crate.VU.length(movementVector) != 0) {
            _god.direction = movementVector;
            _god.speed = 800;
        }
    }

    function onClick(event) {
        let viewportX = event.x - _canvas.getBoundingClientRect().left;
        let viewportY = event.y - _canvas.getBoundingClientRect().top;

        let godInViewport = _viewPort.translateInViewport(_god.position);

        let mapX = _god.position.x + (viewportX - godInViewport.x);
        let mapY = _god.position.y + (viewportY - godInViewport.y);

        if (mode === 'texture') {
            let tile = _level.map.getTileByPosition({
                x: mapX,
                y: mapY
            });

            if (tile) {
                tile.textureIndex = _textureIndex;
            }
        } else if (mode === 'object') {
            let option = _objectSelector[_objectSelector.selectedIndex];

            let clazz = getObjectClass(option.text);
            let newObject:Crate.BasicObject = new clazz(new Crate.Point(mapX, mapY));
            _game.scene.add(newObject);
            selectedObject = newObject;
            _rotationInput.value = selectedObject.rotation;
        }
    }

    function onTexturePickerClick(event) {
        let pickerX = event.x - _texturePicker.getBoundingClientRect().left;
        let pickerY = event.y - _texturePicker.getBoundingClientRect().top;

        _textureIndex = new Crate.Point(
            (pickerX - (pickerX % Crate.Tile.TILE_WIDTH)) / Crate.Tile.TILE_WIDTH,
            (pickerY - (pickerY % Crate.Tile.TILE_HEIGHT)) / Crate.Tile.TILE_HEIGHT
            );

        _canvas.style.cursor = '';
        mode = 'texture';
    }

    function onKeyPress(event) {
        if (event.keyCode === 118) {
            // V
            saveLevel()
        } else if (event.keyCode === 111) {
            // O
            selectObject();
        } else if (event.keyCode === 114) {
            // R
            selectObject();
            removeObject();
        } else if (event.keyCode === 98) {
            // B
            setBlocking(true);
        } else if (event.keyCode === 117) {
            // U
            setBlocking(false);
        }
    }

    function onObjectTypeSelected(e) {
        let option = _objectSelector[_objectSelector.selectedIndex];
        let image = _imageCache.getImageByKey(option.text);
        _canvas.style.cursor = `url(resources/images/${option.value}) ${image.width / 2} ${image.height / 2}, auto`;
        mode = 'object';
        _rotationInput.value = 0;

    }

    function saveLevel() {
        let outputLevel: any = {};

        // still blank
        outputLevel.spawnLocationsData = [];

        outputLevel.mapData = {
            width: _level.map.columns,
            height: _level.map.rows,
            tiles: []
        };

        for (let i = 0; i < _level.map.rows; i++) {
            outputLevel.mapData.tiles.push([]);
            for (let j = 0; j < _level.map.columns; j++) {
                let tile = _level.map.getTileByIndex(j, i);
                outputLevel.mapData.tiles[i].push({
                    textureIndex: {
                        x: tile.textureIndex.x,
                        y: tile.textureIndex.y
                    },
                    blocking: tile.blocking
                });
            }
        }

        outputLevel.objectsData = [];

        for (let i = 0; i < _game.scene.objects.length; i++) {
            let object:Crate.BasicObject = _game.scene.objects[i];
            let data = {
                type: (<any>object.constructor).name,
                properties: {
                    imageKey: object.imageKey,
                    rotation: object.rotation,
                    position: {
                        x: object.position.x,
                        y: object.position.y
                    },
                    collidable: object.collidable,
                    zIndex: object.zIndex,
                }
            }

            outputLevel.objectsData.push(data);
        }

        console.log(JSON.stringify(outputLevel, null, 4));
    }

    function selectObject() {
        let mousePosition = _game.inputRegistry.getMousePosition();

        let godInViewport = _viewPort.translateInViewport(_god.position);

        let mapX = _god.position.x + (mousePosition.x - godInViewport.x);
        let mapY = _god.position.y + (mousePosition.y - godInViewport.y);

        let dummyObject:Crate.BasicObject = new Crate.BasicObject();
        dummyObject.boundingBox = new Crate.BoundingBox(new Crate.Point(mapX, mapY), 1, 1);

        for (let i = 0; i < _game.scene.objects.length; i++) {
            let object:Crate.BasicObject = _game.scene.objects[i];
            if (new Crate.CollisionDetector().getCollisionData(
                object,
                dummyObject)) {
                selectedObject = object;
                _rotationInput.value = selectedObject.rotation;
                return;
            }
        }
    }

    function setBlocking(value) {
        let mousePosition = _game.inputRegistry.getMousePosition();

        let godInViewport = _viewPort.translateInViewport(_god.position);

        let mapX = _god.position.x + (mousePosition.x - godInViewport.x);
        let mapY = _god.position.y + (mousePosition.y - godInViewport.y);

        let tile = _level.map.getTileByPosition({
                x: mapX,
                y: mapY
            });

        if (tile) {
            tile.blocking = value;
        }
    }

    function removeObject() {
        _game.scene.remove(selectedObject);
        _rotationInput.value = 0;
    }
}