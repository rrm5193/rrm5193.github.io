// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application(500,500);
app.renderer.backgroundColor = 0x05E6FF;
document.querySelector("main").appendChild(app.view);


// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// pre-load the images
PIXI.loader.
add(["media/Platform.png","media/explosions.png"]).
on("progress",e=>{console.log(`progress=${e.progress}`)}).
load(setup);

// aliases
let stage;

// game variables
let startScene;
let gameScene,player,scoreLabel,lifeLabel,shootSound,hitSound,fireballSound;
let gameOverScene;

let platforms = [];
let bullets = [];
let aliens = [];
let explosions = [];
let explosionTextures;
let score = 0;
let life = 100;
let levelNum = 1;
let paused = true;
let time = 0;

function setup() {
	stage = app.stage;
	// #1 - Create the `start` scene
	startScene = new PIXI.Container();
    stage.addChild(startScene);
	// #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);
	// #3 - Create the `gameOver` scene and make it invisible
	gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);
	// #4 - Create labels for all 3 scenes
	createLabelsAndButtons();
	// #5 - Create PlayerUnit
    player = new PlayerUnit();
    gameScene.addChild(player);

	// #6 - Load Sounds
    shootSound = new Howl({
        src: ['sounds/shoot.wav']
    });

    hitSound = new Howl({
        src: ['sounds/hit.mp3']
    });

    fireballSound = new Howl({
        src: ['sounds/fireball.mp3']
    });
	
	// #7 - Load sprite sheet
    explosionTextures = loadSpriteSheet();
    // #8 - Start update loop
    app.ticker.add(gameLoop);
	// #9 - Start listening for click events on the canvas
	app.view.onclick = fireBullet;
	// Now our `startScene` is visible
	// Clicking the button calls startGame()
}

function createLabelsAndButtons(){
    let buttonStyle = new PIXI.TextStyle({
        fill: 0x0E0EE0,
        fontSize: 48,
        fontFamily: "Unlock"
    });
    
    //1 - set up start scene
    let startLabel1 = new PIXI.Text("Sky Walk!");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 96,
        fontFamily: "Unlock",
        stroke: 0x0E0EE0,
        strokeThickness: 6
    });
    startLabel1.x = 40;
    startLabel1.y = 60;
    startScene.addChild(startLabel1);
    
    let startLabel2 = new PIXI.Text("Soar higher than the clouds");
    startLabel2.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 32,
        fontFamily: "Unlock",
        fontStyle: "italic",
        stroke: 0x0E0EE0,
        strokeThickness: 6
    });
    startLabel2.x = 80;
    startLabel2.y = 200;
    startScene.addChild(startLabel2);
    
    let startButton = new PIXI.Text("Take Off!");
    startButton.style = buttonStyle;
    startButton.x = (sceneWidth/2)-100;
    startButton.y = sceneHeight - 100;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup",startGame);
    startButton.on('pointerover',e=>e.target.alpha = 0.7);
    startButton.on('pointerout', e=>e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);
    
    //2 - set up gameScene
    let textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 18,
        fontFamily: "Futura",
        stroke: 0xFF0000,
        strokeThickness: 2
    });
    
    //2A - make score label
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);
    
    //2B - make life label
    lifeLabel = new PIXI.Text();
    lifeLabel.style = textStyle;
    lifeLabel.x = 5;
    lifeLabel.y = 26;
    gameScene.addChild(lifeLabel);
    decreaseLifeBy(0);
    
    // 3 - set up `gameOverScene`
    // 3A - make game over text
    let gameOverText = new PIXI.Text("Game Over!");
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 64,
        fontFamily: "Unlock",
        stroke: 0x0E0EE0,
        strokeThickness: 3
    });
    gameOverText.style = textStyle;
    gameOverText.x = 70;
    gameOverText.y = sceneHeight/2 - 160;
    gameOverScene.addChild(gameOverText);

    // 3B - make "play again?" button
    let playAgainButton = new PIXI.Text("Take off again?");
    playAgainButton.style = buttonStyle;
    playAgainButton.x = 70;
    playAgainButton.y = sceneHeight/2;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup",startGame); // startGame is a function reference
    playAgainButton.on('pointerover',e=>e.target.alpha = 0.7); // concise arrow function with no brackets
    playAgainButton.on('pointerout',e=>e.currentTarget.alpha = 1.0); // ditto
    gameOverScene.addChild(playAgainButton);
}

function startGame(){
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    levelNum = 1;
    score = 0;
    life = 100;
    increaseScoreBy(0);
    decreaseLifeBy(0);
    player.x = 50;
    player.y = 50;
    loadLevel();
}

function increaseScoreBy(value){
    score += value;
    scoreLabel.text =`Score ${score}`;
}

function decreaseLifeBy(value){
    life -= value;
    life = parseInt(life);
    lifeLabel.text = `Life    ${life}%`;   
}

function gameLoop(){
	// if (paused) return; // keep this commented out for now
	
	// #1 - Calculate "delta time"
    let dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt=1/12;
	
	// #2 - Move player
    
    let w2 = player.width/2;
    let h2 = player.height/2;
    let newX = 0;
    let newY = 0;
    // i'm going to make an enum for the fsm and an enum for keys and try to get the whole deal set up tonight. -BeachFme
    if(keys[keyboard.RIGHT]){
        newX = 2;
    }else if(keys[keyboard.LEFT]) {
        newX = -2;
    }

    if(keys[keyboard.UP]) {
        newY = -2;
    }else{
        newY = 0;
    }
        
    player.x += newX;
    player.y += newY;
	// #3 - Move Circles
	for(let p of platforms){
        p.move(dt);
        if(p.x <= 10 ){
            gameScene.removeChild(p);
            p.isAlive = false;
            
        }
        if(p.y <= 10 || p.y >= sceneHeight-10){
            p.reflectY();
            p.move(dt);
            platforms = platforms.filter(p=>p.isAlive);
        }
    }
	
	// #4 - Move Bullets
	for (let b of bullets){
		b.move(dt);
	}

	// #5 - Check for Collisions
	let fall = true;
    for(let p of platforms){
        for(let b of bullets){
            if(rectsIntersect(p,b)){
                fireballSound.play();
                createExplosion(p.x,p.y,64,64);
                gameScene.removeChild(p);
                p.isAlive = false;
                gameScene.removeChild(b);
                b.isAlive = false;
                increaseScoreBy(1);
                if(b.y < -10) b.isAlive = false;
            }
        }
        
        if(p.isAlive && PlatformIntersect(p,player)){
                fall = false;
        }
    }
	
    if( fall ){
        player.gravity();
        if(player.y >= sceneHeight){
            life = 0;
        }
    }
    
	// #6 - Now do some clean up
	bullets = bullets.filter(b=>b.isAlive);
    platforms = platforms.filter(p=>p.isAlive);
    explosions = explosions.filter(e=>e.playing);
	
	// #7 - Is game over?
	if(life <= 0){
        end();
        return;
    }
	
	// #8 - Load next level
    time++;
    if (time%50 == 0){
        loadLevel();
    }
}

function createPlatforms(numPlatform){
    for(let i=0; i<numPlatform; i++){
        let p = new Platform();
        p.x = sceneWidth + (Math.random() * 200)+50;
        p.y = Math.random()*(sceneHeight)+50;
        platforms.push(p);
        gameScene.addChild(p);
    }
}

function loadLevel(){
	createPlatforms(1);
	paused = false;
}

function end(){
    paused=true;
    //clears out level
    platforms.forEach(p=>gameScene.removeChild(p));
    platforms = [];
    
    bullets.forEach(b=>gameScene.removeChild(b));
    bullets = [];
    
    explosions.forEach(e=>gameScene.removeChild(e));
    explosions = [];
    
    gameOverScene.visible = true;
    gameScene.visible = false;
}

function fireBullet(e){
    if (paused) return;
    let b = new Bullet(0xFFFFFF,player.x,player.y);
    bullets.push(b);
    gameScene.addChild(b);
    shootSound.play();
}

function loadSpriteSheet(){
    let spritesheet = PIXI.BaseTexture.fromImage("media/explosions.png");
    let width = 64;
    let height = 64;
    let numFrames = 16;
    let textures=[];
    for(let i=0; i< numFrames; i++){
        let frame = new PIXI.Texture(spritesheet,new PIXI.Rectangle(i*width,64,width,height));
        textures.push(frame);
    }
    return textures;
}

function createExplosion(x,y,frameWidth,frameHeight){
    let w2 = frameWidth/2;
    let h2 = frameHeight/2;
    let exp1 = new PIXI.extras.AnimatedSprite(explosionTextures);
    exp1.x = x - w2;
    exp1.y = y - h2;
    exp1.animationSpeed = 1/7;
    exp1.loop = false;
    exp1.onComplete = e=>gameScene.removeChild(exp1);
    explosions.push(exp1);
    gameScene.addChild(exp1);
    exp1.play();
}