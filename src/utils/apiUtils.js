// API utility functions
import { getSocket, sendDrawingPath, sendStopDrawing } from "./socketUtils";

// Cache for drawing data
let drawingDataCache = { paths: [], stickyNotes: [] };

/**
 * Load drawing data from the server
 * @returns {Promise<Object>} Drawing data including paths and sticky notes
 */
export const loadDrawingData = async () => {
  try {
    // Return the cached data immediately
    return drawingDataCache;
  } catch (error) {
    console.error("Error loading drawing data:", error);
    // Return empty data structure if loading fails
    return { paths: [], stickyNotes: [] };
  }
};

/**
 * Initialize socket listeners for drawing data
 * @param {Function} setPaths - Function to update paths state
 * @param {Function} setStickyNotes - Function to update sticky notes state
 * @param {Object} canvasRef - Reference to the canvas element
 */
export const initializeSocketListeners = (
  setPaths,
  setStickyNotes,
  canvasRef
) => {
  const socket = getSocket();

  // Listen for drawing data from other clients
  socket.on("draw", (path) => {
    console.log("Received drawing path:", path);

    // Update the paths state
    setPaths((prevPaths) => {
      const newPaths = [...prevPaths, path];
      drawingDataCache.paths = newPaths;
      return newPaths;
    });

    // Redraw the canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.strokeStyle = path.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(path.start.x, path.start.y);

      path.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      ctx.stroke();
    }
  });

  // Listen for load drawing data
  socket.on("load-drawing", (data) => {
    console.log("Received drawing data:", data);

    if (data && data.paths) {
      setPaths(data.paths);
      drawingDataCache.paths = data.paths;
    }

    if (data && data.stickyNotes) {
      setStickyNotes(data.stickyNotes);
      drawingDataCache.stickyNotes = data.stickyNotes;
    }
  });

  // Listen for clear canvas
  socket.on("clear-canvas", () => {
    setPaths([]);
    drawingDataCache.paths = [];

    // Clear the canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
};

/**
 * Send drawing data to the server
 * @param {Object} data - Drawing data including paths and sticky notes
 * @returns {Promise<void>}
 */
export const sendDrawingData = async (data) => {
  console.log("Syncing data:", data); // Log the data for debugging

  // Update the cache
  drawingDataCache = data;

  // For sticky notes, we'll implement this later
  // For now, we're focusing on drawing paths
};

/**
 * Send a new path to the server
 * @param {Object} path - The path to send
 */
export const sendPath = (path) => {
  sendDrawingPath(path);
};

/**
 * Send a stop drawing event to the server
 * @param {Array} paths - All drawing paths
 */
export const sendStopDrawingEvent = (paths) => {
  sendStopDrawing(paths);
};
