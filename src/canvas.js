import * as utils from './utils.js';
import * as main from './main.js';


let ctx, canvasWidth, canvasHeight,imageOfBucket,backgroundImage;


function setupCanvas(canvasElement) 
{
    // create drawing context
    //create our bullet
    imageOfBucket = document.getElementById("bucketImg");
    backgroundImage = document.getElementById("base");
    ctx = canvasElement.getContext("2d");
    canvasWidth = canvasElement.width;
    canvasHeight = canvasElement.height;


}

function getCtx()
{
    return ctx;
}
function drawHomeScreen(){
    ctx.save();
    ctx.fillStyle = "olive";
    ctx.globalAlpha = .5;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
    ctx.save();
    ctx.drawImage(backgroundImage,0,0);
    ctx.restore();
    
}
function drawScreen(){
    ctx.save();
    ctx.fillStyle = "olive";
    ctx.globalAlpha = .5;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
    
}
function draw(params = {}) {



    drawScreen();

    //draw the bullet
    

    //looping through and making sure we draw every ball in our ball array
    //the array will be handeled in main
    for(let i =0;i<main.getBallArray().length;i++)
    {
        
        main.getBall(i).drawBall(ctx);
    }

    /*
    for(let i =0;i<main.getWallArray().length;i++)
    {
        
        main.getWall(i).drawBall(ctx);
    }
*/
//drawbullet
    if(main.getBullet() != null){
        
        main.getBullet().drawBullet(ctx);
    }
    
    //DRAW THE PLInko cups and black bars
    ctx.save();
    //utils.drawRectangle(ctx,0,canvasHeight-30,canvasWidth,100,"lightblue");
    ctx.drawImage(imageOfBucket,55,650,155,150);
   ctx.drawImage(imageOfBucket,280,650,155,150);
    ctx.drawImage(imageOfBucket,530,650,155,150);
    ctx.drawImage(imageOfBucket,755,650,155,150);
    ctx.restore();

    
    
}


export { setupCanvas, draw, getCtx,drawScreen,drawHomeScreen };