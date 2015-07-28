//Declare namespace
var up360 = up360 || {};
up360.UI = up360.UI || {};

function PreviewWindow(rootElement, animation, rotator, settings) {
    var previewBox,
        $previewWindow,
        initialized = false,
        height = 0,
        width = settings.baseWidth,
        $screen,
        isHidden = false;

    function getParentRelativeRect(element){
        var parentRect = element.parent.getBoundingClientRect(),
            rect = element.getBoundingClientRect();
            
        return new up360.Helpers.Rectangle(
            rect.left - parentRect.left,
            rect.top - parentRect.top,
            rect.width, rect.height
        )
    }
    //-----------------------------Event handlers--------------------------------------
    function registerEventHandlers() {
        //*********************************************************************************    
        //Handle click on the preview
        previewBox.addEventHandler('click', function(e) {
            if (e.target !== previewBox.getElementsByTagName('img')[0])
                return;

            animation.Stop();
            //TODO: BUILD DOM FIRST AND START HERE!!!!!!!!!
            var screenPosition = $screen.offset();

            var mouseX = e.clientX - screenPosition.left,
                mouseY = e.clientY - screenPosition.top;

            var destLeft = mouseX - $previewWindow.width() / 2,
                destTop = mouseY - $previewWindow.height() / 2;

            var pos = correctPositions(destLeft, destTop);

            destLeft = pos.x;
            destTop = pos.y;

            var contentPosition = _rotator.GetContentPosition();

            $previewWindow.velocity({
                left: destLeft + 'px',
                top: destTop + 'px',
            }, {
                duration: settings.moveAnimationDuration,
                easing: 'swing',

            });

            //HAXXX - needs to be changed to a step function
            var prevBoxWidth = $previewBox.width(),
                prevBoxHeight = $previewBox.height();

            var interval = setInterval(function () {
                var pos = $previewWindow.position();
                _rotator.Move({
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
        $previewWindow.mousedown(function (e) {
            e.stopImmediatePropagation();
            animation.Stop();
            isMouseDown = true;
        }).mouseup(function (e) {
            e.stopImmediatePropagation();
            isMouseDown = false;
        });

        $previewBox.mouseup(function () {
            isMouseDown = false;
        }).mouseleave(function () {
            isMouseDown = false;
        }).mousemove(function (e) {
            if (isMouseDown) {
                if (!lastMouseX && !lastMouseY) {
                    lastMouseX = e.clientX;
                    lastMouseY = e.clientY;
                }
                var currentPosition = $previewWindow.position();

                var newX = currentPosition.left + e.clientX - lastMouseX,
                    newY = currentPosition.top + e.clientY - lastMouseY;

                var corrected = correctPositions(newX, newY);

                $previewWindow.css({
                    left: corrected.x,
                    top: corrected.y
                });

                var contentPosition = _rotator.GetContentPosition();

                _rotator.Move({
                    Left: -corrected.x / $previewBox.width() * contentPosition.Width,
                    Top: -corrected.y / $previewBox.height() * contentPosition.Height
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
        $previewBox = $("<div class='zoom360'><img/></div>");
        $previewWindow = $("<div class='zoomcube'></div>");

        $rootElement.find('.main360').append($previewBox);
        $previewBox.append($previewWindow);

        var contentPosition = _rotator.GetContentPosition();
        var contentRatio = contentPosition.Height / contentPosition.Width;

        height = width * contentRatio;
        $previewBox.width(width)
                   .height(height);
    }

    function resetDOM() {
        if (initialized)
            $previewBox.remove();
    }

    function correctPositions(x, y) {
        x = x < 0 ? 0 : x;
        x = x + $previewWindow.width() > $previewBox.width() ? $previewBox.width() - $previewWindow.width() : x;

        y = y < 0 ? 0 : y;
        y = y + $previewWindow.height() > $previewBox.height() ? $previewBox.height() - $previewWindow.height() : y;

        return {
            x: x,
            y: y
        };
    }

    function setUpPosition() {
        var contentPosition = _rotator.GetContentPosition();
        var pos = correctPositions(-(contentPosition.Left / contentPosition.Width * width),
                                   -(contentPosition.Top / contentPosition.Height * height));
        $previewWindow.css({
            left: pos.x,
            top: pos.y
        });
    }

    function setUpSize() {
        var contentPosition = _rotator.GetContentPosition();

        var screenSize = new TrueElementSize($screen);

        $previewWindow.width(screenSize.Width / contentPosition.Width * $previewBox.width())
                      .height(screenSize.Height / contentPosition.Height * $previewBox.height());

        if ($previewWindow.width() >= $previewBox.width() ||
            $previewWindow.height() >= $previewBox.height()) {
            $previewWindow.height($previewBox.height())
                          .width($previewBox.width())
                          .css({
                              left: 0,
                              top: 0
                          });
        }

    }

    //----------------------------Public functions---------------------------
    this.Init = function () {
        $screen = $rootElement.find('.js-rotator-screen');

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

        $previewBox.find('img').attr('src', url);
    }

    this.Hide = function () {
        if (!initialized)
            return;

        if (!isHidden) {
            $previewBox.velocity({
                opacity: 0
            }, {
                duration: 200,
                complete: function () {
                    $previewBox.hide();
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
            $previewBox.show();

            $previewBox.velocity({
                opacity: 1
            }, {
                duration: 200,
            })
            isHidden = false;
        }
    }
}