var util = require('util');

var express = require('express');
var sio = require('socket.io');

var colors = {
	red: "#FF0000",
	blue: "#0000FF",
	green: "#008000",
	yellow: "FFFF00",

	white: "#FFFFFF",
	black: "#000000",

	silver: "#C0C0C0",
	grey: "#808080"
};

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

//
// Our chip class
//
//
var Ship = (function() {

	var id = 0;	//A static var to keep track of ids
	var NewShip;

	//This becomes the new constructor
	NewShip = function() {
		this.id = id += 1;
		this.x = 0;
		this.y = 0;
		this.theta = 0;
		this.vx = 0;
		this.vy = 0;
		this.health = 100;
		this.fuel = 100;
		this.weapon = 1;
		this.color = colors.red;
		this.kills = 0;
		this.deaths = 0;
	};

	return NewShip;
}());

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

Server.prototype.handleClientEvents = function() {
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
			if (socket.id !== client) {
				that.clients[client].emit(server_event_types.conn, that.clients[socket.id].ship);
				others.push(that.clients[client].ship);
			}
		}

		//join event - these are dummy values for now - send to current socket
		socket.emit(server_event_types.join, {
			id: that.clients[socket.id].ship.id,
			color: that.clients[socket.id].ship.color,
			x: that.clients[socket.id].ship.x,
			y: that.clients[socket.id].ship.y,
			ships: others
		});

		//all the following event handling code is for this's socket, so one client
		//each client

		socket.on(client_event_types.disconn, function (data) {
			util.log(client_event_types.disconn);

			for (var client in that.clients) {
				if (socket.id !== client) {
					//send the data to all the other clients
					that.clients[client].emit(server_event_types.diconn, {
						id: that.clients[socket.id].ship.id
					});
				}
			}

			//removes the socket.id from the clients object
			delete that.clients[socket.id];
		});

		//POS
		socket.on(client_event_types.pos, function (data) {
			util.log(client_event_types.pos);

			for (var client in that.clients) {
				if (socket.id !== client) {
					//send the data to all the other clients
					that.clients[client].emit(server_event_types.pos, data);
				}
			}
		});

		//BULLET
		socket.on(client_event_types.bullet, function (data) {
			util.log(client_event_types.bullet);

			for (var client in that.clients) {
				if (socket.id !== client) {
					//send the data to all the other clients
					that.clients[client].emit(server_event_types.bullet, data);
				}
			}
		});

		//BULLET DEATH
		socket.on(client_event_types.bullet_death, function (data) {
			util.log(client_event_types.bullet_death);

			for (var client in that.clients) {
				if (socket.id !== client) {
					//send the data to all the other clients
					that.clients[client].emit(server_event_types.bullet_death, data);
				}
			}
		});

		//DEATH
		socket.on(client_event_types.death, function (data) {
			util.log(client_event_types.death);

			for (var client in that.clients) {
				if (socket.id !== client) {
					//send the data to all the other clients
					that.clients[client].emit(server_event_types.death, data);
				}
			}
		});
	});
};

function createServer(dir, port) {
	var srv = new Server();

	srv.createServer(dir, port);
	srv.handleClientEvents();
}

exports.createServer = createServer;