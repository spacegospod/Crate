namespace Crate {
    
    /*
        Applies motion mechanics and collision to dynamic objects.
    */
    export class PhysicsProcessor {
        // The delta timer.
        private delta: Delta;
        private imageCache: ImageCache;
        private boundingBoxGenerator: BoundingBoxGenerator
        private map: Map;

        detector: CollisionDetector;
        groupsResolver: CollisionGroupsResolver;

        constructor(delta:Delta,
                imageCache:ImageCache,
                boundingBoxGenerator:BoundingBoxGenerator,
                map:Map) {
            this.delta = delta;
            this.detector = new CollisionDetector();
            this.groupsResolver = new CollisionGroupsResolver();
            this.imageCache = imageCache;
            this.boundingBoxGenerator = boundingBoxGenerator;
            this.map = map;
        }

        processDynamicObjects(scene:Scene) {
            this.updateBoundingBoxes(scene, this.imageCache);
            var groups = this.groupsResolver.getBroadPhaseGroups(scene.objects);
            for (var i in groups) {
                var group:CollisionGroup = groups[i];
                var dynamicObject:DynamicObject = group.dynamicObject;
                var targets = group.targets;

                var direction:Vector = VU.normalize(dynamicObject.direction);
                var motionVector:Vector = new Vector(
                    direction.x * (dynamicObject.speed * this.delta.getDelta()),
                    direction.y * (dynamicObject.speed * this.delta.getDelta()));

                dynamicObject.position = new Point(
                    dynamicObject.position.x + motionVector.x,
                    dynamicObject.position.y + motionVector.y);

                this.processTileBlocking(dynamicObject);

                for (var j = 0; j < targets.length; j++) {
                    if (!dynamicObject.collidable || !targets[j].collidable) {
                        continue;
                    }
                    var data:CollisionData = this.detector.getCollisionData(
                        dynamicObject, targets[j]);
                    if (data) {
                        this.processCollision(data);
                    }
                }
            }
        }

        private processCollision(data:CollisionData) {
            var distance:number = VU.length(VU.createVector(
                data.testedObject.position, data.targetObject.position));
            // attempt
            var axis:Vector = data.axis;
            var motionVector:Vector = new Vector(
                axis.x * data.overlapAmount,
                axis.y * data.overlapAmount);
            var position:Point = new Point(
                data.testedObject.position.x + motionVector.x,
                data.testedObject.position.y + motionVector.y);

            if (VU.length(VU.createVector(
                position, data.targetObject.position)) < distance) {
                // flip axis if the objects got pushed together instead of apart
                axis.x *= -1;
                axis.y *= -1;
                motionVector = new Vector(
                    axis.x * data.overlapAmount,
                    axis.y * data.overlapAmount);
                position = new Point(
                    data.testedObject.position.x + motionVector.x,
                    data.testedObject.position.y + motionVector.y);
            }
            data.testedObject.position = position;
        }

        private processTileBlocking(object:DynamicObject) {
            if (!object.collidable || !object.boundingBox) {
                return;
            }

            var boundingBox:BoundingBox = object.boundingBox;
            var boxDiagonal = VU.length(VU.createVector(
                boundingBox.vertices[0], boundingBox.vertices[2]));

            var blockingLocations = [];

            for (var i = object.position.x - boxDiagonal; i < object.position.x + boxDiagonal; i += Tile.TILE_WIDTH) {
                for (var j = object.position.y - boxDiagonal; j < object.position.y + boxDiagonal; j += Tile.TILE_HEIGHT) {
                    var tile:Tile = this.map.getTileByPosition(new Point(i, j));
                    if (tile && tile.blocking) {
                        blockingLocations.push({x: i, y: j});
                    }
                }
            }

            for (var k in blockingLocations) {
                var location = blockingLocations[k];
                var position:Point = new Point(
                    (location.x - (location.x % Tile.TILE_WIDTH)) + (Tile.TILE_WIDTH / 2),
                    (location.y - (location.y % Tile.TILE_HEIGHT)) + (Tile.TILE_HEIGHT / 2));

                var boundingBox:BoundingBox = new BoundingBox(
                    position,
                    Tile.TILE_WIDTH,
                    Tile.TILE_HEIGHT);
                var dummyObject:BasicObject = new BasicObject(
                    'texture-default',
                    position);
                dummyObject.boundingBox = boundingBox;
                dummyObject.collidable = true;

                var data:CollisionData = this.detector.getCollisionData(
                        object, dummyObject);
                if (data) {
                    this.processCollision(data);
                }
            }
        }

        private updateBoundingBoxes(scene:Scene, imageCache:ImageCache) {
            var objects = scene.objects;
            for (var i in objects) {
                var object:BasicObject = objects[i];
                var image = imageCache.getImageByKey(object.imageKey);
                if (!object.boundingBox && typeof image !== 'undefined' && image.width > 0 && image.height > 0) {
                    object.boundingBox = this.boundingBoxGenerator.generateBoundingBoxForImage(
                        object.imageKey,
                        image.width,
                        image.height,
                        object.position,
                        object.rotation
                        );
                }
            }
        }
    }
}
