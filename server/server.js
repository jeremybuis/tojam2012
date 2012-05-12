var express = require('express');
var io = require('socket.io');

var playerList = [];

var createServer = function(directory) {
	var app = express.createServer();

	app.configure(function() {
		app.use(express.static(directory + '/client'));

		app.use(express.bodyParser());
		
		app.use(express.cookieParser());
		app.use(express.session({secret: 'secret', key: 'express.sid'}));
		// app.use(function(req, res) {
		// 	res.end('<h2>Hello, your session id is ' + req.sessionID + '</h2>');
		// });
	});

	app.listen(1337);
	console.log('server listening on 1337');

	app.get('/', function(req, res) {
		res.send('Hello World');
	});

	var sio = io.listen(app);

	sio.sockets.on('connection', function (socket) {
		//add players to state
		socket.emit('player connect', {
			hello: "world"
		});
	});

	sio.sockets.on('disconnect', function (socket) {
		//remove player from state
		socket.emit('player disconnect', {
			hello: "world"
		});
	})
}

exports.createServer = createServer;