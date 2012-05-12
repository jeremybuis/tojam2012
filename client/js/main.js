//Blarg

(function(window, undefined) {

	var socket = io.connect('http://localhost');
			
	socket.on('player connect', function (data) {
		console.log('connection');
		console.log(data);
	});

	socket.on('player disconnect', function (data) {
		console.log('disconnection');
		console.log(data)
	});

})(window);