import * as canvas from './canvas.js';

const makeColor = (red, green, blue, alpha = 1) => {
  return `rgba(${red},${green},${blue},${alpha})`;
};

const getRandom = (min, max) => {
  return Math.random() * (max - min) + min;
};

const getRandomColor = () => {
  const floor = 35; // so that colors are not too bright or too dark 
  const getByte = () => getRandom(floor, 255 - floor);
  return `rgba(${getByte()},${getByte()},${getByte()},1)`;
};

const getLinearGradient = (ctx, startX, startY, endX, endY, colorStops) => {
  let lg = ctx.createLinearGradient(startX, startY, endX, endY);
  for (let stop of colorStops) {
    lg.addColorStop(stop.percent, stop.color);
  }
  return lg;
};

function drawRectangle(ctx, x, y, width, height, fillStyle = "red", lineWidth = 0, strokeStyle = "red") {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.fill();
  if (lineWidth > 0) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
  ctx.closePath();
  ctx.restore();
}
function drawButton(ctx, x, y, width, height,buttonText, css="18pt 'Roboto', cursive", fillStyle = "red", lineWidth = 0, strokeStyle = "red"){
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.fill();
  if (lineWidth > 0) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
  ctx.closePath();
  ctx.restore();
  fillText(ctx,buttonText,x+12,y+30,css);
}
function fillText(ctx, string, x, y, css = "18pt 'Press Start 2P', cursive", color = "Black") {
  canvas.getCtx().save();
  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  canvas.getCtx().font = css;
  canvas.getCtx().fillStyle = color;
  canvas.getCtx().fillText(string, x, y);
  canvas.getCtx().restore();
}
function strokeText(ctx, string, x, y, css = "36pt 'Press Start 2P', cursive", color = "orange", lineWidth = 5) {
  canvas.getCtx().save();
  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  canvas.getCtx().font = css;
  canvas.getCtx().strokeStyle = color;
  canvas.getCtx().lineWidth = lineWidth;
  canvas.getCtx().strokeText(string, x, y);
  canvas.getCtx().restore();
}

const goFullscreen = (element) => {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullscreen) {
    element.mozRequestFullscreen();
  } else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
  // .. and do nothing if the method is not supported
};
function getRandomString(length) {
  var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for ( var i = 0; i < length; i++ ) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
}
export { makeColor, getRandomColor, getLinearGradient, goFullscreen, getRandom,fillText,strokeText,drawRectangle,drawButton,getRandomString };