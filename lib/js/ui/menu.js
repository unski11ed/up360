import { Event } from './../helpers';

export function Menu (parentElement, settings) {
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
        panelElement.classList.add('up360__panel-wrap');
        panelElement.innerHTML = html;
		
		element.appendChild(panelElement);
    }

    // TODO: Dettach Event Handlers!
    function registerEventHandlers() {
        //Zoom slider
        var zoomRangeElement = panelElement.querySelector('.zoombar input');
        zoomRangeElement.addEventListener('change', function(){
            _this.OnZoomBarChanged.Trigger(this.value / 1000);
        });
        
        //Mode switch
        var switchElement = panelElement.querySelector('.switch');
        switchElement.addEventListener('click', function(){
            var targetMode = 'rotate';
            if (switchElement.classList.contains('rotate'))
                targetMode = 'move';
            _this.SetMode(targetMode);

            _this.OnModeChanged.Trigger(targetMode)

            return false;
        });
        
        //Play/Stop switch
        var playStopElement = panelElement.querySelector('.playstop');
        playStopElement.addEventListener('click', function(){
            var command = 'play';
            if (playStopElement.classList.contains('play'))
                command = 'stop';
            _this.SetPlay(command);
            
            _this.OnPlayChanged.Trigger(command);
            return false;
        });
        
        //Fullscreen switch
        var fullscreenSwitchElement = panelElement.querySelector('.fullscreen');
        fullscreenSwitchElement.addEventListener('click', function(){
            _this.OnFullScreenChanged.Trigger();
        });
    }

    this.Init = function () {
        if (!initialised) {
            buildDOM(parentElement);
            registerEventHandlers();

            initialised = true;
        }
    }

    this.OnPlayChanged = new Event();
    this.OnZoomBarChanged = new Event();
    this.OnModeChanged = new Event();
    this.OnFullScreenChanged = new Event();

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