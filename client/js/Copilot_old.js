$(document).ready(function() {
	Crafty.init(300,630);
	Crafty.canvas.init();
	//tetris board in x, y
	var localBoard = [11];
	var currentPiece = [4];
	
	for (var x=0; x<10; x++) {
		localBoard[x] = [21];
	}
	//initialize board
	for (var i = 0; i < 11; i++) {
		localBoard[i] = []; //init board
		for (var j = 0; j < 21; j++) {
			localBoard[i][j] = 0; //set it to empty
		}
	}

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
		
		//currently falling piece
		var pieceChoice = Math.floor((Math.random()*6)+1);

		for (var i=0; i<4; i++) {
			//insert a RNG to randomly color pieces
			currentPiece[i] = Crafty.e("2D, DOM, color1, Controls, Collision")
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
					} else if(e.keyCode === Crafty.keys.SPACE) {
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
					} else if(e.keyCode === Crafty.keys.SPACE) {
						this.move.drop = false;
					}
				}).bind("EnterFrame", function() {
					if (this.move.right) {
						if((currentPiece[0]._x +30) <= Crafty.viewport.width-1 &&
						(currentPiece[1]._x +30)  <= Crafty.viewport.width-1 &&
						(currentPiece[2]._x +30)  <= Crafty.viewport.width-1 &&
						(currentPiece[3]._x +30)  <= Crafty.viewport.width-1) {

							this.x += 30;
							this.move.right = false;
						}
					}
					if (this.move.left) {
						if ((currentPiece[0]._x -30) > -1 &&
							(currentPiece[1]._x -30) > -1 &&
							(currentPiece[2]._x -30) > -1 &&
							(currentPiece[3]._x -30) > -1) {

							this.x -= 30;
							this.move.left = false;
						}
					}
					if (this.move.rotate) {
						//rotate about the X&Y of currentpiece0
						this.x = (this._y - currentPiece[0]._y) + currentPiece[0]._x;
						this.y = -1*this._x - currentPiece[0]._x + currentPiece[0]._y;
					}
					if (this.move.drop) {
						if ((this._y + 1) < Crafty.viewport.height) {
							this.y += 10;
						}
					}
					if ((this._y+1) < Crafty.viewport.height) {
						this.y+=1;
					}
				}).collision()
				.onHit("colorwall", function() {
					//fuse the piece to the storedboard object
				});
				
				//define piece locations
				switch(pieceChoice)
				{
				case 1:		//line
					currentPiece[i].x=Crafty.viewport.width/2;
					currentPiece[i].y=30*i;
					break;
				case 2:		//box
					currentPiece[i].x = Crafty.viewport.width/2 + (i%2)*30;
					currentPiece[i].y=0;
					if(i>1)currentPiece[i].y=30;
					break;
				case 3:		//step up & right
					currentPiece[i].x=Crafty.viewport.width/2 + (i%2)*30;
					currentPiece[i].y=0;
					if(i>1){
						currentPiece[i].y=30;
						currentPiece[i].x-=30;
					}
					break;
				case 4:		//step up and left
					currentPiece[i].x=Crafty.viewport.width/2 + (i%2)*30;
					currentPiece[i].y=0;
					if(i>1){
						currentPiece[i].y=30;
						currentPiece[i].x+=30;
					}
					break;
				case 5:		//L
					currentPiece[i].x=Crafty.viewport.width/2 + Math.floor(i/3)*30;
					currentPiece[i].y=30*i - Math.floor(i/3)*30;
					break;
				case 6:		//backwards L
					currentPiece[i].x=Crafty.viewport.width/2 - Math.floor(i/3)*30;
					currentPiece[i].y=30*i - Math.floor(i/3)*30;
					break;
				}
			}
		for (var i=0; i<10; i++) {
			Crafty.e("2D, DOM, colorwall, Collision")
			.attr({x:i*30, y:600}).origin("top left");
		}
		//function to redraw the currenly placed pieces
		//check game state vars
	});
});