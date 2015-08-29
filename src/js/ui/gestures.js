//Declare namespace
var up360 = up360 || {};
up360.UI = up360.UI || {};

up360.UI.Gestures = function(engine, settings) {
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
		var lastX, started = false, lastDirection = 0, totalValue = 0;

		this.Start = function (x) {
			lastX = x;
			totalValue = 0;

			started = true;
		}

		this.Update = function (x) {
			if (started) {
				var value = (x - lastX) / settings.rotationDivider;

				totalValue += value;

				if (totalValue > 1 || totalValue < -1) {
					engine.SwitchFrame({ delta: settings.rotationDirection * Math.round(totalValue) });
					totalValue = 0;
				}

				lastDirection = value >= 0 ? 1 : -1;

				lastX = x;
			}
		}

		this.End = function (x) {
			if (started) {
				started = false;
				engine.Draw();

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