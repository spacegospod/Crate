namespace Crate {
    
    /*
        Applies motion mechanics and collision to dynamic objects.
    */
    export class PhysicsProcessor {
        // The delta timer.
        private delta:Delta;
        detector:CollisionDetector;
        groupsResolver:CollisionGroupsResolver;

        constructor(delta:Delta) {
            this.delta = delta;
            this.detector = new CollisionDetector();
            this.groupsResolver = new CollisionGroupsResolver();
        }

        processDynamicObjects(scene:Scene, imageCache:ImageCache) {
            this.updateBoundingBoxes(scene, imageCache);
            var groups = this.groupsResolver.getBroadPhaseGroups(scene.objects);
            for (var i in groups) {
                var group:CollisionGroup = groups[i];
                var dynamicObject:DynamicMapObject = group.dynamicObject;
                var targets = group.targets;

                var direction:Vector = VU.normalize(dynamicObject.direction);
                var motionVector:Vector = new Vector(
                    direction.x * (dynamicObject.speed * this.delta.getDelta()),
                    direction.y * (dynamicObject.speed * this.delta.getDelta()));
                dynamicObject.position = new Point(
                    dynamicObject.position.x + motionVector.x,
                    dynamicObject.position.y + motionVector.y);
                for (var j = 0; j < targets.length; j++) {
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

        private updateBoundingBoxes(scene:Scene, imageCache:ImageCache) {
            var objects = scene.objects;
            for (var i in objects) {
                var object:BasicMapObject = objects[i];
                var image = imageCache.getImageByKey(object.imageKey);
                if (!object.boundingBox && typeof image !== 'undefined') {
                    object.boundingBox = new BoundingBox(
                        object.position,
                        image.width,
                        image.height,
                        object.rotation);
                }
            }
        }
    }
}