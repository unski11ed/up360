//Declare namespace
var up360 = up360 || {};
up360.UI = up360.UI || {};

up360.UI.Fullscreen = function(player, engine) {
    this.OnEnabled = new Event();
    this.OnDisabled = new Event();

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
        up360.Imports.screenfull.request(player);
    }

    this.disable = function () {
        up360.Imports.screenfull.exit(player);
    }

    this.init = function () {
        document.addEventListener(
            up360.Imports.screenfull.raw.fullscreenchange, eventListener);
    }

    this.dispose = function () {
        this.Disable();
        document.removeEventListener(
            up360.Imports.screenfull.raw.fullscreenchange, eventListener);
    }

    var eventListener = function () {
        if (up360.Imports.screenfull.isFullscreen) {
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