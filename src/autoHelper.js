// autoHelper.js
// In-game click helper for Horse Plinko.
// Draws a brightly-colored target indicator on the canvas showing where to
// click next. The target automatically advances to the next pre-computed
// click position whenever the bullet resets (returns to start position).
//
// How it works:
//   1. Each level has a list of click positions (canvas coordinates).
//   2. The helper shows a pulsing magenta circle at the current click position.
//   3. When the bullet leaves the start position and returns (a shot is fired
//      and lands), the helper advances to the next click position.
//   4. A small "auto-helper" badge in the top-right shows: current step,
//      total steps, and the current level.
//   5. The helper auto-advances through levels: when level 1's clicks are
//      done, it waits for level 2 to load, then shows level 2's clicks.
//
// Keyboard shortcuts:
//   H     : toggle helper on/off
//   N     : skip to next click position (in case the bullet missed)
//   P     : skip to previous click position
//   R     : reset helper to the first click of the current level
//
// The helper is purely visual — it doesn't click for you. You still click
// the mouse where the indicator shows. This avoids the canvas-coordinate
// calibration issues that the pynput script had.

import * as main from './main.js';
import * as canvas from './canvas.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const START_CLICK = { x: 275, y: 325, label: "Play Game" };

// Click sequences for each level (canvas coordinates).
// Found by simulating the bullet physics and searching for click positions
// that hit orbs AND land the bullet in a cup (so no balls are lost).
const CLICK_SEQUENCES = {
    1: [
        { x:  20, y: 260, label: "L1 #1" },
        { x: 650, y: 710, label: "L1 #2" },
        { x:  20, y: 620, label: "L1 #3" },
        { x:  80, y: 320, label: "L1 #4" },
        { x:  50, y: 380, label: "L1 #5" },
        { x: 740, y:  20, label: "L1 #6" },
        { x: 770, y: 170, label: "L1 #7" },
    ],
    2: [
        { x: 770, y: 410, label: "L2 #1" },
        { x: 110, y: 530, label: "L2 #2" },
        { x:  50, y: 650, label: "L2 #3" },
        { x: 560, y:  50, label: "L2 #4" },
        { x:  20, y: 350, label: "L2 #5" },
        { x:  50, y: 230, label: "L2 #6" },
        { x:  20, y: 200, label: "L2 #7" },
        { x: 680, y:  20, label: "L2 #8" },
        { x: 740, y:  20, label: "L2 #9" },
        { x: 740, y:  20, label: "L2 #10" },
    ],
    3: [
        { x: 650, y: 200, label: "L3 #1" },
        { x: 230, y: 350, label: "L3 #2" },
        { x:  80, y: 290, label: "L3 #3" },
        { x:  20, y: 350, label: "L3 #4" },
        { x:  20, y: 500, label: "L3 #5" },
        { x:  80, y: 350, label: "L3 #6" },
        { x: 260, y: 110, label: "L3 #7" },
        { x: 680, y:  20, label: "L3 #8" },
        { x: 740, y:  20, label: "L3 #9" },
        { x: 740, y:  20, label: "L3 #10" },
    ],
};

// ============================================================================
// STATE
// ============================================================================

let helperEnabled = true;
let startScreenClickShown = true;  // show the Play Game target on start screen
let currentLevel = 1;
let currentStep = 0;               // index into CLICK_SEQUENCES[currentLevel]
let lastBulletAtStart = true;      // was the bullet at (475, 25) last frame?
let lastGameState = null;
let animationTime = 0;             // for pulsing animation
let lastBallCount = 0;             // for detecting level transitions
let framesBulletAway = 0;          // how many frames the bullet has been away from start
let FRAMES_AWAY_THRESHOLD = 30;    // need at least this many frames away to count as a real shot

// ============================================================================
// DRAWING
// ============================================================================

function drawTargetIndicator(ctx, x, y, label, stepNum, totalSteps) {
    // Pulsing animation
    const pulse = 0.5 + 0.5 * Math.sin(animationTime * 0.008);
    const baseRadius = 30;
    const pulseRadius = baseRadius + pulse * 12;

    ctx.save();

    // Outer glow (large semi-transparent magenta circle)
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius + 15, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 0, 255, ${0.15 + pulse * 0.1})`;
    ctx.fill();

    // Pulsing ring
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 0, 255, ${0.7 + pulse * 0.3})`;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner solid ring (always visible)
    ctx.beginPath();
    ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Crosshair lines
    ctx.beginPath();
    ctx.moveTo(x - baseRadius - 8, y);
    ctx.lineTo(x - baseRadius + 4, y);
    ctx.moveTo(x + baseRadius - 4, y);
    ctx.lineTo(x + baseRadius + 8, y);
    ctx.moveTo(x, y - baseRadius - 8);
    ctx.lineTo(x, y - baseRadius + 4);
    ctx.moveTo(x, y + baseRadius - 4);
    ctx.lineTo(x, y + baseRadius + 8);
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label box (below the target)
    if (label) {
        const labelText = stepNum != null && totalSteps != null
            ? `${label}  (${stepNum}/${totalSteps})`
            : label;
        ctx.font = "bold 14pt 'Roboto', Arial, sans-serif";
        const textWidth = ctx.measureText(labelText).width;
        const boxW = textWidth + 20;
        const boxH = 26;
        const boxX = x - boxW / 2;
        const boxY = y + baseRadius + 18;

        // Box background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Box text
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, x, boxY + boxH / 2 + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    ctx.restore();
}


function drawHelperBadge(ctx) {
    // Top-right badge showing helper state
    if (!helperEnabled) return;

    const seq = CLICK_SEQUENCES[currentLevel];
    const totalSteps = seq ? seq.length : 0;
    const stepNum = currentStep + 1;

    const lines = [
        `AUTO-HELPER`,
        `Level ${currentLevel}  •  Step ${stepNum}/${totalSteps}`,
        `[H] hide  [N] next  [P] prev  [R] reset`,
    ];

    ctx.save();
    ctx.font = "12pt 'Roboto', Arial, sans-serif";

    // Measure box
    let maxW = 0;
    for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxW) maxW = w;
    }
    const boxW = maxW + 24;
    const boxH = lines.length * 18 + 16;
    const boxX = 1000 - boxW - 50;  // canvas width is 1000
    const boxY = 8;

    // Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FF00FF';
    ctx.fillText(lines[0], boxX + 12, boxY + 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines[1], boxX + 12, boxY + 8 + 18);
    ctx.fillStyle = '#AAAAAA';
    ctx.font = "10pt 'Roboto', Arial, sans-serif";
    ctx.fillText(lines[2], boxX + 12, boxY + 8 + 36);
    ctx.textBaseline = 'alphabetic';

    ctx.restore();
}


// ============================================================================
// LOGIC
// ============================================================================

function getCurrentTarget() {
    // Returns the current click target based on game state, or null.
    const bullet = main.getBullet();
    if (!bullet) return null;

    // We need to know the current game state. The main module doesn't export
    // it, but we can infer it from the bullet position and the ball array.
    const ballArray = main.getBallArray();
    const bulletAtStart = (bullet.getX() === 475 && bullet.getY() === 25);

    // If the ball array is empty AND bullet is at start, we're on the start
    // screen (or in a level transition). Show the Play Game target only on
    // the actual start screen.
    //
    // Heuristic: if there are no balls and bullet is at start, treat it as
    // the start screen and show the Play Game target.
    if (ballArray.length === 0 && bulletAtStart) {
        return { ...START_CLICK, isStartScreen: true };
    }

    // Otherwise, we're in gameplay. Get the click sequence for the current
    // level. If we're past level 3, no sequence is available - the helper
    // just stops showing targets.
    const seq = CLICK_SEQUENCES[currentLevel];
    if (!seq) return null;
    if (currentStep >= seq.length) return null;
    return { ...seq[currentStep], isStartScreen: false };
}


function updateAnimation(timestamp) {
    animationTime = timestamp || performance.now();
}


function checkBulletResetAndAdvance() {
    // Detect when a real shot has been fired and completed.
    // A "real shot" means:
    //   1. The bullet was at start
    //   2. The bullet moved AWAY from start for at least FRAMES_AWAY_THRESHOLD frames
    //   3. The bullet returned to start
    // This prevents false advances when the bullet briefly passes through
    // the start position during a bounce.
    const bullet = main.getBullet();
    if (!bullet) return;

    const bulletAtStart = (bullet.getX() === 475 && bullet.getY() === 25);

    if (!bulletAtStart) {
        // Bullet is away from start — increment the away counter
        framesBulletAway++;
    } else {
        // Bullet is at start
        if (framesBulletAway >= FRAMES_AWAY_THRESHOLD) {
            // The bullet was away for a meaningful amount of time, then returned.
            // This counts as a completed shot — advance the step.
            const seq = CLICK_SEQUENCES[currentLevel];
            if (seq && currentStep < seq.length) {
                currentStep++;
                // If we've finished all steps for this level, prepare for the
                // next level. Don't advance past level 3 (no sequence beyond).
                if (currentStep >= seq.length && currentLevel < 3) {
                    currentLevel++;
                    currentStep = 0;
                }
            }
        }
        // Reset the away counter
        framesBulletAway = 0;
    }
    lastBulletAtStart = bulletAtStart;
}


function detectLevelTransition() {
    // When the main.js loop loads a new level, it calls autoHelper.resetForLevel()
    // directly. But we also need to handle the start-screen → level-1 transition,
    // which doesn't go through resetForLevel (because no level was being played
    // before). We detect this by watching the ball array size.
    const ballArray = main.getBallArray();
    const ballCount = ballArray.length;

    // If we were on the start screen (ballCount was 0) and now we have balls,
    // we've just entered level 1. Make sure we're at step 0 of level 1.
    if (lastBallCount === 0 && ballCount > 0) {
        if (currentLevel !== 1 || currentStep !== 0) {
            currentLevel = 1;
            currentStep = 0;
        }
    }
    lastBallCount = ballCount;
}


function resetForLevel(level) {
    currentLevel = level;
    currentStep = 0;
}


// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'h') {
            helperEnabled = !helperEnabled;
            console.log(`Auto-helper: ${helperEnabled ? 'ON' : 'OFF'}`);
        } else if (key === 'n') {
            const seq = CLICK_SEQUENCES[currentLevel];
            if (seq && currentStep < seq.length - 1) {
                currentStep++;
                console.log(`Auto-helper: skipped to step ${currentStep + 1}`);
            } else if (seq && currentStep >= seq.length - 1) {
                // Advance to next level
                currentLevel++;
                currentStep = 0;
                console.log(`Auto-helper: advanced to level ${currentLevel}`);
            }
        } else if (key === 'p') {
            if (currentStep > 0) {
                currentStep--;
                console.log(`Auto-helper: back to step ${currentStep + 1}`);
            } else if (currentLevel > 1) {
                currentLevel--;
                const seq = CLICK_SEQUENCES[currentLevel];
                currentStep = seq ? seq.length - 1 : 0;
                console.log(`Auto-helper: back to level ${currentLevel} step ${currentStep + 1}`);
            }
        } else if (key === 'r') {
            currentStep = 0;
            console.log(`Auto-helper: reset to step 1 of level ${currentLevel}`);
        }
    });
}


// ============================================================================
// MAIN DRAW HOOK
// ============================================================================
// This function is called every frame from our patched loop() in main.js.
// It draws the target indicator and badge on top of the existing canvas.

function draw(ctx, timestamp) {
    if (!helperEnabled) return;

    updateAnimation(timestamp);
    detectLevelTransition();
    checkBulletResetAndAdvance();
    const target = getCurrentTarget();
    if (target) {
        const seq = CLICK_SEQUENCES[currentLevel];
        const stepNum = (target.isStartScreen) ? null : (currentStep + 1);
        const totalSteps = (target.isStartScreen) ? null : (seq ? seq.length : 0);
        drawTargetIndicator(ctx, target.x, target.y, target.label, stepNum, totalSteps);
    }
    drawHelperBadge(ctx);
}


// ============================================================================
// INITIALIZATION
// ============================================================================

let initialized = false;
function init() {
    if (initialized) return;
    initialized = true;
    setupKeyboard();
    console.log('%c[Horse Plinko Auto-Helper] Loaded.', 'color: magenta; font-weight: bold');
    console.log('%cKeyboard shortcuts:', 'color: magenta');
    console.log('  H : toggle helper');
    console.log('  N : next click position');
    console.log('  P : previous click position');
    console.log('  R : reset to first click of current level');
    console.log('%cClick where the magenta circle shows. The target auto-advances after each shot lands.', 'color: magenta');
}


export { init, draw, resetForLevel };
