import { Event } from './../helpers';

export function Animation (engine, totalFrames, settings) {
	var playInterval;
	var _this = this;

	this.OnStarted = new Event();

	this.OnStopped = new Event();

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