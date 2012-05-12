var express = require('express');
var io = require('socket.io');

var playerList = [];

function Server() {
	this.app = null;
	this.sio = null;
};

Server.prototype.createServer = function(directory) {
	var that = this;

	this.app = express.createServer();

	this.app.configure(function() {
		that.app.use(express.static(directory + '/client'));

		that.app.use(express.bodyParser());
		
		that.app.use(express.cookieParser());
		that.app.use(express.session({secret: 'secret', key: 'express.sid'}));
		// app.use(function(req, res) {
		// 	res.end('<h2>Hello, your session id is ' + req.sessionID + '</h2>');
		// });
	});
};

Server.prototype.listen = function(port) {
	this.app.listen(1337);
	this.sio = io.listen(this.app);
}

Server.prototype.handleConnections = function() {
	
	this.sio.sockets.on('connection', function (socket) {
		//add players to state
		// socket.emit('player connect', {
		// 	hello: "world"
		// });

		//do something
	});

	this.sio.sockets.on('disconnect', function (socket) {
		//remove player from state
		// socket.emit('player disconnect', {
		// 	hello: "world"
		// });

		//do something
	})
	
};

function createServer(dir) {
	var srv = new Server()

	srv.createServer(dir);
	srv.listen(1337);
	srv.handleConnections();
};

exports.createServer = createServer;