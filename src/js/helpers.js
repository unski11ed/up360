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