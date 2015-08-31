window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();
 
// main game canvas
var canvas = document.getElementById("tankGame");
	canvas.width = 640;
	canvas.height = 480;
var g = canvas.getContext('2d');

// background canvas
var background = document.getElementById("background");
	background.width = 640;
	background.height = 480;
var b = background.getContext('2d');

// smooth 
g.imageSmoothingEnabled= false

mX = 0
mY = 0;

gameover = false;

// 
var inputs = {
	'up'    : false,
	'down'  : false,
	'left'  : false,
	'right' : false,
	'space' : false,
};

window.addEventListener('keydown', function(e){
	setKey(e, true);
})

window.addEventListener('keyup', function(e){
	setKey(e, false);
})

canvas.addEventListener("mousemove", function(e){
	mX = e.pageX - canvas.offsetLeft;
	mY = e.pageY - canvas.offsetTop;
})

// mouse click trigger
canvas.addEventListener("mousedown", function(e){
	inputs['space'] = true;
})

canvas.addEventListener("mouseup", function(e){
	inputs['space'] = false;
})

function setKey(e, status){
	var input;
	switch (e.which) {
		case 32:  input = 'space'; break;

		case 65:
		case 37:  input = 'left' ; break;
		
		case 87:
		case 38:  input = 'up'   ; break;
		
		case 68:
		case 39:  input = 'right'; break;
		
		case 83:
		case 40:  input = 'down' ; break;
	}
	inputs[input] = status;
}

function isInput(button){
	return inputs[button]
}

var lastTime;

function init(){
	sprites = {};
	bullet_speed = 500;

	loadSprites([
		'img/cursor.png',
		'img/bg.png',
		'img/enemy-sprite.png',
		// 'img/tank-sprite.png',
		'img/tank-sprite-head.png',
		'img/tank-sprite-body.png'
	], function(){
		create();
		main();
	});
	
}

function loadSprites(arr, callback){
	arr.forEach(function(src){
		sprites[src] = new Image();
		sprites[src].src = src;
		sprites.onload = function(){ sprites[src].ready = true; }
		sprites[src].ready = false;
	})
	if(spriteReady()) {
		callback();
	}
}

function spriteReady() {
	var ready = true;
	for (var index in sprites) {
		if (!sprites[index].ready) reaty = false;
	}

	if (!ready) return spriteReady();
	else 		return true;
}

function main(){
	var now = Date.now();
	var dt  = (now - lastTime) / 1000;
	lastTime = now
	requestAnimFrame(main)
	update(dt);
	
	b.rect(0,0,background.width, background.height);
	b.fillStyle = b.createPattern(sprites['img/bg.png'],"repeat");
	b.fill();
}

function create(){
	lastTime   = Date.now();
	lastFire   = Date.now();
	lastSpawn  = Date.now();
	spawnTime  = 1500;
	totalEnemy = 0;

	bullets = [];
	enemies = [];
	player = new createPlayer();
	cursor = new createCursor();
}

function createCursor(){
	this.x = 0;
	this.y = 0;
	this.width = 23;
	this.height = 23;

	this.draw = function(){
		this.x = mX;
		this.y = mY;
		g.drawImage(sprites['img/cursor.png'],
			0,0, this.width, this.height,
			this.x - 12, 
			this.y - 12, 
			this.width, 
			this.height 
		);
	}
}

function createPlayer(){
	this.width = 40;
	this.height = 40;

	this.x = canvas.width / 2 - this.width / 2;
	this.y = canvas.height / 2 - this.height / 2;

	this.score = 0;

	this.speed = 200;
	this.sprite = 0

	this.look = 'down';

	this.head_width = 12;
	this.head_height = 23;
	this.head_angle = Math.PI / 180;

	this.render = function(){
		g.drawImage(
				sprites['img/tank-sprite-body.png'], 
				this.sprite * 40, 0, 
				40,40,
				this.x,this.y, 
				40.5,40
			);


		// считаем угол поворота
		g.save();

		var center_x = this.x + this.width / 2,
			center_y = this.y + this.height / 2

		var x = center_x - mX,
			y = center_y - mY

		this.head_angle = Math.atan2(y,x) - Math.PI / 2;

		g.translate(center_x, center_y);
		g.rotate(this.head_angle);

		g.drawImage(
			sprites['img/tank-sprite-head.png'], 
			0,0,this. head_width, this.head_height,
			-this.head_width / 2, -this.head_height / 2 - 5, this.head_width, this.head_height
		);

		g.restore()
	}

	this.move = function(dt){
		if (isInput('up')) {
			if (this.y > 0) {
				this.y -= this.speed * dt;
				this.sprite = 0;
				this.look = 'up';
			}
		}
		if (isInput('down')) {
			if (canvas.height > this.y + this.height) {
				this.y += this.speed * dt;
				this.sprite = 2;
				this.look = 'down';
			}
		}
		if (isInput('left')) {
			if (this.x > 0) {
				this.x -= this.speed * dt;
				this.sprite = 3;
				this.look = 'left';
			}
		}
		if (isInput('right')) {
			if (canvas.width > this.x + this.width) {
				this.x += this.speed * dt;
				this.sprite = 1;
				this.look = 'right';
			}
		}
	}
}

function createEmeny(){
	this.width = 40;
	this.height = 40;
	this.speed = 200;
	this.side = Math.floor(Math.random() * 4);


	var random_x = Math.random() * ((canvas.width - canvas.width / 6) - canvas.width / 6) + canvas.width / 6;
	var random_y = Math.random() * ((canvas.height - canvas.height / 6)- canvas.height / 6) + canvas.height / 6;

	switch (this.side) {
		case 0: 
			// top
			// TODO: fix random spot
			this.x = random_x;
			this.y = -this.height
			break;
		case 3: 
			// right
			this.x = canvas.width;
			this.y = random_y;
			break;
		case 2: 
			// bottom
			this.x = random_x;
			this.y = canvas.height
			break;
		case 1: 
			// left
			this.x = -this.width;
			this.y = random_y;
			break;
	}

	this.render = function(){
		// g.fillStyle = "#fcf";
		// g.fillRect(this.x, this.y, this.width, this.height);
		g.drawImage(
			sprites['img/enemy-sprite.png'], 
			this.side * 40,0,37,40,
			this.x,this.y,40,40
		);

	}

	this.move = function(dt){
		switch (this.side) {
			case 0:
				this.y += dt * this.speed;
				break;
			case 2:
				this.y -= dt * this.speed;
				break;
			case 3:
				this.x -= dt * this.speed;
				break;
			case 1:
				this.x += dt * this.speed;
				break;
		}
	}
}

function update(dt){
	g.clearRect(0, 0, canvas.width, canvas.height)
	// border
	g.strokeStyle = '#ccc';
	g.strokeRect(0,0, canvas.width, canvas.height)

	if(gameover) {
		gameOverScreen();
		if (isInput('space')){
			gameover = false
			create();
		}
	} else {
		if (isInput('space')){
			if(Date.now() - lastFire > 100) {
				var px = player.x + player.width / 2;
				var py = player.y + player.width / 2;

				bullets.push({
					move: player.look,
					pos: [px, py],
					angle: player.head_angle
				})
				lastFire = Date.now();
			}
		}

		if (Date.now() - lastSpawn > spawnTime) {
			enemies.push(new createEmeny())
			lastSpawn = Date.now()

			if (spawnTime > 300) spawnTime -= 20;
		}

		checkCollisions();

		for (var i = bullets.length - 1; i >= 0; i--) {
			if (bullets[i]){
				if (bullets[i].pos[0] < 0 || 
					bullets[i].pos[0] > canvas.width ||
					bullets[i].pos[1] < 0 ||
					bullets[i].pos[1] > canvas.height
					) {
					bullets.splice(i, 1);
					continue;
				}
				// движение пуль

				if ( !bullets[i].velX || !bullets[i].velY ){
					var tx = mX - bullets[i].pos[0],
						ty = mY - bullets[i].pos[1]
					
					dist = Math.sqrt(tx*tx + ty*ty);

					bullets[i].velX = (tx / dist) * bullet_speed;
					bullets[i].velY = (ty / dist) * bullet_speed;
				}


				bullets[i].pos[0] += bullets[i].velX * dt;
				bullets[i].pos[1] += bullets[i].velY * dt;


				// удаление лишних

				g.fillStyle = '#333';
				g.fillRect(bullets[i].pos[0], bullets[i].pos[1], 5, 5)
			}
		};

		for (var i = enemies.length - 1; i >= 0; i--) {
			if (enemies[i].x > canvas.width ||
				enemies[i].x < enemies[i].width * -1 ||
				enemies[i].y > canvas.height ||
				enemies[i].y < -enemies[i].height
			){
				enemies.splice(i,1);
			} else {
				enemies[i].move(dt)
				enemies[i].render();
			}
		}

		g.fillStyle = "#fff";
		g.textAlign = "left";
		g.font      = "30px Arial";
		g.fillText("Score: " + player.score , 10,40)

		player.move(dt);
		player.render();
	}
	cursor.draw();
}

function gameOverScreen(){
	g.fillStyle = "rgba(0,0,0,0.6)"
	g.fillRect(0,0,canvas.width, canvas.height);

	g.textAlign = "center";
	g.fillStyle = "#fff"
	
	g.font = "30px Arial"
	g.fillText("Game Over", 320, 200)

	g.font = "25px Arial"
	g.fillText("click for play again", 320, 300)
}

function checkCollisions(){
	for (var e = enemies.length - 1; e >= 0; e--) {
		if (
			enemies[e].x < player.x + player.width &&
			enemies[e].x + enemies[e].width > player.x &&
			enemies[e].y < player.y + player.height &&
			enemies[e].y + enemies[e].height > player.y
		) {
			gameover = true
		}

		for (var i = bullets.length - 1; i >= 0; i--) {
			if (bullets[i] && enemies[e]){
				if (
					enemies[e].x < bullets[i].pos[0] + 5 &&
					enemies[e].x + enemies[e].width > bullets[i].pos[0] &&
					enemies[e].y < bullets[i].pos[1] + 5 &&
					enemies[e].y + enemies[e].height > bullets[i].pos[1]
				) {
					player.score++;
					enemies.splice(e,1);
					bullets.splice(i,1);
					continue;
				}
			}
		}
		// check player collision

	}
}

init()






