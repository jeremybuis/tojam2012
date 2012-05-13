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
var FIELD_WIDTH = 800;
var FIELD_HEIGHT = 800;

// Ship constants
var SHIP_RADIUS = 50;
var SHIP_MAX_ACCEL = 0.1;
var MAX_STAT = 100;
var START_STAT = 100;

// Physics constants
var TIME_CONST = 1;
var TIME_CONST_SQU_HALF = TIME_CONST * TIME_CONST / 2;
var DEG_TO_RAD = Math.PI / 180;

// Controls
var CTRL_ACCEL = Crafty.keys.W;
var CTRL_DECEL = Crafty.keys.S;
var CTRL_TURN_CW = Crafty.keys.A;
var CTRL_TURN_CCW = Crafty.keys.D;

Crafty.c('ship', {
	init: function() {
		if (!this.has('2D')) this.addComponent('2D');
		if (!this.has('DOM')) this.addComponent('DOM');

		this.attr({
			h: SHIP_RADIUS,
			w: SHIP_RADIUS,
			vx: 0,
			vy: 0,
			ax: 0,
			ay: 0,
			engine: START_STAT,
			hull: START_STAT,
			weap: START_STAT,
			rotation: -90
		});

		this.origin('center');

		this.ship_R = Crafty.e('2D, DOM, ship_R').attr({h: this.h, w: this.w}).origin('center');
		this.ship_G = Crafty.e('2D, DOM, ship_G').attr({h: this.h, w: this.w}).origin('center');
		this.ship_B = Crafty.e('2D, DOM, ship_B').attr({h: this.h, w: this.w}).origin('center');
		this.engine_R = Crafty.e('2D, DOM, engine_R').attr({h: this.h, w: this.w}).origin('center');
		this.engine_G = Crafty.e('2D, DOM, engine_G').attr({h: this.h, w: this.w}).origin('center');
		this.hull_R = Crafty.e('2D, DOM, hull_R').attr({h: this.h, w: this.w}).origin('center');
		this.hull_G = Crafty.e('2D, DOM, hull_G').attr({h: this.h, w: this.w}).origin('center');
		this.weap_R = Crafty.e('2D, DOM, weap_R').attr({h: this.h, w: this.w}).origin('center');
		this.weap_G = Crafty.e('2D, DOM, weap_G').attr({h: this.h, w: this.w}).origin('center');

		this.bind("EnterFrame", function(e) {
			this.vx = this.vx + this.ax * TIME_CONST;
			this.vy = this.vy + this.ay * TIME_CONST;
			this.x = this.x + this.vx * TIME_CONST + TIME_CONST_SQU_HALF * this.ax;
			while (this.x > FIELD_WIDTH) {
				this.x -= FIELD_WIDTH;
			}
			while (this.x < 0) {
				this.x += FIELD_WIDTH;
			}
			while (this.y > FIELD_HEIGHT) {
				this.y -= FIELD_HEIGHT;
			}
			while (this.y < 0) {
				this.y += FIELD_HEIGHT;
			}
			this.y = this.y + this.vy * TIME_CONST + TIME_CONST_SQU_HALF * this.ay;

			this.ship_R.attr({x: this.x, y: this.y, rotation: this.rotation});
			this.ship_G.attr({x: this.x, y: this.y, rotation: this.rotation});
			this.ship_B.attr({x: this.x, y: this.y, rotation: this.rotation});
			this.engine_R.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: 1 - this.engine / 100});
			this.engine_G.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: this.engine / 100});
			this.hull_R.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: 1 - this.hull / 100});
			this.hull_G.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: this.hull / 100});
			this.weap_R.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: 1 - this.weap / 100});
			this.weap_G.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: this.weap / 100});
		});

		console.log(this);
	},
	setEngine: function (engine) {
		if (this.engine != engine) {
			this.engine = engine;
			// TODO: update engine GFX
		}
	},
	setHealth: function (health) {
		if (this.health != health) {
			this.health = health;
			// TODO: update health GFX
		}
	},
	setWeapon: function (weapon) {
		if (this.weapon != weapon) {
			this.weapon = weapon;
			// TODO: update weapon GFX
		}
	},
	setColor: function(r, g, b) {
		this.ship_R.alpha = r * 0.5;
		this.ship_G.alpha = g * 0.5;
		this.ship_B.alpha = b * 0.5;
	}
});

Crafty.c('player', {
	init: function () {
		if (!this.has('ship')) this.addComponent('ship');
		if(!this.has('Keyboard')) this.addComponent('Keyboard');

		this.shoot = true;

		this.bind("EnterFrame", function(e) {
			// TODO: drain fuel here and variable turn rate
			if (this.isDown(CTRL_TURN_CW)) {
				if (this.isDown(CTRL_TURN_CCW)) {

				} else {
					this.rotation = (this.rotation - 5) % 360;
					console.log("rotation - 5");
				}
			} else {
				if (this.isDown(CTRL_TURN_CCW)) {
					this.rotation = (this.rotation + 5) % 360;
				}
			}

			var acc = 0;
			if (this.isDown(CTRL_ACCEL)) {
				acc = SHIP_MAX_ACCEL;
				// TODO: drain fuel here and vary accel
			}
			if (this.isDown(CTRL_DECEL)) {
				acc -= SHIP_MAX_ACCEL / 2;
				// TODO: drain fuel here and vary accel
			}

			this.ax = acc * Math.cos(this.rotation * DEG_TO_RAD);
			this.ay = acc * Math.sin(this.rotation * DEG_TO_RAD);
		});
	}
});

Crafty.scene('ship_test', function() {
	// test a ship
	Crafty.e('ship, player').attr({
		x: FIELD_WIDTH / 2,
		y: FIELD_HEIGHT / 2
	}).setColor(1, 1, 1);
});

window.onload = function() {
	//start crafty, full screen
	Crafty.init(WINDOW_WIDTH, WINDOW_HEIGHT);
	Crafty.scene('ship_test');
};
