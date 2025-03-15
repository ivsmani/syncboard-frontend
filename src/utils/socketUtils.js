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

/**
 * Set up a listener for the update-drawing event
 * @param {Function} setPaths - Function to update the paths state
 */
export const setupUpdateDrawingListener = (setPaths) => {
  const socket = getSocket();

  // Remove any existing listener to prevent duplicates
  socket.off("update-drawing");

  // Listen for complete drawing updates (important for undo/redo operations)
  socket.on("update-drawing", (drawing) => {
    if (drawing && drawing.paths !== undefined) {
      const operation = drawing.operation || "update";
      const source = drawing.source || "unknown";

      console.log(
        `Received ${operation} operation from ${source}:`,
        drawing.paths ? `${drawing.paths.length} paths` : "empty drawing"
      );

      // Always update the paths state with the received paths
      // This will update the UI without affecting the history
      setPaths(drawing.paths || []);
    } else {
      console.warn("Received invalid update-drawing event:", drawing);
    }
  });
};

/**
 * Set up a listener for user presence updates
 * @param {Function} setConnectedUsers - Function to update the connected users state
 */
export const setupUserPresenceListener = (setConnectedUsers) => {
  const socket = getSocket();

  // Remove any existing listener to prevent duplicates
  socket.off("user-presence-update");

  // Listen for user presence updates
  socket.on("user-presence-update", (users) => {
    console.log(
      "Received user presence update:",
      users.length,
      "users connected"
    );
    setConnectedUsers(users);
  });
};

/**
 * Update the current user's information
 * @param {Object} userInfo - User information to update
 */
export const updateUserInfo = (userInfo) => {
  const socket = getSocket();
  socket.emit("update-user-info", userInfo);
};
