// API utility functions
import {
  getSocket,
  sendDrawingPath,
  sendStopDrawing,
  setupUpdateDrawingListener,
} from "./socketUtils";

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

  console.log("Setting up socket listeners");

  // First, remove any existing listeners to prevent duplicates
  socket.off("draw");
  socket.off("load-drawing");
  socket.off("clear-canvas");
  socket.off("load-sticky-notes");
  socket.off("note-added");
  socket.off("sticky-note-deleted");
  socket.off("updateNote");

  // Set up the update-drawing listener for undo/redo operations
  setupUpdateDrawingListener(setPaths);

  // Listen for drawing data from other clients
  socket.on("draw", (path) => {
    console.log("Received draw event for path");
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
    console.log(
      "Received load-drawing event:",
      data ? `${data.paths?.length || 0} paths` : "no data"
    );

    // Always set paths, even if data.paths is undefined or null
    // This ensures we clear the cache when appropriate
    setPaths(data?.paths || []);
    drawingDataCache.paths = data?.paths || [];

    if (data && data.stickyNotes) {
      setStickyNotes(data.stickyNotes);
      drawingDataCache.stickyNotes = data.stickyNotes;
    }
  });

  // Listen for clear canvas
  socket.on("clear-canvas", () => {
    console.log("Received clear-canvas event");
    setPaths([]);
    drawingDataCache.paths = [];

    // Clear the canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  });

  // Listen for sticky note events
  socket.on("load-sticky-notes", (notes) => {
    console.log(
      "Received load-sticky-notes event:",
      notes ? notes.length : 0,
      "notes"
    );
    if (Array.isArray(notes)) {
      setStickyNotes(notes);
      drawingDataCache.stickyNotes = notes;
    }
  });

  socket.on("note-added", (note) => {
    console.log("Received note-added event:", note?.id);
    if (note && note.id) {
      setStickyNotes((prevNotes) => {
        // Avoid duplicates
        if (prevNotes.some((n) => n.id === note.id)) {
          return prevNotes;
        }
        const newNotes = [...prevNotes, note];
        drawingDataCache.stickyNotes = newNotes;
        return newNotes;
      });
    }
  });

  socket.on("sticky-note-deleted", (note) => {
    console.log("Received sticky-note-deleted event:", note?.id);
    if (note && note.id) {
      setStickyNotes((prevNotes) => {
        const newNotes = prevNotes.filter((n) => n.id !== note.id);
        drawingDataCache.stickyNotes = newNotes;
        return newNotes;
      });
    }
  });

  socket.on("updateNote", (note) => {
    console.log("Received updateNote event:", note?.id);
    if (note && note.id) {
      setStickyNotes((prevNotes) => {
        // Find the note to update
        const index = prevNotes.findIndex((n) => n.id === note.id);

        if (index === -1) return prevNotes; // Note not found

        // Create a new array with the updated note
        const newNotes = [...prevNotes];

        // Merge the update with the existing note, preserving fields not included in the update
        newNotes[index] = {
          ...newNotes[index],
          ...note,
          // If this is a position update, ensure we update the position correctly
          position: note.position
            ? {
                ...newNotes[index].position,
                ...note.position,
              }
            : newNotes[index].position,
        };

        // Update the cache
        drawingDataCache.stickyNotes = newNotes;

        return newNotes;
      });
    }
  });
};

/**
 * Send drawing data to the server
 * @param {Object} data - Drawing data including paths and sticky notes
 * @returns {Promise<void>}
 */
export const sendDrawingData = async (data) => {
  // Update the cache
  drawingDataCache = { ...drawingDataCache, ...data };

  // Send sticky note data to the server
  const socket = getSocket();

  // Send update-drawing event for paths (better for undo/redo operations)
  if (data.paths !== undefined) {
    console.log(
      "Sending update-drawing event:",
      data.paths ? `${data.paths.length} paths` : "empty paths"
    );

    // Always send a properly formatted object with paths array and source
    socket.emit("update-drawing", {
      id: "main-drawing",
      paths: data.paths || [],
      source: "client", // Add source to identify client-initiated updates
      operation: data.operation || "update", // Add operation type (undo, redo, clear, update)
    });
  }

  // Send sticky note updates
  if (data.stickyNotes && Array.isArray(data.stickyNotes)) {
    console.log(
      "Sending sticky note updates:",
      data.stickyNotes.length,
      "notes"
    );
    // For each sticky note, send an update
    data.stickyNotes.forEach((note) => {
      socket.emit("updateNote", note);
    });
  }
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

/**
 * Send a new sticky note to the server
 * @param {Object} note - The sticky note to send
 */
export const sendNewStickyNote = (note) => {
  const socket = getSocket();
  socket.emit("add-note", note);
};

/**
 * Delete a sticky note on the server
 * @param {Object} note - The sticky note to delete
 */
export const deleteStickyNoteFromServer = (note) => {
  const socket = getSocket();
  socket.emit("delete-sticky-note", note);
};
