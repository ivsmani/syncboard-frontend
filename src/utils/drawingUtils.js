// Drawing utility functions
import { drawPaths } from "./canvasUtils";
import { sendPath, sendStopDrawingEvent } from "./apiUtils";
import { isAnyUserDrawing, getSocket } from "./socketUtils";

// Keep track of active touches to prevent issues with multi-touch
const activeTouches = new Set();

// Keep track of drawing touch ID to ensure only the original touch controls drawing
let activeDrawingTouchId = null;

// Add a maximum duration for continuous drawing to prevent stuck states
const MAX_DRAWING_DURATION = 30000; // 30 seconds
let drawingStartTime = 0;

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
 * Get the center point between two touches
 * @param {TouchList} touches - The touch list from a touch event
 * @returns {Object} Center point with clientX and clientY properties
 */
export const getTouchCenter = (touches) => {
  const touch1 = touches[0];
  const touch2 = touches[1];

  return {
    clientX: (touch1.clientX + touch2.clientX) / 2,
    clientY: (touch1.clientY + touch2.clientY) / 2,
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

  // Record drawing start time
  drawingStartTime = Date.now();

  // Track touch identifiers to handle multi-touch properly
  if (e.touches) {
    // Reset active touches on new touch start to prevent state issues
    activeTouches.clear();

    // Register all current touches
    for (let i = 0; i < e.touches.length; i++) {
      activeTouches.add(e.touches[i].identifier);

      // If this is the first touch and we're about to start drawing,
      // remember this touch ID so only this touch controls drawing
      if (i === 0 && currentTool === "pen") {
        activeDrawingTouchId = e.touches[i].identifier;
      }
    }
  }

  // Check for two-finger touch (for panning on mobile)
  if (e.touches && e.touches.length === 2) {
    e.preventDefault();

    // Start panning with two fingers
    panningRef.current.isPanning = true;
    panningRef.current.isTouchPanning = true;

    // Get the center point between the two touches
    const centerPoint = getTouchCenter(e.touches);
    panningRef.current.startX = centerPoint.clientX;
    panningRef.current.startY = centerPoint.clientY;

    // Store current scroll position
    panningRef.current.scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    panningRef.current.scrollTop =
      window.pageYOffset || document.documentElement.scrollTop;

    return;
  }

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
    panningRef.current.isTouchPanning = false;
    panningRef.current.startX = coords.clientX;
    panningRef.current.startY = coords.clientY;
    panningRef.current.scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    panningRef.current.scrollTop =
      window.pageYOffset || document.documentElement.scrollTop;

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

  // Check if anyone else is currently drawing
  if (isAnyUserDrawing()) {
    console.log("Drawing prevented: someone else is already drawing");
    return;
  }

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

  // When setting drawing to true, record the ID to help with cleanup
  if (currentTool === "pen") {
    // For pointer events, track the pointer ID
    if (e.pointerId) {
      activeDrawingTouchId = e.pointerId;
    }
    // For mouse events, use a special ID
    else if (!e.touches) {
      activeDrawingTouchId = "mouse";
    }
  }
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

  // Check for drawing timeout to prevent stuck states
  if (isDrawing && Date.now() - drawingStartTime > MAX_DRAWING_DURATION) {
    console.log("Drawing timeout exceeded, forcing stop drawing");
    handleStopDrawing({
      panningRef,
      isSpacePressed,
      currentTool: "pen", // Force it to be pen to ensure cleanup
      canvasRef,
      setIsDrawing: params.setIsDrawing,
      paths,
    });
    return;
  }

  // For touch events, verify we're still tracking the original touch
  if (e.touches && isDrawing && activeDrawingTouchId !== null) {
    let originalTouchFound = false;

    // Look for our active drawing touch ID
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeDrawingTouchId) {
        originalTouchFound = true;
        break;
      }
    }

    // If the original touch that started drawing is gone, stop drawing
    if (!originalTouchFound) {
      console.log("Original drawing touch not found, stopping drawing");
      handleStopDrawing({
        panningRef,
        isSpacePressed,
        currentTool: "pen",
        canvasRef,
        setIsDrawing: params.setIsDrawing,
        paths,
      });
      return;
    }
  }

  // For pointer events, check if this is the same pointer that started drawing
  if (
    e.pointerId &&
    isDrawing &&
    activeDrawingTouchId !== null &&
    e.pointerId !== activeDrawingTouchId
  ) {
    console.log("Different pointer ID, ignoring for drawing");
    return;
  }

  // Handle touch moves for multi-touch detection
  if (e.changedTouches && e.changedTouches.length > 0) {
    let allTouchesRegistered = true;

    // Check if all current touches were previously registered
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (!activeTouches.has(e.changedTouches[i].identifier)) {
        allTouchesRegistered = false;
        break;
      }
    }

    // If we detect touches that weren't registered on start, it might be a gesture
    // so we should stop drawing to prevent issues
    if (!allTouchesRegistered && isDrawing) {
      console.log("Detected unregistered touches, stopping drawing for safety");
      handleStopDrawing({
        panningRef,
        isSpacePressed,
        currentTool,
        canvasRef,
        setIsDrawing: () => {},
        paths,
      });
      return;
    }
  }

  // Handle two-finger panning on mobile
  if (
    e.touches &&
    e.touches.length === 2 &&
    panningRef.current.isPanning &&
    panningRef.current.isTouchPanning
  ) {
    e.preventDefault();

    // Get the center point between the two touches
    const centerPoint = getTouchCenter(e.touches);

    // Calculate how far the touch center has moved
    const dx = centerPoint.clientX - panningRef.current.startX;
    const dy = centerPoint.clientY - panningRef.current.startY;

    // Use window.scrollTo to scroll the body in both directions
    const newScrollX = panningRef.current.scrollLeft - dx;
    const newScrollY = panningRef.current.scrollTop - dy;

    window.scrollTo(newScrollX, newScrollY);

    return;
  }

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
    // Calculate how far the mouse/touch has moved from the start position
    const dx = coords.clientX - panningRef.current.startX;
    const dy = coords.clientY - panningRef.current.startY;

    // Use window.scrollTo to scroll the body in both directions
    const newScrollX = panningRef.current.scrollLeft - dx;
    const newScrollY = panningRef.current.scrollTop - dy;

    window.scrollTo(newScrollX, newScrollY);

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

  // Clear the active drawing touch ID
  activeDrawingTouchId = null;

  // Clear the active touches set
  activeTouches.clear();

  // Reset drawing start time
  drawingStartTime = 0;

  if (panningRef.current.isPanning) {
    panningRef.current.isPanning = false;
    panningRef.current.isTouchPanning = false;
    document.body.style.cursor = isSpacePressed ? "grab" : "default";
    return;
  }

  if (currentTool !== "pen") return; // Only stop drawing with the pen

  if (!canvasRef.current) {
    // If canvas is missing but we're still in drawing state, make sure to reset server state
    if (paths && paths.length > 0) {
      try {
        console.warn("Canvas missing on stopDrawing, force sending stop event");
        sendStopDrawingEvent(paths);

        // Also try to force clear the drawing state as a safety measure
        setTimeout(() => {
          const socket = getSocket();
          if (socket) {
            socket.emit("force-clear-drawing-state");
          }
        }, 1000);
      } catch (error) {
        console.error("Failed to send stop drawing event:", error);
      }
    }
    setIsDrawing(false);
    return;
  }

  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
  ctx.closePath(); // Close the current path
  setIsDrawing(false); // Set drawing state to false

  // Send the stop drawing event to the server
  if (paths && paths.length > 0) {
    console.log("Sending stop drawing event with", paths.length, "paths");
    sendStopDrawingEvent(paths);
  }

  // Add additional server notification for touch device safety
  if (currentTool === "pen") {
    try {
      const socket = getSocket();
      // Notify server that we're definitely stopping drawing (belt and suspenders)
      if (socket) {
        setTimeout(() => {
          socket.emit("ensure-drawing-stopped", { userId: socket.id });
        }, 300); // Small delay to ensure other events process first
      }
    } catch (error) {
      console.error("Error sending ensure-drawing-stopped event:", error);
    }
  }
};
