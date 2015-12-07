require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * eventie v1.0.6
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false, module: false */

( function( window ) {

'use strict';

var docElem = document.documentElement;

var bind = function() {};

function getIEEvent( obj ) {
  var event = window.event;
  // add event.target
  event.target = event.target || event.srcElement || obj;
  return event;
}

if ( docElem.addEventListener ) {
  bind = function( obj, type, fn ) {
    obj.addEventListener( type, fn, false );
  };
} else if ( docElem.attachEvent ) {
  bind = function( obj, type, fn ) {
    obj[ type + fn ] = fn.handleEvent ?
      function() {
        var event = getIEEvent( obj );
        fn.handleEvent.call( fn, event );
      } :
      function() {
        var event = getIEEvent( obj );
        fn.call( obj, event );
      };
    obj.attachEvent( "on" + type, obj[ type + fn ] );
  };
}

var unbind = function() {};

if ( docElem.removeEventListener ) {
  unbind = function( obj, type, fn ) {
    obj.removeEventListener( type, fn, false );
  };
} else if ( docElem.detachEvent ) {
  unbind = function( obj, type, fn ) {
    obj.detachEvent( "on" + type, obj[ type + fn ] );
    try {
      delete obj[ type + fn ];
    } catch ( err ) {
      // can't delete window object properties
      obj[ type + fn ] = undefined;
    }
  };
}

var eventie = {
  bind: bind,
  unbind: unbind
};

// ----- module definition ----- //

if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( eventie );
} else if ( typeof exports === 'object' ) {
  // CommonJS
  module.exports = eventie;
} else {
  // browser global
  window.eventie = eventie;
}

})( window );

},{}],2:[function(require,module,exports){
/*!
 * EventEmitter v4.2.11 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */

;(function () {
    'use strict';

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;
    var exports = this;
    var originalGlobalValue = exports.EventEmitter;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after its first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    }
                    else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this, i, value);
                    }
                }
            }
        }
        else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        }
        else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        }
        else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(evt, args) {
        var listenersMap = this.getListenersAsObject(evt);
        var listeners;
        var listener;
        var i;
        var key;
        var response;

        for (key in listenersMap) {
            if (listenersMap.hasOwnProperty(key)) {
                listeners = listenersMap[key].slice(0);
                i = listeners.length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[i];

                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    /**
     * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
     *
     * @return {Function} Non conflicting EventEmitter class.
     */
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };

    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return EventEmitter;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = EventEmitter;
    }
    else {
        exports.EventEmitter = EventEmitter;
    }
}.call(this));

},{}],3:[function(require,module,exports){
var Helpers = require('./helpers.js');

module.exports = {
	// Default values
	maxZoom: 2,
	minZoom: 1,
	
	minFrame: 1,
	maxFrame: 30,
	
	playSpeed: 20,
	playDirection: 1,
	
	rotationDivider: 20,
	rotationDirection: 1,
	
	autoload: true,
	autoinit: true,
	
	forceReload: false,
	
	previewWindow: {
	    baseWidth: 200,
	    moveAnimationDuration: 200
	},
	
	loadSettings: {
	    type: 'default' //values = 'default || 'lazy'
	    //frameSkip: X - when lazy
	},
	
	DOMSettings: {
	    buildUI: true,
	    buildLoadingScreen: true,
	    buildPreviewWindow: true
	},
	
	scrollZoomEnabled: true,
	scrollZoomStep: 0.3,
	
	baseLayoutsUrl: '/css/templates/',
	layout: 'default',
	
	gesturesType: 'auto',                             //values: auto || desktop||touch
	
	onLoadStarted: new Helpers.Event(),         //params: $img
	onLoadComplete: new Helpers.Event(),        //params: $img
	
	onInitComplete: new Helpers.Event(),        //params: PluginInterface object    *modified by this object*
	
	onContentMoved: new Helpers.Event(),        //params: X, Y
	onRotateComplete: new Helpers.Event(),      //params: direction
	onZoomChanged: new Helpers.Event(),         //params: NormalizedValue, Value, MinZoom, MaxZoom
	onFrameChanged: new Helpers.Event(),        //params: currentFrame
	
	onLowResFrameLoaded: new Helpers.Event(),   //params: frameCount, maxFrames
	
	onDrawFrame: new Helpers.Event(),           //params: currentFrame, isHiRes, lowestLevelUrl
	
	onBuildComplete: new Helpers.Event(),       //params: buildPartComplete         *triggered by this object*
	
	onDisposed: new Helpers.Event(),            //                                  *triggered by this object*
}
},{"./helpers.js":5}],4:[function(require,module,exports){
var Helpers = require('./helpers.js'),
	ImageRepository = require('./image_repository.js'),
	StartingLoader = require('./starting_loader.js');

module.exports = function(parentElement, settings){
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
		sourceRectangle = new Helpers.Rectangle(0, 0, defaultFrameWidth, defaultFrameHeight);
		imageRepository = new ImageRepository(settings, currentLevelObject, settings.forceReload);
		startFramesLoader = new StartingLoader(imageRepository, settings, function(images){
			images.forEach(function(image){
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
		screenRectangle = new Helpers.ScreenRectangle(screen);

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
		
		//AutoLoad
		if(settings.autoload){
			this.Load();
		}
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
		screenRectangle.update();

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
		
		content.appendChild(lowResContent);
		content.appendChild(highResContent);
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
		if (isMouseOnScreen && !Helpers.Functions.isMobile.any() && zoomValue > lastValue) {
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
		highResContent.innerHTML = '';
	}	
};
},{"./helpers.js":5,"./image_repository.js":6,"./starting_loader.js":8}],5:[function(require,module,exports){
module.exports = {
	/*
	class: Rectangle
		Rectangle definition providing image boundries
		and an intersects method for testing rectangle intersections
		with other Rectangle interfaces
	*/
	Rectangle: function(sx, sy, width, height) {
		/*
		public intersects(rect : Rectangle) : <bool>
			Test if the current rectangle intersects with the rectangle
			provided in the param
		*/
		this.intersects = function (rect) {
			return (this.sx <= (rect.sx + rect.width) && (this.sx + this.width) >= rect.sx &&
					this.sy <= (rect.sy + rect.height) && (this.sy + this.height) >= rect.sy);
		};
		
		/*
		public set(sx : <number>, sy : <number>, width: <number>, height: <number>)
			Sets the boundries of this object
		*/
		this.set = function (sx, sy, width, height) {
			this.sx = sx;
			this.sy = sy;
			this.height = height;
			this.width = width;
		};
		//Constructor
		this.set(sx, sy, width, height);
	},

	//=============================================================================

	/*
	class: ScreenRectangle
		Small wrapper on getBoundingClientRect providing
		the boundries of display screen
	*/
	ScreenRectangle: function(screenElement) {
		this.left = 0;
		this.top = 0;
		this.bottom = 0;
		this.right = 0;
	
		this.height = 0;
		this.width = 0;
	
		this.update = function () {
			var screenRectangle = screenElement.getBoundingClientRect();
	
			this.left = screenRectangle.left;
			this.top = screenRectangle.top;
			this.right = screenRectangle.right;
			this.bottom = screenRectangle.bottom;
	
			this.width = screenRectangle.width;
			this.height = screenRectangle.height;
		};
	
		this.update();
	},
	//=============================================================================

	/*
	class: Event
		Simple event mechanism used in the application
	*/
	Event: function(firstEventHandler) {
		var eventHandlers;
		this.Add = function (eventHandler) {
			eventHandlers.push(eventHandler);
		}
	
		var currentArgs;
		this.Trigger = function () {
			currentArgs = Array.prototype.slice.call(arguments);
			for (var i = eventHandlers.length - 1; i >= 0; i--)
				eventHandlers[i].apply(this, currentArgs);
		}
	
		this.ChangeParameter = function(index, value){
			currentArgs[index] = value;
		}
	
		this.Clear = function(){
			eventHandlers = [];
		}
	
		this.Clear();
	
		if (firstEventHandler !== undefined) {
			this.Add(firstEventHandler);
		}
	},


	//*****************************************************************************
	//																			  *
	//								HELPER FUNCTIONS							  *
	//																		      *
	//*****************************************************************************
	Functions: {
		/*
		function: up360.Helpers.Functions.extend(target, source)
			Extends the values, from source primitive object
			by target values. Similar to jQuery's $.extend()
		*/
		extend: function(target, source){
			var _this = this;
			var extended = {};
			var merge = function (obj) {
				for (var prop in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, prop)) {
						if ( Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
							extended[prop] = _this.extend(extended[prop], obj[prop]);
						}
						else {
							extended[prop] = obj[prop];
						}
					}
				}
			};
			merge(arguments[0]);
			for (var i = 1; i < arguments.length; i++) {
				var obj = arguments[i];
				merge(obj);
			}
			return extended;
		},
		
		//TODO: Promise would be better than callback
		getJson: function(url, callback){
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			
			request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				// Success!
				var data = JSON.parse(request.responseText);
					callback.call(this, 1, data);
				} else {
				// We reached our target server, but it returned an error
					callback.call(this, 0);
				}
			};
			
			request.onerror = function() {
				callback.call(this, -1);
			};
			
			request.send();
		},
		
		isMobile: {
			Android: function() {
				return navigator.userAgent.match(/Android/i);
			},
			BlackBerry: function() {
				return navigator.userAgent.match(/BlackBerry/i);
			},
			iOS: function() {
				return navigator.userAgent.match(/iPhone|iPad|iPod/i);
			},
			Opera: function() {
				return navigator.userAgent.match(/Opera Mini/i);
			},
			Windows: function() {
				return navigator.userAgent.match(/IEMobile/i);
			},
			any: function() {
				return (this.Android() || this.BlackBerry() || this.iOS() || this.Opera() || this.Windows());
			}
		},
		
		intToPaddedString: function(number){
			return (this < 10 ? '0' : '') + number.toString();
		}
	}
};
},{}],6:[function(require,module,exports){
/*
class: ImagesRepository
	Creates img elements, and stores them in the cache object
	for further usage in the application
*/

var imagesloaded = require('imagesloaded'),
	helpers = require('./helpers.js');

module.exports = function(settings, currentLevelObject, forceReload) {
	var fastCache = {};

	this.dispose = function () {
		fastCache = {};
	};

	/*Method returning the requested image:
		* params:
		*  frameIndex: numer żądanej klatki
		*  tileId: identyfikator części obrazu
		*  desiredLevelObject: z jakiego poziomu przybliżenia pobrać klatkę (jesli null - aktualny poziom)
		*  callback: funkcja wywoływana po załadowaniu obrazu
	*/
	this.getImage = function (frameIndex, tileId, desiredLevelObject, callback, forceCacheLoad) {
		tileId = tileId === undefined ? 0 : tileId;
		//Decide which level object to render
		var levelObject = desiredLevelObject === null ? currentLevelObject : desiredLevelObject;
		//Generating unique identifier for searching in fastCache object
		var index = levelObject.zoomThreshold.toString() + frameIndex.toString() + tileId.toString();
		//Create a cache frame if doesnt exist already
		var cacheIndexElement = fastCache[frameIndex];
		cacheIndexElement = cacheIndexElement === undefined ? fastCache[frameIndex] = {} : cacheIndexElement;
		//Create the frame tile if it doesnt exist in the cache
		var cacheElement = cacheIndexElement[index];
		if (cacheElement === undefined) {
			//Create the src URL
			var src = levelObject.resourceUrl.replace('{index}', helpers.Functions.intToPaddedString(frameIndex))
											 .replace('{offset}', tileId);
			//If force reload - add a timestamp to the url to bypass browser cache					 
			if (forceReload) {
				src += ("?j=" + (new Date()).valueOf());
			}
			//Create an img element, assign the data attributes
			//and prevent mouse dragging
			var img = document.createElement('img');
			img.dataset.frameIndex = frameIndex;
			img.dataset.index = index;
			img.addEventListener('dragstart', function(e){
				e.preventDefault();
			});
			img.src = src;

			//Call Load Started event
			settings.onLoadStarted.Trigger(img);
			
			//Assign imageLoaded event via plugin
			imagesloaded(img, function(instance, image){
				instance.images.forEach(function(image){
					if(image.isLoaded){
						//Call Load Complete event
						settings.onLoadComplete.Trigger(image.img);
						//Add the created image to cache object
						fastCache[image.img.dataset.frameIndex][image.img.index] = image.img;
						//call the provided callback
						callback.call(image.img, false);
					}
				})
			});
			return false;
		} else {
			//If element is in the cache - instaltly call the callback
			callback.call(cacheElement, true);
			return true;
		}
	};
}
},{"./helpers.js":5,"imagesloaded":"imagesloaded"}],7:[function(require,module,exports){
(function(){
	var UI = {
		Animation: require('./ui/animation.js'),
		Menu: require('./ui/menu.js'),
		PreviewWindow: require('./ui/preview.js'),
		Loader: require('./ui/loader.js'),
		FullScreen: require('./ui/fullscreen.js'),
		Gestures: require('./ui/gestures.js'),
		InputManager: require('./ui/input-manager.js')
	};
	
	var Helpers = require('./helpers.js'),
		Engine = require('./engine.js'),
		defaults = require('./defaults.js');
	
	window.up360 = function(element, options){
		var parentContainer,
			rootElement,
			settings,
			engine,
			lastNormalizedZoomValue = 0;
			
		//Set the parent container
		if(element instanceof HTMLElement)
			parentContainer = element;
		else if(typeof element === 'string')
			parentContainer = document.querySelector(element);
		else
			throw 'up360: Invalid container element provided.';
		
		rootElement = document.createElement('div');
		rootElement.classList.add('up360');
		parentContainer.appendChild(rootElement);
		
		settings = Helpers.Functions.extend(defaults, options);
		engine = new Engine(rootElement, settings);
	
		var animation = new UI.Animation(engine, settings.maxFrame, settings);
		var ui = new UI.Menu(rootElement);
		var previewWindow = new UI.PreviewWindow(rootElement, animation, engine, settings.previewWindow);
		var preLoader = new UI.Loader(rootElement);
		var fullscreen = new UI.FullScreen(rootElement, engine);
		var gestures = new UI.Gestures(engine, settings);
		var inputManager = new UI.InputManager(rootElement, engine, gestures, animation, settings);
		
		//Modules event glue
		settings.onInitComplete.Add(function () {
			if (settings.DOMSettings.buildUI)
				ui.Init();
	
			if (settings.DOMSettings.buildPreviewWindow)
				previewWindow.Init();
	
			inputManager.Init();
	
			preLoader.Hide();
	
			engine.UpdateSize();
			previewWindow.UpdateSize();
		});
	
		settings.onZoomChanged.Add(function (normalizedZoom) {
			ui.SetZoomBarValue(normalizedZoom);
			previewWindow.UpdateSize();
	
			if (normalizedZoom == 0) {
				engine.CenterContent();
				previewWindow.Hide();
	
				ui.SetMode('rotate');
				gestures.Set('rotate');
			} else {
				if (lastNormalizedZoomValue === 0) {
					ui.SetMode('move');
					gestures.Set('move');
				}
				previewWindow.Show();
			}
	
			lastNormalizedZoomValue = normalizedZoom;
		});
	
		settings.onLowResFrameLoaded.Add(function (frame, total) {
			preLoader.Update(frame / total * 100);
		});
	
		settings.onContentMoved.Add(function (x, y) {
			previewWindow.UpdatePosition();
		});
	
		settings.onDrawFrame.Add(function (frameIndex, isHighRes, url) {
			previewWindow.UpdateFrame(url);
		});
	
		ui.OnFullScreenChanged.Add(function () {
			animation.Stop();
			ui.SetPlay('play');
	
			fullscreen.Toggle();
		});
	
		ui.OnModeChanged.Add(function (mode) {
			gestures.Set(mode);
		});
	
		ui.OnPlayChanged.Add(function (command) {
			if (command === 'play')
				animation.Play();
			else
				animation.Stop();
		});
	
		ui.OnZoomBarChanged.Add(function (value) {
			engine.Zoom({ normalized: value });
		});
	
		//animation events
		animation.OnStopped.Add(function () {
			ui.SetPlay('play');
		});
					
		animation.OnStarted.Add(function(){
			ui.SetPlay('stop');
		});
		
		
		var interfaceObject = {
			Init: function () {
				if (settings.DOMSettings.buildLoadingScreen)
					preLoader.Init();
				preLoader.Show();
	
				engine.Init();
			},
			Zoom: engine.Zoom,
			Draw: engine.Draw,
			SwitchFrame: engine.SwitchFrame,
			Move: engine.Move,
	
			Play: animation.Play,
			Stop: animation.Stop,
	
			ContentPosition: engine.GetContentPosition,
	
			SwitchMode: gestures.Set,    // pan || move
	
			Dispose: function () {
				animation.Stop();
				fullscreen.Dispose();
				previewWindow.Dispose();
				ui.Dispose();
				preLoader.Dispose();
				element.removeChild(parentContainer);
			}
		}; 
		
		if(settings.autoinit){
			interfaceObject.Init();
		}
		
		return interfaceObject;
	}
})();
},{"./defaults.js":3,"./engine.js":4,"./helpers.js":5,"./ui/animation.js":9,"./ui/fullscreen.js":10,"./ui/gestures.js":11,"./ui/input-manager.js":12,"./ui/loader.js":13,"./ui/menu.js":14,"./ui/preview.js":15}],8:[function(require,module,exports){
/*
class: StartFramesLoader
Loads the first frames which will be rendered at the
start of the application. Two modes are available:
immediate and lazy 
*/
module.exports = function(imageRepository, settings, completeCallback){
	//Called when a single image is completed loading
	//this - ImageElement
	function makeImageLoadedCallback(totalFrames){
		var loaded = 0;
		var imagesArray = [];
		
		return function(){
			imagesArray.push(this);
			
			loaded++;
			
			settings.onLowResFrameLoaded.Trigger(loaded, totalFrames); 
			
			if(loaded >= totalFrames){
				completeCallback.call(window, imagesArray);
			}
		};
	};
	
	/*public immediateLoader()
	Loads all of the frames one after another using the imageRepository object
	and return an array of HTMLImageElements in the completeCallback function
	provided in the constructor
	*/
	this.immediateLoader = function() {
		var totalFrames = settings.maxFrame - settings.minFrame;
		var loadCallback = makeImageLoadedCallback(totalFrames);
		for (var i = settings.minFrame; i <= settings.maxFrame; i++) {
			imageRepository.getImage(i, 0, settings.levelObjects[0], loadCallback);
		}
	};

	/*
	public lazyLoader(loadSettings)
	Loads the frames with a provided frame skip, which allows faster loading times
	while sacrificing the animation fluidity at the start of loading
	Args:
		<object>{
			frameSkip: <int> (default: 2)
		} 
	*/
	this.lazyLoader = function(loadSettings) {
		loadSettings.frameSkip = loadSettings.frameSkip === undefined ? 2 : loadSettings.frameSkip;

		var totalFrames = Math.ceil(settings.maxFrame - settings.minFrame / loadSettings.frameSkip);
		var loadCallback = makeImageLoadedCallback(totalFrames);
		for (var i = 0; i < loadSettings.frameSkip; i++) {
			for (var j = settings.minFrame + i; j <= settings.maxFrame; j += loadSettings.frameSkip) {
				imageRepository.getImage(j, 0, settings.levelObjects[0], loadCallback);
			}
		}
	};
};
},{}],9:[function(require,module,exports){
var Helpers = require('./../helpers.js');

module.exports = function(engine, totalFrames, settings) {
	var playInterval;
	var _this = this;

	this.OnStarted = new Helpers.Event();

	this.OnStopped = new Helpers.Event();

	this.Play = function (direction, speed) {
		speed = speed || settings.playSpeed;
		direction = direction || settings.playDirection;

		playInterval = setInterval(function () {
			engine.SwitchFrame({ delta: direction })
		}, speed);

		_this.OnStarted.Trigger();
	}

	this.Stop = function () {
		clearInterval(playInterval);
		_this.OnStopped.Trigger();
		engine.Draw();
	}
}
},{"./../helpers.js":5}],10:[function(require,module,exports){
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
},{"./../helpers.js":5,"screenfull":"screenfull"}],11:[function(require,module,exports){
module.exports = function(engine, settings) {
	var gestureObject;

	//---------------------Pan definition------------------------------
	function gesturePan() {
		var lastX, lastY, started = false;
		this.Start = function (x, y) {
			lastX = x;
			lastY = y;

			started = true;
		}

		this.Update = function (x, y) {
			if (started) {

				engine.Move({
					diffX: -(lastX - x),
					diffY: -(lastY - y),
				})

				lastX = x;
				lastY = y;
			}
		}

		this.End = function (x, y) {
			if (started) {
				started = false;
			}
		}
	}

	//--------------------Rotate definition------------------------------
	function gestureRotate() {
		var lastX, started = false, lastDirection = 0, totalValue = 0;

		this.Start = function (x) {
			lastX = x;
			totalValue = 0;

			started = true;
		}

		this.Update = function (x) {
			if (started) {
				var value = (x - lastX) / settings.rotationDivider;

				totalValue += value;

				if (totalValue > 1 || totalValue < -1) {
					engine.SwitchFrame({ delta: settings.rotationDirection * Math.round(totalValue) });
					totalValue = 0;
				}

				lastDirection = value >= 0 ? 1 : -1;

				lastX = x;
			}
		}

		this.End = function (x) {
			if (started) {
				started = false;
				engine.Draw();

				settings.onRotateComplete.Trigger(lastDirection);
			}
		}
	}
	//---------------------Public functions----------------------------
	this.Start = function (x, y) { gestureObject.Start(x, y) };
	this.End = function (x, y) { gestureObject.End(x, y) };
	this.Update = function (x, y) { gestureObject.Update(x, y) };
	
	this.Set = function (type) {
		switch (type) {
			case 'move':
				gestureObject = new gesturePan();
				break;

			case 'rotate':
			default:
				gestureObject = new gestureRotate();
				break;
		}
	}
	//----------------------Constructor--------------------------------
	this.Set(""); //Set default handler
}
},{}],12:[function(require,module,exports){
var HammerJs = require('hammerjs'),
	Helpers = require('./../helpers.js');

module.exports = function(parentElement, engine, gestures, animation, settings) {
	var touchElement;
	
	function registerTouchEventHandlers() {
		var mc = new HammerJs.Hammer(touchElement);

		mc.add(new HammerJs.Pan({ threshold: 0, pointers: 0 }));
		mc.add(new HammerJs.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan')]);

		mc.on("panstart panmove panend", onPan);
		mc.on("pinchstart pinchmove", onPinch);

		function onPan(ev) {
			if (ev.type == 'panstart') {
				animation.Stop();

				gestures.Start(ev.center.x,
							   ev.center.y);
			}
			if (ev.type == 'panmove') {
				gestures.Update(ev.center.x,
								ev.center.y);
			}
			if (ev.type == 'panend') {
				gestures.End();
			}
		}

		var initScale = 1;
		function onPinch(ev) {
			if (ev.type == 'pinchstart') {
				animation.Stop();
				initScale = engine.Zoom() || 1;
			}
			engine.Zoom({
				destination: initScale * ev.scale
			});
		}
	}

	//DOM Events
	function registerDesktopEventHandlers() {
		if (settings.scrollZoomEnabled) {
			touchElement.addEventListener('wheel', function(event){
				animation.Stop();

				//Trigger slide event
				if (event.deltaY > 0)
					engine.Zoom({ delta: settings.scrollZoomStep });
				else
					engine.Zoom({ delta: -settings.scrollZoomStep });

				//Prevent the default mouse wheel
				event.preventDefault();
			});
		}
		
		touchElement.addEventListener('mousedown', function(e){
			animation.Stop();

			gestures.Start(e.clientX, e.clientY);
		})

		touchElement.addEventListener('mousemove', function (e) {
			e.preventDefault();
			gestures.Update(e.clientX, e.clientY);
		});

		touchElement.addEventListener('mouseleave', function (e) {
			gestures.End();
		});

		touchElement.addEventListener('mouseup', function (e) {
			gestures.End(e.clientX, e.clientY);
		});
	}

	this.Init = function () {
		touchElement = parentElement.querySelector('.up360-touch');
		//Register appropriate event handlers
		switch (settings.gesturesType) {
			default:
			case 'auto':
				if (Helpers.Functions.isMobile.any()) {
					registerTouchEventHandlers();
				} else {
					registerDesktopEventHandlers();
				}
				break;

			case 'touch':
				registerTouchEventHandlers();
				break;

			case 'desktop':
				registerDesktopEventHandlers();
				break;
		}
	}
}
},{"./../helpers.js":5,"hammerjs":"hammerjs"}],13:[function(require,module,exports){
var Helpers = require('./../helpers.js'),
    velocity = require('velocity');

module.exports = function(parentElement) {
	var loaderElement, progressBarElement, initialised = false;

	this.Init = function () {
		//Constructor
		buildDOM();

		initialised = true;
	};

	this.Show = function () {
		if (!initialised)
			return;

	    loaderElement.style.opacity = 0;
		loaderElement.style.display = 'block';
		
		velocity(loaderElement, {
			opacity: 1
		}, {
			duration: 50
		});
	};

	this.Update = function (percentage) {
		if (!initialised)
			return;

		progressBarElement.style.width = percentage + '%';
	};

	this.Hide = function () {
		if (!initialised)
			return;

		velocity(loaderElement, {
			opacity: 0
		}, {
			duration: 400,
			complete: function(){
				loaderElement.style.display = 'none';
			}
		});
	}

	this.Dispose = function () {
		if (!initialised)
			return;

		parentElement.removeChild(loaderElement);
	}

	function buildDOM() {
	  	loaderElement = document.createElement('div');
		loaderElement.classList.add('up360-loading');
		loaderElement.style.display = 'none';
		loaderElement.innerHTML = 
			'<div class="loading">' +
			'	<span>Creating object</span>' +
			'   <div class="progress">' +
		    '   	<div class="progressbar"></div>' +
			'	</div>' +
			'</div>';
	
		parentElement.appendChild(loaderElement);
		
		progressBarElement = parentElement.querySelector('.progressbar');	
	}
}
},{"./../helpers.js":5,"velocity":"velocity"}],14:[function(require,module,exports){
var Helpers = require('./../helpers.js');

module.exports = function(parentElement, settings){
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
        panelElement.innerHTML = html;
		
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

    this.Init = function () {
        if (!initialised) {
            buildDOM(parentElement);
            registerEventHandlers();

            initialised = true;
        }
    }

    this.OnPlayChanged = new Helpers.Event();
    this.OnZoomBarChanged = new Helpers.Event();
    this.OnModeChanged = new Helpers.Event();
    this.OnFullScreenChanged = new Helpers.Event();

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
},{"./../helpers.js":5}],15:[function(require,module,exports){
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
},{"./../helpers.js":5}],"hammerjs":[function(require,module,exports){
/*! Hammer.JS - v2.0.4 - 2014-09-28
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2014 Jorik Tangelder;
 * Licensed under the MIT license */
!function(a,b,c,d){"use strict";function e(a,b,c){return setTimeout(k(a,c),b)}function f(a,b,c){return Array.isArray(a)?(g(a,c[b],c),!0):!1}function g(a,b,c){var e;if(a)if(a.forEach)a.forEach(b,c);else if(a.length!==d)for(e=0;e<a.length;)b.call(c,a[e],e,a),e++;else for(e in a)a.hasOwnProperty(e)&&b.call(c,a[e],e,a)}function h(a,b,c){for(var e=Object.keys(b),f=0;f<e.length;)(!c||c&&a[e[f]]===d)&&(a[e[f]]=b[e[f]]),f++;return a}function i(a,b){return h(a,b,!0)}function j(a,b,c){var d,e=b.prototype;d=a.prototype=Object.create(e),d.constructor=a,d._super=e,c&&h(d,c)}function k(a,b){return function(){return a.apply(b,arguments)}}function l(a,b){return typeof a==kb?a.apply(b?b[0]||d:d,b):a}function m(a,b){return a===d?b:a}function n(a,b,c){g(r(b),function(b){a.addEventListener(b,c,!1)})}function o(a,b,c){g(r(b),function(b){a.removeEventListener(b,c,!1)})}function p(a,b){for(;a;){if(a==b)return!0;a=a.parentNode}return!1}function q(a,b){return a.indexOf(b)>-1}function r(a){return a.trim().split(/\s+/g)}function s(a,b,c){if(a.indexOf&&!c)return a.indexOf(b);for(var d=0;d<a.length;){if(c&&a[d][c]==b||!c&&a[d]===b)return d;d++}return-1}function t(a){return Array.prototype.slice.call(a,0)}function u(a,b,c){for(var d=[],e=[],f=0;f<a.length;){var g=b?a[f][b]:a[f];s(e,g)<0&&d.push(a[f]),e[f]=g,f++}return c&&(d=b?d.sort(function(a,c){return a[b]>c[b]}):d.sort()),d}function v(a,b){for(var c,e,f=b[0].toUpperCase()+b.slice(1),g=0;g<ib.length;){if(c=ib[g],e=c?c+f:b,e in a)return e;g++}return d}function w(){return ob++}function x(a){var b=a.ownerDocument;return b.defaultView||b.parentWindow}function y(a,b){var c=this;this.manager=a,this.callback=b,this.element=a.element,this.target=a.options.inputTarget,this.domHandler=function(b){l(a.options.enable,[a])&&c.handler(b)},this.init()}function z(a){var b,c=a.options.inputClass;return new(b=c?c:rb?N:sb?Q:qb?S:M)(a,A)}function A(a,b,c){var d=c.pointers.length,e=c.changedPointers.length,f=b&yb&&d-e===0,g=b&(Ab|Bb)&&d-e===0;c.isFirst=!!f,c.isFinal=!!g,f&&(a.session={}),c.eventType=b,B(a,c),a.emit("hammer.input",c),a.recognize(c),a.session.prevInput=c}function B(a,b){var c=a.session,d=b.pointers,e=d.length;c.firstInput||(c.firstInput=E(b)),e>1&&!c.firstMultiple?c.firstMultiple=E(b):1===e&&(c.firstMultiple=!1);var f=c.firstInput,g=c.firstMultiple,h=g?g.center:f.center,i=b.center=F(d);b.timeStamp=nb(),b.deltaTime=b.timeStamp-f.timeStamp,b.angle=J(h,i),b.distance=I(h,i),C(c,b),b.offsetDirection=H(b.deltaX,b.deltaY),b.scale=g?L(g.pointers,d):1,b.rotation=g?K(g.pointers,d):0,D(c,b);var j=a.element;p(b.srcEvent.target,j)&&(j=b.srcEvent.target),b.target=j}function C(a,b){var c=b.center,d=a.offsetDelta||{},e=a.prevDelta||{},f=a.prevInput||{};(b.eventType===yb||f.eventType===Ab)&&(e=a.prevDelta={x:f.deltaX||0,y:f.deltaY||0},d=a.offsetDelta={x:c.x,y:c.y}),b.deltaX=e.x+(c.x-d.x),b.deltaY=e.y+(c.y-d.y)}function D(a,b){var c,e,f,g,h=a.lastInterval||b,i=b.timeStamp-h.timeStamp;if(b.eventType!=Bb&&(i>xb||h.velocity===d)){var j=h.deltaX-b.deltaX,k=h.deltaY-b.deltaY,l=G(i,j,k);e=l.x,f=l.y,c=mb(l.x)>mb(l.y)?l.x:l.y,g=H(j,k),a.lastInterval=b}else c=h.velocity,e=h.velocityX,f=h.velocityY,g=h.direction;b.velocity=c,b.velocityX=e,b.velocityY=f,b.direction=g}function E(a){for(var b=[],c=0;c<a.pointers.length;)b[c]={clientX:lb(a.pointers[c].clientX),clientY:lb(a.pointers[c].clientY)},c++;return{timeStamp:nb(),pointers:b,center:F(b),deltaX:a.deltaX,deltaY:a.deltaY}}function F(a){var b=a.length;if(1===b)return{x:lb(a[0].clientX),y:lb(a[0].clientY)};for(var c=0,d=0,e=0;b>e;)c+=a[e].clientX,d+=a[e].clientY,e++;return{x:lb(c/b),y:lb(d/b)}}function G(a,b,c){return{x:b/a||0,y:c/a||0}}function H(a,b){return a===b?Cb:mb(a)>=mb(b)?a>0?Db:Eb:b>0?Fb:Gb}function I(a,b,c){c||(c=Kb);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return Math.sqrt(d*d+e*e)}function J(a,b,c){c||(c=Kb);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return 180*Math.atan2(e,d)/Math.PI}function K(a,b){return J(b[1],b[0],Lb)-J(a[1],a[0],Lb)}function L(a,b){return I(b[0],b[1],Lb)/I(a[0],a[1],Lb)}function M(){this.evEl=Nb,this.evWin=Ob,this.allow=!0,this.pressed=!1,y.apply(this,arguments)}function N(){this.evEl=Rb,this.evWin=Sb,y.apply(this,arguments),this.store=this.manager.session.pointerEvents=[]}function O(){this.evTarget=Ub,this.evWin=Vb,this.started=!1,y.apply(this,arguments)}function P(a,b){var c=t(a.touches),d=t(a.changedTouches);return b&(Ab|Bb)&&(c=u(c.concat(d),"identifier",!0)),[c,d]}function Q(){this.evTarget=Xb,this.targetIds={},y.apply(this,arguments)}function R(a,b){var c=t(a.touches),d=this.targetIds;if(b&(yb|zb)&&1===c.length)return d[c[0].identifier]=!0,[c,c];var e,f,g=t(a.changedTouches),h=[],i=this.target;if(f=c.filter(function(a){return p(a.target,i)}),b===yb)for(e=0;e<f.length;)d[f[e].identifier]=!0,e++;for(e=0;e<g.length;)d[g[e].identifier]&&h.push(g[e]),b&(Ab|Bb)&&delete d[g[e].identifier],e++;return h.length?[u(f.concat(h),"identifier",!0),h]:void 0}function S(){y.apply(this,arguments);var a=k(this.handler,this);this.touch=new Q(this.manager,a),this.mouse=new M(this.manager,a)}function T(a,b){this.manager=a,this.set(b)}function U(a){if(q(a,bc))return bc;var b=q(a,cc),c=q(a,dc);return b&&c?cc+" "+dc:b||c?b?cc:dc:q(a,ac)?ac:_b}function V(a){this.id=w(),this.manager=null,this.options=i(a||{},this.defaults),this.options.enable=m(this.options.enable,!0),this.state=ec,this.simultaneous={},this.requireFail=[]}function W(a){return a&jc?"cancel":a&hc?"end":a&gc?"move":a&fc?"start":""}function X(a){return a==Gb?"down":a==Fb?"up":a==Db?"left":a==Eb?"right":""}function Y(a,b){var c=b.manager;return c?c.get(a):a}function Z(){V.apply(this,arguments)}function $(){Z.apply(this,arguments),this.pX=null,this.pY=null}function _(){Z.apply(this,arguments)}function ab(){V.apply(this,arguments),this._timer=null,this._input=null}function bb(){Z.apply(this,arguments)}function cb(){Z.apply(this,arguments)}function db(){V.apply(this,arguments),this.pTime=!1,this.pCenter=!1,this._timer=null,this._input=null,this.count=0}function eb(a,b){return b=b||{},b.recognizers=m(b.recognizers,eb.defaults.preset),new fb(a,b)}function fb(a,b){b=b||{},this.options=i(b,eb.defaults),this.options.inputTarget=this.options.inputTarget||a,this.handlers={},this.session={},this.recognizers=[],this.element=a,this.input=z(this),this.touchAction=new T(this,this.options.touchAction),gb(this,!0),g(b.recognizers,function(a){var b=this.add(new a[0](a[1]));a[2]&&b.recognizeWith(a[2]),a[3]&&b.requireFailure(a[3])},this)}function gb(a,b){var c=a.element;g(a.options.cssProps,function(a,d){c.style[v(c.style,d)]=b?a:""})}function hb(a,c){var d=b.createEvent("Event");d.initEvent(a,!0,!0),d.gesture=c,c.target.dispatchEvent(d)}var ib=["","webkit","moz","MS","ms","o"],jb=b.createElement("div"),kb="function",lb=Math.round,mb=Math.abs,nb=Date.now,ob=1,pb=/mobile|tablet|ip(ad|hone|od)|android/i,qb="ontouchstart"in a,rb=v(a,"PointerEvent")!==d,sb=qb&&pb.test(navigator.userAgent),tb="touch",ub="pen",vb="mouse",wb="kinect",xb=25,yb=1,zb=2,Ab=4,Bb=8,Cb=1,Db=2,Eb=4,Fb=8,Gb=16,Hb=Db|Eb,Ib=Fb|Gb,Jb=Hb|Ib,Kb=["x","y"],Lb=["clientX","clientY"];y.prototype={handler:function(){},init:function(){this.evEl&&n(this.element,this.evEl,this.domHandler),this.evTarget&&n(this.target,this.evTarget,this.domHandler),this.evWin&&n(x(this.element),this.evWin,this.domHandler)},destroy:function(){this.evEl&&o(this.element,this.evEl,this.domHandler),this.evTarget&&o(this.target,this.evTarget,this.domHandler),this.evWin&&o(x(this.element),this.evWin,this.domHandler)}};var Mb={mousedown:yb,mousemove:zb,mouseup:Ab},Nb="mousedown",Ob="mousemove mouseup";j(M,y,{handler:function(a){var b=Mb[a.type];b&yb&&0===a.button&&(this.pressed=!0),b&zb&&1!==a.which&&(b=Ab),this.pressed&&this.allow&&(b&Ab&&(this.pressed=!1),this.callback(this.manager,b,{pointers:[a],changedPointers:[a],pointerType:vb,srcEvent:a}))}});var Pb={pointerdown:yb,pointermove:zb,pointerup:Ab,pointercancel:Bb,pointerout:Bb},Qb={2:tb,3:ub,4:vb,5:wb},Rb="pointerdown",Sb="pointermove pointerup pointercancel";a.MSPointerEvent&&(Rb="MSPointerDown",Sb="MSPointerMove MSPointerUp MSPointerCancel"),j(N,y,{handler:function(a){var b=this.store,c=!1,d=a.type.toLowerCase().replace("ms",""),e=Pb[d],f=Qb[a.pointerType]||a.pointerType,g=f==tb,h=s(b,a.pointerId,"pointerId");e&yb&&(0===a.button||g)?0>h&&(b.push(a),h=b.length-1):e&(Ab|Bb)&&(c=!0),0>h||(b[h]=a,this.callback(this.manager,e,{pointers:b,changedPointers:[a],pointerType:f,srcEvent:a}),c&&b.splice(h,1))}});var Tb={touchstart:yb,touchmove:zb,touchend:Ab,touchcancel:Bb},Ub="touchstart",Vb="touchstart touchmove touchend touchcancel";j(O,y,{handler:function(a){var b=Tb[a.type];if(b===yb&&(this.started=!0),this.started){var c=P.call(this,a,b);b&(Ab|Bb)&&c[0].length-c[1].length===0&&(this.started=!1),this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:tb,srcEvent:a})}}});var Wb={touchstart:yb,touchmove:zb,touchend:Ab,touchcancel:Bb},Xb="touchstart touchmove touchend touchcancel";j(Q,y,{handler:function(a){var b=Wb[a.type],c=R.call(this,a,b);c&&this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:tb,srcEvent:a})}}),j(S,y,{handler:function(a,b,c){var d=c.pointerType==tb,e=c.pointerType==vb;if(d)this.mouse.allow=!1;else if(e&&!this.mouse.allow)return;b&(Ab|Bb)&&(this.mouse.allow=!0),this.callback(a,b,c)},destroy:function(){this.touch.destroy(),this.mouse.destroy()}});var Yb=v(jb.style,"touchAction"),Zb=Yb!==d,$b="compute",_b="auto",ac="manipulation",bc="none",cc="pan-x",dc="pan-y";T.prototype={set:function(a){a==$b&&(a=this.compute()),Zb&&(this.manager.element.style[Yb]=a),this.actions=a.toLowerCase().trim()},update:function(){this.set(this.manager.options.touchAction)},compute:function(){var a=[];return g(this.manager.recognizers,function(b){l(b.options.enable,[b])&&(a=a.concat(b.getTouchAction()))}),U(a.join(" "))},preventDefaults:function(a){if(!Zb){var b=a.srcEvent,c=a.offsetDirection;if(this.manager.session.prevented)return void b.preventDefault();var d=this.actions,e=q(d,bc),f=q(d,dc),g=q(d,cc);return e||f&&c&Hb||g&&c&Ib?this.preventSrc(b):void 0}},preventSrc:function(a){this.manager.session.prevented=!0,a.preventDefault()}};var ec=1,fc=2,gc=4,hc=8,ic=hc,jc=16,kc=32;V.prototype={defaults:{},set:function(a){return h(this.options,a),this.manager&&this.manager.touchAction.update(),this},recognizeWith:function(a){if(f(a,"recognizeWith",this))return this;var b=this.simultaneous;return a=Y(a,this),b[a.id]||(b[a.id]=a,a.recognizeWith(this)),this},dropRecognizeWith:function(a){return f(a,"dropRecognizeWith",this)?this:(a=Y(a,this),delete this.simultaneous[a.id],this)},requireFailure:function(a){if(f(a,"requireFailure",this))return this;var b=this.requireFail;return a=Y(a,this),-1===s(b,a)&&(b.push(a),a.requireFailure(this)),this},dropRequireFailure:function(a){if(f(a,"dropRequireFailure",this))return this;a=Y(a,this);var b=s(this.requireFail,a);return b>-1&&this.requireFail.splice(b,1),this},hasRequireFailures:function(){return this.requireFail.length>0},canRecognizeWith:function(a){return!!this.simultaneous[a.id]},emit:function(a){function b(b){c.manager.emit(c.options.event+(b?W(d):""),a)}var c=this,d=this.state;hc>d&&b(!0),b(),d>=hc&&b(!0)},tryEmit:function(a){return this.canEmit()?this.emit(a):void(this.state=kc)},canEmit:function(){for(var a=0;a<this.requireFail.length;){if(!(this.requireFail[a].state&(kc|ec)))return!1;a++}return!0},recognize:function(a){var b=h({},a);return l(this.options.enable,[this,b])?(this.state&(ic|jc|kc)&&(this.state=ec),this.state=this.process(b),void(this.state&(fc|gc|hc|jc)&&this.tryEmit(b))):(this.reset(),void(this.state=kc))},process:function(){},getTouchAction:function(){},reset:function(){}},j(Z,V,{defaults:{pointers:1},attrTest:function(a){var b=this.options.pointers;return 0===b||a.pointers.length===b},process:function(a){var b=this.state,c=a.eventType,d=b&(fc|gc),e=this.attrTest(a);return d&&(c&Bb||!e)?b|jc:d||e?c&Ab?b|hc:b&fc?b|gc:fc:kc}}),j($,Z,{defaults:{event:"pan",threshold:10,pointers:1,direction:Jb},getTouchAction:function(){var a=this.options.direction,b=[];return a&Hb&&b.push(dc),a&Ib&&b.push(cc),b},directionTest:function(a){var b=this.options,c=!0,d=a.distance,e=a.direction,f=a.deltaX,g=a.deltaY;return e&b.direction||(b.direction&Hb?(e=0===f?Cb:0>f?Db:Eb,c=f!=this.pX,d=Math.abs(a.deltaX)):(e=0===g?Cb:0>g?Fb:Gb,c=g!=this.pY,d=Math.abs(a.deltaY))),a.direction=e,c&&d>b.threshold&&e&b.direction},attrTest:function(a){return Z.prototype.attrTest.call(this,a)&&(this.state&fc||!(this.state&fc)&&this.directionTest(a))},emit:function(a){this.pX=a.deltaX,this.pY=a.deltaY;var b=X(a.direction);b&&this.manager.emit(this.options.event+b,a),this._super.emit.call(this,a)}}),j(_,Z,{defaults:{event:"pinch",threshold:0,pointers:2},getTouchAction:function(){return[bc]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.scale-1)>this.options.threshold||this.state&fc)},emit:function(a){if(this._super.emit.call(this,a),1!==a.scale){var b=a.scale<1?"in":"out";this.manager.emit(this.options.event+b,a)}}}),j(ab,V,{defaults:{event:"press",pointers:1,time:500,threshold:5},getTouchAction:function(){return[_b]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime>b.time;if(this._input=a,!d||!c||a.eventType&(Ab|Bb)&&!f)this.reset();else if(a.eventType&yb)this.reset(),this._timer=e(function(){this.state=ic,this.tryEmit()},b.time,this);else if(a.eventType&Ab)return ic;return kc},reset:function(){clearTimeout(this._timer)},emit:function(a){this.state===ic&&(a&&a.eventType&Ab?this.manager.emit(this.options.event+"up",a):(this._input.timeStamp=nb(),this.manager.emit(this.options.event,this._input)))}}),j(bb,Z,{defaults:{event:"rotate",threshold:0,pointers:2},getTouchAction:function(){return[bc]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.rotation)>this.options.threshold||this.state&fc)}}),j(cb,Z,{defaults:{event:"swipe",threshold:10,velocity:.65,direction:Hb|Ib,pointers:1},getTouchAction:function(){return $.prototype.getTouchAction.call(this)},attrTest:function(a){var b,c=this.options.direction;return c&(Hb|Ib)?b=a.velocity:c&Hb?b=a.velocityX:c&Ib&&(b=a.velocityY),this._super.attrTest.call(this,a)&&c&a.direction&&a.distance>this.options.threshold&&mb(b)>this.options.velocity&&a.eventType&Ab},emit:function(a){var b=X(a.direction);b&&this.manager.emit(this.options.event+b,a),this.manager.emit(this.options.event,a)}}),j(db,V,{defaults:{event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:2,posThreshold:10},getTouchAction:function(){return[ac]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime<b.time;if(this.reset(),a.eventType&yb&&0===this.count)return this.failTimeout();if(d&&f&&c){if(a.eventType!=Ab)return this.failTimeout();var g=this.pTime?a.timeStamp-this.pTime<b.interval:!0,h=!this.pCenter||I(this.pCenter,a.center)<b.posThreshold;this.pTime=a.timeStamp,this.pCenter=a.center,h&&g?this.count+=1:this.count=1,this._input=a;var i=this.count%b.taps;if(0===i)return this.hasRequireFailures()?(this._timer=e(function(){this.state=ic,this.tryEmit()},b.interval,this),fc):ic}return kc},failTimeout:function(){return this._timer=e(function(){this.state=kc},this.options.interval,this),kc},reset:function(){clearTimeout(this._timer)},emit:function(){this.state==ic&&(this._input.tapCount=this.count,this.manager.emit(this.options.event,this._input))}}),eb.VERSION="2.0.4",eb.defaults={domEvents:!1,touchAction:$b,enable:!0,inputTarget:null,inputClass:null,preset:[[bb,{enable:!1}],[_,{enable:!1},["rotate"]],[cb,{direction:Hb}],[$,{direction:Hb},["swipe"]],[db],[db,{event:"doubletap",taps:2},["tap"]],[ab]],cssProps:{userSelect:"none",touchSelect:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}};var lc=1,mc=2;fb.prototype={set:function(a){return h(this.options,a),a.touchAction&&this.touchAction.update(),a.inputTarget&&(this.input.destroy(),this.input.target=a.inputTarget,this.input.init()),this},stop:function(a){this.session.stopped=a?mc:lc},recognize:function(a){var b=this.session;if(!b.stopped){this.touchAction.preventDefaults(a);var c,d=this.recognizers,e=b.curRecognizer;(!e||e&&e.state&ic)&&(e=b.curRecognizer=null);for(var f=0;f<d.length;)c=d[f],b.stopped===mc||e&&c!=e&&!c.canRecognizeWith(e)?c.reset():c.recognize(a),!e&&c.state&(fc|gc|hc)&&(e=b.curRecognizer=c),f++}},get:function(a){if(a instanceof V)return a;for(var b=this.recognizers,c=0;c<b.length;c++)if(b[c].options.event==a)return b[c];return null},add:function(a){if(f(a,"add",this))return this;var b=this.get(a.options.event);return b&&this.remove(b),this.recognizers.push(a),a.manager=this,this.touchAction.update(),a},remove:function(a){if(f(a,"remove",this))return this;var b=this.recognizers;return a=this.get(a),b.splice(s(b,a),1),this.touchAction.update(),this},on:function(a,b){var c=this.handlers;return g(r(a),function(a){c[a]=c[a]||[],c[a].push(b)}),this},off:function(a,b){var c=this.handlers;return g(r(a),function(a){b?c[a].splice(s(c[a],b),1):delete c[a]}),this},emit:function(a,b){this.options.domEvents&&hb(a,b);var c=this.handlers[a]&&this.handlers[a].slice();if(c&&c.length){b.type=a,b.preventDefault=function(){b.srcEvent.preventDefault()};for(var d=0;d<c.length;)c[d](b),d++}},destroy:function(){this.element&&gb(this,!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}},h(eb,{INPUT_START:yb,INPUT_MOVE:zb,INPUT_END:Ab,INPUT_CANCEL:Bb,STATE_POSSIBLE:ec,STATE_BEGAN:fc,STATE_CHANGED:gc,STATE_ENDED:hc,STATE_RECOGNIZED:ic,STATE_CANCELLED:jc,STATE_FAILED:kc,DIRECTION_NONE:Cb,DIRECTION_LEFT:Db,DIRECTION_RIGHT:Eb,DIRECTION_UP:Fb,DIRECTION_DOWN:Gb,DIRECTION_HORIZONTAL:Hb,DIRECTION_VERTICAL:Ib,DIRECTION_ALL:Jb,Manager:fb,Input:y,TouchAction:T,TouchInput:Q,MouseInput:M,PointerEventInput:N,TouchMouseInput:S,SingleTouchInput:O,Recognizer:V,AttrRecognizer:Z,Tap:db,Pan:$,Swipe:cb,Pinch:_,Rotate:bb,Press:ab,on:n,off:o,each:g,merge:i,extend:h,inherit:j,bindFn:k,prefixed:v}),typeof define==kb&&define.amd?define(function(){return eb}):"undefined"!=typeof module&&module.exports?module.exports=eb:a[c]=eb}(window,document,"Hammer");

},{}],"imagesloaded":[function(require,module,exports){
/*!
 * imagesLoaded PACKAGED v3.2.0
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

(function(){"use strict";function e(){}function t(e,t){for(var n=e.length;n--;)if(e[n].listener===t)return n;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var i=e.prototype,r=this,s=r.EventEmitter;i.getListeners=function(e){var t,n,i=this._getEvents();if("object"==typeof e){t={};for(n in i)i.hasOwnProperty(n)&&e.test(n)&&(t[n]=i[n])}else t=i[e]||(i[e]=[]);return t},i.flattenListeners=function(e){var t,n=[];for(t=0;t<e.length;t+=1)n.push(e[t].listener);return n},i.getListenersAsObject=function(e){var t,n=this.getListeners(e);return n instanceof Array&&(t={},t[e]=n),t||n},i.addListener=function(e,n){var i,r=this.getListenersAsObject(e),s="object"==typeof n;for(i in r)r.hasOwnProperty(i)&&-1===t(r[i],n)&&r[i].push(s?n:{listener:n,once:!1});return this},i.on=n("addListener"),i.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},i.once=n("addOnceListener"),i.defineEvent=function(e){return this.getListeners(e),this},i.defineEvents=function(e){for(var t=0;t<e.length;t+=1)this.defineEvent(e[t]);return this},i.removeListener=function(e,n){var i,r,s=this.getListenersAsObject(e);for(r in s)s.hasOwnProperty(r)&&(i=t(s[r],n),-1!==i&&s[r].splice(i,1));return this},i.off=n("removeListener"),i.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},i.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},i.manipulateListeners=function(e,t,n){var i,r,s=e?this.removeListener:this.addListener,o=e?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(i=n.length;i--;)s.call(this,t,n[i]);else for(i in t)t.hasOwnProperty(i)&&(r=t[i])&&("function"==typeof r?s.call(this,i,r):o.call(this,i,r));return this},i.removeEvent=function(e){var t,n=typeof e,i=this._getEvents();if("string"===n)delete i[e];else if("object"===n)for(t in i)i.hasOwnProperty(t)&&e.test(t)&&delete i[t];else delete this._events;return this},i.removeAllListeners=n("removeEvent"),i.emitEvent=function(e,t){var n,i,r,s,o=this.getListenersAsObject(e);for(r in o)if(o.hasOwnProperty(r))for(i=o[r].length;i--;)n=o[r][i],n.once===!0&&this.removeListener(e,n.listener),s=n.listener.apply(this,t||[]),s===this._getOnceReturnValue()&&this.removeListener(e,n.listener);return this},i.trigger=n("emitEvent"),i.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},i.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},i._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},i._getEvents=function(){return this._events||(this._events={})},e.noConflict=function(){return r.EventEmitter=s,e},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return e}):"object"==typeof module&&module.exports?module.exports=e:this.EventEmitter=e}).call(this),function(e){function t(t){var n=e.event;return n.target=n.target||n.srcElement||t,n}var n=document.documentElement,i=function(){};n.addEventListener?i=function(e,t,n){e.addEventListener(t,n,!1)}:n.attachEvent&&(i=function(e,n,i){e[n+i]=i.handleEvent?function(){var n=t(e);i.handleEvent.call(i,n)}:function(){var n=t(e);i.call(e,n)},e.attachEvent("on"+n,e[n+i])});var r=function(){};n.removeEventListener?r=function(e,t,n){e.removeEventListener(t,n,!1)}:n.detachEvent&&(r=function(e,t,n){e.detachEvent("on"+t,e[t+n]);try{delete e[t+n]}catch(i){e[t+n]=void 0}});var s={bind:i,unbind:r};"function"==typeof define&&define.amd?define("eventie/eventie",s):e.eventie=s}(this),function(e,t){"use strict";"function"==typeof define&&define.amd?define(["eventEmitter/EventEmitter","eventie/eventie"],function(n,i){return t(e,n,i)}):"object"==typeof module&&module.exports?module.exports=t(e,require("wolfy87-eventemitter"),require("eventie")):e.imagesLoaded=t(e,e.EventEmitter,e.eventie)}(window,function(e,t,n){function i(e,t){for(var n in t)e[n]=t[n];return e}function r(e){return"[object Array]"==f.call(e)}function s(e){var t=[];if(r(e))t=e;else if("number"==typeof e.length)for(var n=0;n<e.length;n++)t.push(e[n]);else t.push(e);return t}function o(e,t,n){if(!(this instanceof o))return new o(e,t,n);"string"==typeof e&&(e=document.querySelectorAll(e)),this.elements=s(e),this.options=i({},this.options),"function"==typeof t?n=t:i(this.options,t),n&&this.on("always",n),this.getImages(),u&&(this.jqDeferred=new u.Deferred);var r=this;setTimeout(function(){r.check()})}function h(e){this.img=e}function a(e,t){this.url=e,this.element=t,this.img=new Image}var u=e.jQuery,c=e.console,f=Object.prototype.toString;o.prototype=new t,o.prototype.options={},o.prototype.getImages=function(){this.images=[];for(var e=0;e<this.elements.length;e++){var t=this.elements[e];this.addElementImages(t)}},o.prototype.addElementImages=function(e){"IMG"==e.nodeName&&this.addImage(e),this.options.background===!0&&this.addElementBackgroundImages(e);var t=e.nodeType;if(t&&d[t]){for(var n=e.querySelectorAll("img"),i=0;i<n.length;i++){var r=n[i];this.addImage(r)}if("string"==typeof this.options.background){var s=e.querySelectorAll(this.options.background);for(i=0;i<s.length;i++){var o=s[i];this.addElementBackgroundImages(o)}}}};var d={1:!0,9:!0,11:!0};o.prototype.addElementBackgroundImages=function(e){for(var t=m(e),n=/url\(['"]*([^'"\)]+)['"]*\)/gi,i=n.exec(t.backgroundImage);null!==i;){var r=i&&i[1];r&&this.addBackground(r,e),i=n.exec(t.backgroundImage)}};var m=e.getComputedStyle||function(e){return e.currentStyle};return o.prototype.addImage=function(e){var t=new h(e);this.images.push(t)},o.prototype.addBackground=function(e,t){var n=new a(e,t);this.images.push(n)},o.prototype.check=function(){function e(e,n,i){setTimeout(function(){t.progress(e,n,i)})}var t=this;if(this.progressedCount=0,this.hasAnyBroken=!1,!this.images.length)return void this.complete();for(var n=0;n<this.images.length;n++){var i=this.images[n];i.once("progress",e),i.check()}},o.prototype.progress=function(e,t,n){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded,this.emit("progress",this,e,t),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,e),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&c&&c.log("progress: "+n,e,t)},o.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emit(e,this),this.emit("always",this),this.jqDeferred){var t=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[t](this)}},h.prototype=new t,h.prototype.check=function(){var e=this.getIsImageComplete();return e?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,n.bind(this.proxyImage,"load",this),n.bind(this.proxyImage,"error",this),n.bind(this.img,"load",this),n.bind(this.img,"error",this),void(this.proxyImage.src=this.img.src))},h.prototype.getIsImageComplete=function(){return this.img.complete&&void 0!==this.img.naturalWidth},h.prototype.confirm=function(e,t){this.isLoaded=e,this.emit("progress",this,this.img,t)},h.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},h.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},h.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},h.prototype.unbindEvents=function(){n.unbind(this.proxyImage,"load",this),n.unbind(this.proxyImage,"error",this),n.unbind(this.img,"load",this),n.unbind(this.img,"error",this)},a.prototype=new h,a.prototype.check=function(){n.bind(this.img,"load",this),n.bind(this.img,"error",this),this.img.src=this.url;var e=this.getIsImageComplete();e&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},a.prototype.unbindEvents=function(){n.unbind(this.img,"load",this),n.unbind(this.img,"error",this)},a.prototype.confirm=function(e,t){this.isLoaded=e,this.emit("progress",this,this.element,t)},o.makeJQueryPlugin=function(t){t=t||e.jQuery,t&&(u=t,u.fn.imagesLoaded=function(e,t){var n=new o(this,e,t);return n.jqDeferred.promise(u(this))})},o.makeJQueryPlugin(),o});
},{"eventie":1,"wolfy87-eventemitter":2}],"screenfull":[function(require,module,exports){
/*!
* screenfull
* v2.0.0 - 2014-12-22
* (c) Sindre Sorhus; MIT License
*/
(function () {
	'use strict';

	var isCommonjs = typeof module !== 'undefined' && module.exports;
	var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

	var fn = (function () {
		var val;
		var valLength;

		var fnMap = [
			[
				'requestFullscreen',
				'exitFullscreen',
				'fullscreenElement',
				'fullscreenEnabled',
				'fullscreenchange',
				'fullscreenerror'
			],
			// new WebKit
			[
				'webkitRequestFullscreen',
				'webkitExitFullscreen',
				'webkitFullscreenElement',
				'webkitFullscreenEnabled',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			// old WebKit (Safari 5.1)
			[
				'webkitRequestFullScreen',
				'webkitCancelFullScreen',
				'webkitCurrentFullScreenElement',
				'webkitCancelFullScreen',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			[
				'mozRequestFullScreen',
				'mozCancelFullScreen',
				'mozFullScreenElement',
				'mozFullScreenEnabled',
				'mozfullscreenchange',
				'mozfullscreenerror'
			],
			[
				'msRequestFullscreen',
				'msExitFullscreen',
				'msFullscreenElement',
				'msFullscreenEnabled',
				'MSFullscreenChange',
				'MSFullscreenError'
			]
		];

		var i = 0;
		var l = fnMap.length;
		var ret = {};

		for (; i < l; i++) {
			val = fnMap[i];
			if (val && val[1] in document) {
				for (i = 0, valLength = val.length; i < valLength; i++) {
					ret[fnMap[0][i]] = val[i];
				}
				return ret;
			}
		}

		return false;
	})();

	var screenfull = {
		request: function (elem) {
			var request = fn.requestFullscreen;

			elem = elem || document.documentElement;

			// Work around Safari 5.1 bug: reports support for
			// keyboard in fullscreen even though it doesn't.
			// Browser sniffing, since the alternative with
			// setTimeout is even worse.
			if (/5\.1[\.\d]* Safari/.test(navigator.userAgent)) {
				elem[request]();
			} else {
				elem[request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);
			}
		},
		exit: function () {
			document[fn.exitFullscreen]();
		},
		toggle: function (elem) {
			if (this.isFullscreen) {
				this.exit();
			} else {
				this.request(elem);
			}
		},
		raw: fn
	};

	if (!fn) {
		if (isCommonjs) {
			module.exports = false;
		} else {
			window.screenfull = false;
		}

		return;
	}

	Object.defineProperties(screenfull, {
		isFullscreen: {
			get: function () {
				return !!document[fn.fullscreenElement];
			}
		},
		element: {
			enumerable: true,
			get: function () {
				return document[fn.fullscreenElement];
			}
		},
		enabled: {
			enumerable: true,
			get: function () {
				// Coerce to boolean in case of old WebKit
				return !!document[fn.fullscreenEnabled];
			}
		}
	});

	if (isCommonjs) {
		module.exports = screenfull;
	} else {
		window.screenfull = screenfull;
	}
})();

},{}],"velocity":[function(require,module,exports){
/*! VelocityJS.org (1.2.3). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License */
/*! VelocityJS.org jQuery Shim (1.0.1). (C) 2014 The jQuery Foundation. MIT @license: en.wikipedia.org/wiki/MIT_License. */
!function(a){function b(a){var b=a.length,d=c.type(a);return"function"===d||c.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===d||0===b||"number"==typeof b&&b>0&&b-1 in a}if(!a.jQuery){var c=function(a,b){return new c.fn.init(a,b)};c.isWindow=function(a){return null!=a&&a==a.window},c.type=function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?e[g.call(a)]||"object":typeof a},c.isArray=Array.isArray||function(a){return"array"===c.type(a)},c.isPlainObject=function(a){var b;if(!a||"object"!==c.type(a)||a.nodeType||c.isWindow(a))return!1;try{if(a.constructor&&!f.call(a,"constructor")&&!f.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(d){return!1}for(b in a);return void 0===b||f.call(a,b)},c.each=function(a,c,d){var e,f=0,g=a.length,h=b(a);if(d){if(h)for(;g>f&&(e=c.apply(a[f],d),e!==!1);f++);else for(f in a)if(e=c.apply(a[f],d),e===!1)break}else if(h)for(;g>f&&(e=c.call(a[f],f,a[f]),e!==!1);f++);else for(f in a)if(e=c.call(a[f],f,a[f]),e===!1)break;return a},c.data=function(a,b,e){if(void 0===e){var f=a[c.expando],g=f&&d[f];if(void 0===b)return g;if(g&&b in g)return g[b]}else if(void 0!==b){var f=a[c.expando]||(a[c.expando]=++c.uuid);return d[f]=d[f]||{},d[f][b]=e,e}},c.removeData=function(a,b){var e=a[c.expando],f=e&&d[e];f&&c.each(b,function(a,b){delete f[b]})},c.extend=function(){var a,b,d,e,f,g,h=arguments[0]||{},i=1,j=arguments.length,k=!1;for("boolean"==typeof h&&(k=h,h=arguments[i]||{},i++),"object"!=typeof h&&"function"!==c.type(h)&&(h={}),i===j&&(h=this,i--);j>i;i++)if(null!=(f=arguments[i]))for(e in f)a=h[e],d=f[e],h!==d&&(k&&d&&(c.isPlainObject(d)||(b=c.isArray(d)))?(b?(b=!1,g=a&&c.isArray(a)?a:[]):g=a&&c.isPlainObject(a)?a:{},h[e]=c.extend(k,g,d)):void 0!==d&&(h[e]=d));return h},c.queue=function(a,d,e){function f(a,c){var d=c||[];return null!=a&&(b(Object(a))?!function(a,b){for(var c=+b.length,d=0,e=a.length;c>d;)a[e++]=b[d++];if(c!==c)for(;void 0!==b[d];)a[e++]=b[d++];return a.length=e,a}(d,"string"==typeof a?[a]:a):[].push.call(d,a)),d}if(a){d=(d||"fx")+"queue";var g=c.data(a,d);return e?(!g||c.isArray(e)?g=c.data(a,d,f(e)):g.push(e),g):g||[]}},c.dequeue=function(a,b){c.each(a.nodeType?[a]:a,function(a,d){b=b||"fx";var e=c.queue(d,b),f=e.shift();"inprogress"===f&&(f=e.shift()),f&&("fx"===b&&e.unshift("inprogress"),f.call(d,function(){c.dequeue(d,b)}))})},c.fn=c.prototype={init:function(a){if(a.nodeType)return this[0]=a,this;throw new Error("Not a DOM node.")},offset:function(){var b=this[0].getBoundingClientRect?this[0].getBoundingClientRect():{top:0,left:0};return{top:b.top+(a.pageYOffset||document.scrollTop||0)-(document.clientTop||0),left:b.left+(a.pageXOffset||document.scrollLeft||0)-(document.clientLeft||0)}},position:function(){function a(){for(var a=this.offsetParent||document;a&&"html"===!a.nodeType.toLowerCase&&"static"===a.style.position;)a=a.offsetParent;return a||document}var b=this[0],a=a.apply(b),d=this.offset(),e=/^(?:body|html)$/i.test(a.nodeName)?{top:0,left:0}:c(a).offset();return d.top-=parseFloat(b.style.marginTop)||0,d.left-=parseFloat(b.style.marginLeft)||0,a.style&&(e.top+=parseFloat(a.style.borderTopWidth)||0,e.left+=parseFloat(a.style.borderLeftWidth)||0),{top:d.top-e.top,left:d.left-e.left}}};var d={};c.expando="velocity"+(new Date).getTime(),c.uuid=0;for(var e={},f=e.hasOwnProperty,g=e.toString,h="Boolean Number String Function Array Date RegExp Object Error".split(" "),i=0;i<h.length;i++)e["[object "+h[i]+"]"]=h[i].toLowerCase();c.fn.init.prototype=c.fn,a.Velocity={Utilities:c}}}(window),function(a){"object"==typeof module&&"object"==typeof module.exports?module.exports=a():"function"==typeof define&&define.amd?define(a):a()}(function(){return function(a,b,c,d){function e(a){for(var b=-1,c=a?a.length:0,d=[];++b<c;){var e=a[b];e&&d.push(e)}return d}function f(a){return p.isWrapped(a)?a=[].slice.call(a):p.isNode(a)&&(a=[a]),a}function g(a){var b=m.data(a,"velocity");return null===b?d:b}function h(a){return function(b){return Math.round(b*a)*(1/a)}}function i(a,c,d,e){function f(a,b){return 1-3*b+3*a}function g(a,b){return 3*b-6*a}function h(a){return 3*a}function i(a,b,c){return((f(b,c)*a+g(b,c))*a+h(b))*a}function j(a,b,c){return 3*f(b,c)*a*a+2*g(b,c)*a+h(b)}function k(b,c){for(var e=0;p>e;++e){var f=j(c,a,d);if(0===f)return c;var g=i(c,a,d)-b;c-=g/f}return c}function l(){for(var b=0;t>b;++b)x[b]=i(b*u,a,d)}function m(b,c,e){var f,g,h=0;do g=c+(e-c)/2,f=i(g,a,d)-b,f>0?e=g:c=g;while(Math.abs(f)>r&&++h<s);return g}function n(b){for(var c=0,e=1,f=t-1;e!=f&&x[e]<=b;++e)c+=u;--e;var g=(b-x[e])/(x[e+1]-x[e]),h=c+g*u,i=j(h,a,d);return i>=q?k(b,h):0==i?h:m(b,c,c+u)}function o(){y=!0,(a!=c||d!=e)&&l()}var p=4,q=.001,r=1e-7,s=10,t=11,u=1/(t-1),v="Float32Array"in b;if(4!==arguments.length)return!1;for(var w=0;4>w;++w)if("number"!=typeof arguments[w]||isNaN(arguments[w])||!isFinite(arguments[w]))return!1;a=Math.min(a,1),d=Math.min(d,1),a=Math.max(a,0),d=Math.max(d,0);var x=v?new Float32Array(t):new Array(t),y=!1,z=function(b){return y||o(),a===c&&d===e?b:0===b?0:1===b?1:i(n(b),c,e)};z.getControlPoints=function(){return[{x:a,y:c},{x:d,y:e}]};var A="generateBezier("+[a,c,d,e]+")";return z.toString=function(){return A},z}function j(a,b){var c=a;return p.isString(a)?t.Easings[a]||(c=!1):c=p.isArray(a)&&1===a.length?h.apply(null,a):p.isArray(a)&&2===a.length?u.apply(null,a.concat([b])):p.isArray(a)&&4===a.length?i.apply(null,a):!1,c===!1&&(c=t.Easings[t.defaults.easing]?t.defaults.easing:s),c}function k(a){if(a){var b=(new Date).getTime(),c=t.State.calls.length;c>1e4&&(t.State.calls=e(t.State.calls));for(var f=0;c>f;f++)if(t.State.calls[f]){var h=t.State.calls[f],i=h[0],j=h[2],n=h[3],o=!!n,q=null;n||(n=t.State.calls[f][3]=b-16);for(var r=Math.min((b-n)/j.duration,1),s=0,u=i.length;u>s;s++){var w=i[s],y=w.element;if(g(y)){var z=!1;if(j.display!==d&&null!==j.display&&"none"!==j.display){if("flex"===j.display){var A=["-webkit-box","-moz-box","-ms-flexbox","-webkit-flex"];m.each(A,function(a,b){v.setPropertyValue(y,"display",b)})}v.setPropertyValue(y,"display",j.display)}j.visibility!==d&&"hidden"!==j.visibility&&v.setPropertyValue(y,"visibility",j.visibility);for(var B in w)if("element"!==B){var C,D=w[B],E=p.isString(D.easing)?t.Easings[D.easing]:D.easing;if(1===r)C=D.endValue;else{var F=D.endValue-D.startValue;if(C=D.startValue+F*E(r,j,F),!o&&C===D.currentValue)continue}if(D.currentValue=C,"tween"===B)q=C;else{if(v.Hooks.registered[B]){var G=v.Hooks.getRoot(B),H=g(y).rootPropertyValueCache[G];H&&(D.rootPropertyValue=H)}var I=v.setPropertyValue(y,B,D.currentValue+(0===parseFloat(C)?"":D.unitType),D.rootPropertyValue,D.scrollData);v.Hooks.registered[B]&&(g(y).rootPropertyValueCache[G]=v.Normalizations.registered[G]?v.Normalizations.registered[G]("extract",null,I[1]):I[1]),"transform"===I[0]&&(z=!0)}}j.mobileHA&&g(y).transformCache.translate3d===d&&(g(y).transformCache.translate3d="(0px, 0px, 0px)",z=!0),z&&v.flushTransformCache(y)}}j.display!==d&&"none"!==j.display&&(t.State.calls[f][2].display=!1),j.visibility!==d&&"hidden"!==j.visibility&&(t.State.calls[f][2].visibility=!1),j.progress&&j.progress.call(h[1],h[1],r,Math.max(0,n+j.duration-b),n,q),1===r&&l(f)}}t.State.isTicking&&x(k)}function l(a,b){if(!t.State.calls[a])return!1;for(var c=t.State.calls[a][0],e=t.State.calls[a][1],f=t.State.calls[a][2],h=t.State.calls[a][4],i=!1,j=0,k=c.length;k>j;j++){var l=c[j].element;if(b||f.loop||("none"===f.display&&v.setPropertyValue(l,"display",f.display),"hidden"===f.visibility&&v.setPropertyValue(l,"visibility",f.visibility)),f.loop!==!0&&(m.queue(l)[1]===d||!/\.velocityQueueEntryFlag/i.test(m.queue(l)[1]))&&g(l)){g(l).isAnimating=!1,g(l).rootPropertyValueCache={};var n=!1;m.each(v.Lists.transforms3D,function(a,b){var c=/^scale/.test(b)?1:0,e=g(l).transformCache[b];g(l).transformCache[b]!==d&&new RegExp("^\\("+c+"[^.]").test(e)&&(n=!0,delete g(l).transformCache[b])}),f.mobileHA&&(n=!0,delete g(l).transformCache.translate3d),n&&v.flushTransformCache(l),v.Values.removeClass(l,"velocity-animating")}if(!b&&f.complete&&!f.loop&&j===k-1)try{f.complete.call(e,e)}catch(o){setTimeout(function(){throw o},1)}h&&f.loop!==!0&&h(e),g(l)&&f.loop===!0&&!b&&(m.each(g(l).tweensContainer,function(a,b){/^rotate/.test(a)&&360===parseFloat(b.endValue)&&(b.endValue=0,b.startValue=360),/^backgroundPosition/.test(a)&&100===parseFloat(b.endValue)&&"%"===b.unitType&&(b.endValue=0,b.startValue=100)}),t(l,"reverse",{loop:!0,delay:f.delay})),f.queue!==!1&&m.dequeue(l,f.queue)}t.State.calls[a]=!1;for(var p=0,q=t.State.calls.length;q>p;p++)if(t.State.calls[p]!==!1){i=!0;break}i===!1&&(t.State.isTicking=!1,delete t.State.calls,t.State.calls=[])}var m,n=function(){if(c.documentMode)return c.documentMode;for(var a=7;a>4;a--){var b=c.createElement("div");if(b.innerHTML="<!--[if IE "+a+"]><span></span><![endif]-->",b.getElementsByTagName("span").length)return b=null,a}return d}(),o=function(){var a=0;return b.webkitRequestAnimationFrame||b.mozRequestAnimationFrame||function(b){var c,d=(new Date).getTime();return c=Math.max(0,16-(d-a)),a=d+c,setTimeout(function(){b(d+c)},c)}}(),p={isString:function(a){return"string"==typeof a},isArray:Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)},isFunction:function(a){return"[object Function]"===Object.prototype.toString.call(a)},isNode:function(a){return a&&a.nodeType},isNodeList:function(a){return"object"==typeof a&&/^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(a))&&a.length!==d&&(0===a.length||"object"==typeof a[0]&&a[0].nodeType>0)},isWrapped:function(a){return a&&(a.jquery||b.Zepto&&b.Zepto.zepto.isZ(a))},isSVG:function(a){return b.SVGElement&&a instanceof b.SVGElement},isEmptyObject:function(a){for(var b in a)return!1;return!0}},q=!1;if(a.fn&&a.fn.jquery?(m=a,q=!0):m=b.Velocity.Utilities,8>=n&&!q)throw new Error("Velocity: IE8 and below require jQuery to be loaded before Velocity.");if(7>=n)return void(jQuery.fn.velocity=jQuery.fn.animate);var r=400,s="swing",t={State:{isMobile:/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),isAndroid:/Android/i.test(navigator.userAgent),isGingerbread:/Android 2\.3\.[3-7]/i.test(navigator.userAgent),isChrome:b.chrome,isFirefox:/Firefox/i.test(navigator.userAgent),prefixElement:c.createElement("div"),prefixMatches:{},scrollAnchor:null,scrollPropertyLeft:null,scrollPropertyTop:null,isTicking:!1,calls:[]},CSS:{},Utilities:m,Redirects:{},Easings:{},Promise:b.Promise,defaults:{queue:"",duration:r,easing:s,begin:d,complete:d,progress:d,display:d,visibility:d,loop:!1,delay:!1,mobileHA:!0,_cacheValues:!0},init:function(a){m.data(a,"velocity",{isSVG:p.isSVG(a),isAnimating:!1,computedStyle:null,tweensContainer:null,rootPropertyValueCache:{},transformCache:{}})},hook:null,mock:!1,version:{major:1,minor:2,patch:2},debug:!1};b.pageYOffset!==d?(t.State.scrollAnchor=b,t.State.scrollPropertyLeft="pageXOffset",t.State.scrollPropertyTop="pageYOffset"):(t.State.scrollAnchor=c.documentElement||c.body.parentNode||c.body,t.State.scrollPropertyLeft="scrollLeft",t.State.scrollPropertyTop="scrollTop");var u=function(){function a(a){return-a.tension*a.x-a.friction*a.v}function b(b,c,d){var e={x:b.x+d.dx*c,v:b.v+d.dv*c,tension:b.tension,friction:b.friction};return{dx:e.v,dv:a(e)}}function c(c,d){var e={dx:c.v,dv:a(c)},f=b(c,.5*d,e),g=b(c,.5*d,f),h=b(c,d,g),i=1/6*(e.dx+2*(f.dx+g.dx)+h.dx),j=1/6*(e.dv+2*(f.dv+g.dv)+h.dv);return c.x=c.x+i*d,c.v=c.v+j*d,c}return function d(a,b,e){var f,g,h,i={x:-1,v:0,tension:null,friction:null},j=[0],k=0,l=1e-4,m=.016;for(a=parseFloat(a)||500,b=parseFloat(b)||20,e=e||null,i.tension=a,i.friction=b,f=null!==e,f?(k=d(a,b),g=k/e*m):g=m;;)if(h=c(h||i,g),j.push(1+h.x),k+=16,!(Math.abs(h.x)>l&&Math.abs(h.v)>l))break;return f?function(a){return j[a*(j.length-1)|0]}:k}}();t.Easings={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2},spring:function(a){return 1-Math.cos(4.5*a*Math.PI)*Math.exp(6*-a)}},m.each([["ease",[.25,.1,.25,1]],["ease-in",[.42,0,1,1]],["ease-out",[0,0,.58,1]],["ease-in-out",[.42,0,.58,1]],["easeInSine",[.47,0,.745,.715]],["easeOutSine",[.39,.575,.565,1]],["easeInOutSine",[.445,.05,.55,.95]],["easeInQuad",[.55,.085,.68,.53]],["easeOutQuad",[.25,.46,.45,.94]],["easeInOutQuad",[.455,.03,.515,.955]],["easeInCubic",[.55,.055,.675,.19]],["easeOutCubic",[.215,.61,.355,1]],["easeInOutCubic",[.645,.045,.355,1]],["easeInQuart",[.895,.03,.685,.22]],["easeOutQuart",[.165,.84,.44,1]],["easeInOutQuart",[.77,0,.175,1]],["easeInQuint",[.755,.05,.855,.06]],["easeOutQuint",[.23,1,.32,1]],["easeInOutQuint",[.86,0,.07,1]],["easeInExpo",[.95,.05,.795,.035]],["easeOutExpo",[.19,1,.22,1]],["easeInOutExpo",[1,0,0,1]],["easeInCirc",[.6,.04,.98,.335]],["easeOutCirc",[.075,.82,.165,1]],["easeInOutCirc",[.785,.135,.15,.86]]],function(a,b){t.Easings[b[0]]=i.apply(null,b[1])});var v=t.CSS={RegEx:{isHex:/^#([A-f\d]{3}){1,2}$/i,valueUnwrap:/^[A-z]+\((.*)\)$/i,wrappedValueAlreadyExtracted:/[0-9.]+ [0-9.]+ [0-9.]+( [0-9.]+)?/,valueSplit:/([A-z]+\(.+\))|(([A-z0-9#-.]+?)(?=\s|$))/gi},Lists:{colors:["fill","stroke","stopColor","color","backgroundColor","borderColor","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor","outlineColor"],transformsBase:["translateX","translateY","scale","scaleX","scaleY","skewX","skewY","rotateZ"],transforms3D:["transformPerspective","translateZ","scaleZ","rotateX","rotateY"]},Hooks:{templates:{textShadow:["Color X Y Blur","black 0px 0px 0px"],boxShadow:["Color X Y Blur Spread","black 0px 0px 0px 0px"],clip:["Top Right Bottom Left","0px 0px 0px 0px"],backgroundPosition:["X Y","0% 0%"],transformOrigin:["X Y Z","50% 50% 0px"],perspectiveOrigin:["X Y","50% 50%"]},registered:{},register:function(){for(var a=0;a<v.Lists.colors.length;a++){var b="color"===v.Lists.colors[a]?"0 0 0 1":"255 255 255 1";v.Hooks.templates[v.Lists.colors[a]]=["Red Green Blue Alpha",b]}var c,d,e;if(n)for(c in v.Hooks.templates){d=v.Hooks.templates[c],e=d[0].split(" ");var f=d[1].match(v.RegEx.valueSplit);"Color"===e[0]&&(e.push(e.shift()),f.push(f.shift()),v.Hooks.templates[c]=[e.join(" "),f.join(" ")])}for(c in v.Hooks.templates){d=v.Hooks.templates[c],e=d[0].split(" ");for(var a in e){var g=c+e[a],h=a;v.Hooks.registered[g]=[c,h]}}},getRoot:function(a){var b=v.Hooks.registered[a];return b?b[0]:a},cleanRootPropertyValue:function(a,b){return v.RegEx.valueUnwrap.test(b)&&(b=b.match(v.RegEx.valueUnwrap)[1]),v.Values.isCSSNullValue(b)&&(b=v.Hooks.templates[a][1]),b},extractValue:function(a,b){var c=v.Hooks.registered[a];if(c){var d=c[0],e=c[1];return b=v.Hooks.cleanRootPropertyValue(d,b),b.toString().match(v.RegEx.valueSplit)[e]}return b},injectValue:function(a,b,c){var d=v.Hooks.registered[a];if(d){var e,f,g=d[0],h=d[1];return c=v.Hooks.cleanRootPropertyValue(g,c),e=c.toString().match(v.RegEx.valueSplit),e[h]=b,f=e.join(" ")}return c}},Normalizations:{registered:{clip:function(a,b,c){switch(a){case"name":return"clip";case"extract":var d;return v.RegEx.wrappedValueAlreadyExtracted.test(c)?d=c:(d=c.toString().match(v.RegEx.valueUnwrap),d=d?d[1].replace(/,(\s+)?/g," "):c),d;case"inject":return"rect("+c+")"}},blur:function(a,b,c){switch(a){case"name":return t.State.isFirefox?"filter":"-webkit-filter";case"extract":var d=parseFloat(c);if(!d&&0!==d){var e=c.toString().match(/blur\(([0-9]+[A-z]+)\)/i);d=e?e[1]:0}return d;case"inject":return parseFloat(c)?"blur("+c+")":"none"}},opacity:function(a,b,c){if(8>=n)switch(a){case"name":return"filter";case"extract":var d=c.toString().match(/alpha\(opacity=(.*)\)/i);return c=d?d[1]/100:1;case"inject":return b.style.zoom=1,parseFloat(c)>=1?"":"alpha(opacity="+parseInt(100*parseFloat(c),10)+")"}else switch(a){case"name":return"opacity";case"extract":return c;case"inject":return c}}},register:function(){9>=n||t.State.isGingerbread||(v.Lists.transformsBase=v.Lists.transformsBase.concat(v.Lists.transforms3D));for(var a=0;a<v.Lists.transformsBase.length;a++)!function(){var b=v.Lists.transformsBase[a];v.Normalizations.registered[b]=function(a,c,e){switch(a){case"name":return"transform";case"extract":return g(c)===d||g(c).transformCache[b]===d?/^scale/i.test(b)?1:0:g(c).transformCache[b].replace(/[()]/g,"");case"inject":var f=!1;switch(b.substr(0,b.length-1)){case"translate":f=!/(%|px|em|rem|vw|vh|\d)$/i.test(e);break;case"scal":case"scale":t.State.isAndroid&&g(c).transformCache[b]===d&&1>e&&(e=1),f=!/(\d)$/i.test(e);break;case"skew":f=!/(deg|\d)$/i.test(e);break;case"rotate":f=!/(deg|\d)$/i.test(e)}return f||(g(c).transformCache[b]="("+e+")"),g(c).transformCache[b]}}}();for(var a=0;a<v.Lists.colors.length;a++)!function(){var b=v.Lists.colors[a];v.Normalizations.registered[b]=function(a,c,e){switch(a){case"name":return b;case"extract":var f;if(v.RegEx.wrappedValueAlreadyExtracted.test(e))f=e;else{var g,h={black:"rgb(0, 0, 0)",blue:"rgb(0, 0, 255)",gray:"rgb(128, 128, 128)",green:"rgb(0, 128, 0)",red:"rgb(255, 0, 0)",white:"rgb(255, 255, 255)"};/^[A-z]+$/i.test(e)?g=h[e]!==d?h[e]:h.black:v.RegEx.isHex.test(e)?g="rgb("+v.Values.hexToRgb(e).join(" ")+")":/^rgba?\(/i.test(e)||(g=h.black),f=(g||e).toString().match(v.RegEx.valueUnwrap)[1].replace(/,(\s+)?/g," ")}return 8>=n||3!==f.split(" ").length||(f+=" 1"),f;case"inject":return 8>=n?4===e.split(" ").length&&(e=e.split(/\s+/).slice(0,3).join(" ")):3===e.split(" ").length&&(e+=" 1"),(8>=n?"rgb":"rgba")+"("+e.replace(/\s+/g,",").replace(/\.(\d)+(?=,)/g,"")+")"}}}()}},Names:{camelCase:function(a){return a.replace(/-(\w)/g,function(a,b){return b.toUpperCase()})},SVGAttribute:function(a){var b="width|height|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2";return(n||t.State.isAndroid&&!t.State.isChrome)&&(b+="|transform"),new RegExp("^("+b+")$","i").test(a)},prefixCheck:function(a){if(t.State.prefixMatches[a])return[t.State.prefixMatches[a],!0];for(var b=["","Webkit","Moz","ms","O"],c=0,d=b.length;d>c;c++){var e;if(e=0===c?a:b[c]+a.replace(/^\w/,function(a){return a.toUpperCase()}),p.isString(t.State.prefixElement.style[e]))return t.State.prefixMatches[a]=e,[e,!0]}return[a,!1]}},Values:{hexToRgb:function(a){var b,c=/^#?([a-f\d])([a-f\d])([a-f\d])$/i,d=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;return a=a.replace(c,function(a,b,c,d){return b+b+c+c+d+d}),b=d.exec(a),b?[parseInt(b[1],16),parseInt(b[2],16),parseInt(b[3],16)]:[0,0,0]},isCSSNullValue:function(a){return 0==a||/^(none|auto|transparent|(rgba\(0, ?0, ?0, ?0\)))$/i.test(a)},getUnitType:function(a){return/^(rotate|skew)/i.test(a)?"deg":/(^(scale|scaleX|scaleY|scaleZ|alpha|flexGrow|flexHeight|zIndex|fontWeight)$)|((opacity|red|green|blue|alpha)$)/i.test(a)?"":"px"},getDisplayType:function(a){var b=a&&a.tagName.toString().toLowerCase();return/^(b|big|i|small|tt|abbr|acronym|cite|code|dfn|em|kbd|strong|samp|var|a|bdo|br|img|map|object|q|script|span|sub|sup|button|input|label|select|textarea)$/i.test(b)?"inline":/^(li)$/i.test(b)?"list-item":/^(tr)$/i.test(b)?"table-row":/^(table)$/i.test(b)?"table":/^(tbody)$/i.test(b)?"table-row-group":"block"},addClass:function(a,b){a.classList?a.classList.add(b):a.className+=(a.className.length?" ":"")+b},removeClass:function(a,b){a.classList?a.classList.remove(b):a.className=a.className.toString().replace(new RegExp("(^|\\s)"+b.split(" ").join("|")+"(\\s|$)","gi")," ")}},getPropertyValue:function(a,c,e,f){function h(a,c){function e(){j&&v.setPropertyValue(a,"display","none")}var i=0;if(8>=n)i=m.css(a,c);else{var j=!1;if(/^(width|height)$/.test(c)&&0===v.getPropertyValue(a,"display")&&(j=!0,v.setPropertyValue(a,"display",v.Values.getDisplayType(a))),!f){if("height"===c&&"border-box"!==v.getPropertyValue(a,"boxSizing").toString().toLowerCase()){var k=a.offsetHeight-(parseFloat(v.getPropertyValue(a,"borderTopWidth"))||0)-(parseFloat(v.getPropertyValue(a,"borderBottomWidth"))||0)-(parseFloat(v.getPropertyValue(a,"paddingTop"))||0)-(parseFloat(v.getPropertyValue(a,"paddingBottom"))||0);return e(),k}if("width"===c&&"border-box"!==v.getPropertyValue(a,"boxSizing").toString().toLowerCase()){var l=a.offsetWidth-(parseFloat(v.getPropertyValue(a,"borderLeftWidth"))||0)-(parseFloat(v.getPropertyValue(a,"borderRightWidth"))||0)-(parseFloat(v.getPropertyValue(a,"paddingLeft"))||0)-(parseFloat(v.getPropertyValue(a,"paddingRight"))||0);return e(),l}}var o;o=g(a)===d?b.getComputedStyle(a,null):g(a).computedStyle?g(a).computedStyle:g(a).computedStyle=b.getComputedStyle(a,null),"borderColor"===c&&(c="borderTopColor"),i=9===n&&"filter"===c?o.getPropertyValue(c):o[c],(""===i||null===i)&&(i=a.style[c]),e()}if("auto"===i&&/^(top|right|bottom|left)$/i.test(c)){var p=h(a,"position");("fixed"===p||"absolute"===p&&/top|left/i.test(c))&&(i=m(a).position()[c]+"px")}return i}var i;if(v.Hooks.registered[c]){var j=c,k=v.Hooks.getRoot(j);e===d&&(e=v.getPropertyValue(a,v.Names.prefixCheck(k)[0])),v.Normalizations.registered[k]&&(e=v.Normalizations.registered[k]("extract",a,e)),i=v.Hooks.extractValue(j,e)}else if(v.Normalizations.registered[c]){var l,o;l=v.Normalizations.registered[c]("name",a),"transform"!==l&&(o=h(a,v.Names.prefixCheck(l)[0]),v.Values.isCSSNullValue(o)&&v.Hooks.templates[c]&&(o=v.Hooks.templates[c][1])),i=v.Normalizations.registered[c]("extract",a,o)}if(!/^[\d-]/.test(i))if(g(a)&&g(a).isSVG&&v.Names.SVGAttribute(c))if(/^(height|width)$/i.test(c))try{i=a.getBBox()[c]}catch(p){i=0}else i=a.getAttribute(c);else i=h(a,v.Names.prefixCheck(c)[0]);return v.Values.isCSSNullValue(i)&&(i=0),t.debug>=2&&console.log("Get "+c+": "+i),i},setPropertyValue:function(a,c,d,e,f){var h=c;if("scroll"===c)f.container?f.container["scroll"+f.direction]=d:"Left"===f.direction?b.scrollTo(d,f.alternateValue):b.scrollTo(f.alternateValue,d);else if(v.Normalizations.registered[c]&&"transform"===v.Normalizations.registered[c]("name",a))v.Normalizations.registered[c]("inject",a,d),h="transform",d=g(a).transformCache[c];else{if(v.Hooks.registered[c]){var i=c,j=v.Hooks.getRoot(c);e=e||v.getPropertyValue(a,j),d=v.Hooks.injectValue(i,d,e),c=j}if(v.Normalizations.registered[c]&&(d=v.Normalizations.registered[c]("inject",a,d),c=v.Normalizations.registered[c]("name",a)),h=v.Names.prefixCheck(c)[0],8>=n)try{a.style[h]=d}catch(k){t.debug&&console.log("Browser does not support ["+d+"] for ["+h+"]")}else g(a)&&g(a).isSVG&&v.Names.SVGAttribute(c)?a.setAttribute(c,d):a.style[h]=d;t.debug>=2&&console.log("Set "+c+" ("+h+"): "+d)}return[h,d]},flushTransformCache:function(a){function b(b){return parseFloat(v.getPropertyValue(a,b))}var c="";if((n||t.State.isAndroid&&!t.State.isChrome)&&g(a).isSVG){var d={translate:[b("translateX"),b("translateY")],skewX:[b("skewX")],skewY:[b("skewY")],scale:1!==b("scale")?[b("scale"),b("scale")]:[b("scaleX"),b("scaleY")],rotate:[b("rotateZ"),0,0]};m.each(g(a).transformCache,function(a){/^translate/i.test(a)?a="translate":/^scale/i.test(a)?a="scale":/^rotate/i.test(a)&&(a="rotate"),d[a]&&(c+=a+"("+d[a].join(" ")+") ",delete d[a])})}else{var e,f;m.each(g(a).transformCache,function(b){return e=g(a).transformCache[b],"transformPerspective"===b?(f=e,!0):(9===n&&"rotateZ"===b&&(b="rotate"),void(c+=b+e+" "))}),f&&(c="perspective"+f+" "+c)}v.setPropertyValue(a,"transform",c)}};v.Hooks.register(),v.Normalizations.register(),t.hook=function(a,b,c){var e=d;return a=f(a),m.each(a,function(a,f){if(g(f)===d&&t.init(f),c===d)e===d&&(e=t.CSS.getPropertyValue(f,b));else{var h=t.CSS.setPropertyValue(f,b,c);"transform"===h[0]&&t.CSS.flushTransformCache(f),e=h}}),e};var w=function(){function a(){return h?B.promise||null:i}function e(){function a(){function a(a,b){var c=d,e=d,g=d;return p.isArray(a)?(c=a[0],!p.isArray(a[1])&&/^[\d-]/.test(a[1])||p.isFunction(a[1])||v.RegEx.isHex.test(a[1])?g=a[1]:(p.isString(a[1])&&!v.RegEx.isHex.test(a[1])||p.isArray(a[1]))&&(e=b?a[1]:j(a[1],h.duration),a[2]!==d&&(g=a[2]))):c=a,b||(e=e||h.easing),p.isFunction(c)&&(c=c.call(f,y,x)),p.isFunction(g)&&(g=g.call(f,y,x)),[c||0,e,g]}function l(a,b){var c,d;return d=(b||"0").toString().toLowerCase().replace(/[%A-z]+$/,function(a){return c=a,""}),c||(c=v.Values.getUnitType(a)),[d,c]}function n(){var a={myParent:f.parentNode||c.body,position:v.getPropertyValue(f,"position"),fontSize:v.getPropertyValue(f,"fontSize")},d=a.position===I.lastPosition&&a.myParent===I.lastParent,e=a.fontSize===I.lastFontSize;I.lastParent=a.myParent,I.lastPosition=a.position,I.lastFontSize=a.fontSize;var h=100,i={};if(e&&d)i.emToPx=I.lastEmToPx,i.percentToPxWidth=I.lastPercentToPxWidth,i.percentToPxHeight=I.lastPercentToPxHeight;else{var j=g(f).isSVG?c.createElementNS("http://www.w3.org/2000/svg","rect"):c.createElement("div");t.init(j),a.myParent.appendChild(j),m.each(["overflow","overflowX","overflowY"],function(a,b){t.CSS.setPropertyValue(j,b,"hidden")}),t.CSS.setPropertyValue(j,"position",a.position),t.CSS.setPropertyValue(j,"fontSize",a.fontSize),t.CSS.setPropertyValue(j,"boxSizing","content-box"),m.each(["minWidth","maxWidth","width","minHeight","maxHeight","height"],function(a,b){t.CSS.setPropertyValue(j,b,h+"%")}),t.CSS.setPropertyValue(j,"paddingLeft",h+"em"),i.percentToPxWidth=I.lastPercentToPxWidth=(parseFloat(v.getPropertyValue(j,"width",null,!0))||1)/h,i.percentToPxHeight=I.lastPercentToPxHeight=(parseFloat(v.getPropertyValue(j,"height",null,!0))||1)/h,i.emToPx=I.lastEmToPx=(parseFloat(v.getPropertyValue(j,"paddingLeft"))||1)/h,a.myParent.removeChild(j)}return null===I.remToPx&&(I.remToPx=parseFloat(v.getPropertyValue(c.body,"fontSize"))||16),null===I.vwToPx&&(I.vwToPx=parseFloat(b.innerWidth)/100,I.vhToPx=parseFloat(b.innerHeight)/100),i.remToPx=I.remToPx,i.vwToPx=I.vwToPx,i.vhToPx=I.vhToPx,t.debug>=1&&console.log("Unit ratios: "+JSON.stringify(i),f),i}if(h.begin&&0===y)try{h.begin.call(o,o)}catch(r){setTimeout(function(){throw r},1)}if("scroll"===C){var u,w,z,A=/^x$/i.test(h.axis)?"Left":"Top",D=parseFloat(h.offset)||0;h.container?p.isWrapped(h.container)||p.isNode(h.container)?(h.container=h.container[0]||h.container,u=h.container["scroll"+A],z=u+m(f).position()[A.toLowerCase()]+D):h.container=null:(u=t.State.scrollAnchor[t.State["scrollProperty"+A]],w=t.State.scrollAnchor[t.State["scrollProperty"+("Left"===A?"Top":"Left")]],z=m(f).offset()[A.toLowerCase()]+D),i={scroll:{rootPropertyValue:!1,startValue:u,currentValue:u,endValue:z,unitType:"",easing:h.easing,scrollData:{container:h.container,direction:A,alternateValue:w}},element:f},t.debug&&console.log("tweensContainer (scroll): ",i.scroll,f)}else if("reverse"===C){if(!g(f).tweensContainer)return void m.dequeue(f,h.queue);"none"===g(f).opts.display&&(g(f).opts.display="auto"),"hidden"===g(f).opts.visibility&&(g(f).opts.visibility="visible"),g(f).opts.loop=!1,g(f).opts.begin=null,g(f).opts.complete=null,s.easing||delete h.easing,s.duration||delete h.duration,h=m.extend({},g(f).opts,h);var E=m.extend(!0,{},g(f).tweensContainer);for(var F in E)if("element"!==F){var G=E[F].startValue;E[F].startValue=E[F].currentValue=E[F].endValue,E[F].endValue=G,p.isEmptyObject(s)||(E[F].easing=h.easing),t.debug&&console.log("reverse tweensContainer ("+F+"): "+JSON.stringify(E[F]),f)}i=E}else if("start"===C){var E;g(f).tweensContainer&&g(f).isAnimating===!0&&(E=g(f).tweensContainer),m.each(q,function(b,c){if(RegExp("^"+v.Lists.colors.join("$|^")+"$").test(b)){var e=a(c,!0),f=e[0],g=e[1],h=e[2];if(v.RegEx.isHex.test(f)){for(var i=["Red","Green","Blue"],j=v.Values.hexToRgb(f),k=h?v.Values.hexToRgb(h):d,l=0;l<i.length;l++){var m=[j[l]];g&&m.push(g),k!==d&&m.push(k[l]),q[b+i[l]]=m}delete q[b]}}});for(var H in q){var K=a(q[H]),L=K[0],M=K[1],N=K[2];H=v.Names.camelCase(H);var O=v.Hooks.getRoot(H),P=!1;if(g(f).isSVG||"tween"===O||v.Names.prefixCheck(O)[1]!==!1||v.Normalizations.registered[O]!==d){(h.display!==d&&null!==h.display&&"none"!==h.display||h.visibility!==d&&"hidden"!==h.visibility)&&/opacity|filter/.test(H)&&!N&&0!==L&&(N=0),h._cacheValues&&E&&E[H]?(N===d&&(N=E[H].endValue+E[H].unitType),P=g(f).rootPropertyValueCache[O]):v.Hooks.registered[H]?N===d?(P=v.getPropertyValue(f,O),N=v.getPropertyValue(f,H,P)):P=v.Hooks.templates[O][1]:N===d&&(N=v.getPropertyValue(f,H));var Q,R,S,T=!1;if(Q=l(H,N),N=Q[0],S=Q[1],Q=l(H,L),L=Q[0].replace(/^([+-\/*])=/,function(a,b){return T=b,""}),R=Q[1],N=parseFloat(N)||0,L=parseFloat(L)||0,"%"===R&&(/^(fontSize|lineHeight)$/.test(H)?(L/=100,R="em"):/^scale/.test(H)?(L/=100,R=""):/(Red|Green|Blue)$/i.test(H)&&(L=L/100*255,R="")),/[\/*]/.test(T))R=S;else if(S!==R&&0!==N)if(0===L)R=S;else{e=e||n();var U=/margin|padding|left|right|width|text|word|letter/i.test(H)||/X$/.test(H)||"x"===H?"x":"y";switch(S){case"%":N*="x"===U?e.percentToPxWidth:e.percentToPxHeight;break;case"px":break;default:N*=e[S+"ToPx"]}switch(R){case"%":N*=1/("x"===U?e.percentToPxWidth:e.percentToPxHeight);break;case"px":break;default:N*=1/e[R+"ToPx"]}}switch(T){case"+":L=N+L;break;case"-":L=N-L;break;case"*":L=N*L;break;case"/":L=N/L}i[H]={rootPropertyValue:P,startValue:N,currentValue:N,endValue:L,unitType:R,easing:M},t.debug&&console.log("tweensContainer ("+H+"): "+JSON.stringify(i[H]),f)}else t.debug&&console.log("Skipping ["+O+"] due to a lack of browser support.")}i.element=f}i.element&&(v.Values.addClass(f,"velocity-animating"),J.push(i),""===h.queue&&(g(f).tweensContainer=i,g(f).opts=h),g(f).isAnimating=!0,y===x-1?(t.State.calls.push([J,o,h,null,B.resolver]),t.State.isTicking===!1&&(t.State.isTicking=!0,k())):y++)}var e,f=this,h=m.extend({},t.defaults,s),i={};switch(g(f)===d&&t.init(f),parseFloat(h.delay)&&h.queue!==!1&&m.queue(f,h.queue,function(a){t.velocityQueueEntryFlag=!0,g(f).delayTimer={setTimeout:setTimeout(a,parseFloat(h.delay)),next:a}}),h.duration.toString().toLowerCase()){case"fast":h.duration=200;break;case"normal":h.duration=r;break;case"slow":h.duration=600;break;default:h.duration=parseFloat(h.duration)||1}t.mock!==!1&&(t.mock===!0?h.duration=h.delay=1:(h.duration*=parseFloat(t.mock)||1,h.delay*=parseFloat(t.mock)||1)),h.easing=j(h.easing,h.duration),h.begin&&!p.isFunction(h.begin)&&(h.begin=null),h.progress&&!p.isFunction(h.progress)&&(h.progress=null),h.complete&&!p.isFunction(h.complete)&&(h.complete=null),h.display!==d&&null!==h.display&&(h.display=h.display.toString().toLowerCase(),"auto"===h.display&&(h.display=t.CSS.Values.getDisplayType(f))),h.visibility!==d&&null!==h.visibility&&(h.visibility=h.visibility.toString().toLowerCase()),h.mobileHA=h.mobileHA&&t.State.isMobile&&!t.State.isGingerbread,h.queue===!1?h.delay?setTimeout(a,h.delay):a():m.queue(f,h.queue,function(b,c){return c===!0?(B.promise&&B.resolver(o),!0):(t.velocityQueueEntryFlag=!0,void a(b))}),""!==h.queue&&"fx"!==h.queue||"inprogress"===m.queue(f)[0]||m.dequeue(f)}var h,i,n,o,q,s,u=arguments[0]&&(arguments[0].p||m.isPlainObject(arguments[0].properties)&&!arguments[0].properties.names||p.isString(arguments[0].properties));if(p.isWrapped(this)?(h=!1,n=0,o=this,i=this):(h=!0,n=1,o=u?arguments[0].elements||arguments[0].e:arguments[0]),o=f(o)){u?(q=arguments[0].properties||arguments[0].p,s=arguments[0].options||arguments[0].o):(q=arguments[n],s=arguments[n+1]);var x=o.length,y=0;if(!/^(stop|finish|finishAll)$/i.test(q)&&!m.isPlainObject(s)){var z=n+1;s={};for(var A=z;A<arguments.length;A++)p.isArray(arguments[A])||!/^(fast|normal|slow)$/i.test(arguments[A])&&!/^\d/.test(arguments[A])?p.isString(arguments[A])||p.isArray(arguments[A])?s.easing=arguments[A]:p.isFunction(arguments[A])&&(s.complete=arguments[A]):s.duration=arguments[A]}var B={promise:null,resolver:null,rejecter:null};h&&t.Promise&&(B.promise=new t.Promise(function(a,b){B.resolver=a,B.rejecter=b}));var C;switch(q){case"scroll":C="scroll";break;case"reverse":C="reverse";break;case"finish":case"finishAll":case"stop":m.each(o,function(a,b){g(b)&&g(b).delayTimer&&(clearTimeout(g(b).delayTimer.setTimeout),g(b).delayTimer.next&&g(b).delayTimer.next(),delete g(b).delayTimer),"finishAll"!==q||s!==!0&&!p.isString(s)||(m.each(m.queue(b,p.isString(s)?s:""),function(a,b){p.isFunction(b)&&b()}),m.queue(b,p.isString(s)?s:"",[]))});var D=[];return m.each(t.State.calls,function(a,b){b&&m.each(b[1],function(c,e){var f=s===d?"":s;return f===!0||b[2].queue===f||s===d&&b[2].queue===!1?void m.each(o,function(c,d){d===e&&((s===!0||p.isString(s))&&(m.each(m.queue(d,p.isString(s)?s:""),function(a,b){p.isFunction(b)&&b(null,!0)
}),m.queue(d,p.isString(s)?s:"",[])),"stop"===q?(g(d)&&g(d).tweensContainer&&f!==!1&&m.each(g(d).tweensContainer,function(a,b){b.endValue=b.currentValue}),D.push(a)):("finish"===q||"finishAll"===q)&&(b[2].duration=1))}):!0})}),"stop"===q&&(m.each(D,function(a,b){l(b,!0)}),B.promise&&B.resolver(o)),a();default:if(!m.isPlainObject(q)||p.isEmptyObject(q)){if(p.isString(q)&&t.Redirects[q]){var E=m.extend({},s),F=E.duration,G=E.delay||0;return E.backwards===!0&&(o=m.extend(!0,[],o).reverse()),m.each(o,function(a,b){parseFloat(E.stagger)?E.delay=G+parseFloat(E.stagger)*a:p.isFunction(E.stagger)&&(E.delay=G+E.stagger.call(b,a,x)),E.drag&&(E.duration=parseFloat(F)||(/^(callout|transition)/.test(q)?1e3:r),E.duration=Math.max(E.duration*(E.backwards?1-a/x:(a+1)/x),.75*E.duration,200)),t.Redirects[q].call(b,b,E||{},a,x,o,B.promise?B:d)}),a()}var H="Velocity: First argument ("+q+") was not a property map, a known action, or a registered redirect. Aborting.";return B.promise?B.rejecter(new Error(H)):console.log(H),a()}C="start"}var I={lastParent:null,lastPosition:null,lastFontSize:null,lastPercentToPxWidth:null,lastPercentToPxHeight:null,lastEmToPx:null,remToPx:null,vwToPx:null,vhToPx:null},J=[];m.each(o,function(a,b){p.isNode(b)&&e.call(b)});var K,E=m.extend({},t.defaults,s);if(E.loop=parseInt(E.loop),K=2*E.loop-1,E.loop)for(var L=0;K>L;L++){var M={delay:E.delay,progress:E.progress};L===K-1&&(M.display=E.display,M.visibility=E.visibility,M.complete=E.complete),w(o,"reverse",M)}return a()}};t=m.extend(w,t),t.animate=w;var x=b.requestAnimationFrame||o;return t.State.isMobile||c.hidden===d||c.addEventListener("visibilitychange",function(){c.hidden?(x=function(a){return setTimeout(function(){a(!0)},16)},k()):x=b.requestAnimationFrame||o}),a.Velocity=t,a!==b&&(a.fn.velocity=w,a.fn.velocity.defaults=t.defaults),m.each(["Down","Up"],function(a,b){t.Redirects["slide"+b]=function(a,c,e,f,g,h){var i=m.extend({},c),j=i.begin,k=i.complete,l={height:"",marginTop:"",marginBottom:"",paddingTop:"",paddingBottom:""},n={};i.display===d&&(i.display="Down"===b?"inline"===t.CSS.Values.getDisplayType(a)?"inline-block":"block":"none"),i.begin=function(){j&&j.call(g,g);for(var c in l){n[c]=a.style[c];var d=t.CSS.getPropertyValue(a,c);l[c]="Down"===b?[d,0]:[0,d]}n.overflow=a.style.overflow,a.style.overflow="hidden"},i.complete=function(){for(var b in n)a.style[b]=n[b];k&&k.call(g,g),h&&h.resolver(g)},t(a,l,i)}}),m.each(["In","Out"],function(a,b){t.Redirects["fade"+b]=function(a,c,e,f,g,h){var i=m.extend({},c),j={opacity:"In"===b?1:0},k=i.complete;i.complete=e!==f-1?i.begin=null:function(){k&&k.call(g,g),h&&h.resolver(g)},i.display===d&&(i.display="In"===b?"auto":"none"),t(this,j,i)}}),t}(window.jQuery||window.Zepto||window,window,document)});

},{}]},{},[7]);
