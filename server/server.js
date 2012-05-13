var util = require('util');

//var connect = require('connect');
var express = require('express');
var sio = require('socket.io');

var client_event_types = {
	pos: 'POS',
	bullet: 'BULLET',
	bullet_death: 'BULLET_DEATH',
	death: 'DEATH',
	conn: 'connection',
	disconn: 'disconnect'
};

var server_event_types = {
	death: 'DEATH',
	pos: 'POS',
	join: 'JOIN',
	conn: 'CONN',
	disconn: 'DISCONN',
	bullet: 'BULLET',
	bullet_death: 'BULLET_DEATH'
};

var nextColor = (function() {
	var colors = [
		// // {color: "black", code: "#000000", rgb: {r:0, g:0, b:0}},
		// // {color: "white", code: "#FFFFFF", rgb: {r:255, g:255, b:255}},
		// {color: "red", hex: "#FF0000", rgb: {r:255, g:0, b:0}},
		// {color: "lime", hex: "#00FF00", rgb: {r:0, g:255, b:0}},
		// {color: "blue", hex: "#0000FF", rgb: {r:0, g:0, b:255}},
		// {color: "yellow", hex: "FFFF00", rgb: {r:255, g:255, b:0}},
		// {color: "cyan", hex: "#00FFFF", rgb: {r:0, g:255, b:255}},
		// {color: "magenta", hex: "#FF00FF", rgb: {r:255, g:0, b:255}},
		// {color: "silver", hex: "#C0C0C0", rgb: {r:192, g:192, b:192}},
		
		// {color: "gray", hex: "#808080", rgb: {r:128, g:128, b:128}},
		// {color: "maroon", hex: "#800000", rgb: {r:128, g:0, b:0}},
		// {color: "olive", hex: "#808000", rgb: {r:128, g:128, b:0}},
		// {color: "green", hex: "#008000", rgb: {r:0, g:128, b:0}},
		// {color: "purple", hex: "#800080", rgb: {r:128, g:0, b:128}},
		// {color: "teal", hex: "#008080", rgb: {r:0, g:128, b:128}},
		// {color: "navy", hex: "#000080", rgb: {r:0, g:0, b:128}}

		// {color: "black", code: "#000000", rgb: {r:0, g:0, b:0}},
		// {color: "white", code: "#FFFFFF", rgb: {r:255, g:255, b:255}},
		{color: "red", hex: "#FF0000", rgb: {r:1, g:0, b:0}},
		{color: "lime", hex: "#00FF00", rgb: {r:0, g:1, b:0}},
		{color: "blue", hex: "#0000FF", rgb: {r:0, g:0, b:1}},
		{color: "yellow", hex: "FFFF00", rgb: {r:1, g:1, b:0}},
		{color: "cyan", hex: "#00FFFF", rgb: {r:0, g:1, b:1}},
		{color: "magenta", hex: "#FF00FF", rgb: {r:1, g:0, b:1}},
		{color: "silver", hex: "#C0C0C0", rgb: {r:0.75, g:0.75, b:0.75}},
		
		{color: "gray", hex: "#808080", rgb: {r:0.5, g:0.5, b:0.5}},
		{color: "maroon", hex: "#800000", rgb: {r:0.5, g:0, b:0}},
		{color: "olive", hex: "#808000", rgb: {r:0.5, g:0.5, b:0}},
		{color: "green", hex: "#008000", rgb: {r:0, g:0.5, b:0}},
		{color: "purple", hex: "#800080", rgb: {r:0.5, g:0, b:0.5}},
		{color: "teal", hex: "#008080", rgb: {r:0, g:0.5, b:0.5}},
		{color: "navy", hex: "#000080", rgb: {r:0, g:0, b:0.5}}
	];

	var start = 0;

	return function() {
		var index = (start++)%colors.length;

		return colors[index];
	};
})();

var nextPosition = (function() {
	var positions = [
		{x: 0, y:0},

		{x: 500, y:0},
		{x: 0, y:500},
		{x: 500, y:500},

		{x: 250, y:0},
		{x: 0, y:250},
		{x:250, y:250}
	];

	var start = 0;

	return function() {
		//TODO this should be kind of random
		var index = (start++)%positions.length;
		return positions[index];
	};
})();

//
// Our chip class
//
//
var Ship = (function() {
	var id = 0;	//A static var to keep track of ids
	
	//This becomes the new constructor
	return function() {
		var pos = nextPosition();

		this.id = id += 1; //This increments on each new ship being made
		this.x = pos.x;
		this.y = pos.y;
		this.theta = 0;
		this.vx = 0;
		this.vy = 0;
		this.health = 100;
		this.fuel = 100;
		this.weapon = 1;
		this.color = nextColor().rgb;
		this.kills = 0;
		this.deaths = 0;
	};
})();

// var millenium_falcon = new Ship();
// var ebon_hawk = new Ship();
// var enterprise = new Ship();
// var voyager = new Ship();

// util.log(util.inspect(millenium_falcon));
// util.log(util.inspect(ebon_hawk));
// util.log(util.inspect(enterprise));
// util.log(util.inspect(voyager));


//
// Our server class
//
//
function Server() {
	this.app = null;
	this.io = null;

	this.clients = null;
}

Server.prototype.debug = function() {
	//do something useful ;)
	util.debug('funtimes');
};

Server.prototype.createServer = function(directory, port) {
	var that = this;

	this.app = express.createServer();

	this.app.configure(function() {
		var oneDay = 86400000;
		var oneYear = 31557600000;

		// that.app.use(express.logger());
		// that.app.use(express.bodyParser());
		// that.app.use(express.cookieParser());
		// that.app.use(express.session({secret: 'keyboard cat', key: 'express.sid'}));
		// that.app.use(express.router);
		//Handles the static content serving
		//that.app.use(express.staticCache());
		//that.app.use(express.static(directory + '/client'), {maxAge: oneDay});
		that.app.use(express.static(directory + '/client'));
		//that.app.use(connect.compress());

		// that.app.use(express.errorHandling({showStack:true, dumpExceptions: true}));
	});

	this.clients = {};

	this.app.listen(port);
	this.io = sio.listen(this.app);
};

//updates everyone but the current socket
Server.prototype.emitServerEvent = function(type, socket, data) {
	for (var client in this.clients) {
		if (this.clients.hasOwnProperty(client)) {
			if (socket.id !== client) {
				//send the data to all the other clients
				this.clients[client].socket.emit(type, data);
			}
		}
	}
};

//handles incoming connections and other client side events
Server.prototype.onClientEvents = function() {
	var that = this;

	this.io.sockets.on(client_event_types.conn, function (socket) {
		//util.log(client_event_types.conn);

		that.clients[socket.id] = {
			socket: socket,
			ship: new Ship()
		};

		//prep an array of ships to pass around
		var others = [];

		//tell all the other clients about this client joining
		for (var client in that.clients) {
			if (that.clients.hasOwnProperty(client)) {
				if (socket.id !== client) {
					var data = {
						id: that.clients[socket.id].ship.id,
						x:that.clients[socket.id].ship.x,
						y:that.clients[socket.id].ship.y,
						color: that.clients[socket.id].ship.color
					};

					that.clients[client].socket.emit(server_event_types.conn, data);
					others.push(that.clients[client].ship);
				}
			}
		}

		//JOIN - send to current socket
		socket.emit(server_event_types.join, {
			id: that.clients[socket.id].ship.id,
			color: that.clients[socket.id].ship.color,
			x: that.clients[socket.id].ship.x,
			y: that.clients[socket.id].ship.y,
			ships: others
		});

		//all the following event handling code is for this's socket, so one client
		//each client

		//DISCONN
		socket.on(client_event_types.disconn, function () {
			//util.log(client_event_types.disconn);

			var data = {
				id: that.clients[socket.id].ship.id
			};

			that.emitServerEvent(server_event_types.disconn, socket, data);
			//removes the socket.id from the clients object
			delete that.clients[socket.id];
		});

		//POS
		socket.on(client_event_types.pos, function (data) {
			//util.log(client_event_types.pos);

			//sync our data
			var currentShip = that.clients[socket.id].ship;

			currentShip.x = data.x;
			currentShip.y = data.y;
			currentShip.theta = data.theta;
			currentShip.vx = data.vx;
			currentShip.vy = data.vy;
			currentShip.health = data.health;
			currentShip.fuel = data.fuel;
			currentShip.weapon = data.weapon;

			//wrap our ship into an object to send out
			var out = {
				id: currentShip.id,
				x: currentShip.x,
				y: currentShip.y,
				theta: currentShip.theta,
				vx: currentShip.vx,
				vy: currentShip.vy,
				health: currentShip.health,
				fuel: currentShip.fuel,
				weapon: currentShip.weapon,
				kills: currentShip.kills,
				deaths: currentShip.deaths
			};

			//util.debug(util.inspect(data));
			//util.debug(util.inspect(out));

			that.emitServerEvent(server_event_types.pos, socket, out);
		});

		//DEATH
		socket.on(client_event_types.death, function (data) {
			//util.log(client_event_types.death);

			var dead = data.id;
			var killer = data.killingId;

			//update the kill death counters
			for (var client in that.clients) {
				if (that.clients.hasOwnProperty(client)) {
					if (killer === clients[client].ship.id) {
						that.clients[client].ship.kills += 1;
					} else if (dead === clients[client].ship.id) {
						that.clients[client].ship.deaths += 1;
					}
				}
			}

			//simply repeat out to the other clients that a player has died
			that.emitServerEvent(server_event_types.death, socket, data);
		});

		//BULLET
		socket.on(client_event_types.bullet, function (data) {
			//util.log(client_event_types.bullet);

			that.emitServerEvent(server_event_types.bullet, socket, data);
		});

		//BULLET DEATH
		socket.on(client_event_types.bullet_death, function (data) {
			//util.log(client_event_types.bullet_death);

			that.emitServerEvent(server_event_types.bullet_death, socket, data);
		});
	});
};

function createServer(dir, port) {
	var srv = new Server();

	srv.createServer(dir, port);
	srv.onClientEvents();
}

exports.createServer = createServer;