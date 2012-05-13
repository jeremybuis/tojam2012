var util = require('util');

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
		// {color: "black", code: "#000000"},
		// {color: "white", code: "#FFFFFF"},
		{color: "red", code: "#FF0000"},
		{color: "lime", code: "#00FF00"},
		{color: "blue", code: "#0000FF"},
		{color: "yellow", code: "FFFF00"},
		{color: "cyan", code: "#00FFFF"},
		{color: "magenta", code: "#FF00FF"},
		{color: "silver", code: "#C0C0C0"},
		{color: "gray", code: "#808080"},
		{color: "maroon", code: "#800000"},
		{color: "olive", code: "#808000"},
		{color: "green", code: "#008000"},
		{color: "purple", code: "#800080"},
		{color: "teal", code: "#008080"},
		{color: "navy", code: "#000080"}
	];

	var start = 0;

	return function() {
		var index = (start++)%colors.length;

		return colors[index];
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
		this.id = id += 1; //This increments on each new ship being made
		this.x = 0;
		this.y = 0;
		this.theta = 0;
		this.vx = 0;
		this.vy = 0;
		this.health = 100;
		this.fuel = 100;
		this.weapon = 1;
		this.color = nextColor().code;
		this.kills = 0;
		this.deaths = 0;
	};
})();

var millenium_falcon = new Ship();
var ebon_hawk = new Ship();
var enterprise = new Ship();
var voyager = new Ship();

util.log(util.inspect(millenium_falcon));
util.log(util.inspect(ebon_hawk));
util.log(util.inspect(enterprise));
util.log(util.inspect(voyager));


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
};

Server.prototype.createServer = function(directory, port) {
	var that = this;

	this.app = express.createServer();

	this.app.configure(function() {
		//Handles the static content serving
		that.app.use(express.static(directory + '/client'));
		
		// that.app.use(express.bodyParser());
		// that.app.use(express.cookieParser());
		// that.app.use(express.session({secret: 'secret', key: 'express.sid'}));
		// app.use(function(req, res) {
		// 	res.end('<h2>Hello, your session id is ' + req.sessionID + '</h2>');
		// });
	});

	this.clients = {};

	this.app.listen(port);
	this.io = sio.listen(this.app);
};

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

Server.prototype.onClientEvents = function() {
	var that = this;

	this.io.sockets.on(client_event_types.conn, function (socket) {
		util.log(client_event_types.conn);

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
					that.clients[client].socket.emit(server_event_types.conn, that.clients[socket.id].ship);
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
		socket.on(client_event_types.disconn, function (data) {
			util.log(client_event_types.disconn);

			that.emitServerEvent(server_event_types.disconn, socket, {id: that.clients[socket.id].ship.id});
			//removes the socket.id from the clients object
			delete that.clients[socket.id];
		});

		//POS
		socket.on(client_event_types.pos, function (data) {
			util.log(client_event_types.pos);

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
			currentShip.kills = data.kills;
			currentShip.deaths = data.deaths;

			that.emitServerEvent(server_event_types.pos, socket, currentShip);
		});

		//BULLET
		socket.on(client_event_types.bullet, function (data) {
			util.log(client_event_types.bullet);

			that.emitServerEvent(server_event_types.bullet, socket, data);
		});

		//BULLET DEATH
		socket.on(client_event_types.bullet_death, function (data) {
			util.log(client_event_types.bullet_death);

			that.emitServerEvent(server_event_types.bullet_death, socket, data);
		});

		//DEATH
		socket.on(client_event_types.death, function (data) {
			util.log(client_event_types.death);

			that.emitServerEvent(server_event_types.death, socket, data);
		});
	});
};

function createServer(dir, port) {
	var srv = new Server();

	srv.createServer(dir, port);
	srv.onClientEvents();
}

exports.createServer = createServer;