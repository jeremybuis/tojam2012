(function(window, undefined) {

	var socket = io.connect('http://localhost');
			
	socket.on('player connect', function (data) {
		console.log('connection');
		console.log(data);
	});

	socket.on('player disconnect', function (data) {
		console.log('disconnection');
		console.log(data);
	});

})(window);

// CONSTANTS

// Size of the playing field
var WINDOW_WIDTH = 1280;
var WINDOW_HEIGHT = 800;

var SHIP_RADIUS = 50;

Crafty.c('ship', {
	init: function() {
		if (!this.has('2D')) this.addComponent('2D');
		if (!this.has('DOM')) this.addComponent('DOM');
		if (!this.has('Color')) this.addComponent('Color');

		this.attr({
			h: SHIP_RADIUS,
			w: SHIP_RADIUS
		});

		this.origin('center');

		this.color('#fff');
	},
	vel_x: 0,
	vel_y: 0
});

Crafty.c('player', {
	init: function () {
		if (!this.has('ship')) this.addComponent('ship');

		this.move = {
			down: false,
			left: false,
			right: false,
			up: false
		};
	}
});

Crafty.scene('ship_test', function() {
	// test a ship
	Crafty.e('ship, player').attr({
		x: WINDOW_WIDTH / 2,
		y: WINDOW_HEIGHT / 2
	});
});

window.onload = function() {
	//start crafty, full screen
	Crafty.init(WINDOW_WIDTH, WINDOW_HEIGHT);
	Crafty.scene('ship_test');
};

//Blarg