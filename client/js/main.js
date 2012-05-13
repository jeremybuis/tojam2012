// CONSTANTS

// Size of the playing field
var WINDOW_WIDTH = 1280;
var WINDOW_HEIGHT = 800;
var FIELD_WIDTH = 800;
var FIELD_HEIGHT = 800;

// Ship constants
var SHIP_RADIUS = 50;
var BULLET_RADIUS = 5;
var SHIP_MAX_ACCEL = 0.1;
var MAX_STAT = 1;
var START_STAT = 0.5;
var MAX_TURN_INCREASE = 4.5;
var MIN_TURN = 0.5;
var FUEL_DECREASE_TURN = 0.01;

// Physics constants
var TIME_CONST = 1;
var TIME_CONST_SQU_HALF = TIME_CONST * TIME_CONST / 2;
var DEG_TO_RAD = Math.PI / 180;

// Network constants
var SHIP_UPDATE_RATE = 1;

// Controls
var CTRL_ACCEL = Crafty.keys.W;
var CTRL_DECEL = Crafty.keys.S;
var CTRL_TURN_CW = Crafty.keys.A;
var CTRL_TURN_CCW = Crafty.keys.D;

Crafty.c('socket', {
	initSocket: function(socket) {
		this.socket = socket;
		return this;
	}
});

Crafty.c('ship', {
	init: function() {
		this.requires('2D, DOM');

		this.attr({
			id: null,
			h: SHIP_RADIUS,
			w: SHIP_RADIUS,
			vx: 0,
			vy: 0,
			ax: 0,
			ay: 0,
			engine: START_STAT,
			hull: START_STAT,
			weap: START_STAT,
			rotation: -90,
			kills: 0,
			deaths: 0
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

		this.bind('EnterFrame', function(e) {
			this.vx = this.vx + this.ax * TIME_CONST;
			this.vy = this.vy + this.ay * TIME_CONST;
			this.x = this.x + this.vx * TIME_CONST + TIME_CONST_SQU_HALF * this.ax;
			while (this.x > FIELD_WIDTH) {
				this.x -= FIELD_WIDTH;
			}
			while (this.x < 0) {
				this.x += FIELD_WIDTH;
			}
			this.y = this.y + this.vy * TIME_CONST + TIME_CONST_SQU_HALF * this.ay;
			while (this.y > FIELD_HEIGHT) {
				this.y -= FIELD_HEIGHT;
			}
			while (this.y < 0) {
				this.y += FIELD_HEIGHT;
			}

			this.ship_R.attr({x: this.x, y: this.y, rotation: this.rotation});
			this.ship_G.attr({x: this.x, y: this.y, rotation: this.rotation});
			this.ship_B.attr({x: this.x, y: this.y, rotation: this.rotation});
			this.engine_R.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: 1 - this.engine});
			this.engine_G.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: this.engine});
			this.hull_R.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: 1 - this.hull});
			this.hull_G.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: this.hull});
			this.weap_R.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: 1 - this.weap});
			this.weap_G.attr({x: this.x, y: this.y, rotation: this.rotation, alpha: this.weap});
		});
	},
	ship: function(id, r, g, b) {
		this.id = id;
		this.ship_R.alpha = r * 0.5;
		this.ship_G.alpha = g * 0.5;
		this.ship_B.alpha = b * 0.5;

		return this;
	},
	updatePos: function(update) {
		this.x = update['x'];
		this.y = update['y'];
		this.rotation = update['theta'];
		this.vx = update['vx'];
		this.vy = update['vy'];
		this.hull = update['health'];
		this.engine = update['fuel'];
		this.weap = update['weapon'];
		this.kills = update['kills'];
		this.deaths = update['deaths'];

		return this;
	},
	remove: function() {
		// handle removal of ship from playing field here
		this.ship_R.destroy();
		this.ship_G.destroy();
		this.ship_B.destroy();
		this.engine_R.destroy();
		this.engine_G.destroy();
		this.hull_R.destroy();
		this.hull_G.destroy();
		this.weap_R.destroy();
		this.weap_G.destroy();
		this.destroy();
	}
});

Crafty.c('player', {
	init: function () {
		this.requires('ship, Keyboard, socket');

		this.attr({
			shoot: true
		});

		this.bind('EnterFrame', function(e) {
			// TODO: drain fuel here and variable turn rate
			var rotationRate = MIN_TURN + MAX_TURN_INCREASE * this.engine;
			if (this.isDown(CTRL_TURN_CW)) {
				if (this.isDown(CTRL_TURN_CCW)) {
					this.engine = Math.max(this.engine - FUEL_DECREASE_TURN * 2, 0);
				} else {
					this.engine = Math.max(this.engine - FUEL_DECREASE_TURN, 0);
					this.rotation = (this.rotation - rotationRate) % 360;
				}
			} else {
				if (this.isDown(CTRL_TURN_CCW)) {
					this.engine = Math.max(this.engine - FUEL_DECREASE_TURN, 0);
					this.rotation = (this.rotation + rotationRate) % 360;
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

			if (e.frame % SHIP_UPDATE_RATE === 0) {
				this.socket.emit('POS', JSON.stringify({
					id: this.id,
					x: this.x,
					y: this.y,
					theta: this.rotation,
					vx: this.vx,
					vy: this.vy,
					health: this.hull,
					fuel: this.engine,
					weapon: this.weap
				}));
			}
		});
	}
});

Crafty.c('bullet', {
	init: function() {
		this.requires('2D, DOM');

		this.attr({
			id: null,
			h: BULLET_RADIUS,
			w: BULLET_RADIUS,
			vx: 0,
			vy: 0,
			playerId: null,
			power: null,
			bullets: null
		});

		this.bind('EnterFrame', function(e) {
			this.vx = this.vx + this.ax * TIME_CONST;
			this.vy = this.vy + this.ay * TIME_CONST;
			this.x = this.x + this.vx * TIME_CONST;
			while (this.x > FIELD_WIDTH) {
				this.x -= FIELD_WIDTH;
			}
			while (this.x < 0) {
				this.x += FIELD_WIDTH;
			}

			this.y = this.y + this.vy * TIME_CONST;
			while (this.y > FIELD_HEIGHT) {
				this.y -= FIELD_HEIGHT;
			}
			while (this.y < 0) {
				this.y += FIELD_HEIGHT;
			}

			// TODO: decay bullet and kill itself
		});
	},
	bullet: function(id, playerId, x, y, vx, vy, power, bullets) {
		this.id = id;
		this.playerId = playerId;
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.power = power;
		this.bullets = bullets;

		return this;
	},
	remove: function() {
		delete this.bullets[this.id];
		this.destroy();
	}
});

Crafty.scene('game', function() {
	var socket = io.connect();
	var ships = {};
	var bullets = {};

	socket.on('JOIN', function (data) {
		console.log(data);
		var player = Crafty.e('ship, player').initSocket(socket).ship(
			data['id'],
			data['color']['r'],
			data['color']['g'],
			data['color']['b'])
		.attr({
			x: data['x'],
			y: data['y']
		});

		ships = {};
		ships[data['id']] = player;

		var ship;
		for (ship in data['ships']) {
			ships[ship['id']] = Crafty.e('ship').ship(
				ship['id'],
				ship['color']['r'],
				ship['color']['g'],
				ship['color']['b']).updatePos(ship);
		}
	});

	socket.on('DEATH', function (data) {
		console.log(data);
		// TODO: render the death animation
	});

	socket.on('POS', function (data) {
		console.log(data);
		var ship;
		for (ship in data) {
			ships[ship['id']].updatePos(ship);
		}
	});

	socket.on('CONN', function (data) {
		console.log(data);
		ships[data['id']] = Crafty.e('ship').ship(
			data['id'],
			data['color']['r'],
			data['color']['g'],
			data['color']['b']
		).attr({
			x: data['x'],
			y: data['y']
		});
	});

	socket.on('DISCONN', function (data) {
		console.log(data);
		ships[data['id']].remove();
		delete ships[data['id']];
	});

	socket.on('BULLET', function (data) {
		console.log(data);
		bullets[data['id']] = Crafty.e('bullet').bullet(
			data['id'],
			data['playerId'],
			data['x'],
			data['y'],
			data['vx'],
			data['vy'],
			data['power'],
			bullets);
	});

	socket.on('BULLET_DEATH', function (data) {
		console.log(data);
		bullets[data['id']].remove();
	});

});

window.onload = function() {
	//start crafty, full screen
	Crafty.init(WINDOW_WIDTH, WINDOW_HEIGHT);
	Crafty.scene('game');
};
