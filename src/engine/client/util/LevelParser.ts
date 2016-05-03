namespace Crate {

    /*
        This component creates level objects from provided JSON data.
    */
    export class LevelParser {

        private customObjectsBuilders;

        constructor() {
            this.customObjectsBuilders = [];
        }

        // Registers a builder function for a custom object type.
        // The natively supported types are BasicObject and DynamicObject
        // from the Crate engine.
        registerCustomObject(type:string, builderFunc) {
            this.customObjectsBuilders[type.toLowerCase()] = builderFunc;
        }

        // Accepts a JSON as a string
        // and returns a Level object
        parse(data:string) {
            try {
                var initialData = JSON.parse(data);
                var map:Map = this.parseMap(initialData.mapData);
                var objects = this.parseObjects(initialData.objectsData);

                return new Level(map, objects);
            } catch(e) {
                console.error('Unable to parse level, got: ' + e.message);
            }
        }

        private parseMap(mapData) {
            try {
                var map:Map = new Map(mapData.width, mapData.height);

                if (mapData.textures) {
                    map.applyTextures(mapData.textures);
                }

                return map;
            } catch(e) {
                throw new Error('Unable to create map, got: ' + e.message);
            }
        }

        private parseObjects(objectsData) {
            try {
                var result = [];

                for (var i in objectsData) {
                    var object = objectsData[i];
                    result.push(this.loadObject(object));
                }

                return result;
            } catch(e) {
                throw new Error('Unable to create map objects, got: ' + e.message);
            }
        }

        private loadObject(data) {
            function constructor(constructorFunction) {
                return constructorFunction.apply(this);
            }
            switch(data.type.toLowerCase()) {
                case "basicobject": {
                    return this.createBasicObject(data.properties);
                }
                case "dynamicobject": {
                    return this.createDynamicObject(data.properties);
                }
                default: {
                    var customBuilder = this.customObjectsBuilders[data.type];
                    if (customBuilder) {
                        return this.buildCustomObject(customBuilder, data.properties);
                    } else {
                        throw new Error("Unknown map object type: " + data.type);
                    }
                }
            }
        }

        // loads only properties of type string and number
        private loadBasicProperties(object, props) {
            for (var prop in props) {
                // ignore complex data
                if (typeof props[prop] == 'object') {
                    continue;
                }
                // hasOwnProperty doesn't work for accessors
                try {
                    object[prop] = props[prop];
                } catch(e) {
                    // property does not exist
                }
            }
        }

        private loadComplexProperties(object, props) {
            for (var prop in props) {
                if (typeof props[prop] != 'object') {
                    continue;
                }
                // hasOwnProperty doesn't work for accessors
                try {
                    switch(prop) {
                        case "position": {
                            object['position'] = new Point(props[prop].x, props[prop].y);
                        }
                        case "direction": {
                            object['direction'] = new Vector(props[prop].x, props[prop].y);
                        }
                    }
                } catch(e) {
                    // property does not exist
                }
            }
        }

        private buildCustomObject(customBuilder, properties) {
            var obj = customBuilder(properties);
            this.loadBasicProperties(obj, properties);
            this.loadComplexProperties(obj, properties);
            return obj;
        }

        private createBasicObject(properties) {
            var obj = new BasicObject();
            this.loadBasicProperties(obj, properties);
            this.loadComplexProperties(obj, properties);
            return obj;
        }

        private createDynamicObject(properties) {
            var obj = new DynamicObject();
            this.loadBasicProperties(obj, properties);
            this.loadComplexProperties(obj, properties);
            return obj;
        }
    }
}