import imagesLoaded from 'imagesloaded';
import { Functions } from './helpers';

/*
class: ImagesRepository
	Creates img elements, and stores them in the cache object
	for further usage in the application
*/
export function ImageRepository(settings, currentLevelObject, forceReload) {
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
	this.getImage = function (
		frameIndex,
		chunkColumn,
		chunkRow,
		desiredLevelObject,
		resourceUrl,
		callback,
		forceReload,
	) {
		//Decide which level object to render
		var levelObject = desiredLevelObject === null ? currentLevelObject : desiredLevelObject;
		//Generating unique identifier for searching in fastCache object
		var index = levelObject.zoomThreshold.toString() +
			frameIndex.toString() +
			chunkColumn.toString() +
			chunkRow.toString() +
			levelObject.columns.toString() +
			levelObject.rows.toString();
		//Create a cache frame if doesnt exist already
		var cacheIndexElement = fastCache[frameIndex];
		cacheIndexElement = cacheIndexElement === undefined ? fastCache[frameIndex] = {} : cacheIndexElement;
		//Create the frame tile if it doesnt exist in the cache
		var cacheElement = cacheIndexElement[index];
		if (cacheElement === undefined) {
			//Create the src URL
			var src = resourceUrl
				.replace('{index}', frameIndex)
				.replace('{column}', chunkColumn)
				.replace('{row}' ,chunkRow)
				.replace('{totalColumns}', levelObject.columns)
				.replace('{totalRows}', levelObject.rows)
				.replace('{resX}', levelObject.width)
				.replace('{resY}', levelObject.height);

			//If force reload - add a timestamp to the url to bypass browser cache					 
			if (forceReload) {
				src += ("?j=" + (new Date()).valueOf());
			}
			//Create an img element, assign the data attributes
			//and prevent mouse dragging
            var img = document.createElement('img');
            img.classList.add('up360__frame');
			img.dataset.frameIndex = frameIndex;
			img.dataset.index = index;
			img.addEventListener('dragstart', function(e){
				e.preventDefault();
			});
			img.src = src;

			//Call Load Started event
			settings.onLoadStarted.Trigger(img);
			
			//Assign imageLoaded event via plugin
			imagesLoaded(img, function(instance, image){
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