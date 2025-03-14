import { io } from "socket.io-client";

const SOCKET_URL = "http://143.198.129.20:3002";

// Create a socket instance
let socket = null;

/**
 * Initialize the socket connection
 * @returns {Object} The socket instance
 */
export const initializeSocket = () => {
  if (!socket) {
    // Connect to the backend server
    socket = io(SOCKET_URL);

    console.log("Socket connection initialized");

    // Set up connection event handlers
    socket.on("connect", () => {
      console.log("Connected to server with ID:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });
  }

  return socket;
};

/**
 * Get the socket instance
 * @returns {Object} The socket instance
 */
export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

/**
 * Send a drawing path to the server
 * @param {Object} path - The drawing path to send
 */
export const sendDrawingPath = (path) => {
  const socket = getSocket();
  socket.emit("draw", path);
};

/**
 * Send a stop drawing event to the server
 * @param {Array} paths - All drawing paths
 */
export const sendStopDrawing = (paths) => {
  const socket = getSocket();
  socket.emit("stop-draw", { paths });
};

/**
 * Load drawing data from the server
 */
export const loadDrawings = () => {
  const socket = getSocket();
  socket.emit("load-draw");
};

/**
 * Clear the canvas
 */
export const clearCanvas = () => {
  const socket = getSocket();
  socket.emit("clear-canvas", {});
};
