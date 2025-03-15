// Drawing utility functions
import { drawPaths } from "./canvasUtils";
import { sendPath, sendStopDrawingEvent } from "./apiUtils";

/**
 * Calculate distance between two points
 * @param {Object} point1 - First point with x, y coordinates
 * @param {Object} point2 - Second point with x, y coordinates
 * @returns {number} Distance between points
 */
export const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
};

/**
 * Get coordinates from either mouse or touch event
 * @param {Event} e - Mouse or touch event
 * @param {HTMLElement} canvas - Canvas element
 * @returns {Object} Coordinates with x, y properties
 */
export const getEventCoordinates = (e, canvas) => {
  // Check if it's a touch event
  if (e.touches && e.touches.length > 0) {
    // Get the first touch
    const touch = e.touches[0];
    // Get the bounding rectangle of the canvas
    const rect = canvas.getBoundingClientRect();
    // Calculate the touch position relative to the canvas
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      clientX: touch.clientX,
      clientY: touch.clientY,
    };
  }

  // It's a mouse event
  return {
    x: e.nativeEvent.offsetX,
    y: e.nativeEvent.offsetY,
    clientX: e.clientX,
    clientY: e.clientY,
  };
};

/**
 * Handle starting a drawing operation
 * @param {Event} e - Mouse or touch event
 * @param {Object} params - Parameters for drawing
 * @returns {Object} Updated state
 */
export const handleStartDrawing = (e, params) => {
  const {
    isSpacePressed,
    panningRef,
    currentTool,
    canvasRef,
    currentColor,
    setPaths,
    setIsDrawing,
    lastPointRef,
    handleCanvasClick,
  } = params;

  // Prevent default behavior for touch events to avoid scrolling
  if (e.touches) {
    e.preventDefault();
  }

  const canvas = canvasRef.current;
  if (!canvas) return;

  // Get coordinates from either mouse or touch event
  const coords = getEventCoordinates(e, canvas);

  if (isSpacePressed) {
    // Start panning - use the ref for direct manipulation
    panningRef.current.isPanning = true;
    panningRef.current.startX = coords.clientX;
    panningRef.current.startY = coords.clientY;
    panningRef.current.scrollLeft = params.containerRef.current.scrollLeft;
    panningRef.current.scrollTop = params.containerRef.current.scrollTop;

    document.body.style.cursor = "grabbing";
    return;
  }

  if (currentTool === "sticky") {
    // For touch events, create a simulated mouse event for sticky note creation
    const simulatedEvent = e.touches
      ? {
          clientX: coords.clientX,
          clientY: coords.clientY,
          nativeEvent: {
            offsetX: coords.x,
            offsetY: coords.y,
          },
        }
      : e;

    // Handle sticky note creation
    handleCanvasClick(simulatedEvent);
    return;
  }

  if (currentTool !== "pen") return; // Only allow drawing with the pen tool

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.strokeStyle = currentColor; // Set the current color
  ctx.lineWidth = 2.5; // Match the line width in drawPaths
  ctx.lineCap = "round"; // Round line caps for smoother appearance
  ctx.lineJoin = "round"; // Round line joins for smoother appearance

  // Enable anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.beginPath();

  const startPoint = { x: coords.x, y: coords.y }; // Get starting point
  ctx.moveTo(startPoint.x, startPoint.y);
  setIsDrawing(true); // Set drawing state to true

  // Create a new path for the drawing
  setPaths((prevPaths) => [
    ...prevPaths,
    { color: currentColor, start: startPoint, points: [] },
  ]);

  // Initialize the last point reference
  lastPointRef.current = startPoint;
};

/**
 * Handle drawing as mouse or touch moves
 * @param {Event} e - Mouse or touch event
 * @param {Object} params - Parameters for drawing
 */
export const handleDraw = (e, params) => {
  const {
    panningRef,
    isSpacePressed,
    isDrawing,
    currentTool,
    lastPointRef,
    paths,
    setPaths,
    currentColor,
    canvasRef,
    gridSize,
    showGrid,
  } = params;

  // Prevent default behavior for touch events to avoid scrolling
  if (e.touches) {
    e.preventDefault();
  }

  const canvas = canvasRef.current;
  if (!canvas) return;

  // Get coordinates from either mouse or touch event
  const coords = getEventCoordinates(e, canvas);

  // Use the ref for checking panning state to avoid render delays
  if (panningRef.current.isPanning && isSpacePressed) {
    // Handle panning using direct DOM manipulation
    const container = params.containerRef.current;
    if (!container) return;

    // Calculate how far the mouse/touch has moved from the start position
    const dx = coords.clientX - panningRef.current.startX;
    const dy = coords.clientY - panningRef.current.startY;

    // Set the scroll position directly
    container.scrollLeft = panningRef.current.scrollLeft - dx;
    container.scrollTop = panningRef.current.scrollTop - dy;

    return;
  }

  if (!isDrawing || currentTool !== "pen") return; // Only draw if currently drawing with the pen

  const currentPoint = { x: coords.x, y: coords.y }; // Get current point

  // Calculate distance from last point to implement a minimum distance threshold
  const lastPoint = lastPointRef.current;
  const distance = calculateDistance(currentPoint, lastPoint);

  // Only add points if they're a minimum distance apart (prevents too many points)
  // Use a smaller threshold for more precise curves (1.5 instead of 2)
  if (
    distance > 1.5 ||
    (paths.length > 0 && paths[paths.length - 1].points.length === 0)
  ) {
    // Add the point to the current path
    setPaths((prevPaths) => {
      const newPaths = [...prevPaths];
      if (newPaths.length > 0) {
        newPaths[newPaths.length - 1].points.push(currentPoint); // Add point to the last path

        // Send the updated path to the server
        if (newPaths.length > 0) {
          const currentPath = newPaths[newPaths.length - 1];
          sendPath(currentPath);
        }
      }
      return newPaths;
    });

    // Update last point reference
    lastPointRef.current = currentPoint;

    // Clear the canvas and redraw all paths for smoother appearance
    // This is more expensive but produces better results
    drawPaths(
      canvasRef.current,
      paths.concat([
        {
          color: currentColor,
          start: paths[paths.length - 1].start,
          points: [...paths[paths.length - 1].points, currentPoint],
        },
      ]),
      gridSize,
      showGrid
    );
  }
};

/**
 * Handle stopping a drawing operation
 * @param {Object} params - Parameters for drawing
 */
export const handleStopDrawing = (params) => {
  const {
    panningRef,
    isSpacePressed,
    currentTool,
    canvasRef,
    setIsDrawing,
    paths,
  } = params;

  if (panningRef.current.isPanning) {
    panningRef.current.isPanning = false;
    document.body.style.cursor = isSpacePressed ? "grab" : "default";
    return;
  }

  if (currentTool !== "pen") return; // Only stop drawing with the pen
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
  ctx.closePath(); // Close the current path
  setIsDrawing(false); // Set drawing state to false

  // Send the stop drawing event to the server
  if (paths && paths.length > 0) {
    sendStopDrawingEvent(paths);
  }
};
