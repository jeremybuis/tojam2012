$(document).ready(function() {
	var xoffset = 0;
	var yoffset = 0;
	
	Crafty.init(300,630);
	Crafty.canvas.init();
	
	//current piece & test rotation
	var currentPiece = [4];
	var currentPieceColors = [4];
	var critical;
	var banner;
	var testRotate = [4];
	//currently drawn board
	var board = [200];
	//var for placement timer
	var intervalID;
	var deathcounter = 0;	//use for both speedingup and for respawn timer
	//tetris board in x, y
	//note this is slightly oversized to allow referencing outside. just in case.
	var localBoard = new Array(11);
	var alive = false;
	var respawnable = false;
	var fallspeed = 1;
	
	alive = true;
	respawnable = false;
	
	//initialize colors
	for (var x = 0; x < 4; x++) {
		currentPieceColors[x] = 1;
	}
	//initialize board
	for(var y = 0; y < 10; y++) {
		localBoard[y] = [21];
	}
	for (var i = 0; i < 11; i++) {
		localBoard[i] = []; //init board
		for (var j = 0; j < 21; j++) {
			localBoard[i][j] = 0; //set it to empty
		}
	}
	//initialize board
	for (var k=0; k<200; k++) {
		board[k] = -1;
	}
	
	//start placement timer, 100ms
	intervalID = window.setInterval(placeBlocks, 100);

	Crafty.load(["images/sprite.png"], function() {
		//splice the spritemap
		Crafty.sprite(30, "images/sprite.png", {
			color1: [0,0],
			color2: [1,0],
			color3: [2,0],
			color4: [3,0],
			colorwall: [4,0]
		});
		//start the main scene when loaded
		Crafty.scene("main");
	});
	
	Crafty.scene("main", function () {
		Crafty.background("url('images/bg.png')");
		intervalID = window.setInterval(placeBlocks, 100);
		createNewPiece();
		
		for (var i = 0; i <10; i++) {
			Crafty.e("2D, DOM, colorwall")
			.attr({x:i*30, y:600}).origin("top left");
		}
		//function to redraw the currenly placed pieces
		//check game state vars
		banner = Crafty.e("2D, DOM, Image").image("images/not_ending.png");
		banner.x = 0;
		banner.y = 0;
	});

	function createNewPiece () {
		//currently falling piece
		//insert a RNG to randomly color pieces
		var fallingPiece = Crafty.e("2D, DOM, Controls")
		.attr({move: {left: false, right: false, rotate: false, drop: false}})
			.origin("top left")
			.bind("KeyDown", function(e) {
				//on keydown, set the move booleans
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = true;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = true;
				} else if(e.keyCode === Crafty.keys.UP_ARROW) {
					this.move.rotate = true;
				} else if(e.keyCode === Crafty.keys.DOWN_ARROW) {
					this.move.drop = true;
				}
			}).bind("KeyUp", function(e) {
				//on key up, set the move booleans to false
				if(e.keyCode === Crafty.keys.RIGHT_ARROW) {
					this.move.right = false;
				} else if(e.keyCode === Crafty.keys.LEFT_ARROW) {
					this.move.left = false;
				} else if(e.keyCode === Crafty.keys.UP_ARROW) {
					this.move.rotate = false;
				} else if(e.keyCode === Crafty.keys.DOWN_ARROW) {
					this.move.drop = false;
				} else if(e.keyCode === Crafty.keys.ENTER) {
					//Manual Reset Behavior
					destroyPiece();
					localBoard[0][0]=1;
					checkLose();
				}
			}).bind("EnterFrame", function() {
				var i;

				if (this.move.right) {
					if (checkBounds(1)) {
						if (checkCollision(1)) {
							for (i = 0; i < 4; i++) {
								currentPiece[i].x +=30;
							}
							this.move.right = false;
						}
					}
				}
				if (this.move.left) {
					if (checkBounds(2)) {
						if (checkCollision(-1)) {
							for (i = 0; i < 4; i++) {
								currentPiece[i].x -= 30;
							}
							this.move.left = false;
						}
					}
				}
				if (this.move.rotate) {
					//rotate about the X&Y of currentpiece0
					for (i=0; i<4; i++) {
						testRotate[i].x = (currentPiece[i]._y - currentPiece[1]._y) + currentPiece[1]._x;
						testRotate[i].y = -1*(currentPiece[i]._x - currentPiece[1]._x) + currentPiece[1]._y;
					}
					if (checkBounds(3) && pieceChoice != 2) {
						if (checkCollision(2)) {
							for (i = 0; i < 4; i++) {
								currentPiece[i].x = testRotate[i].x;
								currentPiece[i].y = testRotate[i].y;
							}
						}
					}
					this.move.rotate = false;
				}
				if (this.move.drop) {
					if (checkBounds(4)) {
						if (checkCollision(0)) {
							for(i = 0; i < 4; i++) {
								currentPiece[i].y+=10;
							}
						}
					}
				}
				if (checkBounds(5)) {
					if (checkCollision(0)) {
						for(i = 0; i < 4; i++) {
							currentPiece[i].y+=fallspeed;
						}
					}
				}
			});

			var pieceChoice = Math.floor((Math.random()*7)+1);
			var i;

			for (i = 0; i < 4; i++) {
				currentPieceColors[i] = Math.floor((Math.random()*4)+1);
			}
			//define piece shape/starting locations
			for (i = 0; i < 4; i++) {
				currentPiece[i] = Crafty.e("2D, DOM, color"+currentPieceColors[i]);
				testRotate[i] = Crafty.e("2D");
				switch(pieceChoice)
				{
				case 1:		//line
					currentPiece[i].x=150;
					currentPiece[i].y=-90+30*i;
					break;
				case 2:		//box
					currentPiece[i].x = 150 + (i%2)*30;
					currentPiece[i].y=-90;
					if(i>1)currentPiece[i].y=-90+30;
					break;
				case 3:		//step up & right
					currentPiece[i].x=150 + (i%2)*30;
					currentPiece[i].y=-90;
					if(i>1){
						currentPiece[i].y=-90+30;
						currentPiece[i].x-=30;
					}
					break;
				case 4:		//step up and left
					currentPiece[i].x=150 + (i%2)*30;
					currentPiece[i].y=-90;
					if(i>1){
						currentPiece[i].y=-90+30;
						currentPiece[i].x+=30;
					}
					break;
				case 5:		//L
					currentPiece[i].x=150 + Math.floor(i/3)*30;
					currentPiece[i].y=-90+30*i - Math.floor(i/3)*30;
					break;
				case 6:		//backwards L
					currentPiece[i].x=150 - Math.floor(i/3)*30;
					currentPiece[i].y=-90+30*i - Math.floor(i/3)*30;
					break;
				case 7:		//T
					currentPiece[i].x=150 -30 + i*30 - Math.floor(i/3)*60;
					currentPiece[i].y=-90 + Math.floor(i/3)*30;
					break;
				}
			}
	}
	function checkCollision(a){
		//movement a = +1 right, -1 left, 0 down, 2 rotation
		// DO NOT CALL THIS BEFORE CALLING CHECKBOUNDS!!!
		// Checkbounds should handle boundary case. this handles everything except boundary case.
		//check against localBoard array
		//floor vs ceil does not matter for left vs right movement.
		//ceil matters for down movement (round up consideration)
		//allow movement if piece isn't on the board yet (left/right bounds handled by bounds)
		if((currentPiece[0]._y/30) <= 0 || (currentPiece[1]._y/30) <=0 ||
			(currentPiece[2]._y/30) <= 0 || (currentPiece[3]._y/30) <= 0) {
			
			return true;
		}
		if (a === 1) {
			return (
				localBoard[Math.floor(currentPiece[0]._x/30)+1][Math.floor(currentPiece[0]._y/30)] === 0 &&
				localBoard[Math.floor(currentPiece[1]._x/30)+1][Math.floor(currentPiece[1]._y/30)] === 0 &&
				localBoard[Math.floor(currentPiece[2]._x/30)+1][Math.floor(currentPiece[2]._y/30)] === 0 &&
				localBoard[Math.floor(currentPiece[3]._x/30)+1][Math.floor(currentPiece[3]._y/30)] === 0
				);
		}
		if (a === -1) {
			return (
				localBoard[Math.floor(currentPiece[0]._x/30)-1][Math.floor(currentPiece[0]._y/30)] === 0 &&
				localBoard[Math.floor(currentPiece[1]._x/30)-1][Math.floor(currentPiece[1]._y/30)] === 0 &&
				localBoard[Math.floor(currentPiece[2]._x/30)-1][Math.floor(currentPiece[2]._y/30)] === 0 &&
				localBoard[Math.floor(currentPiece[3]._x/30)-1][Math.floor(currentPiece[3]._y/30)] === 0
			);
		}
		if (a === 0) {
			return (
				localBoard[Math.floor(currentPiece[0]._x/30)][Math.ceil(currentPiece[0]._y/30)] === 0 &&
				localBoard[Math.floor(currentPiece[1]._x/30)][Math.ceil(currentPiece[1]._y/30)] === 0 &&
				localBoard[Math.floor(currentPiece[2]._x/30)][Math.ceil(currentPiece[2]._y/30)] === 0 &&
				localBoard[Math.floor(currentPiece[3]._x/30)][Math.ceil(currentPiece[3]._y/30)] === 0
			);
		}
		if (a === 2) {
			return (
				localBoard[Math.floor(testRotate[0]._x/30)][Math.ceil(testRotate[0]._y/30)] === 0 &&
				localBoard[Math.floor(testRotate[1]._x/30)][Math.ceil(testRotate[1]._y/30)] === 0 &&
				localBoard[Math.floor(testRotate[2]._x/30)][Math.ceil(testRotate[2]._y/30)] === 0 &&
				localBoard[Math.floor(testRotate[3]._x/30)][Math.ceil(testRotate[3]._y/30)] === 0
			);
		}
		// handle rotation
	}
	function checkBounds(a){
		//1 right, 2 left, 3 rotation, 4 drop, 5 fallspeed
		if (a === 1) {
			return (currentPiece[0]._x +30) <= 300-1 && (currentPiece[1]._x +30)  <= 300-1 &&
			(currentPiece[2]._x +30)  <= 300-1 && (currentPiece[3]._x +30)  <= 300-1;
		}
		if (a === 2) {
			return (currentPiece[0]._x -30) > -1 && (currentPiece[1]._x -30) > -1 &&
			(currentPiece[2]._x -30) > -1 && (currentPiece[3]._x -30) > -1;
		}
		if (a === 3) {
			return (testRotate[0]._x) <= 300-1 && (testRotate[1]._x)  <= 300-1 &&
			(testRotate[2]._x)  <= 300-1 && (testRotate[3]._x)  <= 300-1 &&
			(testRotate[0]._x) > -1 && (testRotate[1]._x) > -1 &&
			(testRotate[2]._x) > -1 && (testRotate[3]._x) > -1;
		}
		if (a === 4) {
			return (currentPiece[0]._y + 40 && currentPiece[1]._y + 40 &&
			currentPiece[2]._y + 40 && currentPiece[3]._y + 40) < 600;
		}
		if (a === 5) {
			return (currentPiece[0]._y + 30 && currentPiece[1]._y + 30 &&
			currentPiece[2]._y + 30 && currentPiece[3]._y + 30) < 600;
		}
	}
	function destroyPiece () {
		//always call this before creating a new piece (otherwise memory leaks)
		Crafty("color1").destroy();
		Crafty("color2").destroy();
		Crafty("color3").destroy();
		Crafty("color4").destroy();
		Crafty("Controls").destroy();
	}
	function redrawBoard () {
		var i;
		var j;

		for (i = 0; i < 200; i++) {
			if (board[i] != -1) {
				board[i].destroy();
			}
		}

		var drawNum = 0;
		//draw the pieces that are placed
		for (i = 0; i < 11; i++) {
			for (j = 0; j < 21; j++) {
				if (localBoard[i][j] >= 1 && localBoard[i][j] <= 4) {
					board[drawNum] = Crafty.e("2D, DOM, color" + localBoard[i][j]);
					board[drawNum].x = i*30;
					board[drawNum].y = j*30;
					drawNum++;
				}
			}
		}
		Crafty("colorwall").destroy();
		for (i = 0; i < 10; i++) {
			Crafty.e("2D, DOM, colorwall").attr({x:i*30, y:600}).origin("top left");
		}
		banner.destroy();
		banner = Crafty.e("2D, DOM, Image").image("images/not_ending.png");
		banner.x = 0;
		banner.y = 0;
	}

	function placeBlocks(){
		//handle speedups, respawns here
		deathcounter++;
		if (deathcounter%100 === 0) {
			console.log(deathcounter);
		}
		if (alive === true) {
			if (deathcounter === 600) {
				fallspeed = 2;
			}
			if (deathcounter === 1200) {
				fallspeed = 3;
			}
			if (deathcounter === 3600) {
				fallspeed = 4;
			}
			if (deathcounter === 6000) {
				fallspeed = 5;
			}
		}
		if(alive === false && deathcounter == 150 && respawnable === true) {//10s
			critical.destroy();
			redrawBoard();
			createNewPiece();
			fallspeed = 1;
			deathcounter = 0;
			alive = true;
			respawnable = false;
		}
		//check to escape piece placement
		var a = 0;
		if (currentPiece[0] === null ||
			currentPiece[1] === null ||
			currentPiece[2] === null ||
			currentPiece[3] === null) {

			return;
		}

		//localboard's x, y or the bottom of page
		if ((currentPiece[0]._y + 30) >= 600 ||
			(currentPiece[1]._y + 30) >= 600 ||
			(currentPiece[2]._y + 30) >= 600 ||
			(currentPiece[3]._y + 30) >= 600) {
			
			a = 1;

		//continue
		//if any currentPiece[i]'s x, y+30 are equal to a
		} else if (localBoard[Math.floor(currentPiece[0]._x/30)][Math.ceil(currentPiece[0]._y/30)] !== 0 ||
			localBoard[Math.floor(currentPiece[1]._x/30)][Math.ceil(currentPiece[1]._y/30)] !== 0 ||
			localBoard[Math.floor(currentPiece[2]._x/30)][Math.ceil(currentPiece[2]._y/30)] !== 0 ||
			localBoard[Math.floor(currentPiece[3]._x/30)][Math.ceil(currentPiece[3]._y/30)] !== 0) {
			
			a = 1;
		}

		//if piece is above the board
		if ((currentPiece[0]._y/30) <= 0 ||
			(currentPiece[1]._y/30) <= 0 ||
			(currentPiece[2]._y/30) <= 0 ||
			(currentPiece[3]._y/30) <= 0) {
			
			a = 0;
		}

		if (a === 0) {
			return;
		}
		
		//begin code for placement & things related to placing
		var rowsToCheck = [];
		var i;

		for (i = 0; i < 4; i++) {
			localBoard[Math.floor(currentPiece[i]._x/30)][Math.floor(currentPiece[i]._y/30)]=currentPieceColors[i];
			rowsToCheck[i] = Math.floor(currentPiece[i]._y/30);
		}
		//do a quick sort of rowsToCheck
		rowsToCheck.sort();
		//call row destruction from top to bottom (list is sorted)
		for (i = 0; i < 4; i++) {
			checkRow(rowsToCheck[i]);
		}
		destroyPiece();
		if (!checkLose()) {
			redrawBoard();
			createNewPiece();
		}
	}
	function checkRow(a) {
		var count1=0;
		var count2=0;
		var count3=0;
		var count4=0;

		var i;

		for (i = 0; i < 10; i++) {
			switch (localBoard[i][a]) {
				case 1:
					count1++;
					break;
				case 2:
					count2++;
					break;
				case 3:
					count3++;
					break;
				case 4:
					count4++;
					break;
			}
		}
		if ((count1 + count2 + count3 + count4) === 10) {
			sendToPlayer(count1,count2,count3,count4);
			for (i = 0; i < 10; i++) {
				localBoard[i][a]=0;
			}
			//need to cascade the gamestate
			for (var j = a; j > 0; j--) {
				for (i = 0; i < 10; i++) {
					localBoard[i][j]=localBoard[i][j-1];
				}
			}
			for (i = 0; i < 10; i++) {
				localBoard[i][0] = 0;
			}
		}
	}

	function checkLose() {
		var i;

		for (i = 0; i < 10; i++) {
			if (localBoard[i][0] !== 0) {
				//display !critical systems failure! resetting system ...
				critical = Crafty.e("2D, DOM, Image").image("images/critical.png");
				critical.x = 50;
				critical.y = 50;
				Crafty("colorwall").destroy();
				for (i = 0; i <10; i++) {
					Crafty.e("2D, DOM, colorwall").attr({x:i*30, y:600}).origin("top left");
				}
				//reform localBoard
				for (i = 0; i < 11; i++) {
					localBoard[i] = []; //init board
					for (var j = 0; j < 21; j++) {
						localBoard[i][j] = 0; //set it to empty
					}
				}
				alive = false;
				respawnable = true;
				deathcounter = 0;
				fallspeed = 1;

				return true;
			}
		}
	}
	function pilotDied() {
		var i;
		//display !Pilot has died! You are dead ...
		critical = Crafty.e("2D, DOM, Image").image("images/critical.png");
		critical.x = 50;
		critical.y = 50;
		Crafty("colorwall").destroy();
		for (i = 0; i <10; i++) {
			Crafty.e("2D, DOM, colorwall").attr({x:i*30, y:600}).origin("top left");
		}
		//reform localBoard
		for (i = 0; i < 11; i++) {
			localBoard[i] = []; //init board
			for (var j = 0; j < 21; j++) {
				localBoard[i][j] = 0; //set it to empty
			}
		}
		alive = false;
		respawnable = false;
		deathcounter = 0;
		fallspeed = 1;
		clearInterval(intervalID);
	}
	function sendToPlayer(hp, wp, eng, effectMult){
		//handle pilot info changes here
	}
});