var Helpers = require('./../helpers.js');

module.exports = function(engine, totalFrames, settings) {
	var playInterval;
	var _this = this;

	this.OnStarted = new Helpers.Event();

	this.OnStopped = new Helpers.Event();

	this.Play = function (direction, speed) {
		speed = speed || settings.playSpeed;
		direction = direction || settings.playDirection;

		playInterval = setInterval(function () {
			engine.SwitchFrame({ delta: direction })
		}, speed);

		_this.OnStarted.Trigger();
	}

	this.Stop = function () {
		clearInterval(playInterval);
		_this.OnStopped.Trigger();
		engine.Draw();
	}
}