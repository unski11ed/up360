//Declare namespace
var up360 = up360 || {};
up360.UI = up360.UI || {};

up360.UI.Loader = function(parentElement) {
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
		loaderElement.style.display = 'block';
		
		up360.Imports.velocity(loaderElement, {
			opacity: 1
		}, {
			duration: 50
		});
	};

	this.Update = function (percentage) {
		if (!initialised)
			return;

		progressBarElement.style.width = percentage + '%';
	};

	this.Hide = function () {
		if (!initialised)
			return;

		up360.Imports.velocity(loaderElement, {
			opacity: 0
		}, {
			duration: 400,
			complete: function(){
				loaderElement.style.display = 'none';
			}
		});
	}

	this.Dispose = function () {
		if (!initialised)
			return;

		parentElement.removeChild(loaderElement);
	}

	function buildDOM() {
	  	loaderElement = document.createElement('div');
		loaderElement.classList.add('up360-loading');
		loaderElement.style.display = 'none';
		loaderElement.innerHtml = 
			'<div class="loading">' +
			'	<span>Creating object</span>' +
			'   <div class="progress">' +
		    '   	<div class="progressbar"></div>' +
			'	</div>' +
			'</div>';
	
		progressBarElement = loaderElement.querySelector('.progressbar');

		parentElement.appendChild(loaderElement);
	}
}