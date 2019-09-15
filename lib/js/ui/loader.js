export function Loader (parentElement) {
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
		loaderElement.style.display = 'flex';

		requestAnimationFrame(function() {
			loaderElement.style.opacity = 1;
		});
	};

	this.Update = function (percentage) {
		if (!initialised)
			return;

		progressBarElement.style.setProperty('--progress-percentage', percentage + '%');
	};

	this.Hide = function () {
		if (!initialised)
			return;

		loaderElement.style.opacity = 0;
		setTimeout(function() {
			loaderElement.remove();
		}, 300);
	}

	this.Dispose = function () {
		if (!initialised)
			return;

		parentElement.removeChild(loaderElement);
	}

	function buildDOM() {
	  	loaderElement = document.createElement('div');
		loaderElement.classList.add('up360__loading');
		loaderElement.style.display = 'none';
		loaderElement.innerHTML = 
			'<div class="loading">' +
			'   <div class="progress">' +
		    '   	<div class="progressbar"></div>' +
			'	</div>' +
			'</div>';
	
		parentElement.appendChild(loaderElement);
		
		progressBarElement = parentElement.querySelector('.progressbar');	
	}
}