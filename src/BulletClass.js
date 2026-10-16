import * as main from './main.js';
import * as utils from './utils.js';

export default class Bullet {
    constructor(ctx, x, y, speed, radius = 25, image) {
        //super();
        this.isAlive = false;
        this.gravityScale = .01;
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.diameter = 2 * this.radius;
        this.image = image;
        this.hasBounce = false;
        this.isColliding = false;
        this.hasCollided = false;
        this.dx = 0;
        this.dy = 0;

    }
    //this is where the methods and getters and setters will go
    drawBullet(ctx) {
        ctx.save();
        //ctx.rotate(10*Math.PI/180);
        ctx.drawImage(this.image, this.x, this.y, this.diameter, this.diameter);
        ctx.restore();
    }

    moveBullet(ctx, xTarget, yTarget, dt = 1 / 60) {

        this.isAlive = true;
        //before collision
        if (!this.hasCollided) {

            this.dx = (xTarget - 500) / 150;
            this.dy = (yTarget - 25) / 150 + this.gravityScale;
            //increment for largely here 
            this.gravityScale += .01;
        }
        else {
            //reverse the ball when it hits initially
            if (this.isColliding && this.hasBounce) {
                this.dx = -this.dx * .95 + utils.getRandom(.0, .4);
                this.dy = -this.dy * .95 + utils.getRandom(-.5, -.1);
                //reset gravity scale 
                this.gravityScale = .01;
            }
            else if (this.isColliding) {
                this.dx = -this.dx * .95 + utils.getRandom(.0, .4);
                this.dy = this.dy * .95 + utils.getRandom(-.5, -.1);
                //reset gravity scale 
                this.gravityScale = .01;
            }

            this.dx = this.dx * .9995;
            //making sure it slows down after collision and that gravity is acting on it
            this.dy = (this.dy * .99) + this.gravityScale;
            //making sure we increment gravity scale
            this.gravityScale += .0003;
            //console.log(`X:${this.dx} Y:${this.dy}`);
        }

        this.x += this.dx;
        this.y += this.dy;
        //while the ball is moving if it goes off screen it resets 
        if (this.x >= 1000 || this.x < 0 || this.y >= 800 || this.y < 0) {
            main.decrementBalls();
            this.resetBall();
        }

        //handling cup logic
        if (this.y > 700) {

            if (this.x >= 55 && this.x <= 205) {
                //main.incrementBalls();
            }
            else if (this.x >= 280 && this.x <= 430) {
                // main.incrementBalls();
            }
            else if (this.x >= 530 && this.x <= 678) {
                //main.incrementBalls();
            }
            else if (this.x >= 757 && this.x <= 900) {
                //main.incrementBalls();
            }
            //else it misses a cup
            else {
                main.decrementBalls();
            }
            //no matter what the ball is going to reset
            this.resetBall();

        }

    }

    //setter but only sets true
    setAlive() {
        this.isAlive = true;
    }
    //getter
    getIsAlive() {
        return this.isAlive;
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
    resetBall() {
        this.isAlive = false;
        this.x = 475;
        this.y = 25;
        this.dx = 0;
        this.dy = 0;
        this.hasCollided = false;
        this.gravityScale = .01;
    }

    checkColliding(ballX, ballY, ballRadius, thisIsBounce) {
        //first get the distance of our x and y to later use poppyseeds therorem for triangulating the center of jupiter
        let dx = (ballX + ballRadius - 25) - (this.x + this.radius);
        let dy = (ballY + ballRadius - 25) - (this.y + this.radius);
        //pythagorem theorem 
        let distance = Math.sqrt(dx * dx + dy * dy);
        //bounding circle 2d collision detection really really simple
        if ((distance < (ballRadius + this.radius))) {
            if (thisIsBounce) {
                //making sure we reset the bullet if it is the last ball
                if (main.getBallArray().length <= 0) {
                    this.resetBall();
                }

                this.isColliding = true;
                this.hasCollided = true;
                this.hasBounce = true;
                return true;
            }
            //making sure we reset the bullet if it is the last ball
            if (main.getBallArray().length <= 0) {
                this.resetBall();
            }
            console.log("okay");
            this.isColliding = true;
            this.hasCollided = true;
            return true;
        }
      
        else {

            this.isColliding = false;
            this.hasBounce = false;
            return false;
        }
    }

}