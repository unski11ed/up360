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