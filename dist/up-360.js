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
        var listeners = this.getListenersAsObject(evt);
        var listener;
        var i;
        var key;
        var response;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                i = listeners[key].length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[key][i];

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

		defaultFrameWidth = screenRectangle.width;
		defaultFrameHeight = screenRectangle.height;

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

					//Prevent displaying image from a differentframe
					if (image.dataset.frameIndex != currentFrame)
						return;

					image.style.left = (partWidth * x) + 'px';
					image.style.top = (partHeight * y) + 'px';
					image.style.zIndex = levelObject.zoomThreshold;
					image.width = partWidth;
					image.height = partHeight;

					if (levelObject.zoomThreshold <= 1) {
						//Draw Low Resolution
						if(lastActiveLowResImage)
							lastActiveLowResImage.classList.remove('low-active');
						image.classList.add('low-active');
						lastActiveLowResImage = image;

						//Wywołaj event handler odnośnie rysowania klatki
						settings.onDrawFrame.Trigger(currentFrame, !isLowRes, image.src);
					} else {
						//Draw High Resolution chunk
						//Jeśli element nie był jeszcze narysowany, to narysuj go na ekranie
						for(var i = 0; i < highResContent.childNodes.length; i++){
							if(highResContent.childNodes[i] === image)
							return;
						}

						highResContent.appendChild(image);
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
		settings.minZoom = (screenRectangle.width / highestLevelObject.width + screenRectangle.height / highestLevelObject.height) / 2 * settings.maxZoom;

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
		var pointX = screenRectangle.width / 2,
			pointY = screenRectangle.height / 2;

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
		if (rect.width < screenRectangle.width && rect.height < screenRectangle.Height) {
			//Content smaller than screen =>
			//Horizontal
			if (cpX < 0)
				contentPosition.X(0);
			else if (cpX + contentPosition.Width() > screenRectangle.width)
				contentPosition.X(screenRectangle.width - contentPosition.Width())
			//Vertical
			if (cpY < 0)
				contentPosition.Y(0);
			else if (cpY + contentPosition.Height() > screenRectangle.Height)
				contentPosition.Y(screenRectangle.Height - contentPosition.Height());
		} else {
			//Content larger than screen =>
			var percentage = (zoomValue - 1) / settings.maxZoom,
			maxY = Math.round(screenRectangle.height / 2 * percentage),
			maxX = Math.round(screenRectangle.width / 2 * percentage);

			//Vertical
			if (cpY > maxY)
				contentPosition.Y(maxY);
			else if (cpY + contentPosition.Height() < screenRectangle.height - maxY)
				contentPosition.Y(screenRectangle.height - maxY - contentPosition.Height())
			//Horizontal
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
						fastCache[image.img.dataset.frameIndex][image.img.dataset.index] = image.img;
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
    velocity = require('velocity');

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

        previewBox.querySelector('img').src = url;
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
},{"./../helpers.js":5,"velocity":"velocity"}],"hammerjs":[function(require,module,exports){
/*! Hammer.JS - v2.0.4 - 2014-09-28
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2014 Jorik Tangelder;
 * Licensed under the MIT license */
!function(a,b,c,d){"use strict";function e(a,b,c){return setTimeout(k(a,c),b)}function f(a,b,c){return Array.isArray(a)?(g(a,c[b],c),!0):!1}function g(a,b,c){var e;if(a)if(a.forEach)a.forEach(b,c);else if(a.length!==d)for(e=0;e<a.length;)b.call(c,a[e],e,a),e++;else for(e in a)a.hasOwnProperty(e)&&b.call(c,a[e],e,a)}function h(a,b,c){for(var e=Object.keys(b),f=0;f<e.length;)(!c||c&&a[e[f]]===d)&&(a[e[f]]=b[e[f]]),f++;return a}function i(a,b){return h(a,b,!0)}function j(a,b,c){var d,e=b.prototype;d=a.prototype=Object.create(e),d.constructor=a,d._super=e,c&&h(d,c)}function k(a,b){return function(){return a.apply(b,arguments)}}function l(a,b){return typeof a==kb?a.apply(b?b[0]||d:d,b):a}function m(a,b){return a===d?b:a}function n(a,b,c){g(r(b),function(b){a.addEventListener(b,c,!1)})}function o(a,b,c){g(r(b),function(b){a.removeEventListener(b,c,!1)})}function p(a,b){for(;a;){if(a==b)return!0;a=a.parentNode}return!1}function q(a,b){return a.indexOf(b)>-1}function r(a){return a.trim().split(/\s+/g)}function s(a,b,c){if(a.indexOf&&!c)return a.indexOf(b);for(var d=0;d<a.length;){if(c&&a[d][c]==b||!c&&a[d]===b)return d;d++}return-1}function t(a){return Array.prototype.slice.call(a,0)}function u(a,b,c){for(var d=[],e=[],f=0;f<a.length;){var g=b?a[f][b]:a[f];s(e,g)<0&&d.push(a[f]),e[f]=g,f++}return c&&(d=b?d.sort(function(a,c){return a[b]>c[b]}):d.sort()),d}function v(a,b){for(var c,e,f=b[0].toUpperCase()+b.slice(1),g=0;g<ib.length;){if(c=ib[g],e=c?c+f:b,e in a)return e;g++}return d}function w(){return ob++}function x(a){var b=a.ownerDocument;return b.defaultView||b.parentWindow}function y(a,b){var c=this;this.manager=a,this.callback=b,this.element=a.element,this.target=a.options.inputTarget,this.domHandler=function(b){l(a.options.enable,[a])&&c.handler(b)},this.init()}function z(a){var b,c=a.options.inputClass;return new(b=c?c:rb?N:sb?Q:qb?S:M)(a,A)}function A(a,b,c){var d=c.pointers.length,e=c.changedPointers.length,f=b&yb&&d-e===0,g=b&(Ab|Bb)&&d-e===0;c.isFirst=!!f,c.isFinal=!!g,f&&(a.session={}),c.eventType=b,B(a,c),a.emit("hammer.input",c),a.recognize(c),a.session.prevInput=c}function B(a,b){var c=a.session,d=b.pointers,e=d.length;c.firstInput||(c.firstInput=E(b)),e>1&&!c.firstMultiple?c.firstMultiple=E(b):1===e&&(c.firstMultiple=!1);var f=c.firstInput,g=c.firstMultiple,h=g?g.center:f.center,i=b.center=F(d);b.timeStamp=nb(),b.deltaTime=b.timeStamp-f.timeStamp,b.angle=J(h,i),b.distance=I(h,i),C(c,b),b.offsetDirection=H(b.deltaX,b.deltaY),b.scale=g?L(g.pointers,d):1,b.rotation=g?K(g.pointers,d):0,D(c,b);var j=a.element;p(b.srcEvent.target,j)&&(j=b.srcEvent.target),b.target=j}function C(a,b){var c=b.center,d=a.offsetDelta||{},e=a.prevDelta||{},f=a.prevInput||{};(b.eventType===yb||f.eventType===Ab)&&(e=a.prevDelta={x:f.deltaX||0,y:f.deltaY||0},d=a.offsetDelta={x:c.x,y:c.y}),b.deltaX=e.x+(c.x-d.x),b.deltaY=e.y+(c.y-d.y)}function D(a,b){var c,e,f,g,h=a.lastInterval||b,i=b.timeStamp-h.timeStamp;if(b.eventType!=Bb&&(i>xb||h.velocity===d)){var j=h.deltaX-b.deltaX,k=h.deltaY-b.deltaY,l=G(i,j,k);e=l.x,f=l.y,c=mb(l.x)>mb(l.y)?l.x:l.y,g=H(j,k),a.lastInterval=b}else c=h.velocity,e=h.velocityX,f=h.velocityY,g=h.direction;b.velocity=c,b.velocityX=e,b.velocityY=f,b.direction=g}function E(a){for(var b=[],c=0;c<a.pointers.length;)b[c]={clientX:lb(a.pointers[c].clientX),clientY:lb(a.pointers[c].clientY)},c++;return{timeStamp:nb(),pointers:b,center:F(b),deltaX:a.deltaX,deltaY:a.deltaY}}function F(a){var b=a.length;if(1===b)return{x:lb(a[0].clientX),y:lb(a[0].clientY)};for(var c=0,d=0,e=0;b>e;)c+=a[e].clientX,d+=a[e].clientY,e++;return{x:lb(c/b),y:lb(d/b)}}function G(a,b,c){return{x:b/a||0,y:c/a||0}}function H(a,b){return a===b?Cb:mb(a)>=mb(b)?a>0?Db:Eb:b>0?Fb:Gb}function I(a,b,c){c||(c=Kb);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return Math.sqrt(d*d+e*e)}function J(a,b,c){c||(c=Kb);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return 180*Math.atan2(e,d)/Math.PI}function K(a,b){return J(b[1],b[0],Lb)-J(a[1],a[0],Lb)}function L(a,b){return I(b[0],b[1],Lb)/I(a[0],a[1],Lb)}function M(){this.evEl=Nb,this.evWin=Ob,this.allow=!0,this.pressed=!1,y.apply(this,arguments)}function N(){this.evEl=Rb,this.evWin=Sb,y.apply(this,arguments),this.store=this.manager.session.pointerEvents=[]}function O(){this.evTarget=Ub,this.evWin=Vb,this.started=!1,y.apply(this,arguments)}function P(a,b){var c=t(a.touches),d=t(a.changedTouches);return b&(Ab|Bb)&&(c=u(c.concat(d),"identifier",!0)),[c,d]}function Q(){this.evTarget=Xb,this.targetIds={},y.apply(this,arguments)}function R(a,b){var c=t(a.touches),d=this.targetIds;if(b&(yb|zb)&&1===c.length)return d[c[0].identifier]=!0,[c,c];var e,f,g=t(a.changedTouches),h=[],i=this.target;if(f=c.filter(function(a){return p(a.target,i)}),b===yb)for(e=0;e<f.length;)d[f[e].identifier]=!0,e++;for(e=0;e<g.length;)d[g[e].identifier]&&h.push(g[e]),b&(Ab|Bb)&&delete d[g[e].identifier],e++;return h.length?[u(f.concat(h),"identifier",!0),h]:void 0}function S(){y.apply(this,arguments);var a=k(this.handler,this);this.touch=new Q(this.manager,a),this.mouse=new M(this.manager,a)}function T(a,b){this.manager=a,this.set(b)}function U(a){if(q(a,bc))return bc;var b=q(a,cc),c=q(a,dc);return b&&c?cc+" "+dc:b||c?b?cc:dc:q(a,ac)?ac:_b}function V(a){this.id=w(),this.manager=null,this.options=i(a||{},this.defaults),this.options.enable=m(this.options.enable,!0),this.state=ec,this.simultaneous={},this.requireFail=[]}function W(a){return a&jc?"cancel":a&hc?"end":a&gc?"move":a&fc?"start":""}function X(a){return a==Gb?"down":a==Fb?"up":a==Db?"left":a==Eb?"right":""}function Y(a,b){var c=b.manager;return c?c.get(a):a}function Z(){V.apply(this,arguments)}function $(){Z.apply(this,arguments),this.pX=null,this.pY=null}function _(){Z.apply(this,arguments)}function ab(){V.apply(this,arguments),this._timer=null,this._input=null}function bb(){Z.apply(this,arguments)}function cb(){Z.apply(this,arguments)}function db(){V.apply(this,arguments),this.pTime=!1,this.pCenter=!1,this._timer=null,this._input=null,this.count=0}function eb(a,b){return b=b||{},b.recognizers=m(b.recognizers,eb.defaults.preset),new fb(a,b)}function fb(a,b){b=b||{},this.options=i(b,eb.defaults),this.options.inputTarget=this.options.inputTarget||a,this.handlers={},this.session={},this.recognizers=[],this.element=a,this.input=z(this),this.touchAction=new T(this,this.options.touchAction),gb(this,!0),g(b.recognizers,function(a){var b=this.add(new a[0](a[1]));a[2]&&b.recognizeWith(a[2]),a[3]&&b.requireFailure(a[3])},this)}function gb(a,b){var c=a.element;g(a.options.cssProps,function(a,d){c.style[v(c.style,d)]=b?a:""})}function hb(a,c){var d=b.createEvent("Event");d.initEvent(a,!0,!0),d.gesture=c,c.target.dispatchEvent(d)}var ib=["","webkit","moz","MS","ms","o"],jb=b.createElement("div"),kb="function",lb=Math.round,mb=Math.abs,nb=Date.now,ob=1,pb=/mobile|tablet|ip(ad|hone|od)|android/i,qb="ontouchstart"in a,rb=v(a,"PointerEvent")!==d,sb=qb&&pb.test(navigator.userAgent),tb="touch",ub="pen",vb="mouse",wb="kinect",xb=25,yb=1,zb=2,Ab=4,Bb=8,Cb=1,Db=2,Eb=4,Fb=8,Gb=16,Hb=Db|Eb,Ib=Fb|Gb,Jb=Hb|Ib,Kb=["x","y"],Lb=["clientX","clientY"];y.prototype={handler:function(){},init:function(){this.evEl&&n(this.element,this.evEl,this.domHandler),this.evTarget&&n(this.target,this.evTarget,this.domHandler),this.evWin&&n(x(this.element),this.evWin,this.domHandler)},destroy:function(){this.evEl&&o(this.element,this.evEl,this.domHandler),this.evTarget&&o(this.target,this.evTarget,this.domHandler),this.evWin&&o(x(this.element),this.evWin,this.domHandler)}};var Mb={mousedown:yb,mousemove:zb,mouseup:Ab},Nb="mousedown",Ob="mousemove mouseup";j(M,y,{handler:function(a){var b=Mb[a.type];b&yb&&0===a.button&&(this.pressed=!0),b&zb&&1!==a.which&&(b=Ab),this.pressed&&this.allow&&(b&Ab&&(this.pressed=!1),this.callback(this.manager,b,{pointers:[a],changedPointers:[a],pointerType:vb,srcEvent:a}))}});var Pb={pointerdown:yb,pointermove:zb,pointerup:Ab,pointercancel:Bb,pointerout:Bb},Qb={2:tb,3:ub,4:vb,5:wb},Rb="pointerdown",Sb="pointermove pointerup pointercancel";a.MSPointerEvent&&(Rb="MSPointerDown",Sb="MSPointerMove MSPointerUp MSPointerCancel"),j(N,y,{handler:function(a){var b=this.store,c=!1,d=a.type.toLowerCase().replace("ms",""),e=Pb[d],f=Qb[a.pointerType]||a.pointerType,g=f==tb,h=s(b,a.pointerId,"pointerId");e&yb&&(0===a.button||g)?0>h&&(b.push(a),h=b.length-1):e&(Ab|Bb)&&(c=!0),0>h||(b[h]=a,this.callback(this.manager,e,{pointers:b,changedPointers:[a],pointerType:f,srcEvent:a}),c&&b.splice(h,1))}});var Tb={touchstart:yb,touchmove:zb,touchend:Ab,touchcancel:Bb},Ub="touchstart",Vb="touchstart touchmove touchend touchcancel";j(O,y,{handler:function(a){var b=Tb[a.type];if(b===yb&&(this.started=!0),this.started){var c=P.call(this,a,b);b&(Ab|Bb)&&c[0].length-c[1].length===0&&(this.started=!1),this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:tb,srcEvent:a})}}});var Wb={touchstart:yb,touchmove:zb,touchend:Ab,touchcancel:Bb},Xb="touchstart touchmove touchend touchcancel";j(Q,y,{handler:function(a){var b=Wb[a.type],c=R.call(this,a,b);c&&this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:tb,srcEvent:a})}}),j(S,y,{handler:function(a,b,c){var d=c.pointerType==tb,e=c.pointerType==vb;if(d)this.mouse.allow=!1;else if(e&&!this.mouse.allow)return;b&(Ab|Bb)&&(this.mouse.allow=!0),this.callback(a,b,c)},destroy:function(){this.touch.destroy(),this.mouse.destroy()}});var Yb=v(jb.style,"touchAction"),Zb=Yb!==d,$b="compute",_b="auto",ac="manipulation",bc="none",cc="pan-x",dc="pan-y";T.prototype={set:function(a){a==$b&&(a=this.compute()),Zb&&(this.manager.element.style[Yb]=a),this.actions=a.toLowerCase().trim()},update:function(){this.set(this.manager.options.touchAction)},compute:function(){var a=[];return g(this.manager.recognizers,function(b){l(b.options.enable,[b])&&(a=a.concat(b.getTouchAction()))}),U(a.join(" "))},preventDefaults:function(a){if(!Zb){var b=a.srcEvent,c=a.offsetDirection;if(this.manager.session.prevented)return void b.preventDefault();var d=this.actions,e=q(d,bc),f=q(d,dc),g=q(d,cc);return e||f&&c&Hb||g&&c&Ib?this.preventSrc(b):void 0}},preventSrc:function(a){this.manager.session.prevented=!0,a.preventDefault()}};var ec=1,fc=2,gc=4,hc=8,ic=hc,jc=16,kc=32;V.prototype={defaults:{},set:function(a){return h(this.options,a),this.manager&&this.manager.touchAction.update(),this},recognizeWith:function(a){if(f(a,"recognizeWith",this))return this;var b=this.simultaneous;return a=Y(a,this),b[a.id]||(b[a.id]=a,a.recognizeWith(this)),this},dropRecognizeWith:function(a){return f(a,"dropRecognizeWith",this)?this:(a=Y(a,this),delete this.simultaneous[a.id],this)},requireFailure:function(a){if(f(a,"requireFailure",this))return this;var b=this.requireFail;return a=Y(a,this),-1===s(b,a)&&(b.push(a),a.requireFailure(this)),this},dropRequireFailure:function(a){if(f(a,"dropRequireFailure",this))return this;a=Y(a,this);var b=s(this.requireFail,a);return b>-1&&this.requireFail.splice(b,1),this},hasRequireFailures:function(){return this.requireFail.length>0},canRecognizeWith:function(a){return!!this.simultaneous[a.id]},emit:function(a){function b(b){c.manager.emit(c.options.event+(b?W(d):""),a)}var c=this,d=this.state;hc>d&&b(!0),b(),d>=hc&&b(!0)},tryEmit:function(a){return this.canEmit()?this.emit(a):void(this.state=kc)},canEmit:function(){for(var a=0;a<this.requireFail.length;){if(!(this.requireFail[a].state&(kc|ec)))return!1;a++}return!0},recognize:function(a){var b=h({},a);return l(this.options.enable,[this,b])?(this.state&(ic|jc|kc)&&(this.state=ec),this.state=this.process(b),void(this.state&(fc|gc|hc|jc)&&this.tryEmit(b))):(this.reset(),void(this.state=kc))},process:function(){},getTouchAction:function(){},reset:function(){}},j(Z,V,{defaults:{pointers:1},attrTest:function(a){var b=this.options.pointers;return 0===b||a.pointers.length===b},process:function(a){var b=this.state,c=a.eventType,d=b&(fc|gc),e=this.attrTest(a);return d&&(c&Bb||!e)?b|jc:d||e?c&Ab?b|hc:b&fc?b|gc:fc:kc}}),j($,Z,{defaults:{event:"pan",threshold:10,pointers:1,direction:Jb},getTouchAction:function(){var a=this.options.direction,b=[];return a&Hb&&b.push(dc),a&Ib&&b.push(cc),b},directionTest:function(a){var b=this.options,c=!0,d=a.distance,e=a.direction,f=a.deltaX,g=a.deltaY;return e&b.direction||(b.direction&Hb?(e=0===f?Cb:0>f?Db:Eb,c=f!=this.pX,d=Math.abs(a.deltaX)):(e=0===g?Cb:0>g?Fb:Gb,c=g!=this.pY,d=Math.abs(a.deltaY))),a.direction=e,c&&d>b.threshold&&e&b.direction},attrTest:function(a){return Z.prototype.attrTest.call(this,a)&&(this.state&fc||!(this.state&fc)&&this.directionTest(a))},emit:function(a){this.pX=a.deltaX,this.pY=a.deltaY;var b=X(a.direction);b&&this.manager.emit(this.options.event+b,a),this._super.emit.call(this,a)}}),j(_,Z,{defaults:{event:"pinch",threshold:0,pointers:2},getTouchAction:function(){return[bc]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.scale-1)>this.options.threshold||this.state&fc)},emit:function(a){if(this._super.emit.call(this,a),1!==a.scale){var b=a.scale<1?"in":"out";this.manager.emit(this.options.event+b,a)}}}),j(ab,V,{defaults:{event:"press",pointers:1,time:500,threshold:5},getTouchAction:function(){return[_b]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime>b.time;if(this._input=a,!d||!c||a.eventType&(Ab|Bb)&&!f)this.reset();else if(a.eventType&yb)this.reset(),this._timer=e(function(){this.state=ic,this.tryEmit()},b.time,this);else if(a.eventType&Ab)return ic;return kc},reset:function(){clearTimeout(this._timer)},emit:function(a){this.state===ic&&(a&&a.eventType&Ab?this.manager.emit(this.options.event+"up",a):(this._input.timeStamp=nb(),this.manager.emit(this.options.event,this._input)))}}),j(bb,Z,{defaults:{event:"rotate",threshold:0,pointers:2},getTouchAction:function(){return[bc]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.rotation)>this.options.threshold||this.state&fc)}}),j(cb,Z,{defaults:{event:"swipe",threshold:10,velocity:.65,direction:Hb|Ib,pointers:1},getTouchAction:function(){return $.prototype.getTouchAction.call(this)},attrTest:function(a){var b,c=this.options.direction;return c&(Hb|Ib)?b=a.velocity:c&Hb?b=a.velocityX:c&Ib&&(b=a.velocityY),this._super.attrTest.call(this,a)&&c&a.direction&&a.distance>this.options.threshold&&mb(b)>this.options.velocity&&a.eventType&Ab},emit:function(a){var b=X(a.direction);b&&this.manager.emit(this.options.event+b,a),this.manager.emit(this.options.event,a)}}),j(db,V,{defaults:{event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:2,posThreshold:10},getTouchAction:function(){return[ac]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime<b.time;if(this.reset(),a.eventType&yb&&0===this.count)return this.failTimeout();if(d&&f&&c){if(a.eventType!=Ab)return this.failTimeout();var g=this.pTime?a.timeStamp-this.pTime<b.interval:!0,h=!this.pCenter||I(this.pCenter,a.center)<b.posThreshold;this.pTime=a.timeStamp,this.pCenter=a.center,h&&g?this.count+=1:this.count=1,this._input=a;var i=this.count%b.taps;if(0===i)return this.hasRequireFailures()?(this._timer=e(function(){this.state=ic,this.tryEmit()},b.interval,this),fc):ic}return kc},failTimeout:function(){return this._timer=e(function(){this.state=kc},this.options.interval,this),kc},reset:function(){clearTimeout(this._timer)},emit:function(){this.state==ic&&(this._input.tapCount=this.count,this.manager.emit(this.options.event,this._input))}}),eb.VERSION="2.0.4",eb.defaults={domEvents:!1,touchAction:$b,enable:!0,inputTarget:null,inputClass:null,preset:[[bb,{enable:!1}],[_,{enable:!1},["rotate"]],[cb,{direction:Hb}],[$,{direction:Hb},["swipe"]],[db],[db,{event:"doubletap",taps:2},["tap"]],[ab]],cssProps:{userSelect:"none",touchSelect:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}};var lc=1,mc=2;fb.prototype={set:function(a){return h(this.options,a),a.touchAction&&this.touchAction.update(),a.inputTarget&&(this.input.destroy(),this.input.target=a.inputTarget,this.input.init()),this},stop:function(a){this.session.stopped=a?mc:lc},recognize:function(a){var b=this.session;if(!b.stopped){this.touchAction.preventDefaults(a);var c,d=this.recognizers,e=b.curRecognizer;(!e||e&&e.state&ic)&&(e=b.curRecognizer=null);for(var f=0;f<d.length;)c=d[f],b.stopped===mc||e&&c!=e&&!c.canRecognizeWith(e)?c.reset():c.recognize(a),!e&&c.state&(fc|gc|hc)&&(e=b.curRecognizer=c),f++}},get:function(a){if(a instanceof V)return a;for(var b=this.recognizers,c=0;c<b.length;c++)if(b[c].options.event==a)return b[c];return null},add:function(a){if(f(a,"add",this))return this;var b=this.get(a.options.event);return b&&this.remove(b),this.recognizers.push(a),a.manager=this,this.touchAction.update(),a},remove:function(a){if(f(a,"remove",this))return this;var b=this.recognizers;return a=this.get(a),b.splice(s(b,a),1),this.touchAction.update(),this},on:function(a,b){var c=this.handlers;return g(r(a),function(a){c[a]=c[a]||[],c[a].push(b)}),this},off:function(a,b){var c=this.handlers;return g(r(a),function(a){b?c[a].splice(s(c[a],b),1):delete c[a]}),this},emit:function(a,b){this.options.domEvents&&hb(a,b);var c=this.handlers[a]&&this.handlers[a].slice();if(c&&c.length){b.type=a,b.preventDefault=function(){b.srcEvent.preventDefault()};for(var d=0;d<c.length;)c[d](b),d++}},destroy:function(){this.element&&gb(this,!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}},h(eb,{INPUT_START:yb,INPUT_MOVE:zb,INPUT_END:Ab,INPUT_CANCEL:Bb,STATE_POSSIBLE:ec,STATE_BEGAN:fc,STATE_CHANGED:gc,STATE_ENDED:hc,STATE_RECOGNIZED:ic,STATE_CANCELLED:jc,STATE_FAILED:kc,DIRECTION_NONE:Cb,DIRECTION_LEFT:Db,DIRECTION_RIGHT:Eb,DIRECTION_UP:Fb,DIRECTION_DOWN:Gb,DIRECTION_HORIZONTAL:Hb,DIRECTION_VERTICAL:Ib,DIRECTION_ALL:Jb,Manager:fb,Input:y,TouchAction:T,TouchInput:Q,MouseInput:M,PointerEventInput:N,TouchMouseInput:S,SingleTouchInput:O,Recognizer:V,AttrRecognizer:Z,Tap:db,Pan:$,Swipe:cb,Pinch:_,Rotate:bb,Press:ab,on:n,off:o,each:g,merge:i,extend:h,inherit:j,bindFn:k,prefixed:v}),typeof define==kb&&define.amd?define(function(){return eb}):"undefined"!=typeof module&&module.exports?module.exports=eb:a[c]=eb}(window,document,"Hammer");

},{}],"imagesloaded":[function(require,module,exports){
/*!
 * imagesLoaded PACKAGED v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

(function(){function e(){}function t(e,t){for(var n=e.length;n--;)if(e[n].listener===t)return n;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var i=e.prototype,r=this,o=r.EventEmitter;i.getListeners=function(e){var t,n,i=this._getEvents();if("object"==typeof e){t={};for(n in i)i.hasOwnProperty(n)&&e.test(n)&&(t[n]=i[n])}else t=i[e]||(i[e]=[]);return t},i.flattenListeners=function(e){var t,n=[];for(t=0;e.length>t;t+=1)n.push(e[t].listener);return n},i.getListenersAsObject=function(e){var t,n=this.getListeners(e);return n instanceof Array&&(t={},t[e]=n),t||n},i.addListener=function(e,n){var i,r=this.getListenersAsObject(e),o="object"==typeof n;for(i in r)r.hasOwnProperty(i)&&-1===t(r[i],n)&&r[i].push(o?n:{listener:n,once:!1});return this},i.on=n("addListener"),i.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},i.once=n("addOnceListener"),i.defineEvent=function(e){return this.getListeners(e),this},i.defineEvents=function(e){for(var t=0;e.length>t;t+=1)this.defineEvent(e[t]);return this},i.removeListener=function(e,n){var i,r,o=this.getListenersAsObject(e);for(r in o)o.hasOwnProperty(r)&&(i=t(o[r],n),-1!==i&&o[r].splice(i,1));return this},i.off=n("removeListener"),i.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},i.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},i.manipulateListeners=function(e,t,n){var i,r,o=e?this.removeListener:this.addListener,s=e?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(i=n.length;i--;)o.call(this,t,n[i]);else for(i in t)t.hasOwnProperty(i)&&(r=t[i])&&("function"==typeof r?o.call(this,i,r):s.call(this,i,r));return this},i.removeEvent=function(e){var t,n=typeof e,i=this._getEvents();if("string"===n)delete i[e];else if("object"===n)for(t in i)i.hasOwnProperty(t)&&e.test(t)&&delete i[t];else delete this._events;return this},i.removeAllListeners=n("removeEvent"),i.emitEvent=function(e,t){var n,i,r,o,s=this.getListenersAsObject(e);for(r in s)if(s.hasOwnProperty(r))for(i=s[r].length;i--;)n=s[r][i],n.once===!0&&this.removeListener(e,n.listener),o=n.listener.apply(this,t||[]),o===this._getOnceReturnValue()&&this.removeListener(e,n.listener);return this},i.trigger=n("emitEvent"),i.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},i.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},i._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},i._getEvents=function(){return this._events||(this._events={})},e.noConflict=function(){return r.EventEmitter=o,e},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return e}):"object"==typeof module&&module.exports?module.exports=e:this.EventEmitter=e}).call(this),function(e){function t(t){var n=e.event;return n.target=n.target||n.srcElement||t,n}var n=document.documentElement,i=function(){};n.addEventListener?i=function(e,t,n){e.addEventListener(t,n,!1)}:n.attachEvent&&(i=function(e,n,i){e[n+i]=i.handleEvent?function(){var n=t(e);i.handleEvent.call(i,n)}:function(){var n=t(e);i.call(e,n)},e.attachEvent("on"+n,e[n+i])});var r=function(){};n.removeEventListener?r=function(e,t,n){e.removeEventListener(t,n,!1)}:n.detachEvent&&(r=function(e,t,n){e.detachEvent("on"+t,e[t+n]);try{delete e[t+n]}catch(i){e[t+n]=void 0}});var o={bind:i,unbind:r};"function"==typeof define&&define.amd?define("eventie/eventie",o):e.eventie=o}(this),function(e,t){"function"==typeof define&&define.amd?define(["eventEmitter/EventEmitter","eventie/eventie"],function(n,i){return t(e,n,i)}):"object"==typeof exports?module.exports=t(e,require("wolfy87-eventemitter"),require("eventie")):e.imagesLoaded=t(e,e.EventEmitter,e.eventie)}(window,function(e,t,n){function i(e,t){for(var n in t)e[n]=t[n];return e}function r(e){return"[object Array]"===d.call(e)}function o(e){var t=[];if(r(e))t=e;else if("number"==typeof e.length)for(var n=0,i=e.length;i>n;n++)t.push(e[n]);else t.push(e);return t}function s(e,t,n){if(!(this instanceof s))return new s(e,t);"string"==typeof e&&(e=document.querySelectorAll(e)),this.elements=o(e),this.options=i({},this.options),"function"==typeof t?n=t:i(this.options,t),n&&this.on("always",n),this.getImages(),a&&(this.jqDeferred=new a.Deferred);var r=this;setTimeout(function(){r.check()})}function f(e){this.img=e}function c(e){this.src=e,v[e]=this}var a=e.jQuery,u=e.console,h=u!==void 0,d=Object.prototype.toString;s.prototype=new t,s.prototype.options={},s.prototype.getImages=function(){this.images=[];for(var e=0,t=this.elements.length;t>e;e++){var n=this.elements[e];"IMG"===n.nodeName&&this.addImage(n);var i=n.nodeType;if(i&&(1===i||9===i||11===i))for(var r=n.querySelectorAll("img"),o=0,s=r.length;s>o;o++){var f=r[o];this.addImage(f)}}},s.prototype.addImage=function(e){var t=new f(e);this.images.push(t)},s.prototype.check=function(){function e(e,r){return t.options.debug&&h&&u.log("confirm",e,r),t.progress(e),n++,n===i&&t.complete(),!0}var t=this,n=0,i=this.images.length;if(this.hasAnyBroken=!1,!i)return this.complete(),void 0;for(var r=0;i>r;r++){var o=this.images[r];o.on("confirm",e),o.check()}},s.prototype.progress=function(e){this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded;var t=this;setTimeout(function(){t.emit("progress",t,e),t.jqDeferred&&t.jqDeferred.notify&&t.jqDeferred.notify(t,e)})},s.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";this.isComplete=!0;var t=this;setTimeout(function(){if(t.emit(e,t),t.emit("always",t),t.jqDeferred){var n=t.hasAnyBroken?"reject":"resolve";t.jqDeferred[n](t)}})},a&&(a.fn.imagesLoaded=function(e,t){var n=new s(this,e,t);return n.jqDeferred.promise(a(this))}),f.prototype=new t,f.prototype.check=function(){var e=v[this.img.src]||new c(this.img.src);if(e.isConfirmed)return this.confirm(e.isLoaded,"cached was confirmed"),void 0;if(this.img.complete&&void 0!==this.img.naturalWidth)return this.confirm(0!==this.img.naturalWidth,"naturalWidth"),void 0;var t=this;e.on("confirm",function(e,n){return t.confirm(e.isLoaded,n),!0}),e.check()},f.prototype.confirm=function(e,t){this.isLoaded=e,this.emit("confirm",this,t)};var v={};return c.prototype=new t,c.prototype.check=function(){if(!this.isChecked){var e=new Image;n.bind(e,"load",this),n.bind(e,"error",this),e.src=this.src,this.isChecked=!0}},c.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},c.prototype.onload=function(e){this.confirm(!0,"onload"),this.unbindProxyEvents(e)},c.prototype.onerror=function(e){this.confirm(!1,"onerror"),this.unbindProxyEvents(e)},c.prototype.confirm=function(e,t){this.isConfirmed=!0,this.isLoaded=e,this.emit("confirm",this,t)},c.prototype.unbindProxyEvents=function(e){n.unbind(e.target,"load",this),n.unbind(e.target,"error",this)},s});
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
/*! VelocityJS.org (1.2.2). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License */
/*! VelocityJS.org jQuery Shim (1.0.1). (C) 2014 The jQuery Foundation. MIT @license: en.wikipedia.org/wiki/MIT_License. */
!function(e){function t(e){var t=e.length,r=$.type(e);return"function"===r||$.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===r||0===t||"number"==typeof t&&t>0&&t-1 in e}if(!e.jQuery){var $=function(e,t){return new $.fn.init(e,t)};$.isWindow=function(e){return null!=e&&e==e.window},$.type=function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?a[o.call(e)]||"object":typeof e},$.isArray=Array.isArray||function(e){return"array"===$.type(e)},$.isPlainObject=function(e){var t;if(!e||"object"!==$.type(e)||e.nodeType||$.isWindow(e))return!1;try{if(e.constructor&&!n.call(e,"constructor")&&!n.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(r){return!1}for(t in e);return void 0===t||n.call(e,t)},$.each=function(e,r,a){var n,o=0,i=e.length,s=t(e);if(a){if(s)for(;i>o&&(n=r.apply(e[o],a),n!==!1);o++);else for(o in e)if(n=r.apply(e[o],a),n===!1)break}else if(s)for(;i>o&&(n=r.call(e[o],o,e[o]),n!==!1);o++);else for(o in e)if(n=r.call(e[o],o,e[o]),n===!1)break;return e},$.data=function(e,t,a){if(void 0===a){var n=e[$.expando],o=n&&r[n];if(void 0===t)return o;if(o&&t in o)return o[t]}else if(void 0!==t){var n=e[$.expando]||(e[$.expando]=++$.uuid);return r[n]=r[n]||{},r[n][t]=a,a}},$.removeData=function(e,t){var a=e[$.expando],n=a&&r[a];n&&$.each(t,function(e,t){delete n[t]})},$.extend=function(){var e,t,r,a,n,o,i=arguments[0]||{},s=1,l=arguments.length,u=!1;for("boolean"==typeof i&&(u=i,i=arguments[s]||{},s++),"object"!=typeof i&&"function"!==$.type(i)&&(i={}),s===l&&(i=this,s--);l>s;s++)if(null!=(n=arguments[s]))for(a in n)e=i[a],r=n[a],i!==r&&(u&&r&&($.isPlainObject(r)||(t=$.isArray(r)))?(t?(t=!1,o=e&&$.isArray(e)?e:[]):o=e&&$.isPlainObject(e)?e:{},i[a]=$.extend(u,o,r)):void 0!==r&&(i[a]=r));return i},$.queue=function(e,r,a){function n(e,r){var a=r||[];return null!=e&&(t(Object(e))?!function(e,t){for(var r=+t.length,a=0,n=e.length;r>a;)e[n++]=t[a++];if(r!==r)for(;void 0!==t[a];)e[n++]=t[a++];return e.length=n,e}(a,"string"==typeof e?[e]:e):[].push.call(a,e)),a}if(e){r=(r||"fx")+"queue";var o=$.data(e,r);return a?(!o||$.isArray(a)?o=$.data(e,r,n(a)):o.push(a),o):o||[]}},$.dequeue=function(e,t){$.each(e.nodeType?[e]:e,function(e,r){t=t||"fx";var a=$.queue(r,t),n=a.shift();"inprogress"===n&&(n=a.shift()),n&&("fx"===t&&a.unshift("inprogress"),n.call(r,function(){$.dequeue(r,t)}))})},$.fn=$.prototype={init:function(e){if(e.nodeType)return this[0]=e,this;throw new Error("Not a DOM node.")},offset:function(){var t=this[0].getBoundingClientRect?this[0].getBoundingClientRect():{top:0,left:0};return{top:t.top+(e.pageYOffset||document.scrollTop||0)-(document.clientTop||0),left:t.left+(e.pageXOffset||document.scrollLeft||0)-(document.clientLeft||0)}},position:function(){function e(){for(var e=this.offsetParent||document;e&&"html"===!e.nodeType.toLowerCase&&"static"===e.style.position;)e=e.offsetParent;return e||document}var t=this[0],e=e.apply(t),r=this.offset(),a=/^(?:body|html)$/i.test(e.nodeName)?{top:0,left:0}:$(e).offset();return r.top-=parseFloat(t.style.marginTop)||0,r.left-=parseFloat(t.style.marginLeft)||0,e.style&&(a.top+=parseFloat(e.style.borderTopWidth)||0,a.left+=parseFloat(e.style.borderLeftWidth)||0),{top:r.top-a.top,left:r.left-a.left}}};var r={};$.expando="velocity"+(new Date).getTime(),$.uuid=0;for(var a={},n=a.hasOwnProperty,o=a.toString,i="Boolean Number String Function Array Date RegExp Object Error".split(" "),s=0;s<i.length;s++)a["[object "+i[s]+"]"]=i[s].toLowerCase();$.fn.init.prototype=$.fn,e.Velocity={Utilities:$}}}(window),function(e){"object"==typeof module&&"object"==typeof module.exports?module.exports=e():"function"==typeof define&&define.amd?define(e):e()}(function(){return function(e,t,r,a){function n(e){for(var t=-1,r=e?e.length:0,a=[];++t<r;){var n=e[t];n&&a.push(n)}return a}function o(e){return g.isWrapped(e)?e=[].slice.call(e):g.isNode(e)&&(e=[e]),e}function i(e){var t=$.data(e,"velocity");return null===t?a:t}function s(e){return function(t){return Math.round(t*e)*(1/e)}}function l(e,r,a,n){function o(e,t){return 1-3*t+3*e}function i(e,t){return 3*t-6*e}function s(e){return 3*e}function l(e,t,r){return((o(t,r)*e+i(t,r))*e+s(t))*e}function u(e,t,r){return 3*o(t,r)*e*e+2*i(t,r)*e+s(t)}function c(t,r){for(var n=0;m>n;++n){var o=u(r,e,a);if(0===o)return r;var i=l(r,e,a)-t;r-=i/o}return r}function p(){for(var t=0;b>t;++t)w[t]=l(t*x,e,a)}function f(t,r,n){var o,i,s=0;do i=r+(n-r)/2,o=l(i,e,a)-t,o>0?n=i:r=i;while(Math.abs(o)>h&&++s<v);return i}function d(t){for(var r=0,n=1,o=b-1;n!=o&&w[n]<=t;++n)r+=x;--n;var i=(t-w[n])/(w[n+1]-w[n]),s=r+i*x,l=u(s,e,a);return l>=y?c(t,s):0==l?s:f(t,r,r+x)}function g(){V=!0,(e!=r||a!=n)&&p()}var m=4,y=.001,h=1e-7,v=10,b=11,x=1/(b-1),S="Float32Array"in t;if(4!==arguments.length)return!1;for(var P=0;4>P;++P)if("number"!=typeof arguments[P]||isNaN(arguments[P])||!isFinite(arguments[P]))return!1;e=Math.min(e,1),a=Math.min(a,1),e=Math.max(e,0),a=Math.max(a,0);var w=S?new Float32Array(b):new Array(b),V=!1,C=function(t){return V||g(),e===r&&a===n?t:0===t?0:1===t?1:l(d(t),r,n)};C.getControlPoints=function(){return[{x:e,y:r},{x:a,y:n}]};var T="generateBezier("+[e,r,a,n]+")";return C.toString=function(){return T},C}function u(e,t){var r=e;return g.isString(e)?v.Easings[e]||(r=!1):r=g.isArray(e)&&1===e.length?s.apply(null,e):g.isArray(e)&&2===e.length?b.apply(null,e.concat([t])):g.isArray(e)&&4===e.length?l.apply(null,e):!1,r===!1&&(r=v.Easings[v.defaults.easing]?v.defaults.easing:h),r}function c(e){if(e){var t=(new Date).getTime(),r=v.State.calls.length;r>1e4&&(v.State.calls=n(v.State.calls));for(var o=0;r>o;o++)if(v.State.calls[o]){var s=v.State.calls[o],l=s[0],u=s[2],f=s[3],d=!!f,m=null;f||(f=v.State.calls[o][3]=t-16);for(var y=Math.min((t-f)/u.duration,1),h=0,b=l.length;b>h;h++){var S=l[h],w=S.element;if(i(w)){var V=!1;if(u.display!==a&&null!==u.display&&"none"!==u.display){if("flex"===u.display){var C=["-webkit-box","-moz-box","-ms-flexbox","-webkit-flex"];$.each(C,function(e,t){x.setPropertyValue(w,"display",t)})}x.setPropertyValue(w,"display",u.display)}u.visibility!==a&&"hidden"!==u.visibility&&x.setPropertyValue(w,"visibility",u.visibility);for(var T in S)if("element"!==T){var k=S[T],A,F=g.isString(k.easing)?v.Easings[k.easing]:k.easing;if(1===y)A=k.endValue;else{var E=k.endValue-k.startValue;if(A=k.startValue+E*F(y,u,E),!d&&A===k.currentValue)continue}if(k.currentValue=A,"tween"===T)m=A;else{if(x.Hooks.registered[T]){var j=x.Hooks.getRoot(T),H=i(w).rootPropertyValueCache[j];H&&(k.rootPropertyValue=H)}var N=x.setPropertyValue(w,T,k.currentValue+(0===parseFloat(A)?"":k.unitType),k.rootPropertyValue,k.scrollData);x.Hooks.registered[T]&&(i(w).rootPropertyValueCache[j]=x.Normalizations.registered[j]?x.Normalizations.registered[j]("extract",null,N[1]):N[1]),"transform"===N[0]&&(V=!0)}}u.mobileHA&&i(w).transformCache.translate3d===a&&(i(w).transformCache.translate3d="(0px, 0px, 0px)",V=!0),V&&x.flushTransformCache(w)}}u.display!==a&&"none"!==u.display&&(v.State.calls[o][2].display=!1),u.visibility!==a&&"hidden"!==u.visibility&&(v.State.calls[o][2].visibility=!1),u.progress&&u.progress.call(s[1],s[1],y,Math.max(0,f+u.duration-t),f,m),1===y&&p(o)}}v.State.isTicking&&P(c)}function p(e,t){if(!v.State.calls[e])return!1;for(var r=v.State.calls[e][0],n=v.State.calls[e][1],o=v.State.calls[e][2],s=v.State.calls[e][4],l=!1,u=0,c=r.length;c>u;u++){var p=r[u].element;if(t||o.loop||("none"===o.display&&x.setPropertyValue(p,"display",o.display),"hidden"===o.visibility&&x.setPropertyValue(p,"visibility",o.visibility)),o.loop!==!0&&($.queue(p)[1]===a||!/\.velocityQueueEntryFlag/i.test($.queue(p)[1]))&&i(p)){i(p).isAnimating=!1,i(p).rootPropertyValueCache={};var f=!1;$.each(x.Lists.transforms3D,function(e,t){var r=/^scale/.test(t)?1:0,n=i(p).transformCache[t];i(p).transformCache[t]!==a&&new RegExp("^\\("+r+"[^.]").test(n)&&(f=!0,delete i(p).transformCache[t])}),o.mobileHA&&(f=!0,delete i(p).transformCache.translate3d),f&&x.flushTransformCache(p),x.Values.removeClass(p,"velocity-animating")}if(!t&&o.complete&&!o.loop&&u===c-1)try{o.complete.call(n,n)}catch(d){setTimeout(function(){throw d},1)}s&&o.loop!==!0&&s(n),i(p)&&o.loop===!0&&!t&&($.each(i(p).tweensContainer,function(e,t){/^rotate/.test(e)&&360===parseFloat(t.endValue)&&(t.endValue=0,t.startValue=360),/^backgroundPosition/.test(e)&&100===parseFloat(t.endValue)&&"%"===t.unitType&&(t.endValue=0,t.startValue=100)}),v(p,"reverse",{loop:!0,delay:o.delay})),o.queue!==!1&&$.dequeue(p,o.queue)}v.State.calls[e]=!1;for(var g=0,m=v.State.calls.length;m>g;g++)if(v.State.calls[g]!==!1){l=!0;break}l===!1&&(v.State.isTicking=!1,delete v.State.calls,v.State.calls=[])}var f=function(){if(r.documentMode)return r.documentMode;for(var e=7;e>4;e--){var t=r.createElement("div");if(t.innerHTML="<!--[if IE "+e+"]><span></span><![endif]-->",t.getElementsByTagName("span").length)return t=null,e}return a}(),d=function(){var e=0;return t.webkitRequestAnimationFrame||t.mozRequestAnimationFrame||function(t){var r=(new Date).getTime(),a;return a=Math.max(0,16-(r-e)),e=r+a,setTimeout(function(){t(r+a)},a)}}(),g={isString:function(e){return"string"==typeof e},isArray:Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)},isFunction:function(e){return"[object Function]"===Object.prototype.toString.call(e)},isNode:function(e){return e&&e.nodeType},isNodeList:function(e){return"object"==typeof e&&/^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(e))&&e.length!==a&&(0===e.length||"object"==typeof e[0]&&e[0].nodeType>0)},isWrapped:function(e){return e&&(e.jquery||t.Zepto&&t.Zepto.zepto.isZ(e))},isSVG:function(e){return t.SVGElement&&e instanceof t.SVGElement},isEmptyObject:function(e){for(var t in e)return!1;return!0}},$,m=!1;if(e.fn&&e.fn.jquery?($=e,m=!0):$=t.Velocity.Utilities,8>=f&&!m)throw new Error("Velocity: IE8 and below require jQuery to be loaded before Velocity.");if(7>=f)return void(jQuery.fn.velocity=jQuery.fn.animate);var y=400,h="swing",v={State:{isMobile:/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),isAndroid:/Android/i.test(navigator.userAgent),isGingerbread:/Android 2\.3\.[3-7]/i.test(navigator.userAgent),isChrome:t.chrome,isFirefox:/Firefox/i.test(navigator.userAgent),prefixElement:r.createElement("div"),prefixMatches:{},scrollAnchor:null,scrollPropertyLeft:null,scrollPropertyTop:null,isTicking:!1,calls:[]},CSS:{},Utilities:$,Redirects:{},Easings:{},Promise:t.Promise,defaults:{queue:"",duration:y,easing:h,begin:a,complete:a,progress:a,display:a,visibility:a,loop:!1,delay:!1,mobileHA:!0,_cacheValues:!0},init:function(e){$.data(e,"velocity",{isSVG:g.isSVG(e),isAnimating:!1,computedStyle:null,tweensContainer:null,rootPropertyValueCache:{},transformCache:{}})},hook:null,mock:!1,version:{major:1,minor:2,patch:2},debug:!1};t.pageYOffset!==a?(v.State.scrollAnchor=t,v.State.scrollPropertyLeft="pageXOffset",v.State.scrollPropertyTop="pageYOffset"):(v.State.scrollAnchor=r.documentElement||r.body.parentNode||r.body,v.State.scrollPropertyLeft="scrollLeft",v.State.scrollPropertyTop="scrollTop");var b=function(){function e(e){return-e.tension*e.x-e.friction*e.v}function t(t,r,a){var n={x:t.x+a.dx*r,v:t.v+a.dv*r,tension:t.tension,friction:t.friction};return{dx:n.v,dv:e(n)}}function r(r,a){var n={dx:r.v,dv:e(r)},o=t(r,.5*a,n),i=t(r,.5*a,o),s=t(r,a,i),l=1/6*(n.dx+2*(o.dx+i.dx)+s.dx),u=1/6*(n.dv+2*(o.dv+i.dv)+s.dv);return r.x=r.x+l*a,r.v=r.v+u*a,r}return function a(e,t,n){var o={x:-1,v:0,tension:null,friction:null},i=[0],s=0,l=1e-4,u=.016,c,p,f;for(e=parseFloat(e)||500,t=parseFloat(t)||20,n=n||null,o.tension=e,o.friction=t,c=null!==n,c?(s=a(e,t),p=s/n*u):p=u;;)if(f=r(f||o,p),i.push(1+f.x),s+=16,!(Math.abs(f.x)>l&&Math.abs(f.v)>l))break;return c?function(e){return i[e*(i.length-1)|0]}:s}}();v.Easings={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2},spring:function(e){return 1-Math.cos(4.5*e*Math.PI)*Math.exp(6*-e)}},$.each([["ease",[.25,.1,.25,1]],["ease-in",[.42,0,1,1]],["ease-out",[0,0,.58,1]],["ease-in-out",[.42,0,.58,1]],["easeInSine",[.47,0,.745,.715]],["easeOutSine",[.39,.575,.565,1]],["easeInOutSine",[.445,.05,.55,.95]],["easeInQuad",[.55,.085,.68,.53]],["easeOutQuad",[.25,.46,.45,.94]],["easeInOutQuad",[.455,.03,.515,.955]],["easeInCubic",[.55,.055,.675,.19]],["easeOutCubic",[.215,.61,.355,1]],["easeInOutCubic",[.645,.045,.355,1]],["easeInQuart",[.895,.03,.685,.22]],["easeOutQuart",[.165,.84,.44,1]],["easeInOutQuart",[.77,0,.175,1]],["easeInQuint",[.755,.05,.855,.06]],["easeOutQuint",[.23,1,.32,1]],["easeInOutQuint",[.86,0,.07,1]],["easeInExpo",[.95,.05,.795,.035]],["easeOutExpo",[.19,1,.22,1]],["easeInOutExpo",[1,0,0,1]],["easeInCirc",[.6,.04,.98,.335]],["easeOutCirc",[.075,.82,.165,1]],["easeInOutCirc",[.785,.135,.15,.86]]],function(e,t){v.Easings[t[0]]=l.apply(null,t[1])});var x=v.CSS={RegEx:{isHex:/^#([A-f\d]{3}){1,2}$/i,valueUnwrap:/^[A-z]+\((.*)\)$/i,wrappedValueAlreadyExtracted:/[0-9.]+ [0-9.]+ [0-9.]+( [0-9.]+)?/,valueSplit:/([A-z]+\(.+\))|(([A-z0-9#-.]+?)(?=\s|$))/gi},Lists:{colors:["fill","stroke","stopColor","color","backgroundColor","borderColor","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor","outlineColor"],transformsBase:["translateX","translateY","scale","scaleX","scaleY","skewX","skewY","rotateZ"],transforms3D:["transformPerspective","translateZ","scaleZ","rotateX","rotateY"]},Hooks:{templates:{textShadow:["Color X Y Blur","black 0px 0px 0px"],boxShadow:["Color X Y Blur Spread","black 0px 0px 0px 0px"],clip:["Top Right Bottom Left","0px 0px 0px 0px"],backgroundPosition:["X Y","0% 0%"],transformOrigin:["X Y Z","50% 50% 0px"],perspectiveOrigin:["X Y","50% 50%"]},registered:{},register:function(){for(var e=0;e<x.Lists.colors.length;e++){var t="color"===x.Lists.colors[e]?"0 0 0 1":"255 255 255 1";x.Hooks.templates[x.Lists.colors[e]]=["Red Green Blue Alpha",t]}var r,a,n;if(f)for(r in x.Hooks.templates){a=x.Hooks.templates[r],n=a[0].split(" ");var o=a[1].match(x.RegEx.valueSplit);"Color"===n[0]&&(n.push(n.shift()),o.push(o.shift()),x.Hooks.templates[r]=[n.join(" "),o.join(" ")])}for(r in x.Hooks.templates){a=x.Hooks.templates[r],n=a[0].split(" ");for(var e in n){var i=r+n[e],s=e;x.Hooks.registered[i]=[r,s]}}},getRoot:function(e){var t=x.Hooks.registered[e];return t?t[0]:e},cleanRootPropertyValue:function(e,t){return x.RegEx.valueUnwrap.test(t)&&(t=t.match(x.RegEx.valueUnwrap)[1]),x.Values.isCSSNullValue(t)&&(t=x.Hooks.templates[e][1]),t},extractValue:function(e,t){var r=x.Hooks.registered[e];if(r){var a=r[0],n=r[1];return t=x.Hooks.cleanRootPropertyValue(a,t),t.toString().match(x.RegEx.valueSplit)[n]}return t},injectValue:function(e,t,r){var a=x.Hooks.registered[e];if(a){var n=a[0],o=a[1],i,s;return r=x.Hooks.cleanRootPropertyValue(n,r),i=r.toString().match(x.RegEx.valueSplit),i[o]=t,s=i.join(" ")}return r}},Normalizations:{registered:{clip:function(e,t,r){switch(e){case"name":return"clip";case"extract":var a;return x.RegEx.wrappedValueAlreadyExtracted.test(r)?a=r:(a=r.toString().match(x.RegEx.valueUnwrap),a=a?a[1].replace(/,(\s+)?/g," "):r),a;case"inject":return"rect("+r+")"}},blur:function(e,t,r){switch(e){case"name":return v.State.isFirefox?"filter":"-webkit-filter";case"extract":var a=parseFloat(r);if(!a&&0!==a){var n=r.toString().match(/blur\(([0-9]+[A-z]+)\)/i);a=n?n[1]:0}return a;case"inject":return parseFloat(r)?"blur("+r+")":"none"}},opacity:function(e,t,r){if(8>=f)switch(e){case"name":return"filter";case"extract":var a=r.toString().match(/alpha\(opacity=(.*)\)/i);return r=a?a[1]/100:1;case"inject":return t.style.zoom=1,parseFloat(r)>=1?"":"alpha(opacity="+parseInt(100*parseFloat(r),10)+")"}else switch(e){case"name":return"opacity";case"extract":return r;case"inject":return r}}},register:function(){9>=f||v.State.isGingerbread||(x.Lists.transformsBase=x.Lists.transformsBase.concat(x.Lists.transforms3D));for(var e=0;e<x.Lists.transformsBase.length;e++)!function(){var t=x.Lists.transformsBase[e];x.Normalizations.registered[t]=function(e,r,n){switch(e){case"name":return"transform";case"extract":return i(r)===a||i(r).transformCache[t]===a?/^scale/i.test(t)?1:0:i(r).transformCache[t].replace(/[()]/g,"");case"inject":var o=!1;switch(t.substr(0,t.length-1)){case"translate":o=!/(%|px|em|rem|vw|vh|\d)$/i.test(n);break;case"scal":case"scale":v.State.isAndroid&&i(r).transformCache[t]===a&&1>n&&(n=1),o=!/(\d)$/i.test(n);break;case"skew":o=!/(deg|\d)$/i.test(n);break;case"rotate":o=!/(deg|\d)$/i.test(n)}return o||(i(r).transformCache[t]="("+n+")"),i(r).transformCache[t]}}}();for(var e=0;e<x.Lists.colors.length;e++)!function(){var t=x.Lists.colors[e];x.Normalizations.registered[t]=function(e,r,n){switch(e){case"name":return t;case"extract":var o;if(x.RegEx.wrappedValueAlreadyExtracted.test(n))o=n;else{var i,s={black:"rgb(0, 0, 0)",blue:"rgb(0, 0, 255)",gray:"rgb(128, 128, 128)",green:"rgb(0, 128, 0)",red:"rgb(255, 0, 0)",white:"rgb(255, 255, 255)"};/^[A-z]+$/i.test(n)?i=s[n]!==a?s[n]:s.black:x.RegEx.isHex.test(n)?i="rgb("+x.Values.hexToRgb(n).join(" ")+")":/^rgba?\(/i.test(n)||(i=s.black),o=(i||n).toString().match(x.RegEx.valueUnwrap)[1].replace(/,(\s+)?/g," ")}return 8>=f||3!==o.split(" ").length||(o+=" 1"),o;case"inject":return 8>=f?4===n.split(" ").length&&(n=n.split(/\s+/).slice(0,3).join(" ")):3===n.split(" ").length&&(n+=" 1"),(8>=f?"rgb":"rgba")+"("+n.replace(/\s+/g,",").replace(/\.(\d)+(?=,)/g,"")+")"}}}()}},Names:{camelCase:function(e){return e.replace(/-(\w)/g,function(e,t){return t.toUpperCase()})},SVGAttribute:function(e){var t="width|height|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2";return(f||v.State.isAndroid&&!v.State.isChrome)&&(t+="|transform"),new RegExp("^("+t+")$","i").test(e)},prefixCheck:function(e){if(v.State.prefixMatches[e])return[v.State.prefixMatches[e],!0];for(var t=["","Webkit","Moz","ms","O"],r=0,a=t.length;a>r;r++){var n;if(n=0===r?e:t[r]+e.replace(/^\w/,function(e){return e.toUpperCase()}),g.isString(v.State.prefixElement.style[n]))return v.State.prefixMatches[e]=n,[n,!0]}return[e,!1]}},Values:{hexToRgb:function(e){var t=/^#?([a-f\d])([a-f\d])([a-f\d])$/i,r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,a;return e=e.replace(t,function(e,t,r,a){return t+t+r+r+a+a}),a=r.exec(e),a?[parseInt(a[1],16),parseInt(a[2],16),parseInt(a[3],16)]:[0,0,0]},isCSSNullValue:function(e){return 0==e||/^(none|auto|transparent|(rgba\(0, ?0, ?0, ?0\)))$/i.test(e)},getUnitType:function(e){return/^(rotate|skew)/i.test(e)?"deg":/(^(scale|scaleX|scaleY|scaleZ|alpha|flexGrow|flexHeight|zIndex|fontWeight)$)|((opacity|red|green|blue|alpha)$)/i.test(e)?"":"px"},getDisplayType:function(e){var t=e&&e.tagName.toString().toLowerCase();return/^(b|big|i|small|tt|abbr|acronym|cite|code|dfn|em|kbd|strong|samp|var|a|bdo|br|img|map|object|q|script|span|sub|sup|button|input|label|select|textarea)$/i.test(t)?"inline":/^(li)$/i.test(t)?"list-item":/^(tr)$/i.test(t)?"table-row":/^(table)$/i.test(t)?"table":/^(tbody)$/i.test(t)?"table-row-group":"block"},addClass:function(e,t){e.classList?e.classList.add(t):e.className+=(e.className.length?" ":"")+t},removeClass:function(e,t){e.classList?e.classList.remove(t):e.className=e.className.toString().replace(new RegExp("(^|\\s)"+t.split(" ").join("|")+"(\\s|$)","gi")," ")}},getPropertyValue:function(e,r,n,o){function s(e,r){function n(){u&&x.setPropertyValue(e,"display","none")}var l=0;if(8>=f)l=$.css(e,r);else{var u=!1;if(/^(width|height)$/.test(r)&&0===x.getPropertyValue(e,"display")&&(u=!0,x.setPropertyValue(e,"display",x.Values.getDisplayType(e))),!o){if("height"===r&&"border-box"!==x.getPropertyValue(e,"boxSizing").toString().toLowerCase()){var c=e.offsetHeight-(parseFloat(x.getPropertyValue(e,"borderTopWidth"))||0)-(parseFloat(x.getPropertyValue(e,"borderBottomWidth"))||0)-(parseFloat(x.getPropertyValue(e,"paddingTop"))||0)-(parseFloat(x.getPropertyValue(e,"paddingBottom"))||0);return n(),c}if("width"===r&&"border-box"!==x.getPropertyValue(e,"boxSizing").toString().toLowerCase()){var p=e.offsetWidth-(parseFloat(x.getPropertyValue(e,"borderLeftWidth"))||0)-(parseFloat(x.getPropertyValue(e,"borderRightWidth"))||0)-(parseFloat(x.getPropertyValue(e,"paddingLeft"))||0)-(parseFloat(x.getPropertyValue(e,"paddingRight"))||0);return n(),p}}var d;d=i(e)===a?t.getComputedStyle(e,null):i(e).computedStyle?i(e).computedStyle:i(e).computedStyle=t.getComputedStyle(e,null),"borderColor"===r&&(r="borderTopColor"),l=9===f&&"filter"===r?d.getPropertyValue(r):d[r],(""===l||null===l)&&(l=e.style[r]),n()}if("auto"===l&&/^(top|right|bottom|left)$/i.test(r)){var g=s(e,"position");("fixed"===g||"absolute"===g&&/top|left/i.test(r))&&(l=$(e).position()[r]+"px")}return l}var l;if(x.Hooks.registered[r]){var u=r,c=x.Hooks.getRoot(u);n===a&&(n=x.getPropertyValue(e,x.Names.prefixCheck(c)[0])),x.Normalizations.registered[c]&&(n=x.Normalizations.registered[c]("extract",e,n)),l=x.Hooks.extractValue(u,n)}else if(x.Normalizations.registered[r]){var p,d;p=x.Normalizations.registered[r]("name",e),"transform"!==p&&(d=s(e,x.Names.prefixCheck(p)[0]),x.Values.isCSSNullValue(d)&&x.Hooks.templates[r]&&(d=x.Hooks.templates[r][1])),l=x.Normalizations.registered[r]("extract",e,d)}if(!/^[\d-]/.test(l))if(i(e)&&i(e).isSVG&&x.Names.SVGAttribute(r))if(/^(height|width)$/i.test(r))try{l=e.getBBox()[r]}catch(g){l=0}else l=e.getAttribute(r);else l=s(e,x.Names.prefixCheck(r)[0]);return x.Values.isCSSNullValue(l)&&(l=0),v.debug>=2&&console.log("Get "+r+": "+l),l},setPropertyValue:function(e,r,a,n,o){var s=r;if("scroll"===r)o.container?o.container["scroll"+o.direction]=a:"Left"===o.direction?t.scrollTo(a,o.alternateValue):t.scrollTo(o.alternateValue,a);else if(x.Normalizations.registered[r]&&"transform"===x.Normalizations.registered[r]("name",e))x.Normalizations.registered[r]("inject",e,a),s="transform",a=i(e).transformCache[r];else{if(x.Hooks.registered[r]){var l=r,u=x.Hooks.getRoot(r);n=n||x.getPropertyValue(e,u),a=x.Hooks.injectValue(l,a,n),r=u}if(x.Normalizations.registered[r]&&(a=x.Normalizations.registered[r]("inject",e,a),r=x.Normalizations.registered[r]("name",e)),s=x.Names.prefixCheck(r)[0],8>=f)try{e.style[s]=a}catch(c){v.debug&&console.log("Browser does not support ["+a+"] for ["+s+"]")}else i(e)&&i(e).isSVG&&x.Names.SVGAttribute(r)?e.setAttribute(r,a):e.style[s]=a;v.debug>=2&&console.log("Set "+r+" ("+s+"): "+a)}return[s,a]},flushTransformCache:function(e){function t(t){return parseFloat(x.getPropertyValue(e,t))}var r="";if((f||v.State.isAndroid&&!v.State.isChrome)&&i(e).isSVG){var a={translate:[t("translateX"),t("translateY")],skewX:[t("skewX")],skewY:[t("skewY")],scale:1!==t("scale")?[t("scale"),t("scale")]:[t("scaleX"),t("scaleY")],rotate:[t("rotateZ"),0,0]};$.each(i(e).transformCache,function(e){/^translate/i.test(e)?e="translate":/^scale/i.test(e)?e="scale":/^rotate/i.test(e)&&(e="rotate"),a[e]&&(r+=e+"("+a[e].join(" ")+") ",delete a[e])})}else{var n,o;$.each(i(e).transformCache,function(t){return n=i(e).transformCache[t],"transformPerspective"===t?(o=n,!0):(9===f&&"rotateZ"===t&&(t="rotate"),void(r+=t+n+" "))}),o&&(r="perspective"+o+" "+r)}x.setPropertyValue(e,"transform",r)}};x.Hooks.register(),x.Normalizations.register(),v.hook=function(e,t,r){var n=a;return e=o(e),$.each(e,function(e,o){if(i(o)===a&&v.init(o),r===a)n===a&&(n=v.CSS.getPropertyValue(o,t));else{var s=v.CSS.setPropertyValue(o,t,r);"transform"===s[0]&&v.CSS.flushTransformCache(o),n=s}}),n};var S=function(){function e(){return l?T.promise||null:f}function n(){function e(e){function p(e,t){var r=a,i=a,s=a;return g.isArray(e)?(r=e[0],!g.isArray(e[1])&&/^[\d-]/.test(e[1])||g.isFunction(e[1])||x.RegEx.isHex.test(e[1])?s=e[1]:(g.isString(e[1])&&!x.RegEx.isHex.test(e[1])||g.isArray(e[1]))&&(i=t?e[1]:u(e[1],o.duration),e[2]!==a&&(s=e[2]))):r=e,t||(i=i||o.easing),g.isFunction(r)&&(r=r.call(n,w,P)),g.isFunction(s)&&(s=s.call(n,w,P)),[r||0,i,s]}function f(e,t){var r,a;return a=(t||"0").toString().toLowerCase().replace(/[%A-z]+$/,function(e){return r=e,""}),r||(r=x.Values.getUnitType(e)),[a,r]}function d(){var e={myParent:n.parentNode||r.body,position:x.getPropertyValue(n,"position"),fontSize:x.getPropertyValue(n,"fontSize")},a=e.position===N.lastPosition&&e.myParent===N.lastParent,o=e.fontSize===N.lastFontSize;N.lastParent=e.myParent,N.lastPosition=e.position,N.lastFontSize=e.fontSize;var s=100,l={};if(o&&a)l.emToPx=N.lastEmToPx,l.percentToPxWidth=N.lastPercentToPxWidth,l.percentToPxHeight=N.lastPercentToPxHeight;else{var u=i(n).isSVG?r.createElementNS("http://www.w3.org/2000/svg","rect"):r.createElement("div");v.init(u),e.myParent.appendChild(u),$.each(["overflow","overflowX","overflowY"],function(e,t){v.CSS.setPropertyValue(u,t,"hidden")}),v.CSS.setPropertyValue(u,"position",e.position),v.CSS.setPropertyValue(u,"fontSize",e.fontSize),v.CSS.setPropertyValue(u,"boxSizing","content-box"),$.each(["minWidth","maxWidth","width","minHeight","maxHeight","height"],function(e,t){v.CSS.setPropertyValue(u,t,s+"%")}),v.CSS.setPropertyValue(u,"paddingLeft",s+"em"),l.percentToPxWidth=N.lastPercentToPxWidth=(parseFloat(x.getPropertyValue(u,"width",null,!0))||1)/s,l.percentToPxHeight=N.lastPercentToPxHeight=(parseFloat(x.getPropertyValue(u,"height",null,!0))||1)/s,l.emToPx=N.lastEmToPx=(parseFloat(x.getPropertyValue(u,"paddingLeft"))||1)/s,e.myParent.removeChild(u)}return null===N.remToPx&&(N.remToPx=parseFloat(x.getPropertyValue(r.body,"fontSize"))||16),null===N.vwToPx&&(N.vwToPx=parseFloat(t.innerWidth)/100,N.vhToPx=parseFloat(t.innerHeight)/100),l.remToPx=N.remToPx,l.vwToPx=N.vwToPx,l.vhToPx=N.vhToPx,v.debug>=1&&console.log("Unit ratios: "+JSON.stringify(l),n),l}if(o.begin&&0===w)try{o.begin.call(m,m)}catch(y){setTimeout(function(){throw y},1)}if("scroll"===k){var S=/^x$/i.test(o.axis)?"Left":"Top",V=parseFloat(o.offset)||0,C,A,F;o.container?g.isWrapped(o.container)||g.isNode(o.container)?(o.container=o.container[0]||o.container,C=o.container["scroll"+S],F=C+$(n).position()[S.toLowerCase()]+V):o.container=null:(C=v.State.scrollAnchor[v.State["scrollProperty"+S]],A=v.State.scrollAnchor[v.State["scrollProperty"+("Left"===S?"Top":"Left")]],F=$(n).offset()[S.toLowerCase()]+V),s={scroll:{rootPropertyValue:!1,startValue:C,currentValue:C,endValue:F,unitType:"",easing:o.easing,scrollData:{container:o.container,direction:S,alternateValue:A}},element:n},v.debug&&console.log("tweensContainer (scroll): ",s.scroll,n)}else if("reverse"===k){if(!i(n).tweensContainer)return void $.dequeue(n,o.queue);"none"===i(n).opts.display&&(i(n).opts.display="auto"),"hidden"===i(n).opts.visibility&&(i(n).opts.visibility="visible"),i(n).opts.loop=!1,i(n).opts.begin=null,i(n).opts.complete=null,b.easing||delete o.easing,b.duration||delete o.duration,o=$.extend({},i(n).opts,o);var E=$.extend(!0,{},i(n).tweensContainer);for(var j in E)if("element"!==j){var H=E[j].startValue;E[j].startValue=E[j].currentValue=E[j].endValue,E[j].endValue=H,g.isEmptyObject(b)||(E[j].easing=o.easing),v.debug&&console.log("reverse tweensContainer ("+j+"): "+JSON.stringify(E[j]),n)}s=E}else if("start"===k){var E;i(n).tweensContainer&&i(n).isAnimating===!0&&(E=i(n).tweensContainer),$.each(h,function(e,t){if(RegExp("^"+x.Lists.colors.join("$|^")+"$").test(e)){var r=p(t,!0),n=r[0],o=r[1],i=r[2];if(x.RegEx.isHex.test(n)){for(var s=["Red","Green","Blue"],l=x.Values.hexToRgb(n),u=i?x.Values.hexToRgb(i):a,c=0;c<s.length;c++){var f=[l[c]];o&&f.push(o),u!==a&&f.push(u[c]),h[e+s[c]]=f}delete h[e]}}});for(var R in h){var O=p(h[R]),z=O[0],q=O[1],M=O[2];R=x.Names.camelCase(R);var I=x.Hooks.getRoot(R),B=!1;if(i(n).isSVG||"tween"===I||x.Names.prefixCheck(I)[1]!==!1||x.Normalizations.registered[I]!==a){(o.display!==a&&null!==o.display&&"none"!==o.display||o.visibility!==a&&"hidden"!==o.visibility)&&/opacity|filter/.test(R)&&!M&&0!==z&&(M=0),o._cacheValues&&E&&E[R]?(M===a&&(M=E[R].endValue+E[R].unitType),B=i(n).rootPropertyValueCache[I]):x.Hooks.registered[R]?M===a?(B=x.getPropertyValue(n,I),M=x.getPropertyValue(n,R,B)):B=x.Hooks.templates[I][1]:M===a&&(M=x.getPropertyValue(n,R));var W,G,D,X=!1;if(W=f(R,M),M=W[0],D=W[1],W=f(R,z),z=W[0].replace(/^([+-\/*])=/,function(e,t){return X=t,""}),G=W[1],M=parseFloat(M)||0,z=parseFloat(z)||0,"%"===G&&(/^(fontSize|lineHeight)$/.test(R)?(z/=100,G="em"):/^scale/.test(R)?(z/=100,G=""):/(Red|Green|Blue)$/i.test(R)&&(z=z/100*255,G="")),/[\/*]/.test(X))G=D;else if(D!==G&&0!==M)if(0===z)G=D;else{l=l||d();var Y=/margin|padding|left|right|width|text|word|letter/i.test(R)||/X$/.test(R)||"x"===R?"x":"y";switch(D){case"%":M*="x"===Y?l.percentToPxWidth:l.percentToPxHeight;break;case"px":break;default:M*=l[D+"ToPx"]}switch(G){case"%":M*=1/("x"===Y?l.percentToPxWidth:l.percentToPxHeight);break;case"px":break;default:M*=1/l[G+"ToPx"]}}switch(X){case"+":z=M+z;break;case"-":z=M-z;break;case"*":z=M*z;break;case"/":z=M/z}s[R]={rootPropertyValue:B,startValue:M,currentValue:M,endValue:z,unitType:G,easing:q},v.debug&&console.log("tweensContainer ("+R+"): "+JSON.stringify(s[R]),n)}else v.debug&&console.log("Skipping ["+I+"] due to a lack of browser support.")}s.element=n}s.element&&(x.Values.addClass(n,"velocity-animating"),L.push(s),""===o.queue&&(i(n).tweensContainer=s,i(n).opts=o),i(n).isAnimating=!0,w===P-1?(v.State.calls.push([L,m,o,null,T.resolver]),v.State.isTicking===!1&&(v.State.isTicking=!0,c())):w++)}var n=this,o=$.extend({},v.defaults,b),s={},l;switch(i(n)===a&&v.init(n),parseFloat(o.delay)&&o.queue!==!1&&$.queue(n,o.queue,function(e){v.velocityQueueEntryFlag=!0,i(n).delayTimer={setTimeout:setTimeout(e,parseFloat(o.delay)),next:e}}),o.duration.toString().toLowerCase()){case"fast":o.duration=200;break;case"normal":o.duration=y;break;case"slow":o.duration=600;break;default:o.duration=parseFloat(o.duration)||1}v.mock!==!1&&(v.mock===!0?o.duration=o.delay=1:(o.duration*=parseFloat(v.mock)||1,o.delay*=parseFloat(v.mock)||1)),o.easing=u(o.easing,o.duration),o.begin&&!g.isFunction(o.begin)&&(o.begin=null),o.progress&&!g.isFunction(o.progress)&&(o.progress=null),o.complete&&!g.isFunction(o.complete)&&(o.complete=null),o.display!==a&&null!==o.display&&(o.display=o.display.toString().toLowerCase(),"auto"===o.display&&(o.display=v.CSS.Values.getDisplayType(n))),o.visibility!==a&&null!==o.visibility&&(o.visibility=o.visibility.toString().toLowerCase()),o.mobileHA=o.mobileHA&&v.State.isMobile&&!v.State.isGingerbread,o.queue===!1?o.delay?setTimeout(e,o.delay):e():$.queue(n,o.queue,function(t,r){return r===!0?(T.promise&&T.resolver(m),!0):(v.velocityQueueEntryFlag=!0,void e(t))}),""!==o.queue&&"fx"!==o.queue||"inprogress"===$.queue(n)[0]||$.dequeue(n)}var s=arguments[0]&&(arguments[0].p||$.isPlainObject(arguments[0].properties)&&!arguments[0].properties.names||g.isString(arguments[0].properties)),l,f,d,m,h,b;if(g.isWrapped(this)?(l=!1,d=0,m=this,f=this):(l=!0,d=1,m=s?arguments[0].elements||arguments[0].e:arguments[0]),m=o(m)){s?(h=arguments[0].properties||arguments[0].p,b=arguments[0].options||arguments[0].o):(h=arguments[d],b=arguments[d+1]);var P=m.length,w=0;if(!/^(stop|finish)$/i.test(h)&&!$.isPlainObject(b)){var V=d+1;b={};for(var C=V;C<arguments.length;C++)g.isArray(arguments[C])||!/^(fast|normal|slow)$/i.test(arguments[C])&&!/^\d/.test(arguments[C])?g.isString(arguments[C])||g.isArray(arguments[C])?b.easing=arguments[C]:g.isFunction(arguments[C])&&(b.complete=arguments[C]):b.duration=arguments[C]}var T={promise:null,resolver:null,rejecter:null};l&&v.Promise&&(T.promise=new v.Promise(function(e,t){T.resolver=e,T.rejecter=t}));var k;switch(h){case"scroll":k="scroll";break;case"reverse":k="reverse";break;case"finish":case"stop":$.each(m,function(e,t){i(t)&&i(t).delayTimer&&(clearTimeout(i(t).delayTimer.setTimeout),i(t).delayTimer.next&&i(t).delayTimer.next(),delete i(t).delayTimer)});var A=[];return $.each(v.State.calls,function(e,t){t&&$.each(t[1],function(r,n){var o=b===a?"":b;return o===!0||t[2].queue===o||b===a&&t[2].queue===!1?void $.each(m,function(r,a){a===n&&((b===!0||g.isString(b))&&($.each($.queue(a,g.isString(b)?b:""),function(e,t){g.isFunction(t)&&t(null,!0)}),$.queue(a,g.isString(b)?b:"",[])),"stop"===h?(i(a)&&i(a).tweensContainer&&o!==!1&&$.each(i(a).tweensContainer,function(e,t){t.endValue=t.currentValue
}),A.push(e)):"finish"===h&&(t[2].duration=1))}):!0})}),"stop"===h&&($.each(A,function(e,t){p(t,!0)}),T.promise&&T.resolver(m)),e();default:if(!$.isPlainObject(h)||g.isEmptyObject(h)){if(g.isString(h)&&v.Redirects[h]){var F=$.extend({},b),E=F.duration,j=F.delay||0;return F.backwards===!0&&(m=$.extend(!0,[],m).reverse()),$.each(m,function(e,t){parseFloat(F.stagger)?F.delay=j+parseFloat(F.stagger)*e:g.isFunction(F.stagger)&&(F.delay=j+F.stagger.call(t,e,P)),F.drag&&(F.duration=parseFloat(E)||(/^(callout|transition)/.test(h)?1e3:y),F.duration=Math.max(F.duration*(F.backwards?1-e/P:(e+1)/P),.75*F.duration,200)),v.Redirects[h].call(t,t,F||{},e,P,m,T.promise?T:a)}),e()}var H="Velocity: First argument ("+h+") was not a property map, a known action, or a registered redirect. Aborting.";return T.promise?T.rejecter(new Error(H)):console.log(H),e()}k="start"}var N={lastParent:null,lastPosition:null,lastFontSize:null,lastPercentToPxWidth:null,lastPercentToPxHeight:null,lastEmToPx:null,remToPx:null,vwToPx:null,vhToPx:null},L=[];$.each(m,function(e,t){g.isNode(t)&&n.call(t)});var F=$.extend({},v.defaults,b),R;if(F.loop=parseInt(F.loop),R=2*F.loop-1,F.loop)for(var O=0;R>O;O++){var z={delay:F.delay,progress:F.progress};O===R-1&&(z.display=F.display,z.visibility=F.visibility,z.complete=F.complete),S(m,"reverse",z)}return e()}};v=$.extend(S,v),v.animate=S;var P=t.requestAnimationFrame||d;return v.State.isMobile||r.hidden===a||r.addEventListener("visibilitychange",function(){r.hidden?(P=function(e){return setTimeout(function(){e(!0)},16)},c()):P=t.requestAnimationFrame||d}),e.Velocity=v,e!==t&&(e.fn.velocity=S,e.fn.velocity.defaults=v.defaults),$.each(["Down","Up"],function(e,t){v.Redirects["slide"+t]=function(e,r,n,o,i,s){var l=$.extend({},r),u=l.begin,c=l.complete,p={height:"",marginTop:"",marginBottom:"",paddingTop:"",paddingBottom:""},f={};l.display===a&&(l.display="Down"===t?"inline"===v.CSS.Values.getDisplayType(e)?"inline-block":"block":"none"),l.begin=function(){u&&u.call(i,i);for(var r in p){f[r]=e.style[r];var a=v.CSS.getPropertyValue(e,r);p[r]="Down"===t?[a,0]:[0,a]}f.overflow=e.style.overflow,e.style.overflow="hidden"},l.complete=function(){for(var t in f)e.style[t]=f[t];c&&c.call(i,i),s&&s.resolver(i)},v(e,p,l)}}),$.each(["In","Out"],function(e,t){v.Redirects["fade"+t]=function(e,r,n,o,i,s){var l=$.extend({},r),u={opacity:"In"===t?1:0},c=l.complete;l.complete=n!==o-1?l.begin=null:function(){c&&c.call(i,i),s&&s.resolver(i)},l.display===a&&(l.display="In"===t?"auto":"none"),v(this,u,l)}}),v}(window.jQuery||window.Zepto||window,window,document)});
},{}]},{},[7]);
