//Declare namespace
var up360 = up360 || {};
up360.Rendering = up360.Rendering || {};

up360.Rendering.Engine = function(parentElement, settings){
	var defaultFrameWidth,
		defaultFrameHeight,
		screen,
		touch,
		content,
		lowResContent,
		highResContent,
		lastActiveLowResImage;


	var currentLevelObject, highestLevelObject, currentFrame, sourceRectangle,
		imageRepository, startFramesLoader, zoomValue, minZoomValue, _scale, posX = 0, posY = 0,
		mousePosX = 0, mousePosY = 0, isMouseOnScreen = false, screenRectangle,
		contentWidth, contentHeight,
		InterfaceObject, _this = this, moveRedrawTimeout;

	this.ZoomNormalized = 0;

	//---------------------------------------------------------------------------------------
	this.Init = function () {
		//Setup global vars
		currentLevelObject = settings.levelObjects[0];
		highestLevelObject = settings.levelObjects[settings.levelObjects.length - 1];
		currentFrame = settings.minFrame;
		minZoomValue = currentLevelObject.width / highestLevelObject.width;
		zoomValue = settings.minZoom;
		
		//Setup objects
		sourceRectangle = new up360.Helpers.Rectangle(0, 0, defaultFrameWidth, defaultFrameHeight);
		imageRepository = new up360.Rendering.ImageRepository(settings, currentLevelObject, settings.forceReload);
		startFramesLoader = new up360.Rendering.StartFramesLoader(imageRepository, settings, function(){
			//True starting point - launched after loading the low res images
			screenRectangle.Update();

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
		screenRectangle = new up360.Helpers.ScreenRectangle(screen);

		defaultFrameWidth = screenRectangle.Width;
		defaultFrameHeight = screenRectangle.Height;

		//Save for quick further use
		contentWidth = content.offsetWidth;
		contentHeight = content.offsetHeight;

		//Assign touch events
		touch.addEventListener('mousemove', function(e){
			mousePosX = e.pageX - screen.offsetLeft;
			mousePosY = e.pageY - screen.offsetTop;
		});
		
		touch.addEventListener('mouseenter', function(){
			isMouseOnScreen = true;
		});
		
		touch.addEventListener('mouseleave', function(){
			isMouseOnScreen = false;
		});
	}

	this.Dispose = function () {
		InterfaceObject = null;
		imageRepository.dispose();
		resetDOM();
	}

	this.Load = function(){
		switch(settings.loadSettings.type){
			case 'lazy':
			startFramesLoader.lazyLoader(settings.loadSettings);
			break;
			
			case 'default':
			default:
			startFramesLoader.immediateLoader();
			break;
		}
		if(settings.loadSettings.type == 'lazy')
			startFramesLoader.lazyLoader
	}

	this.SwitchFrame = function (options) {
		if (options.destination !== undefined) {
			//Zmiana klatki
			currentFrame = Math.round(options.destination);
			//Korekcja zmienionej klatki tak aby nie przekroczyły settings.maxFrame ani settings.minFrame
			currentFrame = currentFrame > settings.maxFrame ? settings.minFrame : currentFrame;
			currentFrame = currentFrame < settings.minFrame ? settings.maxFrame : currentFrame;

			clearScreen();
			_this.Draw({ lowRes: true });
		} else if (options.delta !== undefined) {
			this.SwitchFrame({ destination: currentFrame + options.delta });
		}
		settings.onFrameChanged.Trigger(currentFrame);
	}

	this.UpdateSize = function () {
		screenRectangle.Update();

		sourceRectangle.width = screenRectangle.Width;
		sourceRectangle.height = screenRectangle.Height;

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
				zoomTo((settings.maxZoom - settings.minZoom) * options.normalized + settings.minZoom);
		}else{
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

			var offset = y * levelObject.columns + x;
			var isLowLevelObject = levelObject === settings.levelObjects[0];
			//Sprawdzenie czy fragment obrazu nachodzi na Prostokąt defniujący kamere(czy fragmentjest widoczny)
			if (sourceRectangle.intersects(tempRect) || isLowLevelObject) {
				//Jeśli jest widoczny - załaduj obraz z cachu lub z resourcow
				imageRepository.getImage(currentFrame, offset, levelObject, function (loadedFromCache) {
					//Po załadowaniu:
					var image = this;

					if ((image.parentElement === null || (!loadedFromCache)) && isLowLevelObject)
						return;
					
					//Prevent displaying image from a differentframe
					if (image.dataset.frameIndex != currentFrame)
						return;

					image.style.left = (partWidth * x) + 'px';
					image.style.top = (partHeight * y) + 'px';
					image.style.zIndex = levelObject.zoomThreshold;
					image.setAttribute('width', partWidth);
					image.setAttribute('height', partHeight);

					if (levelObject.zoomThreshold <= 1) {
						//Draw Low Resolution
						lastActiveLowResImage.classList.remove('low-active');
						image.classList.add('low-active');
						lastActiveLowResImage = image;

						//Wywołaj event handler odnośnie rysowania klatki
						settings.onDrawFrame.Trigger(currentFrame, !isLowRes, image.src);
					} else {
						//Draw High Resolution chunk
						//Jeśli element nie był jeszcze narysowany, to narysuj go na ekranie
						if (highResContent.childNodes.indexOf(image) < 0) {
							highResContent.appendChild(image);
						}
					}
				}, isLowLevelObject); //Na najniższym poziomie przybliżenia ładuj tylko z cachu
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
			left: rect.left - screenRectangle.Left,
			right: rect.right - screenRectangle.Left,
			top: rect.top - screenRectangle.Top,
			bottom: rect.bottom - screenRectangle.Top,
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
		touch.classList.add('up360-touch');
		
		screen = document.createElement('div');
		screen.classList.add('up360-screen');

		parentElement.appendChild(screen);
		parentElement.appendChild(touch);
		
		content = document.createElement('div');
		content.classList.add('up360-content');
		content.style.width = highestLevelObject.width + 'px';
		content.style.height = highestLevelObject.height + 'px';

		lowResContent = document.createElement('div');
		lowResContent.classList.add('up360-low-res-content');
		
		highResContent = document.createElement('div');
		highResContent.classList.add('up360-high-res-content');

		screen.appendChild(content);
		
		content.append(lowResContent);
		content.append(highResContent);
	}

	function resetDOM() {
		parentElement.removeChild(screen);
	}

	function scaleContentToScreen() {
		settings.minZoom = (screenRectangle.Width / highestLevelObject.width + screenRectangle.Height / highestLevelObject.height) / 2 * settings.maxZoom;

		_this.ZoomNormalized = 0;

		zoomTo(settings.minZoom);
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

		contentPosition.X((screenRectangle.Width - rect.width) / 2);
		contentPosition.Y((screenRectangle.Height - rect.height) / 2);

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
		content.style.transform = "translate(" + posX + "px," + posY + "px) " +
								  "scale(" + _scale + ")";
	}

	function zoomTo(value) {
		//zapisanie w globalnej zmiennej
		var lastValue = zoomValue;
		zoomValue = value;

		//Korekcja poziomu zoomu tak, żeby nie był mniejszy od 1 i większy niż settings.maxZoom
		zoomValue = zoomValue < settings.minZoom ? settings.minZoom : zoomValue;
		zoomValue = zoomValue > settings.maxZoom ? settings.maxZoom : zoomValue;

		var levelObject = getCurrentLevelObject();  //aktualny poziom przybliżenia

		var oldRect = getContentRect();

		setScale(minZoomValue * zoomValue);

		if (levelObject.zoomThreshold !== currentLevelObject.zoomThreshold) {
			clearScreen();
			_this.Draw({ lowRes: true });
		}

		currentLevelObject = levelObject;

		var currentRect = getContentRect();

		//Origin point - center
		var pointX = screenRectangle.Width / 2,
			pointY = screenRectangle.Height / 2;

		//If mouse targeting - origin point = mouse position
		if (isMouseOnScreen && !up360.Helpers.isMobile.any() && zoomValue > lastValue) {
			pointX = mousePosX;
			pointY = mousePosY;
		}

		//Calculate offset
		var moldPosX = (pointX - oldRect.left) / oldRect.width,
			moldPosY = (pointY - oldRect.top) / oldRect.height;

		var mPosX = (pointX - currentRect.left) / currentRect.width,
			mPosY = (pointY - currentRect.top) / currentRect.height;

		//Set offset
		_this.Move({
			diffX: (mPosX - moldPosX) * currentRect.width,
			diffY: (mPosY - moldPosY) * currentRect.height
		});

		//Fire the zoom changed event handler and recalculate the normalized zoom value (0 - 1)
		_this.ZoomNormalized = (zoomValue - settings.minZoom) / (settings.maxZoom - settings.minZoom);
		settings.onZoomChanged.Trigger(_this.ZoomNormalized, zoomValue, settings.minZoom, settings.maxZoom);

		correctPosition();

		_this.Draw();
	}

	function correctPosition() {
		var rect = getContentRect();

		var cpX = contentPosition.X(),
			cpY = contentPosition.Y();
		if (rect.width < screenRectangle.Width && rect.height < screenRectangle.Height) {
			//Content smaller than screen =>
			//Horizontal
			if (cpX < 0)
				contentPosition.X(0);
			else if (cpX + contentPosition.Width() > screenRectangle.Width)
				contentPosition.X(screenRectangle.Width - contentPosition.Width())
			//Vertical
			if (cpY < 0)
				contentPosition.Y(0);
			else if (cpY + contentPosition.Height() > screenRectangle.Height)
				contentPosition.Y(screenRectangle.Height - contentPosition.Height());
		} else {
			//Content larger than screen =>
			var percentage = (zoomValue - 1) / settings.maxZoom,
			maxY = Math.round(screenRectangle.Height / 2 * percentage),
			maxX = Math.round(screenRectangle.Width / 2 * percentage);

			//Vertical
			if (cpY > maxY)
				contentPosition.Y(maxY);
			else if (cpY + contentPosition.Height() < screenRectangle.Height - maxY)
				contentPosition.Y(screenRectangle.Height - maxY - contentPosition.Height())
			//Horizontal
			if (cpX > maxX)
				contentPosition.X(maxX);
			else if (cpX + contentPosition.Width() < screenRectangle.Width - maxX)
				contentPosition.X(screenRectangle.Width - maxX - contentPosition.Width())
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
		highResContent.innerHtml = '';
	}	
};