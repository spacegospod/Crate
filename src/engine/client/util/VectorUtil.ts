namespace Crate {

    /*
        Various vector-related helper methods
    */
    class VectorUtil {
        // Translates an angle into radians
        toRadians(angle:number):number {
            return angle * (Math.PI / 180);
        }

        // Translates radians to degrees
        toAngle(rad:number):number {
            return rad * (180 / Math.PI);
        }

        // Creates and rotates a new vector from the provided one
        rotateVector(vector:Vector, angle:number):Vector {
            var rad:number = this.toRadians(angle);
            // fixed to 10 digits after the floating point
            var sin:number = parseFloat(Number(Math.sin(rad)).toFixed(10));
            var cos:number = parseFloat(Number(Math.cos(rad)).toFixed(10));
            var newX:number = (vector.x * cos) + (vector.y * sin);
            var newY:number = (vector.y * cos) - (vector.x * sin) ;
            var rotatedVector = new Vector(newX, newY);
            return rotatedVector;
        }

        rotatePoint(point:Point, fulcrum:Point, amount:number):Point {
            var result:Point = new Point(point.x, point.y);
            var sin = Math.sin(VU.toRadians(amount));
            var cos = Math.cos(VU.toRadians(amount));

            // translate to origin
            result.x -= fulcrum.x;
            result.y -= fulcrum.y;
            // rotate
            var newX = result.x * cos - result.y * sin;
            var newY = result.x * sin + result.y * cos;
            // translate back
            result.x = newX + fulcrum.x;
            result.y = newY + fulcrum.y;

            return result;
        }

        // Calculates the length of the provided vector
        length(vector:Vector):number {
            return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
        }

        // Returns a normalized version of the provided vector
        normalize(vector:Vector):Vector {
            var vectorLength = this.length(vector);
            return new Vector(vector.x /= vectorLength, vector.y /= vectorLength);
        }

        // dot product. duh.
        dotProduct(v1:Vector, v2:Vector):number {
            return ((v1.x * v2.x) + (v1.y * v2.y));
        }

        // Get the sum of 2 vectors
        sumVectors(v1:Vector, v2:Vector):Vector {
            return new Vector(v1.x + v2.x, v1.y + v2.y);
        }

        // Get the substraction of 2 vectors
        substractVectors(v1:Vector, v2:Vector):Vector {
            return new Vector(v1.x - v2.x, v1.y - v2.y);
        }

        // Multiplies a vector by a given number
        multiplyVector(v:Vector, n:number):Vector {
            return new Vector(v.x * n, v.y * n);
        }

        // Calculates the angle between two vectors
        findAngle(v1:Vector, v2:Vector):number {
            var cos = this.dotProduct(v1, v2) / (this.length(v1) * this.length(v2));
            return this.toAngle(Math.acos(cos));
        }

        // Returns the normal of the provided vector
        getNormal(v:Vector) {
            return this.normalize(new Vector(v.y, v.x * -1));
        }

        // Creates a vector object from the provided points
        createVector(p1:Point, p2:Point):Vector {
            return new Vector(p2.x - p1.x, p2.y - p1.y);
        }
    }

    export var VU:VectorUtil = new VectorUtil();
}