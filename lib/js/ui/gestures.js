import TWEEN from '@tweenjs/tween.js';
import { Event } from './../helpers';

export function Gestures(engine, settings) {
    this.OnGestureStarted = new Event();

	var gestureObject;
    var zoomHandler = new gestureZoom();
    var _this = this;

	//---------------------Pan definition------------------------------
	function gesturePan() {
        var lastX,
            lastY,
            lastLength,
            startX,
            startY,
            lastXDiff,
            lastYDiff,
            tween,
            started = false;

        function animate(time) {
            if (tween) {
                tween.update(time);
                requestAnimationFrame(animate);
            }
        }

		this.Start = function (x, y) {
			startX = lastX = x;
			startY = lastY = y;

			started = true;
		}

		this.Update = function (x, y) {
			if (started) {
                lastLength = Math.sqrt(
                    Math.pow(lastX - x, 2) +
                    Math.pow(lastY - y, 2)
                );

				engine.Move({
					diffX: -(lastX - x),
					diffY: -(lastY - y),
				})

                var diffX = x - lastX;
                var diffY = y - lastY;

                // If direction was chenged by
                // assign new start values for proper
                // tweening at the end
                if (-diffX === lastXDiff || -diffY === lastYDiff) {
                    startX = x;
                    startY = y;
                }

				lastX = x;
                lastY = y;
                lastXDiff = diffX;
                lastYDiff = diffY;
			}
		}

		this.End = function (x, y) {
			if (started) {
                started = false;
                
                if(lastLength > settings.panSlowdownLengthThreshold) {
                    var contentPosition = engine.GetContentPosition();
                    var diffX = x - startX;
                    var diffY = y - startY;

                    tween = new TWEEN.Tween({ x: contentPosition.Left, y: contentPosition.Top })
                        .to({
                            x: contentPosition.Left + diffX,
                            y: contentPosition.Top + diffY,
                        }, settings.panSlowdownDuration)
                        .easing(TWEEN.Easing.Cubic.Out)
                        .onUpdate(function (params) {
                            if (!(isNaN(params.x) || isNaN(params.y))) {
                                engine.Move({
                                    Left: params.x,
                                    Top: params.y,
                                });
                            }
                        })
                        .onStop(function() {
                            tween = null;
                        })
                        .onComplete(function() {
                            tween = null;
                        })
                        .start();
                    // Startup tweening
                    requestAnimationFrame(animate);
                }
			}
		}
	}

	//--------------------Rotate definition------------------------------
	function gestureRotate() {
        var lastX,
            started = false,
            tween = null,
            lastDirection = 0,
            lastValue = 0;

        function animate(time) {
            if (tween) {
                tween.update(time);
                requestAnimationFrame(animate);
            }
        }

		this.Start = function (x) {
            lastX = x;
            lastValue = 0;
            started = true;

            if (tween) {
                tween.stop();
            }
		}

		this.Update = function (x) {
			if (started) {
				var value = (x - lastX) / settings.rotationDivider;
                
                engine.SwitchFrame({ delta: settings.rotationDirection * value });

				lastDirection = value >= 0 ? 1 : -1;
                lastX = x;
                lastValue = value;
			}
		}

		this.End = function () {
			if (started) {
                started = false;

                if (
                    Math.abs(lastValue) >= settings.rotationSlowdownThreshold
                ) {
                    tween = new TWEEN.Tween({ frames: lastValue })
                        .to({ frames: 0 }, settings.rotationSlowdownDuration)
                        .easing(TWEEN.Easing.Linear.None)
                        .onUpdate(function (params) {
                            engine.SwitchFrame({ delta: settings.rotationDirection * params.frames });
                        })
                        .onStop(function() {
                            tween = null;
                        })
                        .onComplete(function() {
                            tween = null;
                            engine.Draw();
                        })
                        .start();
                    // Startup tweening
                    requestAnimationFrame(animate);
                } else {
                    engine.Draw();
                }

				settings.onRotateComplete.Trigger(lastDirection);
			}
        }
    }
    
    function gestureZoom() {
        var tween;

        function animate(time) {
            if (tween) {
                tween.update(time);
                requestAnimationFrame(animate);
            }
        }

        this.Zoom = function({ delta, destination }) {
            var start = engine.Zoom() || 1;
            var dest = typeof delta !== 'undefined' ?
                start + delta : destination;

            if (tween) {
                tween.stop();
            }

            tween = new TWEEN.Tween({ destination: start })
                .to({ destination: dest }, settings.scrollZoomEasingDuration)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(function (params) {
                    engine.Zoom({ destination: params.destination });
                })
                .onStop(function() {
                    tween = null;
                })
                .onComplete(function() {
                    tween = null;
                })
                .start();
            
            requestAnimationFrame(animate);
        }
    }
	//---------------------Public functions----------------------------
	this.PanRotate = {
        Start: function (x, y) {
            gestureObject.Start(x, y);

            _this.OnGestureStarted.Trigger(x, y);
        },
        End: function (x, y) { gestureObject.End(x, y) },
        Update: function (x, y) { gestureObject.Update(x, y) },
        Set: function (type) {
            switch (type) {
                case 'move':
                    gestureObject = new gesturePan();
                    break;
    
                case 'rotate':
                default:
                    gestureObject = new gestureRotate();
                    break;
            }
        }
    };
    
    this.Zoom = function(diff) { zoomHandler.Zoom(diff) };
	//----------------------Constructor--------------------------------
	this.PanRotate.Set(""); //Set default handler
}