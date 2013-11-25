// ---------------------------------
// Todd Page
// 10/30/2011
// 11/25/2013 Updated
//
// Add grid-based events to an HTML5 Canvas element
// ---------------------------------

var gridmangler = function (canvas, tile_width, tile_height, options) {
	
	// options
	if (options == null) {
		options = {};
	}

	// PRIVATE Closure variables 
	///////////////////////////////////////////////////////////////////////////
	var _ref;
	var my_canvas, my_context, my_tile_width, my_tile_height, my_width, my_height;
	var my_current_xy = {"x": -1, "y": -1};
	var my_last_click_xy = {"x": -1, "y": -1};
	var my_last_click_time = 0;
	var my_last_visit_xy = {"x": -1, "y": -1};
	var my_doubleClickSpeed = (_ref = options.doubleclickspeed) != null ? _ref : 500;
	var my_longPressSpeed = (_ref = options.longpressspeed) != null ? _ref : 500;
	var my_mouseDownTime = 0; // keep track of longPress
	var that = {};
	
	// Init
	///////////////////////////////////////////////////////////////////////////
	my_canvas = canvas;
	my_context = my_canvas.getContext("2d");
	
	if ((tile_width <= 0) || (tile_height <= 0)) {
		throw {
			name: 'InvalidGridSizeError',
			message: 'Tile width and height must be positive'
		};
	}
	my_tile_width = tile_width;
	my_tile_height = tile_height;
	
	my_width = my_canvas.width / my_tile_width;
	if (my_width - Math.floor(my_width) !== 0) {
		throw {
			name: 'InvalidGridSizeError',
			message: 'Canvas width and tile width must produce an integer'
		};
	}
	
	my_height = my_canvas.height / my_tile_height;
	if (my_height - Math.floor(my_height) !== 0) {
		throw {
			name: 'InvalidGridSizeError',
			message: 'Canvas height and tile height must produce an integer'
		};
	}
	
	// PRIVATE Closure methods
	///////////////////////////////////////////////////////////////////////////
	
	// these 3 functions will be overridden
	var my_gridEventMousedown = function ( ) {};
	var my_gridEventLeaveFocus = function ( ) {};
	var my_gridEventGainFocus = function ( ) {};
	var my_gridEventLongpress = function ( ) {};
	
	var invalidGridCoordinates = function (grid_xy, event_name) {
		// will eventually be a wrapper for user-defined error function is necessary?
	
	};
	
	var isValidGridCoordinates = function (test_xy) {
		// Returns true if a given {x:, y:} coordinate object is within the bounds of the canvas grid
		
		if ((test_xy.x < 0) || (test_xy.y < 0)) {
		  return false;
		} else if ((test_xy.x >= my_width) || (test_xy.y >= my_height)) {
		  return false;
		} else {
		  return true;
		}
	};
	
	var isArray = function (my_value) {
		if (my_value && typeof my_value === 'object' &&
			typeof my_value.length === 'number' &&
			!(my_value.propertyIsEnumerable('length'))) {
			
			return true;
		} else {
			return false;
		}
	};

	var gridEventMousedown = function (grid_xy, button, shiftKey, isDoubleClick) {
		// wrapper for user-defined grid event function
		
		if (isValidGridCoordinates(grid_xy)) {
			my_gridEventMousedown(grid_xy, button, shiftKey, isDoubleClick);
		} else {
			invalidGridCoordinates(grid_xy, "mousedown");
		}
	};
	
	var gridEventLeaveFocus = function (grid_xy) {
		// wrapper for user-defined grid event function
		
		if (isValidGridCoordinates(grid_xy)) {
			my_gridEventLeaveFocus(grid_xy);
			my_last_visit_xy = grid_xy;
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
	
	var gridEventLongpress = function (grid_xy, button, shiftKey) {
		// wrapper for user-defined grid event function
		
		if (isValidGridCoordinates(grid_xy)) {
			my_gridEventLongpress(grid_xy, button, shiftKey);
		} else {
			invalidGridCoordinates(grid_xy, "longpress");
		}
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
		while((currentElement = currentElement.offsetParent))
		
		canvasX = event.pageX - totalOffsetX;
		canvasY = event.pageY - totalOffsetY;
		
		return {x:canvasX, y:canvasY};
	};
	
	HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;	
		
	var convertMouseCoordinatesToGrid = function(event) {
		// converts canvas mouse coordinates to an internal grid coordinate
		// some of this from http://www.quirksmode.org/js/events_properties.html
		
		var coords, posx, posy, gridx, gridy;
		coords = my_canvas.relMouseCoords(event);
		posx = coords.x;
		posy = coords.y;
		
		// find the grid square they just clicked in
		gridx = ~~(posx / my_tile_width);
		gridy = ~~(posy / my_tile_height);	
		
		return {"x": gridx, "y": gridy};
	};

	var canvasOnMouseup = function (event) {
		// depending on how long we held the click, call longpress or regular click
		// only calls clicks when we are in the same grid

		var mouseUpTime = new Date();
		var grid_xy = convertMouseCoordinatesToGrid(event);

		if (grid_xy.x == my_last_click_xy.x && grid_xy.y == my_last_click_xy.y) {
			if (mouseUpTime - my_mouseDownTime > my_longPressSpeed) {
				// longpress
				canvasLongClick(event);
			} else {
				// click
				canvasClick(event);
			}
		} else {
			// mouseup outside of mousedown grid, no click generated
			;
		}
	};
	
	var canvasOnMousedown = function (event) {
		// keep track of when we clicked down

		var grid_xy = convertMouseCoordinatesToGrid(event);

		my_mouseDownTime = new Date();
		my_last_click_xy = grid_xy;
	};

	var canvasLongClick = function (event) {
		// Converts mouse coords into grid coords and calls appropriate grid event
		// grid event is essentially the same as a canvas event with mapped coords
	  
		var grid_xy = convertMouseCoordinatesToGrid(event);
		gridEventLongpress(grid_xy, event.button, event.shiftKey);
	};

	var canvasClick = function (event) {
		// Converts mouse coords into grid coords and calls appropriate grid event
		// grid event is essentially the same as a canvas event with mapped coords
		// clicking does some extra stuff such as checking which button is used
	  
		var grid_xy = convertMouseCoordinatesToGrid(event);
		var now = new Date();
		var delta_last_click = now - my_last_click_time;
		var bDoubleClick = false;

		// check for double clicks
		if (grid_xy.x == my_last_click_xy.x && grid_xy.y == my_last_click_xy.y) {
			if (delta_last_click < my_doubleClickSpeed) {
				bDoubleClick = true;
			}
		}
		gridEventMousedown(grid_xy, event.button, event.shiftKey, bDoubleClick);
		my_last_click_time = now;
	};
	
	var canvasOnMousemove = function(event) {
		// Converts mouse coords into grid coords and calls appropriate grid event
		// Grid "leavefocus" is called when the mouse leaves the boundaries of a particular grid
		// Grid "gainfocus" is called when the mouse moves into a new grid
		// -> Mouse movements that stay within the same grid *do not trigger grid events* <-
		
		var grid_xy = convertMouseCoordinatesToGrid(event);
			if ((my_current_xy.x !== grid_xy.x) || (my_current_xy.y !== grid_xy.y)) {
				if (my_current_xy.x !== -1) {
				  gridEventLeaveFocus(my_current_xy);
				}
				my_current_xy.x = grid_xy.x;
				my_current_xy.y = grid_xy.y;
				gridEventGainFocus(grid_xy);
		}
	};
	
	// PUBLIC object + methods
	///////////////////////////////////////////////////////////////////////////
	
	that.addGridEvent = function (event_name, event_fn) {
		// Pass in user-defined functions to link with grid events
		// functions should take a {x: , y: } coordinate object as its only argument
		// events will not be triggered for invalid coordinates so functions shouldn't worry about that
		
		if (event_name === "mousedown") {
			my_gridEventMousedown = event_fn;
			
		} else if (event_name === "gainfocus") {
			my_gridEventGainFocus = event_fn;
			
		} else if (event_name === "leavefocus") {
			my_gridEventLeaveFocus = event_fn;
			
		} else if (event_name === "longpress") {
			my_gridEventLongpress = event_fn;
		} else {
			throw {
			name: 'InvalidGridEventError',
			message: 'Grid event not recognized: ' + event_name
			};
		}
		
		return true;
	};
	
	that.getTileFromOffset = function (grid_xy, offset_xy) {
		// grid addition/subtraction -- return a new grid coordinate based on a start point and an offset
		// will return null for invalid grid points
		
		var new_xy;
		
		new_xy = {"x": grid_xy.x + offset_xy.x, "y": grid_xy.y + offset_xy.y};
		
		if (isValidGridCoordinates(new_xy) === false) {
			return null;
		} else {
			return new_xy;
		}
	};
	
	that.getTilesFromOffsetArray = function (grid_xy, offset_array) {
		// generates an array of grid coordinates based on a start point and an array of offsets
		// any grid points that are invalid will not be present in the array
		
		var new_xy, i;
		var new_grids = [];
		
		// is offset an array?
		if (isArray(offset_array) === false) {
			throw {
			'name': 'InvalidArgumentType',
			'message': 'offset_array needs to be an actual array'
			};
		}
		
		for (i = 0; i < offset_array.length; i += 1) {
			new_xy = this.getTileFromOffset(grid_xy, offset_array[i]);
			if (new_xy !== null) {
			new_grids.push(new_xy);
			}
		}
		
		return new_grids;
	};
	
	that.getSurroundingTiles = function (grid_xy, b_include_center) {
		// returns an array of {x: , y: } coordinates surrounding a given (center) coordinate
		// will optionally include the center if the 2nd argument is passed as true
		// IGNORES invalid coordinates (e.g. off the map)
		
		var offset_tiles = [
			{"x": -1, "y": -1}, {"x": -1, "y": 0},
			{"x": -1, "y": 1}, {"x": 0, "y": -1},
			{"x": 0, "y": 1}, {"x": 1, "y": -1}, 
			{"x": 1, "y": 0}, {"x": 1, "y": 1}
		];
			
		if (b_include_center === true) {
			offset_tiles.push({"x": 0, "y": 0});
		}
		
		return this.getTilesFromOffsetArray(grid_xy, offset_tiles);
	};
	
	that.getCardinalTiles = function (grid_xy, b_include_center) {
		// returns an array of {x: , y: } coordinates adjacent to a given (center) coordinate
		// will optionally include the center if the 2nd argument is passed as true
		// IGNORES invalid coordinates (e.g. off the map)
		
		var offset_tiles = [
			{"x": -1, "y": 0}, {"x": 0, "y": -1},
			{"x": 0, "y": 1}, {"x": 1, "y": 0}
		];
			
		if (b_include_center === true) {
			offset_tiles.push({"x": 0, "y": 0});
		}
		
		return this.getTilesFromOffsetArray(grid_xy, offset_tiles);
	};

	that.getContextCoordinates = function (grid_xy) {
		// returns the actual context coordinates for a given grid
		return {"x": grid_xy.x * my_tile_width, "y": grid_xy.y * my_tile_height};
	};
	
	that.getContextRectangle = function (grid_xy) {
		// returns the actual context rectangle (x, y, width, height) for a given grid
		return {"x": grid_xy.x * my_tile_width, "y": grid_xy.y * my_tile_height, "width": my_tile_width, "height": my_tile_height};
	};
	
	// Methods that do actual drawing
	///////////////////////////////////////////////////////////////////////
	
	that.drawImageAt = function (grid_xy, image) {
		// place an image on a grid tile based on its coordinates
		my_context.drawImage(image, grid_xy.x * my_tile_width, grid_xy.y * my_tile_height, my_tile_width, my_tile_height);
	};

	that.drawBorderAt = function (grid_xy, stroke_style) {
		// draw simple border around a grid tile based on its coordinates
		
		my_context.strokeStyle = stroke_style;
		my_context.strokeRect((grid_xy.x * my_tile_width) + 1, (grid_xy.y * my_tile_height) + 1, my_tile_width - 2, my_tile_height - 2);
	};
	
	that.drawFillAt = function (grid_xy, fill_style) {
		my_context.fillStyle = fill_style;
		my_context.fillRect(grid_xy.x * my_tile_width, grid_xy.y * my_tile_height, my_tile_width, my_tile_height);
	};
	
	that.clearAt = function (grid_xy) {
		my_context.clearRect(grid_xy.x * my_tile_width, grid_xy.y * my_tile_height, my_tile_width, my_tile_height);
	};
	
	// Accessor Methods
	///////////////////////////////////////////////////////////////////////
	that.getWidth = function ( ) {
		return my_width;
	};
	
	that.getHeight = function ( ) {
		return my_height;
	};
	
	that.getTileHeight = function ( ) {
		return my_tile_height;
	};
	
	that.getTileWidth = function ( ) {
		return my_tile_width;
	};
	
	that.getCurrentGrid = function ( ) {
		return my_current_xy;
	};
	
	that.getLastClickGrid = function ( ) {
		return my_last_click_xy;
	};

	that.getLastVisitGrid = function ( ) {
		return my_last_visit_xy;
	};
	
	that.getCanvasContext = function ( ) {
		return my_context;
	};
	
	that.getLastClickTime = function ( ) {
		return my_last_click_time;
	};

	that.removeEventListeners = function ( ) {
		my_canvas.removeEventListener("mousedown", canvasOnMousedown, false);
		my_canvas.removeEventListener("mousemove", canvasOnMousemove, false);
	};
	
	// add these last
	my_canvas.addEventListener("mousedown", canvasOnMousedown, false);
	my_canvas.addEventListener("mousemove", canvasOnMousemove, false);
	my_canvas.addEventListener("mouseup", canvasOnMouseup, false);
	
	// this is the actual grid mangler object with public methods	
	return that;
};
