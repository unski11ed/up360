import Hammer from 'hammerjs';
import { Functions } from './../helpers';

export function InputManager (parentElement, engine, gestures, animation, settings) {
	var touchElement;
	
	function registerTouchEventHandlers() {
		var mc = new Hammer(touchElement);

		mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
		mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan')]);

		mc.on("panstart panmove panend", onPan);
		mc.on("pinchstart pinchmove", onPinch);

		function onPan(ev) {
			if (ev.type == 'panstart') {
				animation.PanRotate.Stop();

				gestures.PanRotate.Start(ev.center.x,
							   ev.center.y);
			}
			if (ev.type == 'panmove') {
				gestures.PanRotate.Update(ev.center.x,
								ev.center.y);
			}
			if (ev.type == 'panend') {
				gestures.PanRotate.End();
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
                    gestures.Zoom({ delta: settings.scrollZoomStep });
				else
                    gestures.Zoom({ delta: -settings.scrollZoomStep });

				//Prevent the default mouse wheel
				event.preventDefault();
			});
		}
		
		touchElement.addEventListener('mousedown', function(e){
			animation.Stop();

			gestures.PanRotate.Start(e.clientX, e.clientY);
		})

		touchElement.addEventListener('mousemove', function (e) {
			e.preventDefault();
			gestures.PanRotate.Update(e.clientX, e.clientY);
		});

		touchElement.addEventListener('mouseleave', function (e) {
			gestures.PanRotate.End();
		});

		touchElement.addEventListener('mouseup', function (e) {
			gestures.PanRotate.End(e.clientX, e.clientY);
		});
	}

	this.Init = function () {
		touchElement = parentElement.querySelector('.up360__touch');
		//Register appropriate event handlers
		switch (settings.gesturesType) {
			default:
			case 'auto':
				if (Functions.isMobile.any()) {
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