//Declare namespace
var up360 = up360 || {};

up360.Plugin = function(element, options){
	 var parentContainer,
            settings,
            engine;
        
    //Set the parent container
    if(element instanceof HTMLElement)
           parentContainer = element;
    else if(typeof element === 'string')
    	parentContainer = document.querySelector(element);
    else
            throw 'up360: Invalid container element provided.';
	
    element.innerHtml = '<div class="up360"></div>';
    
    if(typeof options === 'object'){
            settings = up360.Helpers.Functions.extend(up360.Settigns.default, options);
            engine = new up360.Rendering.Engine()
    }
    
    if(typeof options === 'string'){
            up360.Helpers.Functions.getJson(function(status, data){
                    if(status){
                            settings = up360.Helpers.Functions.extend(up360.Settings.default, options);
                    }
            });
    }
	this.Zoom = engineObject.Zoom,
	this.Draw = engineObject.Draw,
	this.SwitchFrame = engineObject.SwitchFrame,
	this.Move = engineObject.Move,
	
	this.Play = animation.Play,
	this.Stop = animation.Stop,
	
	this.ContentPosition = engineObject.GetContentPosition,
	
	this.SwitchMode = gestures.Set,    // pan || move
	
	this.Dispose = function () {
	    animation.Stop();
	    fullscreen.Dispose();
	    previewWindow.Dispose();
	    ui.Dispose();
	    preLoader.Dispose();
	    templateLoader.Dispose();
	    $parentElement.find('.main360').remove();
	    //$parentElement.html($parentElementBackup.html());
	}
}


up360.init = function(element, options){
        var parentContainer,
            settings,
            engine;
        
        function start(){
                engine = 
        }
        
        //Set the parent container
        if(element instanceof HTMLElement)
               parentContainer = element;
        else if(typeof element === 'string')
        	parentContainer = document.querySelector(element);
        else
                throw 'up360: Invalid container element provided.';
        	
        if(typeof options === 'object'){
                settings = up360.Helpers.Functions.extend(up360.Settigns.default, options);
                start();
        }
        
        if(typeof options === 'string'){
                up360.Helpers.Functions.getJson(function(status, data){
                        if(status){
                                settings = up360.Helpers.Functions.extend(up360.Settigns.default, options);
                                start();
                        }
                });
        }
        
        	
};