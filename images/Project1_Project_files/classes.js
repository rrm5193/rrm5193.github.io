class PlayerUnit extends PIXI.Sprite{
    constructor(x=0,y=0){
        super(PIXI.loader.resources["media/Platform.png"].texture);
        this.anchor.set(.5,.5);
        this.scale.set(0.2);
        this.x = x;
        this.y = y;
    }
    
    gravity(force=5){
        this.y += force;
    }
}

class Platform extends PIXI.Sprite{
    constructor(color=0xFF0000, x=0, y=0){
        super(PIXI.loader.resources["media/Platform.png"].texture);
        this.anchor.set(.5,.5);
        this.scale.set(0.2);
        this.x = x;
        this.y = y;
        this.fwd = getRandomUnitVector();
        this.fwd.x = -20;
        this.fwd.y = 0;
        this.speed = 5;
        this.isAlive = true;
    }
    
    move(dt=1/60){
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
    
    reflectX(){
        this.fwd.x *= -1;    
    }
    
    reflectY(){
        this.fwd.y *= -1;
    }
}
class Bullet extends PIXI.Graphics{
    constructor(color=0xFFFFFF, x=0, y=0){
        super();
        this.beginFill(color);
        this.drawRect(-2,-3,4,6);
        this.endFill();
        this.x = x;
        this.y = y;
        this.fwd = {x:0,y:-1};
        this.speed = 400;
        this.isAlive = true;
        Object.seal(this);
    }
    
    move(dt=1/60){
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}

const keyboard = Object.freeze({
	SHIFT: 		16,
	SPACE: 		32,
	LEFT: 		37, 
	UP: 		38, 
	RIGHT: 		39, 
	DOWN: 		40
});

// this is the "key daemon" that we poll every frame
const keys = [];
window.onkeyup = (e) => {
//	console.log("keyup=" + e.keyCode);
	keys[e.keyCode] = false;
	e.preventDefault();
};

window.onkeydown = (e)=>{
//	console.log("keydown=" + e.keyCode);
	keys[e.keyCode] = true;
	
    switch(e.keyCode){
            case 37: case 39: case 38:  case 40: // Arrow keys
            case 32: e.preventDefault(); break; // Space
            default: break; // do not block other keys
    }
};