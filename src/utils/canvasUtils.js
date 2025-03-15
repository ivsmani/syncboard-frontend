// Canvas utility functions

// Define canvas dimensions as constants
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

/**
 * Draws a grid on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} gridSize - Size of grid cells
 * @param {boolean} showGrid - Whether to show the grid
 */
export const drawGrid = (ctx, width, height, gridSize, showGrid) => {
  if (!showGrid) return; // Skip drawing grid if it's disabled

  ctx.save();
  ctx.strokeStyle = "#e2e8f0"; // Medium gray color for better visibility
  ctx.lineWidth = 0.5;

  // Draw vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
};

/**
 * Draws all paths on the canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} paths - Array of path objects
 * @param {number} gridSize - Size of grid cells
 * @param {boolean} showGrid - Whether to show the grid
 */
export const drawPaths = (canvas, paths, gridSize, showGrid) => {
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Repaint background

  // Redraw the grid
  drawGrid(ctx, canvas.width, canvas.height, gridSize, showGrid);

  paths.forEach((path) => {
    if (!path.points || path.points.length === 0) return;

    ctx.strokeStyle = path.color; // Set color for the path
    ctx.lineWidth = 2.5; // Slightly thicker lines for better visibility
    ctx.lineCap = "round"; // Round line caps for smoother appearance
    ctx.lineJoin = "round"; // Round line joins for smoother appearance

    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.beginPath();
    ctx.moveTo(path.start.x, path.start.y);

    // If we have enough points, use bezier curves for smoother lines
    if (path.points.length > 1) {
      // Draw a curve between each point, using the midpoints as control points
      for (let i = 0; i < path.points.length - 1; i++) {
        const p1 = path.points[i];
        const p2 = path.points[i + 1];

        // Calculate the midpoint
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Use quadratic curve to the midpoint
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }

      // For the last point
      const lastPoint = path.points[path.points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    } else {
      // If we only have one point, just draw a line to it
      path.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
    }

    ctx.stroke();
  });
};

/**
 * Check if the device supports touch events
 * @returns {boolean} True if touch is supported
 */
export const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Sets up the canvas with the correct dimensions and initial state
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {CanvasRenderingContext2D} ctx - Canvas context (optional)
 * @param {number} gridSize - Size of grid cells
 * @param {boolean} showGrid - Whether to show the grid
 */
export const setupCanvas = (canvas, ctx, gridSize, showGrid) => {
  if (!canvas) return;

  // Get the canvas context if not provided
  ctx = ctx || canvas.getContext("2d", { alpha: false });

  // Set canvas dimensions to match the defined constants
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Optimize canvas for touch devices
  if (isTouchDevice()) {
    // Increase the line width slightly for touch devices for better visibility
    ctx.lineWidth = 3;

    // Set higher precision for touch devices
    canvas.style.touchAction = "none";
  } else {
    ctx.lineWidth = 2.5;
  }

  // Set initial canvas state
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the grid
  drawGrid(ctx, canvas.width, canvas.height, gridSize, showGrid);
};
