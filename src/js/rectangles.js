//Declare namespace
var up360 = up360 || {};
up360.Helpers = up360.Helpers || {};

/*
class: Rectangle
Rectangle definition providing image boundries
and an intersects method for testing rectangle intersections
with other Rectangle interfaces
*/
up360.Helpers.Recatngle = function(sx, sy, width, height) {
	/*
	public intersects(rect : Rectangle) : <bool>
	Test if the current rectangle intersects with the rectangle
	provided in the param
	*/
	this.intersects = function (rect) {
		return (this.sx <= (rect.sx + rect.width) && (this.sx + this.width) >= rect.sx &&
				this.sy <= (rect.sy + rect.height) && (this.sy + this.height) >= rect.sy);
	};
	
	/*
	public set(sx : <number>, sy : <number>, width: <number>, height: <number>)
	Sets the boundries of this object
	*/
	this.set = function (sx, sy, width, height) {
		this.sx = sx;
		this.sy = sy;
		this.height = height;
		this.width = width;
	};
	//Konstruktor
	this.set(sx, sy, width, height);
};

//=============================================================================

/*
class: ScreenRectangle
Small wrapper on getBoundingClientRect providing
the boundries of display screen
*/
up360.Helpers.ScreenRectangle = function(screenElement) {
	this.left = 0;
	this.top = 0;
	this.bottom = 0;
	this.right = 0;

	this.height = 0;
	this.width = 0;

	this.update = function () {
		var screenRectangle = screenElement.getBoundingClientRect();

		this.left = screenRectangle.left;
		this.top = screenRectangle.top;
		this.right = screenRectangle.right;
		this.bottom = screenRectangle.bottom;

		this.width = screenRectangle.width;
		this.height = screenRectangle.height;
	};

	this.update();
}