import noUiSlider from 'nouislider';
import { Event } from './../helpers';

export function Menu (parentElement, settings) {
     var panelElement,
        elements = {},
        initialised = false,
        _this = this;

    function buildDOM(element) {
        var html = "<div class='up360__ui-panel'>"
                  + "   <div class='up360__element up360__element--play'>"
                  + "       <button type='button' class='up360__button'>"
                  + "       </button>"
                  + "   </div>"
                  + "   <div class='up360__element up360__element--pan-rotate'>"
                  + "       <button type='button' class='up360__button'>"
                  + "       </button>"
                  + "   </div>"
                  + "   <div class='up360__element up360__element--zoom-bar'>"
                  + "       <div class='up360__zoom-bar'>"
                  + "           <div></div>"
                  + "       </div>"
                  + "   </div>"
                  + "   <div class='up360__element up360__element--fullscreen'>"
                  + "       <button class='up360__button'>"
                  + "       </button>"
                  + "   </div>"
                  + "</div>";

        panelElement = document.createElement('div');
        panelElement.classList.add('up360__panel-wrap');
        panelElement.innerHTML = html;
        
        elements.play = panelElement.querySelector('.up360__element--play');
        elements.fullscreen = panelElement.querySelector('.up360__element--fullscreen');
        elements.modeSwitch = panelElement.querySelector('.up360__element--pan-rotate');
        elements.zoomSlider = panelElement.querySelector('.up360__element--zoom-bar div');

		element.appendChild(panelElement);
    }

    // TODO: Dettach Event Handlers!
    function registerEventHandlers() {
        //Zoom slider
        elements.zoomSlider.noUiSlider.on('slide', function(value) {
            _this.OnZoomBarChanged.Trigger(value / 1000);
        });
        
        //Mode switch
        elements.modeSwitch.addEventListener('click', function(){
            var targetMode = elements.modeSwitch.classList.contains('up360__element--pan-rotate--pan') ?
                'rotate' : 'move';
            
            _this.SetMode(targetMode);

            _this.OnModeChanged.Trigger(targetMode)

            return false;
        });
        
        //Play/Stop switch
        elements.play.addEventListener('click', function(){
            var command = elements.play.classList.contains('up360__element--play--stop') ?
                'stop' : 'play';

            _this.SetPlay(command);
            
            _this.OnPlayChanged.Trigger(command);
            return false;
        });
        
        //Fullscreen switch
        elements.fullscreen.addEventListener('click', function(){
            _this.OnFullScreenChanged.Trigger();
        });
    }

    this.Init = function () {
        if (!initialised) {
            buildDOM(parentElement);
            // Init Custom Slider
            noUiSlider.create(
                elements.zoomSlider,
                {
                    start: 0,
                    range: {
                        min: 0,
                        max: 1000,
                    },
                    orientation: 'vertical',
                    direction: 'rtl'
                }
            )
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

        elements.play.classList.toggle('up360__element--play--stop', state === 'stop');
    }

    this.SetZoomBarValue = function (normalizedValue) {
        if (!initialised)
            return;
         
        // Update only if the range slider isn't active (being slided)
        if (!elements.zoomSlider.querySelector('.noUi-active')) {
            elements.zoomSlider.noUiSlider.set(normalizedValue * 1000);
        }
    }

    //mode = rotate || move
    this.SetMode = function (mode) {
        if (!initialised)
            return;

        elements.modeSwitch.classList.toggle(
            'up360__element--pan-rotate--pan',
            mode === 'move'
        );
        elements.modeSwitch.classList.toggle(
            'up360__element--pan-rotate--rotate',
            mode === 'rotate'
        );
    }

    this.ToggleFullscreen = function(enabled) {
        elements.fullscreen.classList.toggle(
            'up360__element--fullscreen--enabled',
            enabled
        );
    }

    this.Dispose = function () {
        if (!initialised)
            return;

        parentElement.removeChild(panelElement);
    }
}