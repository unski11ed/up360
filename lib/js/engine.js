import { Rectangle, ScreenRectangle, Functions } from './helpers';
import { ImageRepository } from './imageRepository';
import { StartFramesLoader } from './startingLoader';

export function Engine(parentElement, settings) {
    var defaultFrameWidth,
        defaultFrameHeight,
        screen,
        touch,
        content,
        lowResContent,
        highResContent,
        lastActiveLowResImage;

    var currentLevelObject, highestLevelObject, currentFrame, sourceRectangle,
        imageRepository, startFramesLoader, zoomValue, _scale, posX = 0, posY = 0,
        mousePosX = 0, mousePosY = 0, isMouseOnScreen = false, screenRectangle,
        contentWidth, contentHeight,
        InterfaceObject, _this = this, moveRedrawTimeout;

    var minZoom = function() {
        if (settings.fillWindow && screenRectangle) {
            var highestLevelObject = settings.levelObjects[settings.levelObjects.length - 1];
            var highestRatio = Math.max(
                screenRectangle.width / highestLevelObject.width,
                screenRectangle.height / highestLevelObject.height,
            );
            return 1 + highestRatio * (maxZoom() - 1);
        }
        return Math.min.apply(null, settings.levelObjects.map(function(v) { return v.zoomThreshold; }));
    }
    var maxZoom = function() {
        return Math.max.apply(null, settings.levelObjects.map(function(v) { return v.zoomThreshold; }));
    }

    this.ZoomNormalized = 0;

    //---------------------------------------------------------------------------------------
    this.Init = function () {
        //Setup global vars
        currentLevelObject = settings.levelObjects[0];
        highestLevelObject = settings.levelObjects[settings.levelObjects.length - 1];
        currentFrame = settings.minFrame;
        zoomValue = minZoom();

        //Setup objects
        sourceRectangle = new Rectangle(0, 0, defaultFrameWidth, defaultFrameHeight);
        imageRepository = new ImageRepository(settings, currentLevelObject, settings.forceReload);
        startFramesLoader = new StartFramesLoader(imageRepository, settings, function (images) {
            images.forEach(function (image) {
                lowResContent.appendChild(image);
            });
            //True starting point - launched after loading the low res images
            screenRectangle.update();

            _this.Draw();

            //Lets go!
            scaleContentToScreen();
            centerContent();

            updateCss();

            settings.onInitComplete.Trigger(_this);
        });

        //Setup the DOM tree
        setUpDOM();

        //Save sizes
        screenRectangle = new ScreenRectangle(screen);

        defaultFrameWidth = screenRectangle.width;
        defaultFrameHeight = screenRectangle.height;

        //Save for quick further use
        contentWidth = content.offsetWidth;
        contentHeight = content.offsetHeight;

        //Assign touch events
        touch.addEventListener('mousemove', function (e) {
            mousePosX = e.offsetX;
            mousePosY = e.offsetY;
        });

        touch.addEventListener('mouseenter', function () {
            isMouseOnScreen = true;
        });

        touch.addEventListener('mouseleave', function () {
            isMouseOnScreen = false;
        });

        //AutoLoad
        if (settings.autoload) {
            this.Load();
        }
    }

    this.Dispose = function () {
        InterfaceObject = null;
        imageRepository.dispose();
        resetDOM();
    }

    this.Load = function () {
        switch (settings.loadSettings.type) {
            case 'lazy':
                startFramesLoader.lazyLoader(settings.loadSettings);
                break;

            case 'default':
            default:
                startFramesLoader.immediateLoader();
                break;
        }
        if (settings.loadSettings.type == 'lazy')
            startFramesLoader.lazyLoader
    }

    this.SwitchFrame = function (options) {
        if (options.destination !== undefined) {
            //Zmiana klatki
            currentFrame = options.destination;
            //Korekcja zmienionej klatki tak aby nie przekroczyły settings.maxFrame ani settings.minFrame
            currentFrame = currentFrame > settings.maxFrame - 1 ? settings.minFrame : currentFrame;
            currentFrame = currentFrame < settings.minFrame ? settings.maxFrame - 1 : currentFrame;

            clearScreen();
            _this.Draw({ lowRes: true });
        } else if (options.delta !== undefined) {
            this.SwitchFrame({ destination: currentFrame + options.delta });
        }
        settings.onFrameChanged.Trigger(currentFrame);
    }

    this.UpdateSize = function () {
        screenRectangle.update();

        sourceRectangle.width = screenRectangle.width;
        sourceRectangle.height = screenRectangle.height;

        scaleContentToScreen();

        correctPosition();

        centerContent();

        _this.Draw();

        updateCss();
    }

    this.Move = function (options) {
        if (_this.ZoomNormalized === 0) {
            centerContent();
            return;
        }

        if (options !== undefined) {
            var x, y;
            if (options.diffX !== undefined || options.diffY !== undefined) {
                x = options.diffX === undefined ? posX : posX + options.diffX;
                y = options.diffY === undefined ? posY : posY + options.diffY;

                moveTo(x, y);
            }

            if (options.X !== undefined || options.Y !== undefined) {
                x = options.X === undefined ? posX : options.X;
                y = options.Y === undefined ? posY : options.Y;

                moveTo(x, y);
            }

            if (options.Left !== undefined || options.Top !== undefined) {
                contentPosition.X(options.Left);
                contentPosition.Y(options.Top);

                updateCss();
            }

            clearTimeout(moveRedrawTimeout);
            moveRedrawTimeout = setTimeout(function () {
                _this.Draw({ lowRes: false });
            }, 100);
        }
    }

    this.Zoom = function (options) {
        if (options !== undefined) {
            if (options.destination !== undefined)
                zoomTo(options.destination);
            if (options.delta !== undefined)
                zoomTo(zoomValue + options.delta);
            if (options.normalized !== undefined)
                zoomTo((maxZoom() - minZoom()) * options.normalized + minZoom());
        } else {
            return zoomValue;
        }
    }

    this.Draw = function (options) {
        var isLowRes = (options !== undefined && options.lowRes);
        var levelObject = (isLowRes ? settings.levelObjects[0] : currentLevelObject);

        var contentRectangle = getContentRect();
        var scale = getScale();

        var chunkRender = function (x, y, levelObject) {
            var partWidth = contentWidth / levelObject.columns,
                partHeight = contentHeight / levelObject.rows;

            var tempRect = {
                sx: partWidth * scale * x + contentRectangle.left,
                sy: partHeight * scale * y + contentRectangle.top,
                width: partWidth * scale,
                height: partHeight * scale
            };

            var isLowLevelObject = levelObject === settings.levelObjects[0];
            // Check if the image chunk intersects with the Screen Rectangle
            if (sourceRectangle.intersects(tempRect) || isLowLevelObject) {
                var currentFrameNormalized = Math.round(currentFrame);
                // If the image is within the screen load from cache or remote
                imageRepository.getImage(
                    currentFrameNormalized,
                    x,
                    y,
                    levelObject,
                    settings.resourceUrl,
                    // Load Callback
                    function () {
                        var image = this;

                        // Prevent displaying image from a differentframe
                        if (image.dataset.frameIndex != currentFrameNormalized)
                            return;

                        image.style.left = (partWidth * x) + 'px';
                        image.style.top = (partHeight * y) + 'px';
                        image.style.zIndex = levelObject.zoomThreshold;
                        image.width = partWidth;
                        image.height = partHeight;

                        if (levelObject.zoomThreshold <= 1) {
                            // Draw Low Resolution
                            if (lastActiveLowResImage)
                                lastActiveLowResImage.classList.remove('up360__frame--active');
                            image.classList.add('up360__frame--active');
                            lastActiveLowResImage = image;

                            // Call draw frame event
                            settings.onDrawFrame.Trigger(currentFrameNormalized, !isLowRes, image.src);
                        } else {
                            // Draw High Resolution chunk
                            // If the element has not been rendered - do it
                            for (var i = 0; i < highResContent.childNodes.length; i++) {
                                if (highResContent.childNodes[i] === image)
                                    return;
                            }

                            highResContent.appendChild(image);
                        }
                    },
                    // Lowest zoom level - load only from cache
                    isLowLevelObject
                );
            }
        };

        chunkRender(0, 0, settings.levelObjects[0]);

        if (!isLowRes && levelObject !== settings.levelObjects[0]) {
            for (var y = 0; y < levelObject.rows; y++)
                for (var x = 0; x < levelObject.columns; x++) {
                    chunkRender(x, y, levelObject);
                }
        }
    }

    this.GetContentPosition = function () {
        return {
            Left: contentPosition.X(),
            Top: contentPosition.Y(),
            Width: contentPosition.Width(),
            Height: contentPosition.Height()
        };
    }

    this.CenterContent = centerContent;
    //****************************************PRIVATE FUNCTIONS*********************************************
    function getContentRect() {
        var rect = content.getBoundingClientRect();
        return {
            left: rect.left - screenRectangle.left,
            right: rect.right - screenRectangle.left,
            top: rect.top - screenRectangle.top,
            bottom: rect.bottom - screenRectangle.top,
            width: rect.width,
            height: rect.height
        };
    }

    var contentPosition = {
        X: function (value) {
            if (value != undefined) {
                posX = value - (contentWidth * (1 - getScale()) / 2);  //Setter
                settings.onContentMoved.Trigger(value, contentPosition.Y());
            } else {
                return posX + (contentWidth * (1 - getScale()) / 2);   //Getter
            }
        },

        Y: function (value) {
            if (value != undefined) {
                posY = value - (contentHeight * (1 - getScale()) / 2); //Setter
                settings.onContentMoved.Trigger(contentPosition.X(), value);
            } else {
                return posY + (contentHeight * (1 - getScale()) / 2);  //Getter
            }
        },

        Width: function () {
            var rect = getContentRect();
            return rect.width;
        },

        Height: function () {
            var rect = getContentRect();
            return rect.height;
        }
    }

    function setUpDOM() {
        touch = document.createElement('div');
        touch.classList.add('up360__touch');

        screen = document.createElement('div');
        screen.classList.add('up360__screen');
        screen.style.backgroundColor = settings.backgroundColor;

        parentElement.appendChild(screen);
        parentElement.appendChild(touch);

        content = document.createElement('div');
        content.classList.add('up360__content');
        content.style.width = highestLevelObject.width + 'px';
        content.style.height = highestLevelObject.height + 'px';

        lowResContent = document.createElement('div');
        lowResContent.classList.add('up360__content__low-res');

        highResContent = document.createElement('div');
        highResContent.classList.add('up360__content__high-res');

        screen.appendChild(content);

        content.appendChild(lowResContent);
        content.appendChild(highResContent);

        // Setup style variables
        if (settings.backgroundColor) {
            parentElement.style.setProperty('--background-color', settings.backgroundColor);
        }
        if (settings.primaryUiColor) {
            parentElement.style.setProperty('--primary-color', settings.primaryUiColor);
        }
        if (settings.secondaryUiColor) {
            parentElement.style.setProperty('--secondary-color', settings.secondaryUiColor);
        }
    }

    function resetDOM() {
        parentElement.removeChild(screen);
    }

    function scaleContentToScreen() {
        _this.ZoomNormalized = 0;

        zoomTo(minZoom());
    }

    function getCurrentLevelObject() {
        var currentLevelObject = null;
        //Znajdz defnicje poziomu przyblizenia
        settings.levelObjects.forEach(function (level) {
            if (zoomValue >= level.zoomThreshold)
                currentLevelObject = level;
        });
        //Wyrzuć wyjątek, jeżeli nic nie znaleziono
        if (currentLevelObject === null)
            currentLevelObject = settings.levelObjects[0];

        return currentLevelObject;
    };


    function centerContent() {
        var rect = getContentRect();

        contentPosition.X((screenRectangle.width - rect.width) / 2);
        contentPosition.Y((screenRectangle.height - rect.height) / 2);

        updateCss();
    }

    function setScale(scale) {
        _scale = scale;
        updateCss();
    }

    function getScale() {
        return _scale;
    }

    function updateCss() {
        content.style.transform = "translate3d(" + posX + "px," + posY + "px, 0) " +
            "scale3d(" + _scale + ", " + _scale + ", 1)";
    }

    function zoomTo(value) {
        // Save for later
        var lastValue = zoomValue;
        zoomValue = value;

        // Keep zoom levels in the minZoom - maxZoom range
        zoomValue = zoomValue < minZoom() ? minZoom() : zoomValue;
        zoomValue = zoomValue > maxZoom() ? maxZoom() : zoomValue;

        var levelObject = getCurrentLevelObject();
        var oldRect = getContentRect();

        var scale = (zoomValue - 1) / (maxZoom() - 1);
        setScale(scale);

        if (levelObject.zoomThreshold !== currentLevelObject.zoomThreshold) {
            clearScreen();
            _this.Draw({ lowRes: true });
        }

        currentLevelObject = levelObject;

        var currentRect = getContentRect();
        var newZoomNormalized = (zoomValue - minZoom()) / (maxZoom() - minZoom());
        var isZoomIn = (newZoomNormalized - _this.ZoomNormalized) >= 0;

        // Origin point - center
        var pointX = screenRectangle.width / 2,
            pointY = screenRectangle.height / 2;

        // If mouse targeting - origin point = mouse position
        if (isMouseOnScreen && !Functions.isMobile.any() && zoomValue != lastValue) {
            pointX = mousePosX;
            pointY = mousePosY;
        }

        // Calculate offset
        var moldPosX = (pointX - oldRect.left) / oldRect.width,
            moldPosY = (pointY - oldRect.top) / oldRect.height;

        var mPosX = (pointX - currentRect.left) / currentRect.width,
            mPosY = (pointY - currentRect.top) / currentRect.height;

        // Set offset
        _this.Move({
            diffX: (mPosX - moldPosX) * currentRect.width,
            diffY: (mPosY - moldPosY) * currentRect.height
        });

        // Fire the zoom changed event handler and recalculate the normalized zoom value (0 - 1)
        _this.ZoomNormalized = newZoomNormalized;
        settings.onZoomChanged.Trigger(_this.ZoomNormalized, zoomValue, minZoom(), maxZoom());

        correctPosition();

        _this.Draw();
    }

    function correctPosition() {
        var rect = getContentRect();

        var cpX = contentPosition.X(),
            cpY = contentPosition.Y();
        if (rect.width < screenRectangle.width && rect.height < screenRectangle.Height) {
            // Content smaller than screen =>
            // Horizontal
            if (cpX < 0)
                contentPosition.X(0);
            else if (cpX + contentPosition.Width() > screenRectangle.width)
                contentPosition.X(screenRectangle.width - contentPosition.Width())
            // Vertical
            if (cpY < 0)
                contentPosition.Y(0);
            else if (cpY + contentPosition.Height() > screenRectangle.Height)
                contentPosition.Y(screenRectangle.Height - contentPosition.Height());
        } else {
            // Content larger than screen =>
            var percentage = (zoomValue - 1) / maxZoom(),
                maxY = Math.round(screenRectangle.height / 2 * percentage),
                maxX = Math.round(screenRectangle.width / 2 * percentage);

            // Vertical
            if (cpY > maxY)
                contentPosition.Y(maxY);
            else if (cpY + contentPosition.Height() < screenRectangle.height - maxY)
                contentPosition.Y(screenRectangle.height - maxY - contentPosition.Height())
            // Horizontal
            if (cpX > maxX)
                contentPosition.X(maxX);
            else if (cpX + contentPosition.Width() < screenRectangle.width - maxX)
                contentPosition.X(screenRectangle.width - maxX - contentPosition.Width())
        }
    }

    function moveTo(x, y) {
        posX = x;
        posY = y;

        correctPosition();

        updateCss();

        settings.onContentMoved.Trigger(contentPosition.X(), contentPosition.Y());
    }

    function clearScreen() {
        highResContent.innerHTML = '';
    }
};