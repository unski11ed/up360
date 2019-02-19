import TWEEN, { Tween, Easing } from '@tweenjs/tween.js';

export function Gestures(engine, settings) {
	var gestureObject;

	//---------------------Pan definition------------------------------
	function gesturePan() {
		var lastX, lastY, started = false;
		this.Start = function (x, y) {
			lastX = x;
			lastY = y;

			started = true;
		}

		this.Update = function (x, y) {
			if (started) {

				engine.Move({
					diffX: -(lastX - x),
					diffY: -(lastY - y),
				})

				lastX = x;
				lastY = y;
			}
		}

		this.End = function (x, y) {
			if (started) {
				started = false;
			}
		}
	}

	//--------------------Rotate definition------------------------------
	function gestureRotate() {
        var lastX,
            started = false,
            updateTween = false,
            tween = null,
            lastDirection = 0,
            lastValue = 0;

        function animate(time) {
            TWEEN.update(time);
            if (tween) {
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

		this.End = function (x) {
			if (started) {
                started = false;
                
				engine.Draw();

                if (lastValue >= 0.5 || lastValue <= 0.5) {
                    tween = new Tween({ frames: lastValue })
                        .to({ frames: 0 }, settings.rotationSlowdownDuration)
                        .easing(Easing.Linear.None)
                        .onUpdate(({ frames }) => {
                            engine.SwitchFrame({ delta: settings.rotationDirection * frames });
                        })
                        .onStop(() => {
                            tween = null;
                        })
                        .onComplete(() => {
                            tween = null;
                        })
                        .start();
                    // Startup tweening
                    requestAnimationFrame(animate);
                }

				settings.onRotateComplete.Trigger(lastDirection);
			}
        }
	}
	//---------------------Public functions----------------------------
	this.Start = function (x, y) { gestureObject.Start(x, y) };
	this.End = function (x, y) { gestureObject.End(x, y) };
	this.Update = function (x, y) { gestureObject.Update(x, y) };
	
	this.Set = function (type) {
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
	//----------------------Constructor--------------------------------
	this.Set(""); //Set default handler
}