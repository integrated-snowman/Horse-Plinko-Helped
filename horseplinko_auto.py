#!/usr/bin/env python3
"""
Horse Plinko Auto-Player (v2 - easier activation)
=================================================
A pynput-based automation script that plays Horse Plinko
(https://www.horseplinko.com) through Level 3.

WHAT'S NEW IN v2
----------------
- AUTO-DETECTION: The script scans your screen for the game's olive-colored
  canvas and finds it automatically. No clicking required!
- FALLBACK: If auto-detection fails, you can click ANYWHERE inside the
  canvas (no need to hit the exact corner).
- LAST RESORT: If both fail, you can still click the top-left corner.

PREREQUISITES
-------------
1. Python 3.8+
2. pynput:      pip install pynput
3. Pillow:      pip install pillow    (for auto-detection)
4. numpy:       pip install numpy     (for fast auto-detection)

USAGE
-----
1. Open the game in your browser:
   - Local:  http://localhost:8000/index.html
   - Live:   https://www.horseplinko.com/index.html
2. Make sure the canvas is fully visible (don't scroll the page).
3. Run this script:  python3 horseplinko_auto.py
4. Follow the on-screen prompts:
   - First, the script tries to auto-detect the canvas.
   - Press ENTER to scan, or 'S' to skip to click-anywhere mode.
5. After detection, you have 3 seconds to focus your browser window.
6. The script clicks "Play Game" and runs the click sequences for L1, L2, L3.

HOW IT WORKS
------------
The game's canvas is rendered with an olive (127, 127, 0) overlay. This color
is distinctive — almost nothing else on the screen is exactly that color. So
the script scans your screen for olive pixels and finds their bounding box.
That bounding box IS the canvas.

If auto-detection fails (e.g., you're in dark mode, or have olive-colored
wallpaper), you can click anywhere inside the canvas. The script will then
scan outward from your click to find the canvas edges.

NOTES
-----
- The game has random bounce physics, so each run is slightly different.
- The click sequences clear all orbs on each level (verified in browser).
- Ball losses vary: Level 1 usually 0-2 balls lost, Level 2 usually 1-3,
  Level 3 usually 1-2. The counter starts at 4 (Level 1), +1 per level complete.
- If the game ends early (counter hits 0), refresh and re-run.
- Between clicks, the script waits for the bullet to land and reset. Adjust
  BULLET_WAIT below if needed.
"""

import sys
import os
import time

# Required: pynput
try:
    from pynput import mouse, keyboard
    from pynput.mouse import Button, Controller as MouseController
except ImportError:
    print("ERROR: pynput is not installed.")
    print("Install it with:  pip install pynput")
    sys.exit(1)

# Optional: PIL (for screenshot-based detection)
try:
    from PIL import Image, ImageGrab
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Optional: numpy (for fast color scanning)
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False


# ============================================================================
# CONFIGURATION
# ============================================================================

# How long to wait between clicks (for the bullet to fly, land, and reset).
BULLET_WAIT = 5.0

# How long to wait for level transition (after clearing all orbs in a level).
LEVEL_TRANSITION_WAIT = 3.0

# How long to wait after clicking "Play Game" before starting Level 1.
START_WAIT = 2.5

# Calibration prompt timeout (seconds).
CALIBRATION_TIMEOUT = 30.0


# ============================================================================
# CLICK SEQUENCES (in canvas coordinates; canvas is 1000 x 800)
# ============================================================================

# Start screen: "Play Game" button is at canvas (150,300)-(400,350)
START_CLICK = (275, 325)

LEVEL_1_CLICKS = [
    (20, 260),    # hits orbs 2, 6, 7, 8
    (650, 710),   # hits orbs 9, 10, 11, 12
    (20, 620),    # hits orbs 4, 5
    (80, 320),    # hits orbs 0, 1
    (50, 380),    # hits orb 3
    (740, 20),    # hits orb 14
    (770, 170),   # hits orb 13
]

LEVEL_2_CLICKS = [
    (770, 410),   # hits orbs 1, 4, 13, 14, 15, 16, 17
    (110, 530),   # hits orbs 3, 8, 9, 10, 11, 12
    (50, 650),    # hits orbs 8, 11
    (560, 50),    # hits orbs 0, 2
    (20, 350),    # hits orb 7
    (50, 230),    # hits orb 6
    (20, 200),    # hits orb 5
    (680, 20),    # hits orb 16
    (740, 20),    # hits orb 17
    (740, 20),    # hits orb 18
]

LEVEL_3_CLICKS = [
    (650, 200),   # hits orbs 11, 12, 13, 14, 15, 16, 17
    (230, 350),   # hits orbs 5, 6, 7, 8, 9
    (80, 290),    # hits orbs 1, 10
    (20, 350),    # hits orb 0
    (20, 500),    # hits orb 4
    (80, 350),    # hits orb 2
    (260, 110),   # hits orb 3
    (680, 20),    # hits orb 18
    (740, 20),    # hits orb 19
    (740, 20),    # hits orb 20
]

ALL_LEVELS = [
    ("Level 1", LEVEL_1_CLICKS),
    ("Level 2", LEVEL_2_CLICKS),
    ("Level 3", LEVEL_3_CLICKS),
]


# ============================================================================
# CANVAS DETECTION
# ============================================================================

# The game draws the canvas with an olive (127, 127, 0) overlay.
# This color is distinctive — almost nothing else on screen is exactly olive.
OLIVE_COLOR = (127, 127, 0)
OLIVE_TOLERANCE = 40  # max color distance to count as "olive"


def is_olive_pixel(r, g, b):
    """Check if a pixel matches the olive color (within tolerance)."""
    return (abs(r - OLIVE_COLOR[0]) + abs(g - OLIVE_COLOR[1]) +
            abs(b - OLIVE_COLOR[2])) < OLIVE_TOLERANCE


def find_canvas_auto(verbose=True):
    """
    Auto-detect the canvas by scanning the screen for olive-colored pixels.
    Returns (x, y) of the canvas top-left corner, or None if not found.
    """
    if not PIL_AVAILABLE:
        if verbose:
            print("  (PIL not available - install with: pip install pillow)")
        return None

    try:
        screenshot = ImageGrab.grab().convert('RGB')
    except Exception as e:
        if verbose:
            print(f"  (Screenshot failed: {e})")
        return None

    width, height = screenshot.size
    px = screenshot.load()

    # Collect all olive pixel positions
    # Use numpy for speed if available; otherwise pure Python
    if NUMPY_AVAILABLE:
        arr = np.array(screenshot)
        olive = np.array(OLIVE_COLOR)
        diff = np.abs(arr.astype(int) - olive).sum(axis=2)
        mask = diff < OLIVE_TOLERANCE
        rows_with_olive = np.any(mask, axis=1)
        cols_with_olive = np.any(mask, axis=0)
        row_indices = np.where(rows_with_olive)[0]
        col_indices = np.where(cols_with_olive)[0]
        if len(row_indices) == 0 or len(col_indices) == 0:
            return None
        top, bottom = int(row_indices[0]), int(row_indices[-1])
        left, right = int(col_indices[0]), int(col_indices[-1])
        total_olive = int(mask.sum())
    else:
        # Pure-Python fallback (slower)
        olive_pixels_x = []
        olive_pixels_y = []
        for y in range(height):
            for x in range(width):
                r, g, b = px[x, y][:3]
                if is_olive_pixel(r, g, b):
                    olive_pixels_x.append(x)
                    olive_pixels_y.append(y)
        if not olive_pixels_x:
            return None
        left, right = min(olive_pixels_x), max(olive_pixels_x)
        top, bottom = min(olive_pixels_y), max(olive_pixels_y)
        total_olive = len(olive_pixels_x)

    canvas_w = right - left + 1
    canvas_h = bottom - top + 1

    if verbose:
        print(f"  Found {total_olive:,} olive pixels on screen.")
        print(f"  Olive region: x=[{left}, {right}], y=[{top}, {bottom}]")
        print(f"  Size: {canvas_w}x{canvas_h} (expected ~1000x800)")

    # Validate: the canvas should be roughly 1000x800
    # (Allow some slack for partial visibility or page zoom)
    if canvas_w < 500 or canvas_h < 400:
        if verbose:
            print(f"  Region too small - probably not the canvas.")
        return None

    # Check that we have a reasonable density of olive pixels in the region
    # (the canvas should be mostly olive)
    expected_pixels = canvas_w * canvas_h
    density = total_olive / expected_pixels if expected_pixels > 0 else 0
    if verbose:
        print(f"  Olive density: {density*100:.1f}% of bounding box")
    if density < 0.3:
        if verbose:
            print(f"  Density too low - probably not the canvas.")
        return None

    return (left, top)


def find_canvas_from_click(click_x, click_y, verbose=True):
    """
    Given a click inside the canvas, find the canvas boundaries. We use the
    same olive-color scan as auto-detection, but only AFTER confirming the
    click is inside the canvas (which gives the user confidence that they
    clicked the right place). Returns (x, y) or None.
    """
    if not PIL_AVAILABLE:
        return None

    screenshot = ImageGrab.grab().convert('RGB')
    width, height = screenshot.size
    px = screenshot.load()

    if verbose:
        print(f"  Screenshot size: {width}x{height}")
        r, g, b = px[click_x, click_y][:3]
        print(f"  Click pixel color: RGB({r}, {g}, {b})")

    # Verify the click is inside the canvas (should be olive-ish)
    click_is_olive = is_olive_pixel(*px[click_x, click_y][:3])
    if not click_is_olive:
        if verbose:
            print(f"  ✗ Click point is NOT olive. You probably clicked outside the canvas.")
            print(f"    The canvas is the dark/olive play area.")
        return None

    if verbose:
        print(f"  ✓ Click is inside the canvas. Scanning for canvas boundaries...")

    # Use the same olive scan as auto-detection - it's robust
    if NUMPY_AVAILABLE:
        arr = np.array(screenshot)
        olive = np.array(OLIVE_COLOR)
        diff = np.abs(arr.astype(int) - olive).sum(axis=2)
        mask = diff < OLIVE_TOLERANCE
        rows_with_olive = np.any(mask, axis=1)
        cols_with_olive = np.any(mask, axis=0)
        row_indices = np.where(rows_with_olive)[0]
        col_indices = np.where(cols_with_olive)[0]
        if len(row_indices) == 0 or len(col_indices) == 0:
            return None
        top, bottom = int(row_indices[0]), int(row_indices[-1])
        left, right = int(col_indices[0]), int(col_indices[-1])
    else:
        # Pure Python fallback - scan and find olive pixel bounds
        left, right = width, 0
        top, bottom = height, 0
        for y in range(height):
            for x in range(width):
                if is_olive_pixel(*px[x, y][:3]):
                    if x < left: left = x
                    if x > right: right = x
                    if y < top: top = y
                    if y > bottom: bottom = y
        if left > right or top > bottom:
            return None

    canvas_w = right - left + 1
    canvas_h = bottom - top + 1

    if verbose:
        print(f"  Detected canvas: x=[{left}, {right}], y=[{top}, {bottom}]")
        print(f"  Size: {canvas_w}x{canvas_h}")

    if canvas_w < 500 or canvas_h < 400:
        if verbose:
            print(f"  Region too small - detection failed.")
        return None

    return (left, top)


# ============================================================================
# CALIBRATION FLOW
# ============================================================================

def calibrate():
    """
    Three-tier calibration:
      1. Try auto-detection (no clicks needed — just press ENTER)
      2. Fall back to click-anywhere mode (click anywhere inside the canvas)
      3. Last resort: click the top-left corner of the canvas
    Returns (x, y) screen coordinates of the canvas top-left corner.
    """
    print("\n" + "=" * 60)
    print("CALIBRATION")
    print("=" * 60)

    if not PIL_AVAILABLE:
        print("\n  Pillow is not installed (pip install pillow).")
        print("  Auto-detection is disabled. Using manual corner-click mode.")
        return calibrate_manual_corner()

    if not NUMPY_AVAILABLE:
        print("\n  numpy is not installed (pip install numpy).")
        print("  Auto-detection will be slower but should still work.")

    # --- TIER 1: AUTO-DETECTION ---
    print("\n--- TIER 1: Auto-detection ---")
    print("Make sure the game is open in your browser and the canvas is visible.")
    print("(The start screen, gameplay, or any state with the canvas visible will work.)")
    print()
    print("Press ENTER to scan for the canvas automatically,")
    print("or press 'S' to skip to click-anywhere mode.")

    key_pressed = []

    def on_press(key):
        try:
            key_pressed.append(key.char.lower())
        except AttributeError:
            if key == keyboard.Key.enter:
                key_pressed.append('enter')
            elif key == keyboard.Key.esc:
                key_pressed.append('esc')
        return False

    with keyboard.Listener(on_press=on_press) as listener:
        listener.join(timeout=20.0)

    if not key_pressed:
        print("  Timed out. Moving to click-anywhere mode.")
        return calibrate_click_anywhere()

    if key_pressed[0] == 's':
        print("  Skipping auto-detection.")
        return calibrate_click_anywhere()

    if key_pressed[0] == 'esc':
        print("  Cancelled.")
        sys.exit(0)

    # Take screenshot and try to find canvas
    print("\n  Scanning screen for the canvas...")
    result = find_canvas_auto(verbose=True)
    if result:
        print(f"\n  ✓ Canvas found at screen position ({result[0]}, {result[1]})")
        return result
    print("\n  ✗ Auto-detection failed (canvas not found on screen).")

    # --- TIER 2: CLICK ANYWHERE ---
    return calibrate_click_anywhere()


def calibrate_click_anywhere():
    """Ask the user to click anywhere inside the canvas."""
    print("\n--- TIER 2: Click anywhere inside the canvas ---")
    print("Click ANYWHERE inside the canvas (the dark/olive play area).")
    print("You don't need to click the exact corner — just somewhere")
    print("inside the canvas will work.")
    print(f"You have {CALIBRATION_TIMEOUT} seconds.")

    clicked_position = []

    def on_click(x, y, button, pressed):
        if pressed and button == Button.left:
            clicked_position.append((x, y))
            return False

    with mouse.Listener(on_click=on_click) as listener:
        listener.join(timeout=CALIBRATION_TIMEOUT)

    if not clicked_position:
        print("ERROR: Calibration timed out.")
        sys.exit(1)

    cx, cy = clicked_position[0]
    print(f"\n  Click recorded at ({cx}, {cy}). Analyzing screenshot...")

    result = find_canvas_from_click(cx, cy, verbose=True)
    if result:
        print(f"\n  ✓ Canvas detected: top-left at ({result[0]}, {result[1]})")
        return result

    print("\n  ✗ Could not detect canvas boundaries from click.")
    print("  Falling back to manual corner-click mode.")

    # --- TIER 3: CORNER CLICK ---
    return calibrate_manual_corner()


def calibrate_manual_corner():
    """Last resort: ask user to click the top-left corner of the canvas."""
    print("\n--- TIER 3: Click the top-left corner ---")
    print("Click on the TOP-LEFT CORNER of the canvas.")
    print("  - The canvas is the 1000x800 dark/olive play area.")
    print("  - Click the very top-left pixel of that area.")
    print(f"  You have {CALIBRATION_TIMEOUT} seconds.")

    clicked_position = []

    def on_click(x, y, button, pressed):
        if pressed and button == Button.left:
            clicked_position.append((x, y))
            return False

    with mouse.Listener(on_click=on_click) as listener:
        listener.join(timeout=CALIBRATION_TIMEOUT)

    if not clicked_position:
        print("ERROR: Calibration timed out.")
        sys.exit(1)

    pos = clicked_position[0]
    print(f"\n  Canvas top-left corner recorded at: {pos}")
    return pos


# ============================================================================
# CLICK EXECUTION
# ============================================================================

def execute_click_sequence(canvas_origin, clicks, label=""):
    """Click each position in `clicks` (canvas coords), waiting between clicks."""
    mouse_ctrl = MouseController()
    print(f"\n--- {label} ({len(clicks)} clicks) ---")
    for i, (cx, cy) in enumerate(clicks):
        screen_x = canvas_origin[0] + cx
        screen_y = canvas_origin[1] + cy
        print(f"  click {i+1}/{len(clicks)}: canvas ({cx:4d},{cy:4d}) "
              f"-> screen ({screen_x},{screen_y})")
        mouse_ctrl.position = (screen_x, screen_y)
        time.sleep(0.1)  # let the mouse settle
        mouse_ctrl.click(Button.left, 1)
        time.sleep(BULLET_WAIT)
    print(f"  {label} complete. Waiting for level transition...")
    time.sleep(LEVEL_TRANSITION_WAIT)


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 60)
    print("  HORSE PLINKO AUTO-PLAYER (v2)")
    print("=" * 60)
    print()
    print("This script automatically plays Horse Plinko through Level 3.")
    print()
    print("Activation is now MUCH easier:")
    print("  - Auto-detection (just press ENTER, no clicks)")
    print("  - Or click ANYWHERE inside the canvas")
    print()

    if not PIL_AVAILABLE:
        print("⚠ Pillow is not installed — auto-detection is disabled.")
        print("  Install with: pip install pillow")
        print()
    elif not NUMPY_AVAILABLE:
        print("⚠ numpy is not installed — auto-detection will be slower.")
        print("  Install with: pip install numpy")
        print()

    print("Make sure the game is open in your browser with the canvas visible.")
    print()

    # Step 1: Calibrate
    canvas_origin = calibrate()

    # Step 2: Countdown
    print("\n" + "=" * 60)
    print("STARTING IN 3 SECONDS...")
    print("(Make sure your browser window is focused and visible!)")
    print("=" * 60)
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)

    # Step 3: Click "Play Game"
    mouse_ctrl = MouseController()
    px, py = canvas_origin[0] + START_CLICK[0], canvas_origin[1] + START_CLICK[1]
    print(f"\nClicking 'Play Game' at screen ({px}, {py})")
    mouse_ctrl.position = (px, py)
    time.sleep(0.1)
    mouse_ctrl.click(Button.left, 1)
    time.sleep(START_WAIT)

    # Step 4: Execute each level's click sequence
    for level_name, clicks in ALL_LEVELS:
        execute_click_sequence(canvas_origin, clicks, label=level_name)

    print("\n" + "=" * 60)
    print("  DONE! All 3 levels attempted.")
    print("=" * 60)
    print()
    print("Notes:")
    print("- The game has random bounce physics, so each run is slightly different.")
    print("- If the game ended early (ball counter hit 0), refresh and re-run.")
    print("- To adjust click timing, edit BULLET_WAIT at the top of this script.")


if __name__ == "__main__":
    main()
