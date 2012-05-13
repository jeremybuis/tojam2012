// CONSTANTS

// Size of the playing field
var WINDOW_WIDTH = 1280;
var WINDOW_HEIGHT = 800;
var FIELD_WIDTH = 800;
var FIELD_HEIGHT = 800;

// Ship constants
var SHIP_RADIUS = 50;
var BULLET_RADIUS = 5;
var SHIP_MAX_ACCEL_INCREASE = 0.09;
var SHIP_MIN_ACCEL = 0.01;
var MAX_STAT = 1;
var START_STAT = 0.5;
var MAX_TURN_INCREASE = 4.5;
var MIN_TURN = 0.5;
var FUEL_DECREASE_TURN = 0.001;
var FUEL_DECREASE_ENGINE = 0.0005;
var BULLET_MAX_POWER = 250;
var BULLET_VEL_INCREASE = 5;
var MIN_WEAP_POWER = 0.1;
var MAX_WEAP_POWER_INCREASE = 0.9;
var WEAP_POWER_DECREASE = 0.1;
var MAX_HP = 1000;

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
var CTRL_SHOOT = Crafty.keys.SPACE;

//hacking this in (Tetris)
var XOFFSET=850;
//current piece & test rotation
var currentPiece = [4];
var currentPieceColors = [4];
var critical;
var banner;
var tetris;
var testRotate = [4];
//currently drawn board
var board = [200];
//var for placement
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
								currentPiece[i].move("s",10);
							}
						}
					}
				}
				if (checkBounds(5)) {
					if (checkCollision(0)) {
						for(i = 0; i < 4; i++) {
							currentPiece[i].move("s",1);
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
				currentPiece[i] = Crafty.e("2D, DOM, color"+currentPieceColors[i]).attr({h: 30, w: 30});
				testRotate[i] = Crafty.e("2D");
				switch(pieceChoice)
				{
				case 1:		//line
					currentPiece[i].x=150+XOFFSET;
					currentPiece[i].y=-90+30*i;
					break;
				case 2:		//box
					currentPiece[i].x = 150+XOFFSET + (i%2)*30;
					currentPiece[i].y=-90;
					if(i>1)currentPiece[i].y=-90+30;
					break;
				case 3:		//step up & right
					currentPiece[i].x=150+XOFFSET + (i%2)*30;
					currentPiece[i].y=-90;
					if(i>1){
						currentPiece[i].y=-90+30;
						currentPiece[i].x-=30;
					}
					break;
				case 4:		//step up and left
					currentPiece[i].x=150+XOFFSET + (i%2)*30;
					currentPiece[i].y=-90;
					if(i>1){
						currentPiece[i].y=-90+30;
						currentPiece[i].x+=30;
					}
					break;
				case 5:		//L
					currentPiece[i].x=150 + Math.floor(i/3)*30+XOFFSET;
					currentPiece[i].y=-90+30*i - Math.floor(i/3)*30;
					break;
				case 6:		//backwards L
					currentPiece[i].x=150 - Math.floor(i/3)*30+XOFFSET;
					currentPiece[i].y=-90+30*i - Math.floor(i/3)*30;
					break;
				case 7:		//T
					currentPiece[i].x=150 -30 + i*30+XOFFSET - Math.floor(i/3)*60;
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
				localBoard[Math.floor((currentPiece[0]._x-XOFFSET)/30)+1][Math.floor(currentPiece[0]._y/30)] === 0 &&
				localBoard[Math.floor((currentPiece[1]._x-XOFFSET)/30)+1][Math.floor(currentPiece[1]._y/30)] === 0 &&
				localBoard[Math.floor((currentPiece[2]._x-XOFFSET)/30)+1][Math.floor(currentPiece[2]._y/30)] === 0 &&
				localBoard[Math.floor((currentPiece[3]._x-XOFFSET)/30)+1][Math.floor(currentPiece[3]._y/30)] === 0
				);
		}
		if (a === -1) {
			return (
				localBoard[Math.floor((currentPiece[0]._x-XOFFSET)/30)-1][Math.floor(currentPiece[0]._y/30)] === 0 &&
				localBoard[Math.floor((currentPiece[1]._x-XOFFSET)/30)-1][Math.floor(currentPiece[1]._y/30)] === 0 &&
				localBoard[Math.floor((currentPiece[2]._x-XOFFSET)/30)-1][Math.floor(currentPiece[2]._y/30)] === 0 &&
				localBoard[Math.floor((currentPiece[3]._x-XOFFSET)/30)-1][Math.floor(currentPiece[3]._y/30)] === 0
			);
		}
		if (a === 0) {
			return (
				localBoard[Math.floor((currentPiece[0]._x-XOFFSET)/30)][Math.ceil(currentPiece[0]._y/30)] === 0 &&
				localBoard[Math.floor((currentPiece[1]._x-XOFFSET)/30)][Math.ceil(currentPiece[1]._y/30)] === 0 &&
				localBoard[Math.floor((currentPiece[2]._x-XOFFSET)/30)][Math.ceil(currentPiece[2]._y/30)] === 0 &&
				localBoard[Math.floor((currentPiece[3]._x-XOFFSET)/30)][Math.ceil(currentPiece[3]._y/30)] === 0
			);
		}
		if (a === 2) {
			return (
				localBoard[Math.floor((testRotate[0]._x-XOFFSET)/30)][Math.ceil(testRotate[0]._y/30)] === 0 &&
				localBoard[Math.floor((testRotate[1]._x-XOFFSET)/30)][Math.ceil(testRotate[1]._y/30)] === 0 &&
				localBoard[Math.floor((testRotate[2]._x-XOFFSET)/30)][Math.ceil(testRotate[2]._y/30)] === 0 &&
				localBoard[Math.floor((testRotate[3]._x-XOFFSET)/30)][Math.ceil(testRotate[3]._y/30)] === 0
			);
		}
		// handle rotation
	}
	function checkBounds(a){
		//1 right, 2 left, 3 rotation, 4 drop, 5 fallspeed
		if (a === 1) {
			return (currentPiece[0]._x-XOFFSET +30) <= 300-1 && (currentPiece[1]._x-XOFFSET +30)  <= 300-1 &&
			(currentPiece[2]._x-XOFFSET +30)  <= 300-1 && (currentPiece[3]._x-XOFFSET +30)  <= 300-1;
		}
		if (a === 2) {
			return (currentPiece[0]._x-XOFFSET -30) > -1 && (currentPiece[1]._x-XOFFSET -30) > -1 &&
			(currentPiece[2]._x-XOFFSET -30) > -1 && (currentPiece[3]._x-XOFFSET -30) > -1;
		}
		if (a === 3) {
			return (testRotate[0]._x-XOFFSET) <= 300-1 && (testRotate[1]._x-XOFFSET)  <= 300-1 &&
			(testRotate[2]._x-XOFFSET)  <= 300-1 && (testRotate[3]._x-XOFFSET)  <= 300-1 &&
			(testRotate[0]._x-XOFFSET) > -1 && (testRotate[1]._x-XOFFSET) > -1 &&
			(testRotate[2]._x-XOFFSET) > -1 && (testRotate[3]._x-XOFFSET) > -1;
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
					board[drawNum] = Crafty.e("2D, DOM, color" + localBoard[i][j]).attr({h: 30, w: 30});
					board[drawNum].x = i*30+XOFFSET;
					board[drawNum].y = j*30;
					drawNum++;
				}
			}
		}
		Crafty("colorwall").destroy();
		for (i = 0; i < 10; i++) {
			Crafty.e("2D, DOM, colorwall").attr({x:i*30+XOFFSET, y:600}).origin("top left").attr({h: 30, w: 30});
		}
		banner.destroy();
		banner = Crafty.e("2D, DOM, Image").image("images/not_ending.png");
		banner.x = XOFFSET;
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
		} else if (localBoard[Math.floor((currentPiece[0]._x-XOFFSET)/30)][Math.ceil(currentPiece[0]._y/30)] !== 0 ||
			localBoard[Math.floor((currentPiece[1]._x-XOFFSET)/30)][Math.ceil(currentPiece[1]._y/30)] !== 0 ||
			localBoard[Math.floor((currentPiece[2]._x-XOFFSET)/30)][Math.ceil(currentPiece[2]._y/30)] !== 0 ||
			localBoard[Math.floor((currentPiece[3]._x-XOFFSET)/30)][Math.ceil(currentPiece[3]._y/30)] !== 0) {
			
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
			localBoard[Math.floor((currentPiece[i]._x-XOFFSET)/30)][Math.floor(currentPiece[i]._y/30)]=currentPieceColors[i];
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
				critical.x = 50+XOFFSET;
				critical.y = 50;
				Crafty("colorwall").destroy();
				for (i = 0; i <10; i++) {
					Crafty.e("2D, DOM, colorwall").attr({x:i*30+XOFFSET, y:600}).attr({h: 30, w: 30}).origin("top left");
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
		checkLose();
		alive = false;
		respawnable = false;
		deathcounter = 0;
		fallspeed = 1;
		clearInterval(intervalID);
	}
	function sendToPlayer(hp, wp, eng, effectMult){
		//handle pilot info changes here
		var temp;
		temp = tetris.playerid.hull + hp/10;
		if (temp>1)temp=1;
		tetris.playerid.hull = temp;
		temp = tetris.playerid.weap + wp/10;
		if (temp>1)temp=1;
		tetris.playerid.wp = temp;
		temp = tetris.playerid.engine + eng/10;
		if (temp>1)temp=1;
		tetris.playerid.eng = temp;
		//console.log(tetris.playerid.hull);
	}
	
Crafty.c("tetris",{
	init:function(){
		this.attr({playerid:null});
		Crafty.e("2D, DOM, Image").image("images/bg.png","repeat")
			.attr({w: 300, h: 600, x:XOFFSET, y:0});
		intervalID = window.setInterval(placeBlocks, 100);
		createNewPiece();
		
		for (var i = 0; i <10; i++) {
			Crafty.e("2D, DOM, colorwall")
			.attr({x:i*30+XOFFSET, y:600}).origin("top left").attr({h: 30, w: 30});
		}
		//function to redraw the currenly placed pieces
		//check game state vars
		banner = Crafty.e("2D, DOM, Image").image("images/not_ending.png");
		banner.x = XOFFSET;
		banner.y = 0;
	},
	setPlayer:function(id){
		this.playerid= id;
	}
});
//end tetris hack-in

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
		this.requires('ship, Keyboard, socket, Collision');

		this.attr({
			bullets: null,
			bulletCnt: 0,
			shoot: true
		});

		this.bind('EnterFrame', function(e) {
			var baseAcc = SHIP_MIN_ACCEL + SHIP_MAX_ACCEL_INCREASE * this.engine;
			var rotationRate = MIN_TURN + MAX_TURN_INCREASE * this.engine;

			var acc = 0;
			if (this.isDown(CTRL_ACCEL)) {
				acc = baseAcc;
				this.engine = Math.max(this.engine - FUEL_DECREASE_ENGINE, 0);
			}
			if (this.isDown(CTRL_DECEL)) {
				acc -= baseAcc /2;
				this.engine = Math.max(this.engine - FUEL_DECREASE_ENGINE, 0);
			}

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

			this.ax = acc * Math.cos(this.rotation * DEG_TO_RAD);
			this.ay = acc * Math.sin(this.rotation * DEG_TO_RAD);

			if (e.frame % SHIP_UPDATE_RATE === 0) {
				this.socket.emit('POS', {
					id: this.id,
					x: this.x,
					y: this.y,
					theta: this.rotation,
					vx: this.vx,
					vy: this.vy,
					health: this.hull,
					fuel: this.engine,
					weapon: this.weap
				});
			}

			if (this.isDown(CTRL_SHOOT)) {
				if (this.shoot) {
					this.shoot = false;
					var bulletId = this.id + ':' + this.bulletCnt++;
					var bullet = Crafty.e('bullet').bullet(
						bulletId,
						this.id,
						this.x + this.w / 2 + (this.w / 2 + BULLET_RADIUS) * Math.cos(this.rotation * DEG_TO_RAD),
						this.y + this.h / 2 + (this.h / 2 + BULLET_RADIUS) * Math.sin(this.rotation * DEG_TO_RAD),
						this.vx + BULLET_VEL_INCREASE * Math.cos(this.rotation * DEG_TO_RAD),
						this.vy + BULLET_VEL_INCREASE * Math.sin(this.rotation * DEG_TO_RAD),
						BULLET_MAX_POWER * (this.weap + MIN_WEAP_POWER),
						this.bullets);

					this.bullets[bulletId] = bullet;
					this.weap = Math.max(this.weap - WEAP_POWER_DECREASE, 0);
					this.socket.emit('BULLET', JSON.stringify({
						id: bullet.id,
						playerId: bullet.playerId,
						x: bullet.x,
						y: bullet.y,
						vx: bullet.vx,
						vy: bullet.vy,
						power: bullet.power
					}));
				}
			} else if (!this.shoot) {
				this.shoot = true;
			}

			var hits = this.hit('bullet');
			var i;
			if (hits) {
				for (i in hits) {
					var bulletHit = hits[i].obj;
					if (bulletHit.playerId != this.id) {
						this.hull = Math.max(this.hull - bulletHit.power / MAX_HP, 0);
						this.socket.emit('BULLET_DEATH', {id: bulletHit.id});
						if (this.hull === 0) {
							this.socket.emit('DEATH', {
								id: this.id,
								x: this.x,
								y: this.y,
								killingId: bulletHit.playerId
							});
							Crafty.e('death').death(this.x, this.y);
						}
						bulletHit.remove();
						Crafty.audio.play('hit');
					}
				}
			}
		});
	},
	player: function(bullets) {
		this.bullets = bullets;
		return this;
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

			// decay bullet and kill itself
			if (this.power !== null) {
				if (--this.power <= 0) {
					this.remove();
				}
			}
		});

		Crafty.audio.play('shot');
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

Crafty.c('death', {
	init: function() {
		this.requires('2D, DOM');
		this.animCnt = 60;

		this.bind('EnterFrame', function(e) {
			if (--this.animCnt === 0) {
				this.destroy();
			}
		});

		Crafty.audio.play('death');
	},
	death: function(x, y) {
		this.x = x;
		this.x = y;
	}
});

Crafty.scene('game', function() {
	var socket = io.connect();
	var ships = {};
	var bullets = {};
	
	/*Crafty.load(["images/sprite.png"], function() {
		//splice the spritemap
		Crafty.sprite(30, "images/sprite.png", {
			color1: [0,0],
			color2: [1,0],
			color3: [2,0],
			color4: [3,0],
			colorwall: [4,0]
		});
		//start tetris when loaded
		//tetris = Crafty.e("tetris");
	});*/
	
	socket.on('JOIN', function (data) {
		console.log(data);
		var player = Crafty.e('ship, player').player(bullets).initSocket(socket).ship(
			data['id'],
			data['color']['r'],
			data['color']['g'],
			data['color']['b'])
		.attr({
			x: data['x'],
			y: data['y']			
		});
		tetris = Crafty.e("tetris");
		tetris.setPlayer(player);
		
		ships = {};
		ships[data['id']] = player;

		var i;
		for (i in data['ships']) {
			var ship = data.ships[i];
			ships[ship['id']] = Crafty.e('ship').ship(
				ship['id'],
				ship['color']['r'],
				ship['color']['g'],
				ship['color']['b']).updatePos(ship);
		}			
	});

	socket.on('DEATH', function (data) {
		console.log(data);
		Crafty.e('death').death(data.x, data.y);
	});

	socket.on('POS', function (data) {
		ships[data.id].updatePos(data);
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
		data = JSON.parse(data);
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
		Crafty.audio.play('hit');
	});

});

window.onload = function() {
	//start crafty, full screen
	Crafty.init(1200, 800);
	//tetris initialization
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

	Crafty.audio.add('death', [
		"snd/death.ogg",
		"snd/death.mp3",
		"snd/death.wav"]);
	Crafty.audio.add('hit', [
		"snd/hit.ogg",
		"snd/hit.mp3",
		"snd/hit.wav"]);
	Crafty.audio.add('shot', [
		"snd/shot.ogg",
		"snd/shot.mp3",
		"snd/shot.wav"]);

	Crafty.scene('game');
};
