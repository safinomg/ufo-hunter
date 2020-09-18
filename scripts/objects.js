// --- objects --- //
function Objects() {
};

Objects.prototype.spaceship = function (x, y, spaceship_image) {
	this.x = x;
	this.y = y;
	this.width = 34;
	this.height = 28;
	this.spaceship_image = spaceship_image;
	this.spaceship_image.src = "images/ship.png";
	return this;
};

Objects.prototype.bullet = function(x, y) {
    this.x = x;
    this.y = y;
	return this;
};

Objects.prototype.ufo = function(x, y, line, column, ufo_image, level) {
    this.x = x;
    this.y = y;
    this.line = line;
    this.column = column;
    this.width = 32;  
    this.height = 24;  
	this.ufo_image = ufo_image;  
	this.level = level;
	//even-odd level selector		 
	this.ufo_image.src = (this.level%2==0) ? "images/ufo2.png" : "images/ufo.png"; 
	return this;	
};

Objects.prototype.bomb = function(x, y) {
    this.x = x;
    this.y = y;
	return this;
};