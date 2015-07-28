//Declare namespace
var up360 = up360 || {};
up360.UI = up360.UI || {};

up360.UI.Menu = function(parentElement, settings){
 	var panelElement, initialised = false, _this = this;

    function buildDOM(element) {
        var html = "<div class='panel'>"
                  + "   <div class='button playstop play'>"
                  + "   </div>"
                  + "   <div class='switch rotate'>"
                  + "   </div>"
                  + "   <div class='zoombar'>"
                  + "       <input type='range' min='0' max='1000'/>"
                  + "   </div>"
                  + "   <div class='button fullscreen'>"
                  + "   </div>"
                  + "</div>";

        panelElement = document.createElement('div');
        panelElement.innerHtml = html;
		
		element.appendChild(panelElement);
    }

    function registerEventHandlers() {
        //Zoom slider
        var zoomRangeElement = panelElement.querySelector('.zoombar input');
        zoomRangeElement.addEventListener(function(){
            _this.OnZoomBarChanged.Trigger(this.value / 1000);
        });
        
        //Mode switch
        var switchElement = panelElement.querySelector('.switch');
        switchElement.addEventListener(function(){
            var targetMode = 'rotate';
            if (switchElement.classList.contains('rotate'))
                targetMode = 'move';
            _this.SetMode(targetMode);

            _this.OnModeChanged.Trigger(targetMode)

            return false;
        });
        
        //Play/Stop switch
        var playStopElement = panelElement.querySelector('.playstop');
        playStopElement.addEventListener(function(){
            var command = 'play';
            if (playStopElement.classList.contains('play'))
                command = 'stop';
            _this.SetPlay(command);
            
            _this.OnPlayChanged.Trigger(command);
            return false;
        });
        
        //Fullscreen switch
        var fullscreenSwitchElement = panelElement.querySelector('.fullscreen');
        fullscreenSwitchElement.addEventListener(function(){
            _this.OnFullScreenChanged.Trigger();
        });
    }

    this.init = function () {
        if (!initialised) {
            buildDOM(parentElement);
            registerEventHandlers();

            initialised = true;
        }
    }

    this.OnPlayChanged = new up360.Helpers.Event();
    this.OnZoomBarChanged = new up360.Helpers.Event();
    this.OnModeChanged = new up360.Helpers.Event();
    this.OnFullScreenChanged = new up360.Helpers.Event();

    this.SetPlay = function (state) {
        if (!initialised)
            return;

        var playPauseSwitch = panelElement.querySelector('.playstop');
        playPauseSwitch.classList.remove('stop', 'play');
        playPauseSwitch.classList.add(state ===  'play' ? 'play' : 'stop');
    }

    this.SetZoomBarValue = function (normalizedValue) {
        if (!initialised)
            return;
            
        var slider = panelElement.querySelector('.zoombar input');
        slider.value = normalizedValue * 1000;
    }

    //mode = rotate || move
    this.SetMode = function (mode) {
        if (!initialised)
            return;

        var modeSwitch = panelElement.querySelector('.switch');
        modeSwitch.classList.remove('rotate', 'move');
        modeSwitch.classList.add(mode ===  'rotate' ? 'rotate' : 'move');
    }

    this.Dispose = function () {
        if (!initialised)
            return;

        parentElement.removeChild(panelElement);
    }
}