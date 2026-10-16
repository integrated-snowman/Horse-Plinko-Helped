import * as utils from './utils.js';
import * as canvas from './canvas.js';
import * as firebase from './firebase.js';
import Bullet from './BulletClass.js';
import Balls from './BallsClass.js';
import * as autoHelper from './autoHelper.js';



// Gamestates that will be used for our game
const GameState = Object.freeze({
  START: Symbol("START"),
  MAIN: Symbol("MAIN"),
  INSTRUCTIONS: Symbol("INSTRUCTIONS"),
  GAMEOVER: Symbol("GAMEOVER"),
  GAMEOVERPRIOR: Symbol("GAMEOVERPRIOR")
});

//this array will  hold all of the balls on the screen
let score;
let bullet;
//these will remember the x and y that was clicked orginally 
let xAtClick;
let yAtClick;
let decider;
let balls;
let walls;
let canvasElement;
let nameInputField;
let gameState;
let numberOfBalls;
let currentLevel;
let startX;
let startY;
let bulletImg;
let instructions;
let userName;
let map;
let topTenNames;
let topTenScores;
//declaring our sounds
let hitSound;
let backgroundSound;
let shootSound;

function init() {
  //create our bullet at the center
  score = 0;
  //setting this to fault at the start so the bullet isnt moving arround
  decider = false;
  balls = [];
  walls = [];
  topTenNames = [];
  topTenScores = [];
  canvasElement = document.querySelector("canvas"); // hookup <canvas> element
  nameInputField = document.querySelector("#nameField");
  nameInputField.style.display = "none"
  gameState = GameState.START;
  numberOfBalls = 3;
  currentLevel = 0;
  startX = 475;
  startY = 25;
  bulletImg = document.getElementById("bulletImg");
  bullet = new Bullet(canvas.getCtx(), 475, 25, 1, 25, bulletImg);
  instructions = [];
  userName = utils.getRandomString(12);
  map = new Map();
  //setting up our sounds now

  backgroundSound = new Howl({
    src: ['./music/backgroundMusic.mp3'],
    volume: .1
  });

  hitSound = new Howl({
    src: ['./music/hitMusic.mp3'],
    volume: .3
  });

  shootSound = new Howl({
    src: ['./music/shootMusic.mp3'],
    volume: .3
  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //set up firebase
  firebase.setUpFireBase();
  //function that loads in instructions from json
  retrieveInstructions();
  //next setup canvas
  canvas.setupCanvas(canvasElement);
  //run our logic loop
  loop();

  //adding our correct event listener may get moved out of init eventually
  canvasElement.addEventListener("mousedown", function (e) {
    bullet.setAlive();
    //we only want this code to run if our bullet is centered at the start
    if (bullet.getX() == startX && bullet.getY() == startY) {

      doMouseDown(getMousePosition(canvasElement, e));
    }
    //this else is gonna handle other scenes
    else if(!gameState == GameState.MAIN) {
      doMouseDown(getMousePosition(canvasElement, e));
    }
  });
  createWalls();

  // === AUTO-HELPER: initialize the click-position indicator ===
  autoHelper.init();
}


function loop(timestamp) {

  requestAnimationFrame(loop);

  if(!backgroundSound.playing()){
    backgroundSound.play();
  }
  
  //if the player loses change to the name grabbing menu
  if (numberOfBalls <= 0) {
    gameState = GameState.GAMEOVERPRIOR;
  }

  if (gameState == GameState.MAIN) {

    //if there are no more balls we will load the next level
    if (balls.length <= 0) {
      //increment the level
      incrementBalls();
      bullet.resetBall();
      currentLevel++
      loadLevel(currentLevel);
      // === AUTO-HELPER: reset helper for the new level ===
      autoHelper.resetForLevel(currentLevel);
    }
    //move the bullet only if the bullet is suppose to be moving
    if (decider == true && bullet.getIsAlive()) {

      //movement
      bullet.moveBullet(canvas.getCtx(), xAtClick, yAtClick);

      for (let i = 0; i < walls.length; i++) {

        if (bullet.checkColliding(getWall(i).getX(), getWall(i).getY(), getWall(i).getRadius())) {
          //has to go here because of 
          canvas.draw();
          drawHUD();
          return;
        }
      }
      //collision detection
      for (let i = 0; i < balls.length; i++) {
        //if it is colliding with one we exit the loop so that the collision detection doesnt only work with the last ball
        if (bullet.checkColliding(getBall(i).getX(), getBall(i).getY(), getBall(i).getRadius(), getBall(i).getHasBounce())) {
          //remove the ball it collided with
          canvas.draw();
          drawHUD();
          score += 10;
          balls.splice(i, 1);
          //play hit sound
          hitSound.play();
          return;
        }
      }

    }
    //make sure draw is always being called at the end of our logic
    canvas.draw();
    drawHUD();

  }

  else if (gameState == GameState.START) {
    //draw background
    canvas.drawHomeScreen();
    //input handler
    handleInputOnStartScreen();
    //draw the hud every frame


  }
  else if (gameState == GameState.INSTRUCTIONS) {
    //draw background
    canvas.drawHomeScreen();
    //input handler
    handleInputOnInstructionsScreen();

  }
  else if (gameState == GameState.GAMEOVERPRIOR) {

    canvas.drawHomeScreen();
    handleNameInput();
  }
  else if (gameState == GameState.GAMEOVER) {
    canvas.drawHomeScreen();
    handleInputOnHighScoreScreen();

  }
  drawHUD();

  // === AUTO-HELPER: draw the click-position indicator on top of everything ===
  autoHelper.draw(canvas.getCtx(), timestamp);
}

//this is where ball creation will be handeled
function loadLevel(levelNum) {
  if (levelNum == 1) {
    balls.push(new Balls(canvas.getCtx(), canvasElement.width / 2 - 250, 300, 25, true));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width / 2 + 250, 300, 25, false));
    balls.push(new Balls(canvas.getCtx(), 50, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 125, 475, 25, true));
    balls.push(new Balls(canvas.getCtx(), 200, 550, 25, false));
    balls.push(new Balls(canvas.getCtx(), 275, 625, 25, false));
    balls.push(new Balls(canvas.getCtx(), 350, 650, 25, false));
    balls.push(new Balls(canvas.getCtx(), 425, 650, 25, false));
    balls.push(new Balls(canvas.getCtx(), 500, 650, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 425, 650, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 350, 650, 25, true));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 275, 625, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 200, 550, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 125, 475, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 50, 400, 25, true));
  }
  else if(levelNum ==2){
    balls.push(new Balls(canvas.getCtx(), canvasElement.width / 2 , 200, 25, true));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width / 2 , 250, 25, true));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width / 2 , 150, 25, true));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width / 2 - 250, 525, 25, true));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width / 2 + 250, 525, 25, false));
    balls.push(new Balls(canvas.getCtx(), 50, 350, 25, false));
    balls.push(new Balls(canvas.getCtx(), 100, 375, 25, true));
    balls.push(new Balls(canvas.getCtx(), 150, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 200, 425, 25, false));
    balls.push(new Balls(canvas.getCtx(), 250, 450, 25, false));
    balls.push(new Balls(canvas.getCtx(), 300, 475, 25, false));
    balls.push(new Balls(canvas.getCtx(), 350, 500, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 350, 500, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 300, 475, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 250, 450, 25, true));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 200, 425, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 150, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 100, 375, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 50, 350, 25, true));
  }
  else if(levelNum ==3){
    balls.push(new Balls(canvas.getCtx(), 50, 500, 25, false));
    balls.push(new Balls(canvas.getCtx(), 100, 475, 25, true));
    balls.push(new Balls(canvas.getCtx(), 150, 450, 25, true));
    balls.push(new Balls(canvas.getCtx(), 200, 425, 25, false));
    balls.push(new Balls(canvas.getCtx(), 250, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 300, 375, 25, true));
    balls.push(new Balls(canvas.getCtx(), 350, 350, 25, false));
    balls.push(new Balls(canvas.getCtx(), 400, 500, 25, false));
    balls.push(new Balls(canvas.getCtx(), 450, 475, 25, true));
    balls.push(new Balls(canvas.getCtx(), 500, 450, 25, false));
    balls.push(new Balls(canvas.getCtx(), 550, 425, 25, false));
    balls.push(new Balls(canvas.getCtx(), 600, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 650, 375, 25, false));
    balls.push(new Balls(canvas.getCtx(), 700, 350, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 350, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 300, 475, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 250, 450, 25, true));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 200, 425, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 150, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 100, 375, 25, false));
    balls.push(new Balls(canvas.getCtx(), canvasElement.width - 50, 350, 25, true));
  }
  else{
    balls.push(new Balls(canvas.getCtx(), 50, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 150,400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 250, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 350, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 450, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 550, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 650, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 750, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 850, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 950, 400, 25, false));
    balls.push(new Balls(canvas.getCtx(), 50, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), 150, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), 250, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), 350, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), 450, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), 550, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), 650, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), 750, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), 850, 500, 25, true));
    balls.push(new Balls(canvas.getCtx(), 950, 500, 25, true));

    balls.push(new Balls(canvas.getCtx(), 100, 550, 25, true));
    balls.push(new Balls(canvas.getCtx(), 200, 550, 25, true));
    balls.push(new Balls(canvas.getCtx(), 300, 550, 25, true));
    balls.push(new Balls(canvas.getCtx(), 400, 550, 25, true));
    balls.push(new Balls(canvas.getCtx(), 500, 550, 25, true));
    balls.push(new Balls(canvas.getCtx(), 600, 550, 25, true));
    balls.push(new Balls(canvas.getCtx(), 700, 550, 25, true));
    balls.push(new Balls(canvas.getCtx(), 800, 550, 25, true));
    balls.push(new Balls(canvas.getCtx(), 900, 550, 25, true));

  }



}




function handleNameInput() {
  numberOfBalls = 3;
  nameInputField.style.display = "block";
  //update the onscreen text 
  nameInputField.oninput = function () {
    //set the username to the value so it takes effect
    userName = nameInputField.value;

  }
  canvas.getCtx().restore();

  //make sure we handle if the user clicks the button
  if (xAtClick >= 150 && xAtClick <= 400 && yAtClick >= 400 && yAtClick <= 450) {
    //make sure we update the data on the server
    firebase.writeScoreNameData(userName, score, utils.getRandomString(10));
    //make sure we also turn off the text box
    nameInputField.style.display = "none";  
    //from there we grab our ordered map
    map = firebase.returnMapGlobal();
    highScoreScreen();
    //draw out the top 10 scores
    gameState = GameState.GAMEOVER;
  }
}

function drawHUD() {
  switch (gameState) {
    case GameState.START:
      canvas.getCtx().save();
      utils.drawButton(canvas.getCtx(), 150, 300, 250, 50, "Play Game");
      utils.drawButton(canvas.getCtx(), 150, 400, 250, 50, "View Instructions");
      utils.fillText(canvas.getCtx(), "Horse Plinko", 50, 150, "58pt 'Roboto', cursive");
      utils.fillText(canvas.getCtx(), "Horse Plinko", 50, 150, "58pt 'Roboto', cursive");
      canvas.getCtx().restore();
      // Draw background
      // Draw Text
      break;
    case GameState.MAIN:
      // draw score
      canvas.getCtx().save();
      utils.fillText(canvas.getCtx(), `Current Level:${currentLevel}`, canvasElement.width - 975, 25);
      utils.fillText(canvas.getCtx(), `Score:${score}`, canvasElement.width - 975, 50);
      utils.fillText(canvas.getCtx(), `Total Balls Remaining:${numberOfBalls}`, canvasElement.width - 270, 25);
      canvas.getCtx().restore();
      break;
    case GameState.INSTRUCTIONS:
      canvas.getCtx().save();
      utils.drawButton(canvas.getCtx(), 150, 200, 250, 50, "Return to Start Screen");
      utils.fillText(canvas.getCtx(), instructions[0], 50, 50, "18pt 'Oswald', cursive");
      utils.fillText(canvas.getCtx(), instructions[1], 50, 100, "18pt 'Oswald', cursive");
      utils.fillText(canvas.getCtx(), instructions[2], 50, 150, "18pt 'Oswald', cursive");
      canvas.getCtx().restore();
      break;
    case GameState.GAMEOVERPRIOR:
      canvas.getCtx().save();
      utils.fillText(canvas.getCtx(), `Your score is:${score}`, 50, 150, "18pt 'Roboto', cursive");
      utils.fillText(canvas.getCtx(), "Please imput your name into the box above", 50, 200, "18pt 'Roboto', cursive");
      utils.fillText(canvas.getCtx(), `The currently imputted name is:${userName} `, 50, 250, "18pt 'Roboto', cursive");
      //button to advance to highscores
      utils.drawButton(canvas.getCtx(), 150, 400, 250, 50, "View Highscores");
      canvas.getCtx().restore();
      // draw game results
      break;
    case GameState.GAMEOVER:
      canvas.getCtx().save();
      utils.fillText(canvas.getCtx(), `Top 10 Scores`, 400, 75, "28pt 'Oswald', cursive");
      //this offset will be used for offsetting the lines
      let offset = 0;
      for (let i = 1; i < 11; i++) {
        //draw what needs to be drawn each iteration
        utils.fillText(canvas.getCtx(), `${i}. ${topTenNames[i]}:${topTenScores[i]}`, 50, 150 + offset, "18pt 'Oswald', cursive");
        //increment our offset
        offset = offset + 50;
      }
      utils.drawButton(canvas.getCtx(), 150, 700, 250, 50, "Return to Start Screen");
      // draw game results
      canvas.getCtx().restore();
      break;

    default:
      throw new Error(MyErrors.drawHUDswitch);


  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
//this function will be accessed by our bullet class to allow it to decrease the number of balls we have
function decrementBalls() {
  numberOfBalls--;
}
function incrementBalls() {
  numberOfBalls++;
}
//our getters and setters
//getter for a specific ball
function getBall(i) {
  return balls[i];
}
//getter for a specific wall
function getWall(i) {
  return walls[i];
}
//getter for the entire ball array
function getBallArray() {
  return balls;
}
function getWallArray() {
  return walls;
}
function getBullet() {
  return bullet;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
//function that will return the mouse position we need
function getMousePosition(canvas, event) {
  let newArray = [];
  let rect = canvasElement.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  console.log(`X:${x},Y:${y}`);
  newArray[0] = x;
  newArray[1] = y;
  return newArray;
}
function doMouseDown(array) {
  //if bullet is centered have it mnake the shoot sound
  if (bullet.getX() == startX && bullet.getY() == startY && gameState == GameState.MAIN) {

    shootSound.play();
  }
  //when the mouse is clicked save the x and y into our global variables that can be accessed in our loop

  xAtClick = array[0];
  yAtClick = array[1];
  switch (decider) {
    case false:
      decider = true;
      break;
    /*
  case true:
  decider = false;
    break;
    */
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
function handleInputOnStartScreen() {
  if (xAtClick >= 150 && xAtClick <= 400 && yAtClick >= 300 && yAtClick < 350) {
    gameState = GameState.MAIN;
  }
  else if (xAtClick >= 150 && xAtClick <= 400 && yAtClick >= 400 && yAtClick <= 450) {
    gameState = GameState.INSTRUCTIONS;
  }
}
function handleInputOnInstructionsScreen() {
  if (xAtClick >= 150 && xAtClick <= 400 && yAtClick >= 200 && yAtClick <= 250) {
    gameState = GameState.START;
  }
}
function handleInputOnHighScoreScreen() {
  if (xAtClick >= 150 && xAtClick <= 400 && yAtClick >= 700 && yAtClick <= 750) {
    //window.location.pathname = './about.html';
    window.location.reload();
    gameState = GameState.START;
  }
}
function highScoreScreen() {


  for (let i = 0; i < 10; i++) {
    
    if (map[i] == undefined) {
      return;
    }
    //get the two values we want
    let name = map[i][0];
    let score = map[i][1];

    //split this back down into its two arrays
    topTenNames.push(name);
    topTenScores.push(score);
    //console.log(topTenNames);
    //console.log(topTenScores);

  }



}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
function createWalls() {
  /////////////////////////////////drawing walls//////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  //drawing a singular wall
  let x = 75;
  let y = 800;
  for (let i = 0; i < 25; i++) {
    walls.push(new Balls(canvas.getCtx(), x, y, 2, false));
    y -= 4;
  }
  y = 800
  x = 225;
  for (let i = 0; i < 25; i++) {
    walls.push(new Balls(canvas.getCtx(), x, y, 2, false));
    y -= 4;
  }
  y = 800
  x = 300;
  for (let i = 0; i < 25; i++) {
    walls.push(new Balls(canvas.getCtx(), x, y, 2, false));
    y -= 4;
  }
  y = 800
  x = 450;
  for (let i = 0; i < 25; i++) {
    walls.push(new Balls(canvas.getCtx(), x, y, 2, false));
    y -= 4;
  }
  y = 800
  x = 550;
  for (let i = 0; i < 25; i++) {
    walls.push(new Balls(canvas.getCtx(), x, y, 2, false));
    y -= 4;
  }
  y = 800
  x = 700;
  for (let i = 0; i < 25; i++) {
    walls.push(new Balls(canvas.getCtx(), x, y, 2, false));
    y -= 4;
  }
  y = 800
  x = 775;
  for (let i = 0; i < 25; i++) {
    walls.push(new Balls(canvas.getCtx(), x, y, 2, false));
    y -= 4;
  }
  y = 800
  x = 925;
  for (let i = 0; i < 25; i++) {
    walls.push(new Balls(canvas.getCtx(), x, y, 2, false));
    y -= 4;
  }
}
function retrieveInstructions() {

  //fetch this jimmy jawn
  fetch("./data/instructions-data.json")
    .then(response => {
      //if response is successful, return the JSON
      if (response.ok) {
        return response.json();//piping to next.then
      }
      //else throw an error that will be caught below
      return response.text().then(text => {
        throw text;//goes right to catch
      });
    })//send the response.json() promise to the next .then()
    .then(json => {//the second promise is resolved and json is a json object
      console.log(json);

      /////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////
      //getting the keys 
      const keys = Object.keys(json);
      //looping through each key and passing the instructions along
      for (let k of keys) {
        const obj = json[k];
        instructions.push(obj.instructions);
      }

    }).catch(error => {
      //error
      console.log(error);
    });
}








export { init, getBall, getBallArray, getBullet, decrementBalls, incrementBalls, getWall, getWallArray };