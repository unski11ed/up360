import screenfull from 'screenfull';
import { Event } from './../helpers';

export function FullScreen (player, engine) {
    this.OnEnabled = new Event();
    this.OnDisabled = new Event();

    var _this = this;

    var isFullScreen = false;

    var defaultScreenStyle;

    this.Toggle = function () {
        if (!isFullScreen)
            this.Enable();
        else
            this.Disable();
    }

    this.Enable = function () {
        screenfull.request(player);
    }

    this.Disable = function () {
        screenfull.exit(player);
    }

    this.Init = function () {
        document.addEventListener(
            screenfull.raw.fullscreenchange, eventListener
        );
    }

    this.Dispose = function () {
        this.Disable();
        document.removeEventListener(
            screenfull.raw.fullscreenchange, eventListener
        );
    }

    var eventListener = function () {
        if (screenfull.isFullscreen) {
            isFullScreen = true;
            _this.OnEnabled.Trigger();
            engine.UpdateSize();
            engine.Zoom({ normalized: 0 });
        } else {
            player.style.width = '';
            player.style.height = '';
            isFullScreen = false;
            _this.OnDisabled.Trigger();
            engine.UpdateSize();
            engine.Zoom({ normalized: 0 });
        }
    }

    this.Init();
}