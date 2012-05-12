var util = require('util');

var express = require('express');
var sio = require('socket.io');

var colours = {
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

	//these are implicit
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

	//Connection/Disconnect code
	this.io.sockets.on(client_event_types.conn, function (socket) {
		util.log(client_event_types.conn);

		that.clients[socket.id] = socket; //add the socket to our list of clients

		socket.on(client_event_types.disconn, function() {
			util.log(client_event_types.disconn);

			delete that.clients[socket.id];
		});
	});

	//Game event code
	//POS
	this.io.sockets.on(client_event_types.pos, function (socket) {
		util.log(client_event_types.pos);

		//emit the clients position to all the other clients
	});

	//BULLET
	this.io.sockets.on(client_event_types.bullet, function (socket) {
		util.log(client_event_types.bullet);
	});

	//BULLET_DEATH
	this.io.sockets.on(client_event_types.bullet_death, function (socket) {
		util.log(client_event_types.bullet_death);
	});

	//DEATH
	this.io.sockets.on(client_event_types.death, function (socket) {
		util.log(client_event_types.death);
	});
	
};

function createServer(dir, port) {
	var srv = new Server();

	srv.createServer(dir, port);
	srv.handleClientEvents();
}

exports.createServer = createServer;