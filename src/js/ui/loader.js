var Helpers = require('./../helpers.js'),
    velocity = require('velocity');

module.exports = function(parentElement) {
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
		
		velocity(loaderElement, {
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

		velocity(loaderElement, {
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
		loaderElement.innerHTML = 
			'<div class="loading">' +
			'	<span>Creating object</span>' +
			'   <div class="progress">' +
		    '   	<div class="progressbar"></div>' +
			'	</div>' +
			'</div>';
	
		parentElement.appendChild(loaderElement);
		
		progressBarElement = parentElement.querySelector('.progressbar');	
	}
}