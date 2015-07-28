//Declare namespace
var up360 = up360 || {};
up360.Settings = up360.Settings || {};

up360.Settigns.default = {
	// Default values
	maxZoom: 2,
	minZoom: 1,
	
	minFrame: 1,
	maxFrame: 30,
	
	playSpeed: 20,
	defaultPlayDirection: 1,
	
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
	
	onLoadStarted: new up360.Helpers.Event(),         //params: $img
	onLoadComplete: new up360.Helpers.Event(),        //params: $img
	
	onInitComplete: new up360.Helpers.Event(),        //params: PluginInterface object    *modified by this object*
	
	onContentMoved: new up360.Helpers.Event(),        //params: X, Y
	onRotateComplete: new up360.Helpers.Event(),      //params: direction
	onZoomChanged: new up360.Helpers.Event(),         //params: NormalizedValue, Value, MinZoom, MaxZoom
	onFrameChanged: new up360.Helpers.Event(),        //params: currentFrame
	
	onLowResFrameLoaded: new up360.Helpers.Event(),   //params: frameCount, maxFrames
	
	onDrawFrame: new up360.Helpers.Event(),           //params: currentFrame, isHiRes, lowestLevelUrl
	
	onBuildComplete: new up360.Helpers.Event(),       //params: buildPartComplete         *triggered by this object*
	
	onDisposed: new up360.Helpers.Event(),            //                                  *triggered by this object*
}