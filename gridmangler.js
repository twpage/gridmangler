// ---------------------------------
// Todd Page
// 10/30/2011
//
// Add grid-based events to an HTML5 Canvas element
// v 0.1
// ---------------------------------

var gridmangler = function ( ) {
    
    // PRIVATE Closure variables + functions
    ///////////////////////////////////////////////////////////////////////////
    
    var my_canvas;
    var my_context;
    var tile_width, tile_height;
    var width;
    var height;
    var current_xy = {"x": -1, "y": -1};
    
    // these 3 functions will be overridden
    var my_gridEventMousedown = function ( ) {};
    var my_gridEventLeaveFocus = function ( ) {};
    var my_gridEventGainFocus = function ( ) {};
    
    var gridEventMousedown = function (grid_xy) {
    // wrapper for user-defined grid event function
    
	if (isValidGridCoordinates(grid_xy)) {
	    my_gridEventMousedown(grid_xy);
	} else {
	    invalidGridCoordinates(grid_xy, "mousedown");
	}
    };
    
    var gridEventLeaveFocus = function (grid_xy) {
    // wrapper for user-defined grid event function
    
	if (isValidGridCoordinates(grid_xy)) {
	    my_gridEventLeaveFocus(grid_xy);
	} else {
	    invalidGridCoordinates(grid_xy, "leavefocus");
	}
    };
    
    var gridEventGainFocus = function (grid_xy) {
    // wrapper for user-defined grid event function
    
	if (isValidGridCoordinates(grid_xy)) {
	    my_gridEventGainFocus(grid_xy);
	} else {
	    invalidGridCoordinates(grid_xy, "gainfocus");
	}
    };
    
    var invalidGridCoordinates = function (grid_xy, event_name) {
    // will eventually be a wrapper for user-defined error function is necessary?
	;
    };
    
    var relMouseCoords = function (event){
    // Returns the relative mouse coordinates for a canvas element, avoiding cross-browser obnoxiousness
    // From Ryan Artecona, 
    //   http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
    
	var totalOffsetX = 0;
	var totalOffsetY = 0;
	var canvasX = 0;
	var canvasY = 0;
	var currentElement = this;
    
	do{
	    totalOffsetX += currentElement.offsetLeft;
	    totalOffsetY += currentElement.offsetTop;
	}
	while(currentElement = currentElement.offsetParent)
    
	canvasX = event.pageX - totalOffsetX;
	canvasY = event.pageY - totalOffsetY;
    
	return {x:canvasX, y:canvasY}
    }
    HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;    
    
    var convertMouseCoordinatesToGrid = function(event) {
    // converts canvas mouse coordinates to an internal grid coordinate
    // some of this from http://www.quirksmode.org/js/events_properties.html
    
	coords = my_canvas.relMouseCoords(event);
	posx = coords.x;
	posy = coords.y;
	
	// find the grid square they just clicked in
	gridx = ~~(posx / tile_size);
	gridy = ~~(posy / tile_size);	
	
	response = {"x": gridx, "y": gridy};
	return response;
    };
      
    var canvasOnMousedown = function (event) {
    // Converts mouse coords into grid coords and calls appropriate grid event
    // grid "mousedown" is essentially the same as a canvas mousedown with mapped coords
    
	grid_xy = convertMouseCoordinatesToGrid(event);
	gridEventMousedown(grid_xy);
    };
    
    var canvasOnMousemove = function(event) {
    // Converts mouse coords into grid coords and calls appropriate grid event
    // Grid "leavefocus" is called when the mouse leaves the boundaries of a particular grid
    // Grid "gainfocus" is called when the mouse moves into a new grid
    // -> Mouse movements that stay within the same grid *do not trigger grid events* <-
    
	grid_xy = convertMouseCoordinatesToGrid(event);
	if ((current_xy.x != grid_xy.x) || (current_xy.y != grid_xy.y)) {
	    if (current_xy.x != -1) {
	      gridEventLeaveFocus(current_xy);
	    }
	    current_xy.x = grid_xy.x;
	    current_xy.y = grid_xy.y;
	    gridEventGainFocus(grid_xy);
	}
    };
    
    var isValidGridCoordinates = function (test_xy) {
    // Returns true if a given {x:, y:} coordinate object is within the bounds of the canvas grid
    
	if ((test_xy.x < 0) || (test_xy.y < 0)) {
	  return false;
	} else if ((test_xy.x >= width) || (test_xy.y >= height)) {
	  return false;
	} else {
	  return true;
	}
    };
    
    // PUBLIC object + methods
    ///////////////////////////////////////////////////////////////////////////
    return {
        
        init: function (canvas, given_tile_size) {
	// initialize a given HTML5 Canvas element, 
	// ensures canvas size is suitable for given tile size (e.g. integer number of X x Y tiles)
	// (will throw exceptions if not)
	
            my_canvas = canvas;
            my_context = my_canvas.getContext("2d");
            
            
            tile_size = given_tile_size;
	    if (tile_size <= 0) {
		throw {
		    name: 'InvalidGridSizeError',
		    message: 'Tile size must be positive'
		};
	    }
	    // TODO: Allow for init of rectangular tiles
	    tile_width = tile_size;
	    tile_height = tile_size;
	    
	    width = my_canvas.width / tile_width;
	    if (width - Math.floor(width) !== 0) {
		throw {
		    name: 'InvalidGridSizeError',
		    message: 'Canvas width and tile width must produce an integer'
		};
	    }
	    
	    height = my_canvas.height / tile_height;
	    if (height - Math.floor(height) !== 0) {
		throw {
		    name: 'InvalidGridSizeError',
		    message: 'Canvas height and tile height must produce an integer'
		};
	    }
	    
            my_canvas.addEventListener("mousedown", canvasOnMousedown, false);
            my_canvas.addEventListener("mousemove", canvasOnMousemove, false);
        },
	
	addGridEvent: function (event_name, event_fn) {
	// Pass in user-defined functions to link with grid events
	// functions should take a {x: , y: } coordinate object as its only argument
	// events will not be triggered for invalid coordinates so functions shouldn't worry about that
	
	    if (event_name === "mousedown") {
		my_gridEventMousedown = event_fn;
		
	    } else if (event_name === "gainfocus") {
		my_gridEventGainFocus = event_fn;
		
	    } else if (event_name === "leavefocus") {
		my_gridEventLeaveFocus = event_fn;
		
	    } else {
		throw {
		    name: 'InvalidGridEventError',
		    message: 'Grid event not recognized: ' + event_name
		};
	    }
	    
	    return true;
	},
	
	getSurroundingTiles: function (grid_xy, b_include_center) {
	// returns an array of {x: , y: } coordinates surrounding a given (center) coordinate
	// will optionally include the center if the 2nd argument is passed as true
	// IGNORES invalid coordinates (e.g. off the map)
	
	    var offset_tiles = [
		{"x": -1, "y": -1}, {"x": -1, "y": 0},
		{"x": -1, "y": 1}, {"x": 0, "y": -1},
		{"x": 0, "y": 0}, {"x": 0, "y": 1},
		{"x": 1, "y": -1}, {"x": 1, "y": 0},
		{"x": 1, "y": 1}
	    ];
				 
	    if (b_include_center === true) {
		offset_tiles.push({"x": 0, "y": 0});
	    }
	    
	    var surrounding_tiles = new Array();
	    
	    for (i = 0; i < offset_tiles.length; i++) {
		surround_xy = {"x": grid_xy.x + offset_tiles[i].x, "y": grid_xy.y + offset_tiles[i].y};
		if (isValidGridCoordinates(surround_xy) === false) {
		    continue;
		}
		surrounding_tiles.push(surround_xy);
	    }
	    
	    return surrounding_tiles;
	},
	
	// Methods that do actual drawing
	///////////////////////////////////////////////////////////////////////
	
	drawImageAt: function (grid_xy, image) {
	// place an image on a grid tile based on its coordinates
	    my_context.drawImage(image, grid_xy.x * tile_width, grid_xy.y * tile_height, tile_width, tile_height);
	},

	drawBorderAt: function (grid_xy, stroke_style) {
	// draw simple border around a grid tile based on its coordinates
	
	    my_context.strokeStyle = stroke_style;
	    my_context.strokeRect(grid_xy.x * tile_width, grid_xy.y * tile_height, tile_width, tile_height);
	},
	
	drawFillAt: function (grid_xy, fill_style) {
	    my_context.fillStyle = fill_style;
	    my_context.fillRect(grid_xy.x * tile_width, grid_xy.y * tile_height, tile_width, tile_height);
	},
	
	// Accessor Methods
	///////////////////////////////////////////////////////////////////////
	getWidth: function ( ) {
	    return width;
	},
	
	getHeight: function ( ) {
	    return height;
	},
	
	getCurrentGrid: function ( ) {
	    return current_xy;
	},
	
	getCanvasContext: function ( ) {
	    return my_context;
	}
    };
};



        
        
        
        
            
