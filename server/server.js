var express = require('express');
var io = require('socket.io');

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

		console.log(__dirname + '../client');
	});

	var sio = io.listen(app);

	sio.sockets.on('connection', function (socket) {
		socket.emit('news', { hello: 'world' });
		socket.on('my other event', function (data) {
			console.log(data);
		});
	});
}

exports.createServer = createServer;