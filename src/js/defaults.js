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