var screenfull = require('screenfull'),
    Helpers = require('./../helpers.js');;

module.exports = function(player, engine) {
    this.OnEnabled = new Helpers.Event();
    this.OnDisabled = new Helpers.Event();

    var _this = this;

    var isFullScreen = false;

    var defaultScreenStyle;

    this.toggle = function () {
        if (!isFullScreen)
            this.Enable();
        else
            this.Disable();
    }

    this.enable = function () {
        screenfull.request(player);
    }

    this.disable = function () {
        screenfull.exit(player);
    }

    this.init = function () {
        document.addEventListener(
            screenfull.raw.fullscreenchange, eventListener
        );
    }

    this.dispose = function () {
        this.Disable();
        document.removeEventListener(
            screenfull.raw.fullscreenchange, eventListener
        );
    }

    var eventListener = function () {
        if (screenfull.isFullscreen) {
            //Save copy
            if (!defaultScreenStyle)
                defaultScreenStyle = window.getComputedStyle(player);
                
            player.style.width = screen.width + 'px';
            player.style.height = screen.height + 'px';

            isFullScreen = true;
            _this.OnEnabled.Trigger();
            engine.UpdateSize();
            engine.Zoom({ normalized: 0 });
        } else {
            player.style = defaultScreenStyle;
            isFullScreen = false;
            _this.OnDisabled.Trigger();
            engine.UpdateSize();
            engine.Zoom({ normalized: 0 });
        }
    }

    this.init();
}