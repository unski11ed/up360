$(function(){
	//Loading appropriate templates
	$(window).on('hashchange', function(){
		var viewFile = window.location.hash ? window.location.hash.replace('#', '') : 'example-default';

		$('main').load('/' + viewFile + '.html', function(){
			$(window).trigger('pageloaded');
		});	
		
		$('.ajax-menu a[href=#' + viewFile + ']')
			.parent()
			.addClass('active');
	}).trigger('hashchange');
	
	//Resize content height if nescessary
	$(window).on('resize ready pageloaded', function(){
		$('.content-wrap').css('height', $(window).height());
	});
});