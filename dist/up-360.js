(function(window, document, exportName, undefined) {
    "use strict";
    var VENDOR_PREFIXES = [ "", "webkit", "moz", "MS", "ms", "o" ];
    var TEST_ELEMENT = document.createElement("div");
    var TYPE_FUNCTION = "function";
    var round = Math.round;
    var abs = Math.abs;
    var now = Date.now;
    function setTimeoutContext(fn, timeout, context) {
        return setTimeout(bindFn(fn, context), timeout);
    }
    function invokeArrayArg(arg, fn, context) {
        if (Array.isArray(arg)) {
            each(arg, context[fn], context);
            return true;
        }
        return false;
    }
    function each(obj, iterator, context) {
        var i;
        if (!obj) {
            return;
        }
        if (obj.forEach) {
            obj.forEach(iterator, context);
        } else if (obj.length !== undefined) {
            i = 0;
            while (i < obj.length) {
                iterator.call(context, obj[i], i, obj);
                i++;
            }
        } else {
            for (i in obj) {
                obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
            }
        }
    }
    function extend(dest, src, merge) {
        var keys = Object.keys(src);
        var i = 0;
        while (i < keys.length) {
            if (!merge || merge && dest[keys[i]] === undefined) {
                dest[keys[i]] = src[keys[i]];
            }
            i++;
        }
        return dest;
    }
    function merge(dest, src) {
        return extend(dest, src, true);
    }
    function inherit(child, base, properties) {
        var baseP = base.prototype, childP;
        childP = child.prototype = Object.create(baseP);
        childP.constructor = child;
        childP._super = baseP;
        if (properties) {
            extend(childP, properties);
        }
    }
    function bindFn(fn, context) {
        return function boundFn() {
            return fn.apply(context, arguments);
        };
    }
    function boolOrFn(val, args) {
        if (typeof val == TYPE_FUNCTION) {
            return val.apply(args ? args[0] || undefined : undefined, args);
        }
        return val;
    }
    function ifUndefined(val1, val2) {
        return val1 === undefined ? val2 : val1;
    }
    function addEventListeners(target, types, handler) {
        each(splitStr(types), function(type) {
            target.addEventListener(type, handler, false);
        });
    }
    function removeEventListeners(target, types, handler) {
        each(splitStr(types), function(type) {
            target.removeEventListener(type, handler, false);
        });
    }
    function hasParent(node, parent) {
        while (node) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }
    function inStr(str, find) {
        return str.indexOf(find) > -1;
    }
    function splitStr(str) {
        return str.trim().split(/\s+/g);
    }
    function inArray(src, find, findByKey) {
        if (src.indexOf && !findByKey) {
            return src.indexOf(find);
        } else {
            var i = 0;
            while (i < src.length) {
                if (findByKey && src[i][findByKey] == find || !findByKey && src[i] === find) {
                    return i;
                }
                i++;
            }
            return -1;
        }
    }
    function toArray(obj) {
        return Array.prototype.slice.call(obj, 0);
    }
    function uniqueArray(src, key, sort) {
        var results = [];
        var values = [];
        var i = 0;
        while (i < src.length) {
            var val = key ? src[i][key] : src[i];
            if (inArray(values, val) < 0) {
                results.push(src[i]);
            }
            values[i] = val;
            i++;
        }
        if (sort) {
            if (!key) {
                results = results.sort();
            } else {
                results = results.sort(function sortUniqueArray(a, b) {
                    return a[key] > b[key];
                });
            }
        }
        return results;
    }
    function prefixed(obj, property) {
        var prefix, prop;
        var camelProp = property[0].toUpperCase() + property.slice(1);
        var i = 0;
        while (i < VENDOR_PREFIXES.length) {
            prefix = VENDOR_PREFIXES[i];
            prop = prefix ? prefix + camelProp : property;
            if (prop in obj) {
                return prop;
            }
            i++;
        }
        return undefined;
    }
    var _uniqueId = 1;
    function uniqueId() {
        return _uniqueId++;
    }
    function getWindowForElement(element) {
        var doc = element.ownerDocument;
        return doc.defaultView || doc.parentWindow;
    }
    var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
    var SUPPORT_TOUCH = "ontouchstart" in window;
    var SUPPORT_POINTER_EVENTS = prefixed(window, "PointerEvent") !== undefined;
    var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);
    var INPUT_TYPE_TOUCH = "touch";
    var INPUT_TYPE_PEN = "pen";
    var INPUT_TYPE_MOUSE = "mouse";
    var INPUT_TYPE_KINECT = "kinect";
    var COMPUTE_INTERVAL = 25;
    var INPUT_START = 1;
    var INPUT_MOVE = 2;
    var INPUT_END = 4;
    var INPUT_CANCEL = 8;
    var DIRECTION_NONE = 1;
    var DIRECTION_LEFT = 2;
    var DIRECTION_RIGHT = 4;
    var DIRECTION_UP = 8;
    var DIRECTION_DOWN = 16;
    var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
    var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
    var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;
    var PROPS_XY = [ "x", "y" ];
    var PROPS_CLIENT_XY = [ "clientX", "clientY" ];
    function Input(manager, callback) {
        var self = this;
        this.manager = manager;
        this.callback = callback;
        this.element = manager.element;
        this.target = manager.options.inputTarget;
        this.domHandler = function(ev) {
            if (boolOrFn(manager.options.enable, [ manager ])) {
                self.handler(ev);
            }
        };
        this.init();
    }
    Input.prototype = {
        handler: function() {},
        init: function() {
            this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
            this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
            this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
        },
        destroy: function() {
            this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
            this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
            this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
        }
    };
    function createInputInstance(manager) {
        var Type;
        var inputClass = manager.options.inputClass;
        if (inputClass) {
            Type = inputClass;
        } else if (SUPPORT_POINTER_EVENTS) {
            Type = PointerEventInput;
        } else if (SUPPORT_ONLY_TOUCH) {
            Type = TouchInput;
        } else if (!SUPPORT_TOUCH) {
            Type = MouseInput;
        } else {
            Type = TouchMouseInput;
        }
        return new Type(manager, inputHandler);
    }
    function inputHandler(manager, eventType, input) {
        var pointersLen = input.pointers.length;
        var changedPointersLen = input.changedPointers.length;
        var isFirst = eventType & INPUT_START && pointersLen - changedPointersLen === 0;
        var isFinal = eventType & (INPUT_END | INPUT_CANCEL) && pointersLen - changedPointersLen === 0;
        input.isFirst = !!isFirst;
        input.isFinal = !!isFinal;
        if (isFirst) {
            manager.session = {};
        }
        input.eventType = eventType;
        computeInputData(manager, input);
        manager.emit("hammer.input", input);
        manager.recognize(input);
        manager.session.prevInput = input;
    }
    function computeInputData(manager, input) {
        var session = manager.session;
        var pointers = input.pointers;
        var pointersLength = pointers.length;
        if (!session.firstInput) {
            session.firstInput = simpleCloneInputData(input);
        }
        if (pointersLength > 1 && !session.firstMultiple) {
            session.firstMultiple = simpleCloneInputData(input);
        } else if (pointersLength === 1) {
            session.firstMultiple = false;
        }
        var firstInput = session.firstInput;
        var firstMultiple = session.firstMultiple;
        var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;
        var center = input.center = getCenter(pointers);
        input.timeStamp = now();
        input.deltaTime = input.timeStamp - firstInput.timeStamp;
        input.angle = getAngle(offsetCenter, center);
        input.distance = getDistance(offsetCenter, center);
        computeDeltaXY(session, input);
        input.offsetDirection = getDirection(input.deltaX, input.deltaY);
        input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
        input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;
        computeIntervalInputData(session, input);
        var target = manager.element;
        if (hasParent(input.srcEvent.target, target)) {
            target = input.srcEvent.target;
        }
        input.target = target;
    }
    function computeDeltaXY(session, input) {
        var center = input.center;
        var offset = session.offsetDelta || {};
        var prevDelta = session.prevDelta || {};
        var prevInput = session.prevInput || {};
        if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
            prevDelta = session.prevDelta = {
                x: prevInput.deltaX || 0,
                y: prevInput.deltaY || 0
            };
            offset = session.offsetDelta = {
                x: center.x,
                y: center.y
            };
        }
        input.deltaX = prevDelta.x + (center.x - offset.x);
        input.deltaY = prevDelta.y + (center.y - offset.y);
    }
    function computeIntervalInputData(session, input) {
        var last = session.lastInterval || input, deltaTime = input.timeStamp - last.timeStamp, velocity, velocityX, velocityY, direction;
        if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
            var deltaX = last.deltaX - input.deltaX;
            var deltaY = last.deltaY - input.deltaY;
            var v = getVelocity(deltaTime, deltaX, deltaY);
            velocityX = v.x;
            velocityY = v.y;
            velocity = abs(v.x) > abs(v.y) ? v.x : v.y;
            direction = getDirection(deltaX, deltaY);
            session.lastInterval = input;
        } else {
            velocity = last.velocity;
            velocityX = last.velocityX;
            velocityY = last.velocityY;
            direction = last.direction;
        }
        input.velocity = velocity;
        input.velocityX = velocityX;
        input.velocityY = velocityY;
        input.direction = direction;
    }
    function simpleCloneInputData(input) {
        var pointers = [];
        var i = 0;
        while (i < input.pointers.length) {
            pointers[i] = {
                clientX: round(input.pointers[i].clientX),
                clientY: round(input.pointers[i].clientY)
            };
            i++;
        }
        return {
            timeStamp: now(),
            pointers: pointers,
            center: getCenter(pointers),
            deltaX: input.deltaX,
            deltaY: input.deltaY
        };
    }
    function getCenter(pointers) {
        var pointersLength = pointers.length;
        if (pointersLength === 1) {
            return {
                x: round(pointers[0].clientX),
                y: round(pointers[0].clientY)
            };
        }
        var x = 0, y = 0, i = 0;
        while (i < pointersLength) {
            x += pointers[i].clientX;
            y += pointers[i].clientY;
            i++;
        }
        return {
            x: round(x / pointersLength),
            y: round(y / pointersLength)
        };
    }
    function getVelocity(deltaTime, x, y) {
        return {
            x: x / deltaTime || 0,
            y: y / deltaTime || 0
        };
    }
    function getDirection(x, y) {
        if (x === y) {
            return DIRECTION_NONE;
        }
        if (abs(x) >= abs(y)) {
            return x > 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
        }
        return y > 0 ? DIRECTION_UP : DIRECTION_DOWN;
    }
    function getDistance(p1, p2, props) {
        if (!props) {
            props = PROPS_XY;
        }
        var x = p2[props[0]] - p1[props[0]], y = p2[props[1]] - p1[props[1]];
        return Math.sqrt(x * x + y * y);
    }
    function getAngle(p1, p2, props) {
        if (!props) {
            props = PROPS_XY;
        }
        var x = p2[props[0]] - p1[props[0]], y = p2[props[1]] - p1[props[1]];
        return Math.atan2(y, x) * 180 / Math.PI;
    }
    function getRotation(start, end) {
        return getAngle(end[1], end[0], PROPS_CLIENT_XY) - getAngle(start[1], start[0], PROPS_CLIENT_XY);
    }
    function getScale(start, end) {
        return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
    }
    var MOUSE_INPUT_MAP = {
        mousedown: INPUT_START,
        mousemove: INPUT_MOVE,
        mouseup: INPUT_END
    };
    var MOUSE_ELEMENT_EVENTS = "mousedown";
    var MOUSE_WINDOW_EVENTS = "mousemove mouseup";
    function MouseInput() {
        this.evEl = MOUSE_ELEMENT_EVENTS;
        this.evWin = MOUSE_WINDOW_EVENTS;
        this.allow = true;
        this.pressed = false;
        Input.apply(this, arguments);
    }
    inherit(MouseInput, Input, {
        handler: function MEhandler(ev) {
            var eventType = MOUSE_INPUT_MAP[ev.type];
            if (eventType & INPUT_START && ev.button === 0) {
                this.pressed = true;
            }
            if (eventType & INPUT_MOVE && ev.which !== 1) {
                eventType = INPUT_END;
            }
            if (!this.pressed || !this.allow) {
                return;
            }
            if (eventType & INPUT_END) {
                this.pressed = false;
            }
            this.callback(this.manager, eventType, {
                pointers: [ ev ],
                changedPointers: [ ev ],
                pointerType: INPUT_TYPE_MOUSE,
                srcEvent: ev
            });
        }
    });
    var POINTER_INPUT_MAP = {
        pointerdown: INPUT_START,
        pointermove: INPUT_MOVE,
        pointerup: INPUT_END,
        pointercancel: INPUT_CANCEL,
        pointerout: INPUT_CANCEL
    };
    var IE10_POINTER_TYPE_ENUM = {
        2: INPUT_TYPE_TOUCH,
        3: INPUT_TYPE_PEN,
        4: INPUT_TYPE_MOUSE,
        5: INPUT_TYPE_KINECT
    };
    var POINTER_ELEMENT_EVENTS = "pointerdown";
    var POINTER_WINDOW_EVENTS = "pointermove pointerup pointercancel";
    if (window.MSPointerEvent) {
        POINTER_ELEMENT_EVENTS = "MSPointerDown";
        POINTER_WINDOW_EVENTS = "MSPointerMove MSPointerUp MSPointerCancel";
    }
    function PointerEventInput() {
        this.evEl = POINTER_ELEMENT_EVENTS;
        this.evWin = POINTER_WINDOW_EVENTS;
        Input.apply(this, arguments);
        this.store = this.manager.session.pointerEvents = [];
    }
    inherit(PointerEventInput, Input, {
        handler: function PEhandler(ev) {
            var store = this.store;
            var removePointer = false;
            var eventTypeNormalized = ev.type.toLowerCase().replace("ms", "");
            var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
            var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;
            var isTouch = pointerType == INPUT_TYPE_TOUCH;
            var storeIndex = inArray(store, ev.pointerId, "pointerId");
            if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
                if (storeIndex < 0) {
                    store.push(ev);
                    storeIndex = store.length - 1;
                }
            } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
                removePointer = true;
            }
            if (storeIndex < 0) {
                return;
            }
            store[storeIndex] = ev;
            this.callback(this.manager, eventType, {
                pointers: store,
                changedPointers: [ ev ],
                pointerType: pointerType,
                srcEvent: ev
            });
            if (removePointer) {
                store.splice(storeIndex, 1);
            }
        }
    });
    var SINGLE_TOUCH_INPUT_MAP = {
        touchstart: INPUT_START,
        touchmove: INPUT_MOVE,
        touchend: INPUT_END,
        touchcancel: INPUT_CANCEL
    };
    var SINGLE_TOUCH_TARGET_EVENTS = "touchstart";
    var SINGLE_TOUCH_WINDOW_EVENTS = "touchstart touchmove touchend touchcancel";
    function SingleTouchInput() {
        this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
        this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
        this.started = false;
        Input.apply(this, arguments);
    }
    inherit(SingleTouchInput, Input, {
        handler: function TEhandler(ev) {
            var type = SINGLE_TOUCH_INPUT_MAP[ev.type];
            if (type === INPUT_START) {
                this.started = true;
            }
            if (!this.started) {
                return;
            }
            var touches = normalizeSingleTouches.call(this, ev, type);
            if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
                this.started = false;
            }
            this.callback(this.manager, type, {
                pointers: touches[0],
                changedPointers: touches[1],
                pointerType: INPUT_TYPE_TOUCH,
                srcEvent: ev
            });
        }
    });
    function normalizeSingleTouches(ev, type) {
        var all = toArray(ev.touches);
        var changed = toArray(ev.changedTouches);
        if (type & (INPUT_END | INPUT_CANCEL)) {
            all = uniqueArray(all.concat(changed), "identifier", true);
        }
        return [ all, changed ];
    }
    var TOUCH_INPUT_MAP = {
        touchstart: INPUT_START,
        touchmove: INPUT_MOVE,
        touchend: INPUT_END,
        touchcancel: INPUT_CANCEL
    };
    var TOUCH_TARGET_EVENTS = "touchstart touchmove touchend touchcancel";
    function TouchInput() {
        this.evTarget = TOUCH_TARGET_EVENTS;
        this.targetIds = {};
        Input.apply(this, arguments);
    }
    inherit(TouchInput, Input, {
        handler: function MTEhandler(ev) {
            var type = TOUCH_INPUT_MAP[ev.type];
            var touches = getTouches.call(this, ev, type);
            if (!touches) {
                return;
            }
            this.callback(this.manager, type, {
                pointers: touches[0],
                changedPointers: touches[1],
                pointerType: INPUT_TYPE_TOUCH,
                srcEvent: ev
            });
        }
    });
    function getTouches(ev, type) {
        var allTouches = toArray(ev.touches);
        var targetIds = this.targetIds;
        if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
            targetIds[allTouches[0].identifier] = true;
            return [ allTouches, allTouches ];
        }
        var i, targetTouches, changedTouches = toArray(ev.changedTouches), changedTargetTouches = [], target = this.target;
        targetTouches = allTouches.filter(function(touch) {
            return hasParent(touch.target, target);
        });
        if (type === INPUT_START) {
            i = 0;
            while (i < targetTouches.length) {
                targetIds[targetTouches[i].identifier] = true;
                i++;
            }
        }
        i = 0;
        while (i < changedTouches.length) {
            if (targetIds[changedTouches[i].identifier]) {
                changedTargetTouches.push(changedTouches[i]);
            }
            if (type & (INPUT_END | INPUT_CANCEL)) {
                delete targetIds[changedTouches[i].identifier];
            }
            i++;
        }
        if (!changedTargetTouches.length) {
            return;
        }
        return [ uniqueArray(targetTouches.concat(changedTargetTouches), "identifier", true), changedTargetTouches ];
    }
    function TouchMouseInput() {
        Input.apply(this, arguments);
        var handler = bindFn(this.handler, this);
        this.touch = new TouchInput(this.manager, handler);
        this.mouse = new MouseInput(this.manager, handler);
    }
    inherit(TouchMouseInput, Input, {
        handler: function TMEhandler(manager, inputEvent, inputData) {
            var isTouch = inputData.pointerType == INPUT_TYPE_TOUCH, isMouse = inputData.pointerType == INPUT_TYPE_MOUSE;
            if (isTouch) {
                this.mouse.allow = false;
            } else if (isMouse && !this.mouse.allow) {
                return;
            }
            if (inputEvent & (INPUT_END | INPUT_CANCEL)) {
                this.mouse.allow = true;
            }
            this.callback(manager, inputEvent, inputData);
        },
        destroy: function destroy() {
            this.touch.destroy();
            this.mouse.destroy();
        }
    });
    var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, "touchAction");
    var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;
    var TOUCH_ACTION_COMPUTE = "compute";
    var TOUCH_ACTION_AUTO = "auto";
    var TOUCH_ACTION_MANIPULATION = "manipulation";
    var TOUCH_ACTION_NONE = "none";
    var TOUCH_ACTION_PAN_X = "pan-x";
    var TOUCH_ACTION_PAN_Y = "pan-y";
    function TouchAction(manager, value) {
        this.manager = manager;
        this.set(value);
    }
    TouchAction.prototype = {
        set: function(value) {
            if (value == TOUCH_ACTION_COMPUTE) {
                value = this.compute();
            }
            if (NATIVE_TOUCH_ACTION) {
                this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
            }
            this.actions = value.toLowerCase().trim();
        },
        update: function() {
            this.set(this.manager.options.touchAction);
        },
        compute: function() {
            var actions = [];
            each(this.manager.recognizers, function(recognizer) {
                if (boolOrFn(recognizer.options.enable, [ recognizer ])) {
                    actions = actions.concat(recognizer.getTouchAction());
                }
            });
            return cleanTouchActions(actions.join(" "));
        },
        preventDefaults: function(input) {
            if (NATIVE_TOUCH_ACTION) {
                return;
            }
            var srcEvent = input.srcEvent;
            var direction = input.offsetDirection;
            if (this.manager.session.prevented) {
                srcEvent.preventDefault();
                return;
            }
            var actions = this.actions;
            var hasNone = inStr(actions, TOUCH_ACTION_NONE);
            var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
            var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
            if (hasNone || hasPanY && direction & DIRECTION_HORIZONTAL || hasPanX && direction & DIRECTION_VERTICAL) {
                return this.preventSrc(srcEvent);
            }
        },
        preventSrc: function(srcEvent) {
            this.manager.session.prevented = true;
            srcEvent.preventDefault();
        }
    };
    function cleanTouchActions(actions) {
        if (inStr(actions, TOUCH_ACTION_NONE)) {
            return TOUCH_ACTION_NONE;
        }
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
        if (hasPanX && hasPanY) {
            return TOUCH_ACTION_PAN_X + " " + TOUCH_ACTION_PAN_Y;
        }
        if (hasPanX || hasPanY) {
            return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
        }
        if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
            return TOUCH_ACTION_MANIPULATION;
        }
        return TOUCH_ACTION_AUTO;
    }
    var STATE_POSSIBLE = 1;
    var STATE_BEGAN = 2;
    var STATE_CHANGED = 4;
    var STATE_ENDED = 8;
    var STATE_RECOGNIZED = STATE_ENDED;
    var STATE_CANCELLED = 16;
    var STATE_FAILED = 32;
    function Recognizer(options) {
        this.id = uniqueId();
        this.manager = null;
        this.options = merge(options || {}, this.defaults);
        this.options.enable = ifUndefined(this.options.enable, true);
        this.state = STATE_POSSIBLE;
        this.simultaneous = {};
        this.requireFail = [];
    }
    Recognizer.prototype = {
        defaults: {},
        set: function(options) {
            extend(this.options, options);
            this.manager && this.manager.touchAction.update();
            return this;
        },
        recognizeWith: function(otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, "recognizeWith", this)) {
                return this;
            }
            var simultaneous = this.simultaneous;
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            if (!simultaneous[otherRecognizer.id]) {
                simultaneous[otherRecognizer.id] = otherRecognizer;
                otherRecognizer.recognizeWith(this);
            }
            return this;
        },
        dropRecognizeWith: function(otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, "dropRecognizeWith", this)) {
                return this;
            }
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            delete this.simultaneous[otherRecognizer.id];
            return this;
        },
        requireFailure: function(otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, "requireFailure", this)) {
                return this;
            }
            var requireFail = this.requireFail;
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            if (inArray(requireFail, otherRecognizer) === -1) {
                requireFail.push(otherRecognizer);
                otherRecognizer.requireFailure(this);
            }
            return this;
        },
        dropRequireFailure: function(otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, "dropRequireFailure", this)) {
                return this;
            }
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            var index = inArray(this.requireFail, otherRecognizer);
            if (index > -1) {
                this.requireFail.splice(index, 1);
            }
            return this;
        },
        hasRequireFailures: function() {
            return this.requireFail.length > 0;
        },
        canRecognizeWith: function(otherRecognizer) {
            return !!this.simultaneous[otherRecognizer.id];
        },
        emit: function(input) {
            var self = this;
            var state = this.state;
            function emit(withState) {
                self.manager.emit(self.options.event + (withState ? stateStr(state) : ""), input);
            }
            if (state < STATE_ENDED) {
                emit(true);
            }
            emit();
            if (state >= STATE_ENDED) {
                emit(true);
            }
        },
        tryEmit: function(input) {
            if (this.canEmit()) {
                return this.emit(input);
            }
            this.state = STATE_FAILED;
        },
        canEmit: function() {
            var i = 0;
            while (i < this.requireFail.length) {
                if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                    return false;
                }
                i++;
            }
            return true;
        },
        recognize: function(inputData) {
            var inputDataClone = extend({}, inputData);
            if (!boolOrFn(this.options.enable, [ this, inputDataClone ])) {
                this.reset();
                this.state = STATE_FAILED;
                return;
            }
            if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
                this.state = STATE_POSSIBLE;
            }
            this.state = this.process(inputDataClone);
            if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
                this.tryEmit(inputDataClone);
            }
        },
        process: function(inputData) {},
        getTouchAction: function() {},
        reset: function() {}
    };
    function stateStr(state) {
        if (state & STATE_CANCELLED) {
            return "cancel";
        } else if (state & STATE_ENDED) {
            return "end";
        } else if (state & STATE_CHANGED) {
            return "move";
        } else if (state & STATE_BEGAN) {
            return "start";
        }
        return "";
    }
    function directionStr(direction) {
        if (direction == DIRECTION_DOWN) {
            return "down";
        } else if (direction == DIRECTION_UP) {
            return "up";
        } else if (direction == DIRECTION_LEFT) {
            return "left";
        } else if (direction == DIRECTION_RIGHT) {
            return "right";
        }
        return "";
    }
    function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
        var manager = recognizer.manager;
        if (manager) {
            return manager.get(otherRecognizer);
        }
        return otherRecognizer;
    }
    function AttrRecognizer() {
        Recognizer.apply(this, arguments);
    }
    inherit(AttrRecognizer, Recognizer, {
        defaults: {
            pointers: 1
        },
        attrTest: function(input) {
            var optionPointers = this.options.pointers;
            return optionPointers === 0 || input.pointers.length === optionPointers;
        },
        process: function(input) {
            var state = this.state;
            var eventType = input.eventType;
            var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
            var isValid = this.attrTest(input);
            if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
                return state | STATE_CANCELLED;
            } else if (isRecognized || isValid) {
                if (eventType & INPUT_END) {
                    return state | STATE_ENDED;
                } else if (!(state & STATE_BEGAN)) {
                    return STATE_BEGAN;
                }
                return state | STATE_CHANGED;
            }
            return STATE_FAILED;
        }
    });
    function PanRecognizer() {
        AttrRecognizer.apply(this, arguments);
        this.pX = null;
        this.pY = null;
    }
    inherit(PanRecognizer, AttrRecognizer, {
        defaults: {
            event: "pan",
            threshold: 10,
            pointers: 1,
            direction: DIRECTION_ALL
        },
        getTouchAction: function() {
            var direction = this.options.direction;
            var actions = [];
            if (direction & DIRECTION_HORIZONTAL) {
                actions.push(TOUCH_ACTION_PAN_Y);
            }
            if (direction & DIRECTION_VERTICAL) {
                actions.push(TOUCH_ACTION_PAN_X);
            }
            return actions;
        },
        directionTest: function(input) {
            var options = this.options;
            var hasMoved = true;
            var distance = input.distance;
            var direction = input.direction;
            var x = input.deltaX;
            var y = input.deltaY;
            if (!(direction & options.direction)) {
                if (options.direction & DIRECTION_HORIZONTAL) {
                    direction = x === 0 ? DIRECTION_NONE : x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
                    hasMoved = x != this.pX;
                    distance = Math.abs(input.deltaX);
                } else {
                    direction = y === 0 ? DIRECTION_NONE : y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
                    hasMoved = y != this.pY;
                    distance = Math.abs(input.deltaY);
                }
            }
            input.direction = direction;
            return hasMoved && distance > options.threshold && direction & options.direction;
        },
        attrTest: function(input) {
            return AttrRecognizer.prototype.attrTest.call(this, input) && (this.state & STATE_BEGAN || !(this.state & STATE_BEGAN) && this.directionTest(input));
        },
        emit: function(input) {
            this.pX = input.deltaX;
            this.pY = input.deltaY;
            var direction = directionStr(input.direction);
            if (direction) {
                this.manager.emit(this.options.event + direction, input);
            }
            this._super.emit.call(this, input);
        }
    });
    function PinchRecognizer() {
        AttrRecognizer.apply(this, arguments);
    }
    inherit(PinchRecognizer, AttrRecognizer, {
        defaults: {
            event: "pinch",
            threshold: 0,
            pointers: 2
        },
        getTouchAction: function() {
            return [ TOUCH_ACTION_NONE ];
        },
        attrTest: function(input) {
            return this._super.attrTest.call(this, input) && (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
        },
        emit: function(input) {
            this._super.emit.call(this, input);
            if (input.scale !== 1) {
                var inOut = input.scale < 1 ? "in" : "out";
                this.manager.emit(this.options.event + inOut, input);
            }
        }
    });
    function PressRecognizer() {
        Recognizer.apply(this, arguments);
        this._timer = null;
        this._input = null;
    }
    inherit(PressRecognizer, Recognizer, {
        defaults: {
            event: "press",
            pointers: 1,
            time: 500,
            threshold: 5
        },
        getTouchAction: function() {
            return [ TOUCH_ACTION_AUTO ];
        },
        process: function(input) {
            var options = this.options;
            var validPointers = input.pointers.length === options.pointers;
            var validMovement = input.distance < options.threshold;
            var validTime = input.deltaTime > options.time;
            this._input = input;
            if (!validMovement || !validPointers || input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime) {
                this.reset();
            } else if (input.eventType & INPUT_START) {
                this.reset();
                this._timer = setTimeoutContext(function() {
                    this.state = STATE_RECOGNIZED;
                    this.tryEmit();
                }, options.time, this);
            } else if (input.eventType & INPUT_END) {
                return STATE_RECOGNIZED;
            }
            return STATE_FAILED;
        },
        reset: function() {
            clearTimeout(this._timer);
        },
        emit: function(input) {
            if (this.state !== STATE_RECOGNIZED) {
                return;
            }
            if (input && input.eventType & INPUT_END) {
                this.manager.emit(this.options.event + "up", input);
            } else {
                this._input.timeStamp = now();
                this.manager.emit(this.options.event, this._input);
            }
        }
    });
    function RotateRecognizer() {
        AttrRecognizer.apply(this, arguments);
    }
    inherit(RotateRecognizer, AttrRecognizer, {
        defaults: {
            event: "rotate",
            threshold: 0,
            pointers: 2
        },
        getTouchAction: function() {
            return [ TOUCH_ACTION_NONE ];
        },
        attrTest: function(input) {
            return this._super.attrTest.call(this, input) && (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
        }
    });
    function SwipeRecognizer() {
        AttrRecognizer.apply(this, arguments);
    }
    inherit(SwipeRecognizer, AttrRecognizer, {
        defaults: {
            event: "swipe",
            threshold: 10,
            velocity: .65,
            direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
            pointers: 1
        },
        getTouchAction: function() {
            return PanRecognizer.prototype.getTouchAction.call(this);
        },
        attrTest: function(input) {
            var direction = this.options.direction;
            var velocity;
            if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
                velocity = input.velocity;
            } else if (direction & DIRECTION_HORIZONTAL) {
                velocity = input.velocityX;
            } else if (direction & DIRECTION_VERTICAL) {
                velocity = input.velocityY;
            }
            return this._super.attrTest.call(this, input) && direction & input.direction && input.distance > this.options.threshold && abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
        },
        emit: function(input) {
            var direction = directionStr(input.direction);
            if (direction) {
                this.manager.emit(this.options.event + direction, input);
            }
            this.manager.emit(this.options.event, input);
        }
    });
    function TapRecognizer() {
        Recognizer.apply(this, arguments);
        this.pTime = false;
        this.pCenter = false;
        this._timer = null;
        this._input = null;
        this.count = 0;
    }
    inherit(TapRecognizer, Recognizer, {
        defaults: {
            event: "tap",
            pointers: 1,
            taps: 1,
            interval: 300,
            time: 250,
            threshold: 2,
            posThreshold: 10
        },
        getTouchAction: function() {
            return [ TOUCH_ACTION_MANIPULATION ];
        },
        process: function(input) {
            var options = this.options;
            var validPointers = input.pointers.length === options.pointers;
            var validMovement = input.distance < options.threshold;
            var validTouchTime = input.deltaTime < options.time;
            this.reset();
            if (input.eventType & INPUT_START && this.count === 0) {
                return this.failTimeout();
            }
            if (validMovement && validTouchTime && validPointers) {
                if (input.eventType != INPUT_END) {
                    return this.failTimeout();
                }
                var validInterval = this.pTime ? input.timeStamp - this.pTime < options.interval : true;
                var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;
                this.pTime = input.timeStamp;
                this.pCenter = input.center;
                if (!validMultiTap || !validInterval) {
                    this.count = 1;
                } else {
                    this.count += 1;
                }
                this._input = input;
                var tapCount = this.count % options.taps;
                if (tapCount === 0) {
                    if (!this.hasRequireFailures()) {
                        return STATE_RECOGNIZED;
                    } else {
                        this._timer = setTimeoutContext(function() {
                            this.state = STATE_RECOGNIZED;
                            this.tryEmit();
                        }, options.interval, this);
                        return STATE_BEGAN;
                    }
                }
            }
            return STATE_FAILED;
        },
        failTimeout: function() {
            this._timer = setTimeoutContext(function() {
                this.state = STATE_FAILED;
            }, this.options.interval, this);
            return STATE_FAILED;
        },
        reset: function() {
            clearTimeout(this._timer);
        },
        emit: function() {
            if (this.state == STATE_RECOGNIZED) {
                this._input.tapCount = this.count;
                this.manager.emit(this.options.event, this._input);
            }
        }
    });
    function Hammer(element, options) {
        options = options || {};
        options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
        return new Manager(element, options);
    }
    Hammer.VERSION = "2.0.4";
    Hammer.defaults = {
        domEvents: false,
        touchAction: TOUCH_ACTION_COMPUTE,
        enable: true,
        inputTarget: null,
        inputClass: null,
        preset: [ [ RotateRecognizer, {
            enable: false
        } ], [ PinchRecognizer, {
            enable: false
        }, [ "rotate" ] ], [ SwipeRecognizer, {
            direction: DIRECTION_HORIZONTAL
        } ], [ PanRecognizer, {
            direction: DIRECTION_HORIZONTAL
        }, [ "swipe" ] ], [ TapRecognizer ], [ TapRecognizer, {
            event: "doubletap",
            taps: 2
        }, [ "tap" ] ], [ PressRecognizer ] ],
        cssProps: {
            userSelect: "none",
            touchSelect: "none",
            touchCallout: "none",
            contentZooming: "none",
            userDrag: "none",
            tapHighlightColor: "rgba(0,0,0,0)"
        }
    };
    var STOP = 1;
    var FORCED_STOP = 2;
    function Manager(element, options) {
        options = options || {};
        this.options = merge(options, Hammer.defaults);
        this.options.inputTarget = this.options.inputTarget || element;
        this.handlers = {};
        this.session = {};
        this.recognizers = [];
        this.element = element;
        this.input = createInputInstance(this);
        this.touchAction = new TouchAction(this, this.options.touchAction);
        toggleCssProps(this, true);
        each(options.recognizers, function(item) {
            var recognizer = this.add(new item[0](item[1]));
            item[2] && recognizer.recognizeWith(item[2]);
            item[3] && recognizer.requireFailure(item[3]);
        }, this);
    }
    Manager.prototype = {
        set: function(options) {
            extend(this.options, options);
            if (options.touchAction) {
                this.touchAction.update();
            }
            if (options.inputTarget) {
                this.input.destroy();
                this.input.target = options.inputTarget;
                this.input.init();
            }
            return this;
        },
        stop: function(force) {
            this.session.stopped = force ? FORCED_STOP : STOP;
        },
        recognize: function(inputData) {
            var session = this.session;
            if (session.stopped) {
                return;
            }
            this.touchAction.preventDefaults(inputData);
            var recognizer;
            var recognizers = this.recognizers;
            var curRecognizer = session.curRecognizer;
            if (!curRecognizer || curRecognizer && curRecognizer.state & STATE_RECOGNIZED) {
                curRecognizer = session.curRecognizer = null;
            }
            var i = 0;
            while (i < recognizers.length) {
                recognizer = recognizers[i];
                if (session.stopped !== FORCED_STOP && (!curRecognizer || recognizer == curRecognizer || recognizer.canRecognizeWith(curRecognizer))) {
                    recognizer.recognize(inputData);
                } else {
                    recognizer.reset();
                }
                if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                    curRecognizer = session.curRecognizer = recognizer;
                }
                i++;
            }
        },
        get: function(recognizer) {
            if (recognizer instanceof Recognizer) {
                return recognizer;
            }
            var recognizers = this.recognizers;
            for (var i = 0; i < recognizers.length; i++) {
                if (recognizers[i].options.event == recognizer) {
                    return recognizers[i];
                }
            }
            return null;
        },
        add: function(recognizer) {
            if (invokeArrayArg(recognizer, "add", this)) {
                return this;
            }
            var existing = this.get(recognizer.options.event);
            if (existing) {
                this.remove(existing);
            }
            this.recognizers.push(recognizer);
            recognizer.manager = this;
            this.touchAction.update();
            return recognizer;
        },
        remove: function(recognizer) {
            if (invokeArrayArg(recognizer, "remove", this)) {
                return this;
            }
            var recognizers = this.recognizers;
            recognizer = this.get(recognizer);
            recognizers.splice(inArray(recognizers, recognizer), 1);
            this.touchAction.update();
            return this;
        },
        on: function(events, handler) {
            var handlers = this.handlers;
            each(splitStr(events), function(event) {
                handlers[event] = handlers[event] || [];
                handlers[event].push(handler);
            });
            return this;
        },
        off: function(events, handler) {
            var handlers = this.handlers;
            each(splitStr(events), function(event) {
                if (!handler) {
                    delete handlers[event];
                } else {
                    handlers[event].splice(inArray(handlers[event], handler), 1);
                }
            });
            return this;
        },
        emit: function(event, data) {
            if (this.options.domEvents) {
                triggerDomEvent(event, data);
            }
            var handlers = this.handlers[event] && this.handlers[event].slice();
            if (!handlers || !handlers.length) {
                return;
            }
            data.type = event;
            data.preventDefault = function() {
                data.srcEvent.preventDefault();
            };
            var i = 0;
            while (i < handlers.length) {
                handlers[i](data);
                i++;
            }
        },
        destroy: function() {
            this.element && toggleCssProps(this, false);
            this.handlers = {};
            this.session = {};
            this.input.destroy();
            this.element = null;
        }
    };
    function toggleCssProps(manager, add) {
        var element = manager.element;
        each(manager.options.cssProps, function(value, name) {
            element.style[prefixed(element.style, name)] = add ? value : "";
        });
    }
    function triggerDomEvent(event, data) {
        var gestureEvent = document.createEvent("Event");
        gestureEvent.initEvent(event, true, true);
        gestureEvent.gesture = data;
        data.target.dispatchEvent(gestureEvent);
    }
    extend(Hammer, {
        INPUT_START: INPUT_START,
        INPUT_MOVE: INPUT_MOVE,
        INPUT_END: INPUT_END,
        INPUT_CANCEL: INPUT_CANCEL,
        STATE_POSSIBLE: STATE_POSSIBLE,
        STATE_BEGAN: STATE_BEGAN,
        STATE_CHANGED: STATE_CHANGED,
        STATE_ENDED: STATE_ENDED,
        STATE_RECOGNIZED: STATE_RECOGNIZED,
        STATE_CANCELLED: STATE_CANCELLED,
        STATE_FAILED: STATE_FAILED,
        DIRECTION_NONE: DIRECTION_NONE,
        DIRECTION_LEFT: DIRECTION_LEFT,
        DIRECTION_RIGHT: DIRECTION_RIGHT,
        DIRECTION_UP: DIRECTION_UP,
        DIRECTION_DOWN: DIRECTION_DOWN,
        DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
        DIRECTION_VERTICAL: DIRECTION_VERTICAL,
        DIRECTION_ALL: DIRECTION_ALL,
        Manager: Manager,
        Input: Input,
        TouchAction: TouchAction,
        TouchInput: TouchInput,
        MouseInput: MouseInput,
        PointerEventInput: PointerEventInput,
        TouchMouseInput: TouchMouseInput,
        SingleTouchInput: SingleTouchInput,
        Recognizer: Recognizer,
        AttrRecognizer: AttrRecognizer,
        Tap: TapRecognizer,
        Pan: PanRecognizer,
        Swipe: SwipeRecognizer,
        Pinch: PinchRecognizer,
        Rotate: RotateRecognizer,
        Press: PressRecognizer,
        on: addEventListeners,
        off: removeEventListeners,
        each: each,
        merge: merge,
        extend: extend,
        inherit: inherit,
        bindFn: bindFn,
        prefixed: prefixed
    });
    if (typeof define == TYPE_FUNCTION && define.amd) {
        define(function() {
            return Hammer;
        });
    } else if (typeof module != "undefined" && module.exports) {
        module.exports = Hammer;
    } else {
        window[exportName] = Hammer;
    }
})(window, document, "Hammer");

(function(window, factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([ "eventEmitter/EventEmitter", "eventie/eventie" ], function(EventEmitter, eventie) {
            return factory(window, EventEmitter, eventie);
        });
    } else if (typeof exports === "object") {
        module.exports = factory(window, require("wolfy87-eventemitter"), require("eventie"));
    } else {
        window.imagesLoaded = factory(window, window.EventEmitter, window.eventie);
    }
})(window, function factory(window, EventEmitter, eventie) {
    "use strict";
    var $ = window.jQuery;
    var console = window.console;
    var hasConsole = typeof console !== "undefined";
    function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    }
    var objToString = Object.prototype.toString;
    function isArray(obj) {
        return objToString.call(obj) === "[object Array]";
    }
    function makeArray(obj) {
        var ary = [];
        if (isArray(obj)) {
            ary = obj;
        } else if (typeof obj.length === "number") {
            for (var i = 0, len = obj.length; i < len; i++) {
                ary.push(obj[i]);
            }
        } else {
            ary.push(obj);
        }
        return ary;
    }
    function ImagesLoaded(elem, options, onAlways) {
        if (!(this instanceof ImagesLoaded)) {
            return new ImagesLoaded(elem, options);
        }
        if (typeof elem === "string") {
            elem = document.querySelectorAll(elem);
        }
        this.elements = makeArray(elem);
        this.options = extend({}, this.options);
        if (typeof options === "function") {
            onAlways = options;
        } else {
            extend(this.options, options);
        }
        if (onAlways) {
            this.on("always", onAlways);
        }
        this.getImages();
        if ($) {
            this.jqDeferred = new $.Deferred();
        }
        var _this = this;
        setTimeout(function() {
            _this.check();
        });
    }
    ImagesLoaded.prototype = new EventEmitter();
    ImagesLoaded.prototype.options = {};
    ImagesLoaded.prototype.getImages = function() {
        this.images = [];
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var elem = this.elements[i];
            if (elem.nodeName === "IMG") {
                this.addImage(elem);
            }
            var nodeType = elem.nodeType;
            if (!nodeType || !(nodeType === 1 || nodeType === 9 || nodeType === 11)) {
                continue;
            }
            var childElems = elem.querySelectorAll("img");
            for (var j = 0, jLen = childElems.length; j < jLen; j++) {
                var img = childElems[j];
                this.addImage(img);
            }
        }
    };
    ImagesLoaded.prototype.addImage = function(img) {
        var loadingImage = new LoadingImage(img);
        this.images.push(loadingImage);
    };
    ImagesLoaded.prototype.check = function() {
        var _this = this;
        var checkedCount = 0;
        var length = this.images.length;
        this.hasAnyBroken = false;
        if (!length) {
            this.complete();
            return;
        }
        function onConfirm(image, message) {
            if (_this.options.debug && hasConsole) {
                console.log("confirm", image, message);
            }
            _this.progress(image);
            checkedCount++;
            if (checkedCount === length) {
                _this.complete();
            }
            return true;
        }
        for (var i = 0; i < length; i++) {
            var loadingImage = this.images[i];
            loadingImage.on("confirm", onConfirm);
            loadingImage.check();
        }
    };
    ImagesLoaded.prototype.progress = function(image) {
        this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
        var _this = this;
        setTimeout(function() {
            _this.emit("progress", _this, image);
            if (_this.jqDeferred && _this.jqDeferred.notify) {
                _this.jqDeferred.notify(_this, image);
            }
        });
    };
    ImagesLoaded.prototype.complete = function() {
        var eventName = this.hasAnyBroken ? "fail" : "done";
        this.isComplete = true;
        var _this = this;
        setTimeout(function() {
            _this.emit(eventName, _this);
            _this.emit("always", _this);
            if (_this.jqDeferred) {
                var jqMethod = _this.hasAnyBroken ? "reject" : "resolve";
                _this.jqDeferred[jqMethod](_this);
            }
        });
    };
    if ($) {
        $.fn.imagesLoaded = function(options, callback) {
            var instance = new ImagesLoaded(this, options, callback);
            return instance.jqDeferred.promise($(this));
        };
    }
    function LoadingImage(img) {
        this.img = img;
    }
    LoadingImage.prototype = new EventEmitter();
    LoadingImage.prototype.check = function() {
        var resource = cache[this.img.src] || new Resource(this.img.src);
        if (resource.isConfirmed) {
            this.confirm(resource.isLoaded, "cached was confirmed");
            return;
        }
        if (this.img.complete && this.img.naturalWidth !== undefined) {
            this.confirm(this.img.naturalWidth !== 0, "naturalWidth");
            return;
        }
        var _this = this;
        resource.on("confirm", function(resrc, message) {
            _this.confirm(resrc.isLoaded, message);
            return true;
        });
        resource.check();
    };
    LoadingImage.prototype.confirm = function(isLoaded, message) {
        this.isLoaded = isLoaded;
        this.emit("confirm", this, message);
    };
    var cache = {};
    function Resource(src) {
        this.src = src;
        cache[src] = this;
    }
    Resource.prototype = new EventEmitter();
    Resource.prototype.check = function() {
        if (this.isChecked) {
            return;
        }
        var proxyImage = new Image();
        eventie.bind(proxyImage, "load", this);
        eventie.bind(proxyImage, "error", this);
        proxyImage.src = this.src;
        this.isChecked = true;
    };
    Resource.prototype.handleEvent = function(event) {
        var method = "on" + event.type;
        if (this[method]) {
            this[method](event);
        }
    };
    Resource.prototype.onload = function(event) {
        this.confirm(true, "onload");
        this.unbindProxyEvents(event);
    };
    Resource.prototype.onerror = function(event) {
        this.confirm(false, "onerror");
        this.unbindProxyEvents(event);
    };
    Resource.prototype.confirm = function(isLoaded, message) {
        this.isConfirmed = true;
        this.isLoaded = isLoaded;
        this.emit("confirm", this, message);
    };
    Resource.prototype.unbindProxyEvents = function(event) {
        eventie.unbind(event.target, "load", this);
        eventie.unbind(event.target, "error", this);
    };
    return ImagesLoaded;
});

(function() {
    "use strict";
    var isCommonjs = typeof module !== "undefined" && module.exports;
    var keyboardAllowed = typeof Element !== "undefined" && "ALLOW_KEYBOARD_INPUT" in Element;
    var fn = function() {
        var val;
        var valLength;
        var fnMap = [ [ "requestFullscreen", "exitFullscreen", "fullscreenElement", "fullscreenEnabled", "fullscreenchange", "fullscreenerror" ], [ "webkitRequestFullscreen", "webkitExitFullscreen", "webkitFullscreenElement", "webkitFullscreenEnabled", "webkitfullscreenchange", "webkitfullscreenerror" ], [ "webkitRequestFullScreen", "webkitCancelFullScreen", "webkitCurrentFullScreenElement", "webkitCancelFullScreen", "webkitfullscreenchange", "webkitfullscreenerror" ], [ "mozRequestFullScreen", "mozCancelFullScreen", "mozFullScreenElement", "mozFullScreenEnabled", "mozfullscreenchange", "mozfullscreenerror" ], [ "msRequestFullscreen", "msExitFullscreen", "msFullscreenElement", "msFullscreenEnabled", "MSFullscreenChange", "MSFullscreenError" ] ];
        var i = 0;
        var l = fnMap.length;
        var ret = {};
        for (;i < l; i++) {
            val = fnMap[i];
            if (val && val[1] in document) {
                for (i = 0, valLength = val.length; i < valLength; i++) {
                    ret[fnMap[0][i]] = val[i];
                }
                return ret;
            }
        }
        return false;
    }();
    var screenfull = {
        request: function(elem) {
            var request = fn.requestFullscreen;
            elem = elem || document.documentElement;
            if (/5\.1[\.\d]* Safari/.test(navigator.userAgent)) {
                elem[request]();
            } else {
                elem[request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);
            }
        },
        exit: function() {
            document[fn.exitFullscreen]();
        },
        toggle: function(elem) {
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
            get: function() {
                return !!document[fn.fullscreenElement];
            }
        },
        element: {
            enumerable: true,
            get: function() {
                return document[fn.fullscreenElement];
            }
        },
        enabled: {
            enumerable: true,
            get: function() {
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

var up360 = up360 || {};

up360.Helpers = up360.Helpers || {};

up360.Helpers.isMobile = {
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
        return this.Android() || this.BlackBerry() || this.iOS() || this.Opera() || this.Windows();
    }
};

var up360 = up360 || {};

up360.Rendering = up360.Rendering || {};

up360.Rendering.Engine = function(parentElement, settings) {
    var defaultFrameWidth, defaultFrameHeight, screen, touch, content, lowResContent, highResContent, lastActiveLowResImage;
    var currentLevelObject, highestLevelObject, currentFrame, sourceRectangle, imageRepository, startFramesLoader, zoomValue, minZoomValue, _scale, posX = 0, posY = 0, mousePosX = 0, mousePosY = 0, isMouseOnScreen = false, screenRectangle, contentWidth, contentHeight, defaultScreenStyle = null, defaultMinimumZoom = 0, InterfaceObject, _this = this, moveRedrawTimeout;
    this.ZoomNormalized = 0;
    this.Init = function() {
        currentLevelObject = settings.levelObjects[0];
        highestLevelObject = settings.levelObjects[settings.levelObjects.length - 1];
        currentFrame = settings.minFrame;
        minZoomValue = currentLevelObject.width / highestLevelObject.width;
        zoomValue = settings.minZoom;
        sourceRectangle = new up360.Helpers.Rectangle(0, 0, defaultFrameWidth, defaultFrameHeight);
        imageRepository = new up360.Rendering.ImageRepository(settings, currentLevelObject, settings.forceReload);
        startFramesLoader = new up360.Rendering.StartFramesLoader(imageRepository, settings, function() {
            screenRectangle.Update();
            _this.Draw();
            scaleContentToScreen();
            centerContent();
            updateCss();
            settings.onInitComplete.Trigger(_this);
        });
        setUpDOM();
        screenRectangle = new up360.Helpers.ScreenRectangle(screen);
        defaultFrameWidth = screenRectangle.Width;
        defaultFrameHeight = screenRectangle.Height;
        contentWidth = content.offsetWidth;
        contentHeight = content.offsetHeight;
        touch.addEventListener("mousemove", function(e) {
            mousePosX = e.pageX - screen.offsetLeft;
            mousePosY = e.pageY - screen.offsetTop;
        });
        touch.addEventListener("mouseenter", function() {
            isMouseOnScreen = true;
        });
        touch.addEventListener("mouseleave", function() {
            isMouseOnScreen = false;
        });
    };
    this.Dispose = function() {
        InterfaceObject = null;
        imageRepository.dispose();
        resetDOM();
    };
    this.Load = function() {
        switch (settings.loadSettings.type) {
          case "lazy":
            startFramesLoader.lazyLoader(settings.loadSettings);
            break;

          case "default":
          default:
            startFramesLoader.immediateLoader();
            break;
        }
        if (settings.loadSettings.type == "lazy") startFramesLoader.lazyLoader;
    };
    this.SwitchFrame = function(options) {
        if (options.destination !== undefined) {
            currentFrame = Math.round(options.destination);
            currentFrame = currentFrame > settings.maxFrame ? settings.minFrame : currentFrame;
            currentFrame = currentFrame < settings.minFrame ? settings.maxFrame : currentFrame;
            clearScreen();
            _this.Draw({
                lowRes: true
            });
        } else if (options.delta !== undefined) {
            this.SwitchFrame({
                destination: currentFrame + options.delta
            });
        }
        settings.onFrameChanged.Trigger(currentFrame);
    };
    this.UpdateSize = function() {
        screenRectangle.Update();
        sourceRectangle.width = screenRectangle.Width;
        sourceRectangle.height = screenRectangle.Height;
        scaleContentToScreen();
        correctPosition();
        centerContent();
        _this.Draw();
        updateCss();
    };
    this.Move = function(options) {
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
            moveRedrawTimeout = setTimeout(function() {
                _this.Draw({
                    lowRes: false
                });
            }, 100);
        }
    };
    this.Zoom = function(options) {
        if (options !== undefined) {
            if (options.destination !== undefined) zoomTo(options.destination);
            if (options.delta !== undefined) zoomTo(zoomValue + options.delta);
            if (options.normalized !== undefined) zoomTo((settings.maxZoom - settings.minZoom) * options.normalized + settings.minZoom);
        } else {
            return zoomValue;
        }
    };
    this.Draw = function(options) {
        var isLowRes = options !== undefined && options.lowRes;
        var levelObject = isLowRes ? settings.levelObjects[0] : currentLevelObject;
        var contentRectangle = getContentRect();
        var scale = getScale();
        var chunkRender = function(x, y, levelObject) {
            var partWidth = contentWidth / levelObject.columns, partHeight = contentHeight / levelObject.rows;
            var tempRect = {
                sx: partWidth * scale * x + contentRectangle.left,
                sy: partHeight * scale * y + contentRectangle.top,
                width: partWidth * scale,
                height: partHeight * scale
            };
            var offset = y * levelObject.columns + x;
            var isLowLevelObject = levelObject === settings.levelObjects[0];
            if (sourceRectangle.intersects(tempRect) || isLowLevelObject) {
                imageRepository.getImage(currentFrame, offset, levelObject, function(loadedFromCache) {
                    var image = this;
                    if ((image.parentElement === null || !loadedFromCache) && isLowLevelObject) return;
                    if (image.dataset.frameIndex != currentFrame) return;
                    image.style.left = partWidth * x + "px";
                    image.style.top = partHeight * y + "px";
                    image.style.zIndex = levelObject.zoomThreshold;
                    image.setAttribute("width", partWidth);
                    image.setAttribute("height", partHeight);
                    if (levelObject.zoomThreshold <= 1) {
                        lastActiveLowResImage.classList.remove("low-active");
                        image.classList.add("low-active");
                        lastActiveLowResImage = image;
                        settings.onDrawFrame.Trigger(currentFrame, !isLowRes, image.src);
                    } else {
                        if (highResContent.childNodes.indexOf(image) < 0) {
                            highResContent.appendChild(image);
                        }
                    }
                }, isLowLevelObject);
            }
        };
        chunkRender(0, 0, settings.levelObjects[0]);
        if (!isLowRes && levelObject !== settings.levelObjects[0]) {
            for (var y = 0; y < levelObject.rows; y++) for (var x = 0; x < levelObject.columns; x++) {
                chunkRender(x, y, levelObject);
            }
        }
    };
    this.GetContentPosition = function() {
        return {
            Left: contentPosition.X(),
            Top: contentPosition.Y(),
            Width: contentPosition.Width(),
            Height: contentPosition.Height()
        };
    };
    this.CenterContent = centerContent;
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
        X: function(value) {
            if (value != undefined) {
                posX = value - contentWidth * (1 - getScale()) / 2;
                settings.onContentMoved.Trigger(value, contentPosition.Y());
            } else {
                return posX + contentWidth * (1 - getScale()) / 2;
            }
        },
        Y: function(value) {
            if (value != undefined) {
                posY = value - contentHeight * (1 - getScale()) / 2;
                settings.onContentMoved.Trigger(contentPosition.X(), value);
            } else {
                return posY + contentHeight * (1 - getScale()) / 2;
            }
        },
        Width: function() {
            var rect = getContentRect();
            return rect.width;
        },
        Height: function() {
            var rect = getContentRect();
            return rect.height;
        }
    };
    function setUpDOM() {
        touch = document.createElement("div");
        touch.classList.add("up360-touch");
        screen = document.createElement("div");
        screen.classList.add("up360-screen");
        parentElement.appendChild(screen);
        parentElement.appendChild(touch);
        content = document.createElement("div");
        content.classList.add("up360-content");
        content.style.width = highestLevelObject.width + "px";
        content.style.height = highestLevelObject.height + "px";
        lowResContent = document.createElement("div");
        lowResContent.classList.add("up360-low-res-content");
        highResContent = document.createElement("div");
        highResContent.classList.add("up360-high-res-content");
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
        settings.levelObjects.forEach(function(level) {
            if (zoomValue >= level.zoomThreshold) currentLevelObject = level;
        });
        if (currentLevelObject === null) currentLevelObject = settings.levelObjects[0];
        return currentLevelObject;
    }
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
        content.style.transform = "translate(" + posX + "px," + posY + "px) " + "scale(" + _scale + ")";
    }
    function zoomTo(value) {
        var lastValue = zoomValue;
        zoomValue = value;
        zoomValue = zoomValue < settings.minZoom ? settings.minZoom : zoomValue;
        zoomValue = zoomValue > settings.maxZoom ? settings.maxZoom : zoomValue;
        var levelObject = getCurrentLevelObject();
        var oldRect = getContentRect();
        setScale(minZoomValue * zoomValue);
        if (levelObject.zoomThreshold !== currentLevelObject.zoomThreshold) {
            clearScreen();
            _this.Draw({
                lowRes: true
            });
        }
        currentLevelObject = levelObject;
        var currentRect = getContentRect();
        var pointX = screenRectangle.Width / 2, pointY = screenRectangle.Height / 2;
        if (isMouseOnScreen && !up360.Helpers.isMobile.any() && zoomValue > lastValue) {
            pointX = mousePosX;
            pointY = mousePosY;
        }
        var moldPosX = (pointX - oldRect.left) / oldRect.width, moldPosY = (pointY - oldRect.top) / oldRect.height;
        var mPosX = (pointX - currentRect.left) / currentRect.width, mPosY = (pointY - currentRect.top) / currentRect.height;
        _this.Move({
            diffX: (mPosX - moldPosX) * currentRect.width,
            diffY: (mPosY - moldPosY) * currentRect.height
        });
        _this.ZoomNormalized = (zoomValue - settings.minZoom) / (settings.maxZoom - settings.minZoom);
        settings.onZoomChanged.Trigger(_this.ZoomNormalized, zoomValue, settings.minZoom, settings.maxZoom);
        correctPosition();
        _this.Draw();
    }
    function correctPosition() {
        var rect = getContentRect();
        var cpX = contentPosition.X(), cpY = contentPosition.Y();
        if (rect.width < screenRectangle.Width && rect.height < screenRectangle.Height) {
            if (cpX < 0) contentPosition.X(0); else if (cpX + contentPosition.Width() > screenRectangle.Width) contentPosition.X(screenRectangle.Width - contentPosition.Width());
            if (cpY < 0) contentPosition.Y(0); else if (cpY + contentPosition.Height() > screenRectangle.Height) contentPosition.Y(screenRectangle.Height - contentPosition.Height());
        } else {
            var percentage = (zoomValue - 1) / settings.maxZoom, maxY = Math.round(screenRectangle.Height / 2 * percentage), maxX = Math.round(screenRectangle.Width / 2 * percentage);
            if (cpY > maxY) contentPosition.Y(maxY); else if (cpY + contentPosition.Height() < screenRectangle.Height - maxY) contentPosition.Y(screenRectangle.Height - maxY - contentPosition.Height());
            if (cpX > maxX) contentPosition.X(maxX); else if (cpX + contentPosition.Width() < screenRectangle.Width - maxX) contentPosition.X(screenRectangle.Width - maxX - contentPosition.Width());
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
        highResContent.innerHtml = "";
    }
};

var up360 = up360 || {};

up360.Rendering = up360.Rendering || {};

up360.Rendering.ImageRepository = function(settings, currentLevelObject, forceReload) {
    var fastCache = {};
    this.dispose = function() {
        fastCache = {};
    };
    this.getImage = function(frameIndex, tileId, desiredLevelObject, callback, forceCacheLoad) {
        tileId = tileId === undefined ? 0 : tileId;
        var levelObject = desiredLevelObject === null ? currentLevelObject : desiredLevelObject;
        var index = levelObject.zoomThreshold.toString() + frameIndex.toString() + tileId.toString();
        var cacheIndexElement = fastCache[frameIndex];
        cacheIndexElement = cacheIndexElement === undefined ? fastCache[frameIndex] = {} : cacheIndexElement;
        var cacheElement = cacheIndexElement[index];
        if (cacheElement === undefined) {
            var src = levelObject.resourceUrl.replace("{index}", frameIndex.toPaddedString()).replace("{offset}", tileId);
            if (forceReload) {
                src += "?j=" + new Date().valueOf();
            }
            var img = document.createElement("img");
            img.dataset.frameIndex = frameIndex;
            img.dataset.index = index;
            img.addEventListener("dragstart", function(e) {
                e.preventDefault();
            });
            settings.onLoadStarted.Trigger(img);
            up360.Imports.imagesLoaded(img, function(instance, image) {
                if (image.isLoaded) {
                    settings.onLoadComplete.Trigger(image.img);
                    fastCache[image.img.dataset.frameIndex][image.img.index] = image.img;
                    callback.call(image.img, false);
                }
            });
            return false;
        } else {
            callback.call(cacheElement, true);
            return true;
        }
    };
};

var up360 = up360 || {};

up360.Imports = up360.Imports || {};

up360.Imports.imagesLoaded = imagesLoaded;

var up360 = up360 || {};

up360.Helpers = up360.Helpers || {};

up360.Helpers.Recatngle = function(sx, sy, width, height) {
    this.intersects = function(rect) {
        return this.sx <= rect.sx + rect.width && this.sx + this.width >= rect.sx && this.sy <= rect.sy + rect.height && this.sy + this.height >= rect.sy;
    };
    this.set = function(sx, sy, width, height) {
        this.sx = sx;
        this.sy = sy;
        this.height = height;
        this.width = width;
    };
    this.set(sx, sy, width, height);
};

up360.Helpers.ScreenRectangle = function(screenElement) {
    this.left = 0;
    this.top = 0;
    this.bottom = 0;
    this.right = 0;
    this.height = 0;
    this.width = 0;
    this.update = function() {
        var screenRectangle = screenElement.getBoundingClientRect();
        this.left = screenRectangle.left;
        this.top = screenRectangle.top;
        this.right = screenRectangle.right;
        this.bottom = screenRectangle.bottom;
        this.width = screenRectangle.width;
        this.height = screenRectangle.height;
    };
    this.update();
};

var up360 = up360 || {};

up360.Rendering = up360.Rendering || {};

up360.Rendering.StartFramesLoader = function(imageRepository, settings, completeCallback) {
    function makeImageLoadedCallback(totalFrames) {
        var loaded = 0;
        var imagesArray = [];
        return function() {
            imagesArray.push(this);
            loaded++;
            settings.onLowResFrameLoaded.Trigger(loaded, totalFrames);
            if (loaded >= totalFrames) {
                completeCallback.call(window, imagesArray);
            }
        };
    }
    this.immediateLoader = function() {
        var totalFrames = settings.maxFrame - settings.minFrame;
        for (var i = settings.minFrame; i <= settings.maxFrame; i++) {
            imageRepository.getImage(i, 0, settings.levelObjects[0], makeImageLoadedCallback(totalFrames));
        }
    };
    this.lazyLoader = function(loadSettings) {
        loadSettings.frameSkip = loadSettings.frameSkip === undefined ? 2 : loadSettings.frameSkip;
        var totalFrames = Math.ceil(settings.maxFrame - settings.minFrame / loadSettings.frameSkip);
        for (var i = 0; i < loadSettings.frameSkip; i++) {
            for (var j = settings.minFrame + i; j <= settings.maxFrame; j += loadSettings.frameSkip) {
                imageRepository.getImage(j, 0, settings.levelObjects[0], makeImageLoadedCallback(totalFrames));
            }
        }
    };
};