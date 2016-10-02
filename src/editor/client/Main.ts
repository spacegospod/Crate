namespace Editor {
    /*------ Main editor file ------*/
    var _canvas: any;
    var _context: any;
    var _imageMap: any;
    var _texturePicker: any;
    var _objectSelector: any;
    var _level: Crate.Level;
    var _game: Crate.Game;

    var _viewPort: Crate.ViewPort;
    var _god: Crate.DynamicObject;
    var _inputController: Crate.InputController;

    var _textureIndex: Crate.Point = new Crate.Point(0, 0);
    var _imageCache: Crate.ImageCache;

    var mode = 'texture';

    export function init(canvas, context, imageMap, level:Crate.Level, socketIo) {
        document.addEventListener('keypress', onKeyPress);

        _canvas = canvas;
        _context = context;
        _imageMap = imageMap;

        _texturePicker = document.getElementById('texturePicker');
        _texturePicker.addEventListener('click', onTexturePickerClick);

        _objectSelector = document.getElementById('objectSelector');
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

        _game.init(_imageMap, [], [], context, _viewPort, level);

        _game.begin([processKeys], []);
    }

    function initObjectSelector(imageMap) {
        for (var key in imageMap) {
            var option = document.createElement("option");
            option.text = key;
            option.value = imageMap[key];
            _objectSelector.add(option);
        }

        _objectSelector.onchange = onObjectSelected;
    }

    function processKeys(environment) {
        _god.speed = 0;
        var movementVector:Crate.Vector = _inputController.processMovement();
        var directionVectors = [];
        if (typeof movementVector !== 'undefined' && Crate.VU.length(movementVector) != 0) {
            _god.direction = movementVector;
            _god.speed = 800;
        }
    }

    function onClick(event) {
        var viewportX = event.x - _canvas.getBoundingClientRect().left;
        var viewportY = event.y - _canvas.getBoundingClientRect().top;

        var godInViewport = _viewPort.translateInViewport(_god.position);

        var mapX = _god.position.x + (viewportX - godInViewport.x);
        var mapY = _god.position.y + (viewportY - godInViewport.y);

        if (mode === 'texture') {
            var tile = _level.map.getTileByPosition({
                x: mapX,
                y: mapY
            });

            if (tile) {
                tile.textureIndex = _textureIndex;
            }
        } else if (mode === 'object') {
            var option = _objectSelector[_objectSelector.selectedIndex];

            var newObject:Crate.BasicObject = new Crate.BasicObject(option.text,
                new Crate.Point(mapX, mapY));
            _game.scene.add(newObject);
        }
    }

    function onTexturePickerClick(event) {
        var pickerX = event.x - _texturePicker.getBoundingClientRect().left;
        var pickerY = event.y - _texturePicker.getBoundingClientRect().top;

        _textureIndex = new Crate.Point(
            (pickerX - (pickerX % Crate.Tile.TILE_WIDTH)) / Crate.Tile.TILE_WIDTH,
            (pickerY - (pickerY % Crate.Tile.TILE_HEIGHT)) / Crate.Tile.TILE_HEIGHT
            );

        _canvas.style.cursor = '';
        mode = 'texture';
    }

    function onKeyPress(event) {
        // V
        if (event.keyCode === 118) {
            var outputLevel: any = {};

            // still blank
            outputLevel.spawnLocationsData = [];

            outputLevel.mapData = {
                width: _level.map.columns,
                height: _level.map.rows,
                textures: []
            };

            for (var i = 0; i < _level.map.rows; i++) {
                outputLevel.mapData.textures.push([]);
                for (var j = 0; j < _level.map.columns; j++) {
                    var tile = _level.map.getTileByIndex(j, i);
                    outputLevel.mapData.textures[i].push({
                        x: tile.textureIndex.x,
                        y: tile.textureIndex.y
                    });
                }
            }

            outputLevel.objectsData = [];

            for (var i = 0; i < _game.scene.objects.length; i++) {
                var object:Crate.BasicObject = _game.scene.objects[i];
                var data = {
                    type: (<any>object.constructor).name,
                    properties: {
                        imageKey: object.imageKey,
                        rotation: object.rotation,
                        position: {
                            x: object.position.x,
                            y: object.position.y
                        },
                        collidable: object.collidable
                    }
                }

                outputLevel.objectsData.push(data);
            }

            console.log(JSON.stringify(outputLevel, null, 4));
        }
    }

    function onObjectSelected(e) {
        var option = _objectSelector[_objectSelector.selectedIndex];
        var image = _imageCache.getImageByKey(option.text);
        _canvas.style.cursor = `url(resources/images/${option.value}) ${image.width / 2} ${image.height / 2}, auto`;
        mode = 'object';
    }
}