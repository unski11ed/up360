import { Functions } from './helpers';

var MIN_ZOOM_BAR_HEIGHT = 440;

export function Responsive(container) {
    var zoomSliderElement;
    var debouncedUpdate = Functions.debounce(update);

    // Public
    this.Init = function() {
        zoomSliderElement =
            container.querySelector(
                '.up360__element--zoom-bar'
            );
        
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', debouncedUpdate);
        }

        update();
    };

    this.Dispose = function() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('debounce', debouncedUpdate);
        }
    };

    function getContainerSize() {
        return container.getBoundingClientRect();
    }

    // Private
    function update() {
        // If portrait screen - keep a min height
        if (
            typeof window !== 'undefined' &&
            window.innerHeight > window.innerWidth
        ) {
            const containerSize = getContainerSize();
            if (containerSize.height < MIN_ZOOM_BAR_HEIGHT) {
                container.style.paddingTop = (MIN_ZOOM_BAR_HEIGHT - containerSize.height) + 'px';
            }
        } else {
            container.style.paddingTop = '';
        }

        // Hide zoom bar if there is not enough space
        if (zoomSliderElement) {
            zoomSliderElement.style.display =
                getContainerSize().height < MIN_ZOOM_BAR_HEIGHT ? 'none' : '';
        }
    }
}