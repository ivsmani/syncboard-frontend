import { io } from "socket.io-client";

const SOCKET_URL = "http://143.198.129.20:3002";

// Create a socket instance
let socket = null;

// Track if someone is currently drawing
let isAnyoneDrawing = false;

// Keep the previous user presence state for smooth transitions
let previousUserPresence = [];

// Track last activity time for the drawing user
let lastDrawingActivity = 0;
const DRAWING_TIMEOUT = 15000; // 15 seconds of inactivity before auto-clearing drawing state

/**
 * Initialize the socket connection
 * @returns {Object} The socket instance
 */
export const initializeSocket = () => {
  if (!socket) {
    // Connect to the backend server
    socket = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    console.log("Socket connection initialized");

    // Set up connection event handlers
    socket.on("connect", () => {
      console.log("Connected to server with ID:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      // Reset drawing flag when disconnected
      isAnyoneDrawing = false;
      previousUserPresence = [];
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected to server after ${attemptNumber} attempts`);

      // Force clear any lingering drawing state on reconnection
      socket.emit("force-clear-drawing-state");
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect to server after multiple attempts");
    });

    // Listen for drawing not allowed event
    socket.on("drawing-not-allowed", () => {
      console.log("Drawing not allowed - someone else is already drawing");
      // The UI will handle this based on the isAnyoneDrawing state
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
 * Check if anyone is currently drawing
 * @returns {boolean} Whether anyone is currently drawing
 */
export const isAnyUserDrawing = () => {
  return isAnyoneDrawing;
};

/**
 * Send a drawing path to the server
 * @param {Object} path - The drawing path to send
 */
export const sendDrawingPath = (path) => {
  const socket = getSocket();

  try {
    socket.emit("draw", path);
    lastDrawingActivity = Date.now();
  } catch (error) {
    console.error("Error sending drawing path:", error);
  }
};

/**
 * Send a stop drawing event to the server
 * @param {Array} paths - All drawing paths
 */
export const sendStopDrawing = (paths) => {
  const socket = getSocket();

  try {
    socket.emit("stop-draw", { paths });
    console.log("Stop drawing event sent successfully");
  } catch (error) {
    console.error("Error sending stop drawing event:", error);

    // If there's an error, try to force clear the drawing state
    setTimeout(() => {
      try {
        socket.emit("force-clear-drawing-state");
      } catch (e) {
        console.error("Failed to clear drawing state after error:", e);
      }
    }, 1000);
  }
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

      // Handle 'clear' operations specially to ensure we completely reset the paths
      if (operation === "clear" || drawing.paths.length === 0) {
        console.log("Performing complete canvas clear");
        setPaths([]);
      } else {
        // For normal updates, use the provided paths
        setPaths(drawing.paths || []);
      }
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

    // Determine if drawing state changed
    const prevDrawingUser = previousUserPresence.find((u) => u.isDrawing);
    const currentDrawingUser = users.find((u) => u.isDrawing);

    // Check if the drawing user changed to enable smooth transitions
    const drawingUserChanged =
      (!prevDrawingUser && currentDrawingUser) ||
      (prevDrawingUser && !currentDrawingUser) ||
      (prevDrawingUser &&
        currentDrawingUser &&
        prevDrawingUser.id !== currentDrawingUser.id);

    if (drawingUserChanged) {
      console.log("Drawing user changed, enabling smooth transition");

      // Update the last activity time if there's a new drawing user
      if (currentDrawingUser) {
        lastDrawingActivity = Date.now();
      }
    }

    // Check if anyone is currently drawing
    isAnyoneDrawing = users.some((user) => user.isDrawing);

    // If someone is drawing, check for timeout
    if (isAnyoneDrawing && currentDrawingUser) {
      const inactivityTime = Date.now() - lastDrawingActivity;

      // If drawing is inactive for too long, force clear the drawing state
      if (inactivityTime > DRAWING_TIMEOUT) {
        console.log(
          `Drawing inactive for ${inactivityTime}ms, force clearing drawing state`
        );
        socket.emit("force-clear-drawing-state");
      }
    }

    // Store the current state for next comparison
    previousUserPresence = [...users];

    // Call the provided callback with the users array
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
