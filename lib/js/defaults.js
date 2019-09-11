import { Event } from './helpers';

export default {
	minFrame: 1,
	maxFrame: 30,
	
	playSpeed: 20,
	playDirection: 1,
	
	rotationDivider: 10,
    rotationDirection: 1,

    rotationSlowdownDuration: 1000,
    rotationSlowdownThreshold: 0.4,

    panSlowdownLengthThreshold: 5,
    panSlowdownDuration: 300,

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
	},
	
	scrollZoomEnabled: true,
    scrollZoomStep: 0.5,
    scrollZoomEasingDuration: 300,
	
	baseLayoutsUrl: '/css/templates/',
	layout: 'default',
	
	gesturesType: 'auto',               //values: auto || desktop||touch
	
	onLoadStarted: new Event(),         //params: $img
	onLoadComplete: new Event(),        //params: $img
	
	onInitComplete: new Event(),        //params: PluginInterface object    *modified by this object*
	
	onContentMoved: new Event(),        //params: X, Y
	onRotateComplete: new Event(),      //params: direction
	onZoomChanged: new Event(),         //params: NormalizedValue, Value, MinZoom, MaxZoom
	onFrameChanged: new Event(),        //params: currentFrame
	
	onLowResFrameLoaded: new Event(),   //params: frameCount, maxFrames
	
	onDrawFrame: new Event(),           //params: currentFrame, isHiRes, lowestLevelUrl
	
	onBuildComplete: new Event(),       //params: buildPartComplete         *triggered by this object*
	
	onDisposed: new Event(),            //                                  *triggered by this object*
}