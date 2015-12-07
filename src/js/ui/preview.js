var Helpers = require('./../helpers.js'),
    velocity = null;

module.exports = function(rootElement, animation, engine, settings) {
    var previewBox,
        previewWindow,
        
        initialized = false,
        height = 0,
        width = settings.baseWidth,
        isHidden = false;

    function getParentRelativeRect(element){
        var parentRect = element.parent.getBoundingClientRect(),
            rect = element.getBoundingClientRect();
            
        return new Helpers.Rectangle(
            rect.left - parentRect.left,
            rect.top - parentRect.top,
            rect.width, rect.height
        )
    }
    //-----------------------------Event handlers--------------------------------------
    function registerEventHandlers() {
        //*********************************************************************************    
        //Handle click on the preview
        previewBox.addEventListener('click', function(e) {
            if (e.target !== previewBox.getElementsByTagName('img')[0])
                return;

            animation.Stop();
            //TODO: BUILD DOM FIRST AND START HERE!!!!!!!!!
            var screenPosition = rootElement.getBoundingClientRect();

            var mouseX = e.clientX - screenPosition.left,
                mouseY = e.clientY - screenPosition.top;

            var destLeft = mouseX - previewWindow.clientWidth / 2,
                destTop = mouseY - previewWindow.clientHeight / 2;

            var pos = correctPositions(destLeft, destTop);

            destLeft = pos.x;
            destTop = pos.y;

            var contentPosition = engine.GetContentPosition();

            velocity(previewWindow, {
                left: destLeft + 'px',
                top: destTop + 'px',
            }, {
                duration: settings.moveAnimationDuration,
                easing: 'swing',
            });

            //HAXXX - needs to be changed to a step function
            var prevBoxWidth = previewBox.clientWidth,
                prevBoxHeight = previewBox.clientHeight;

            var interval = setInterval(function () {
                var pos = previewWindow.getBoundingClientRect();
                engine.Move({
                    Left: -pos.left / prevBoxWidth * contentPosition.Width,
                    Top: -pos.top / prevBoxHeight * contentPosition.Height
                });
            }, 16); //about 60fps
            setTimeout(function () {
                clearInterval(interval);
            }, settings.moveAnimationDuration);

            return false;
        });


        //Handle dragging the ViewBox
        var isMouseDown = false;

        var lastMouseX, lastMouseY;
        previewWindow.addEventListener('mousedown', function (e) {
            e.stopImmediatePropagation();
            animation.Stop();
            isMouseDown = true;
        })
        previewWindow.addEventListener('mouseup', function (e) {
            e.stopImmediatePropagation();
            isMouseDown = false;
        });

        previewBox.addEventListener('mouseup mouseleave', function(){
            isMouseDown = false;
        });
        previewBox.addEventListener('mousemove', function (e) {
            if (isMouseDown) {
                if (!lastMouseX && !lastMouseY) {
                    lastMouseX = e.clientX;
                    lastMouseY = e.clientY;
                }
                var currentPosition = previewWindow.getBoundingClientRect();

                var newX = currentPosition.left + e.clientX - lastMouseX,
                    newY = currentPosition.top + e.clientY - lastMouseY;

                var corrected = correctPositions(newX, newY);

                previewWindow.style.left = corrected.x + 'px';
                previewWindow.style.top = corrected.y + 'px';

                var contentPosition = engine.GetContentPosition();

                engine.Move({
                    Left: -corrected.x / previewBox.clientWidth * contentPosition.Width,
                    Top: -corrected.y / previewBox.clientHeight * contentPosition.Height
                });

                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
            } else {
                if (lastMouseX && lastMouseY) {
                    lastMouseX = lastMouseY = null;
                }
            }
        });
    }

    //------------------------------Private functions--------------------------------
    function buildDOM() {
        previewBox = document.createElement('div');
        previewBox.innerHTML = '<img />';
        previewBox.classList.toggle('zoom360');
        
        previewWindow = document.createElement("div");
        previewWindow.classList.toggle('zoomcube');

        rootElement.appendChild(previewBox);
        previewBox.appendChild(previewWindow);
        
        var contentPosition = engine.GetContentPosition();
        var contentRatio = contentPosition.Height / contentPosition.Width;

        height = width * contentRatio;
                
        previewBox.style.width = width + 'px';
        previewBox.style.height = height + 'px';
    }

    function resetDOM() {
        if (initialized)
            rootElement.removeChild(previewBox);
    }

    function correctPositions(x, y) {
        x = x < 0 ? 0 : x;
        x = x + previewWindow.clientWidth > previewWindow.clientWidth ? previewBox.clientWidth - previewWindow.clientWidth : x;

        y = y < 0 ? 0 : y;
        y = y + previewWindow.clientHeight > previewBox.clientHeight ? previewBox.clientHeight - previewWindow.clientHeight : y;

        return {
            x: x,
            y: y
        };
    }

    function setUpPosition() {
        var contentPosition = engine.GetContentPosition();
        var pos = correctPositions(-(contentPosition.Left / contentPosition.Width * width),
                                   -(contentPosition.Top / contentPosition.Height * height));
        
        previewWindow.style.left = pos.x + 'px';
        previewWindow.style.top = pos.y + 'px';
    }

    function setUpSize() {
        var contentPosition = engine.GetContentPosition();

        var screenSize = rootElement.getBoundingClientRect();

        previewWindow.style.width = screenSize.width / contentPosition.Width * previewBox.clientWidth + 'px';
        previewWindow.style.height = screenSize.height / contentPosition.Height * previewBox.clientHeight + 'px';
        
        if(previewWindow.clientWidth >= previewBox.clientWidth ||
            previewWindow.clientHeight >= previewBox.clientHeight){
                previewWindow.style.width = previewBox.clientWidth + 'px';
                previewWindow.style.height = previewBox.clientHeight + 'px';
                previewWindow.style.left = 0;
                previewWindow.style.top = 0;
            }
    }

    //----------------------------Public functions---------------------------
    this.Init = function () {
        buildDOM();

        setUpPosition();

        setUpSize();

        registerEventHandlers();

        this.UpdateFrame();
        initialized = true;
    }

    this.Dispose = function () {
        initialized = false;
        resetDOM();
    }

    this.UpdateSize = function () {
        if (initialized)
            setUpSize();
    }

    this.UpdatePosition = function () {
        if (initialized)
            setUpPosition();
    }

    this.UpdateFrame = function (url) {
        if (!initialized)
            return;

        previewBox.querySelector('img').src(url);
    }

    this.Hide = function () {
        if (!initialized)
            return;

        if (!isHidden) {
            velocity(previewBox, {
                opacity: 0
            }, {
                durtion: 200,
                complete: function(){
                    previewBox.classList.add('hidden');
                }
            });
            isHidden = true;
        }
    }

    this.Show = function () {
        if (!initialized)
            return;

        this.UpdateSize();
        this.UpdatePosition();

        if (isHidden) {
            velocity(previewBox, {
                opacity: 1
            }, {
                duration: 200
            });
           
            previewBox.classList.remove('hidden');
            
            isHidden = false;
        }
    }
}