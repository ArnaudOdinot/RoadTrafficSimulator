define(function(require) {
    "use strict";

    var _ = require("underscore");

    var Trajectory = require("trajectory");

    function Car(lane, position) {
        this.id = window.__nextId++;
        this.color = 255 * Math.random();
        this.speed = 0;
        this.width = 0.3;
        this.length = 0.7;
        this.safeDistance = 1.5 * this.length;
        this.maxSpeed = (4 + Math.random()) / 5 / 20; // 0.04 - 0.05
        this.acceleration = 0.02 / 20;
        this.trajectory = new Trajectory(this, lane, position);
        this.alive = true;
    }

    Object.defineProperty(Car.prototype, "coords", {
        get: function() {
            return this.trajectory.coords;
        },
    });

    Object.defineProperty(Car.prototype, "absolutePosition", {
        get: function() {
            return this.trajectory.current.position;
        },
        set: function(absolutePosition) {
            this.trajectory.current.position = absolutePosition;
        },
    });

    Object.defineProperty(Car.prototype, "relativePosition", {
        get: function() {
            return this.trajectory.current.position / this.trajectory.current.lane.length;
        },
        set: function(relativePosition) {
            this.trajectory.current.position =
                relativePosition * this.trajectory.current.lane.length;
        },
    });

    Object.defineProperty(Car.prototype, "speed", {
        get: function() {
            return this._speed;
        },
        set: function(speed) {
            if (speed < 0) {
                speed = 0;
            } else if (speed > this.maxSpeed) {
                speed = this.maxSpeed;
            }
            this._speed = speed;
        },
    });

    Car.prototype.move = function() {
        if (this.trajectory.getDistanceToNextCar() > this.safeDistance) { // FIXME
            // enough room to move forward
            this.speed += this.acceleration;
        } else {
            this.speed = 0;
        }
        this.trajectory.moveForward(this.speed);
        if (!this.trajectory.current.lane) {
            this.alive = false;
        }
    };

    Object.defineProperty(Car.prototype, "orientation", {
        get: function() {
            return this.trajectory.orientation;
        },
    });

    Car.prototype.pickNextLane = function() {
        if (this.trajectory.next.lane) {
            return this.trajectory.next.lane;
        }

        var intersection = this.trajectory.getNextIntersection(),
            previousIntersection = this.trajectory.getPreviousIntersection();
        var possibleRoads = intersection.roads.filter(function(x) {
            return x.target !== previousIntersection &&
                   x.source !== previousIntersection;
        });
        if (possibleRoads.length !== 0) {
            var nextRoad = _.sample(possibleRoads);
            var laneNumber;
            if (intersection === nextRoad.source) {
                laneNumber = _.random(0, nextRoad.lanesNumber / 2 - 1);
                // laneNumber = 0;
            } else {
                laneNumber = _.random(nextRoad.lanesNumber / 2, nextRoad.lanesNumber - 1);
                // laneNumber = nextRoad.lanesNumber - 1;
            }
            this.trajectory.next.lane = nextRoad.lanes[laneNumber];
            this.trajectory.next.position = NaN;
            return this.trajectory.next.lane;
        }
    };

    return Car;
});
