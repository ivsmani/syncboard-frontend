import Navbar from "./components/Navbar";
import ActionButtons from "./components/ActionButtons";
import { useState, useRef, useEffect, useCallback } from "react";
import InfoButton from "./components/InfoButton";
import StickyNoteContainer from "./components/StickyNoteContainer";
import UserPresence from "./components/UserPresence";

// Define canvas dimensions as constants
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Import utility functions from the index file
import {
  drawPaths,
  setupCanvas,
  handleStartDrawing,
  handleDraw,
  handleStopDrawing,
  createStickyNote,
  updateStickyNote,
  sendDrawingData,
  sendNewStickyNote,
  deleteStickyNoteFromServer,
  setupKeyboardEvents,
  initializeSocketListeners,
  initializeSocket,
  loadDrawings,
  getSocket,
  setupUserPresenceListener,
  isAnyUserDrawing,
  drawGrid,
} from "./utils";

function App() {
  const canvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000");
  const [paths, setPaths] = useState([]);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [showDrawingNotAllowed, setShowDrawingNotAllowed] = useState(false);
  const [currentlyDrawingUser, setCurrentlyDrawingUser] = useState(null);

  // History state for undo/redo functionality
  const [pathHistory, setPathHistory] = useState({
    past: [], // Stores previous states of paths
    future: [], // Stores undone states for redo
  });

  // Sticky notes state
  const [stickyNotes, setStickyNotes] = useState([]);

  // Use refs to store panning state to avoid re-renders during panning
  const panningRef = useRef({
    isPanning: false,
    isTouchPanning: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  // Grid state
  const [gridSize, setGridSize] = useState(20); // Grid cell size in pixels
  const [showGrid, setShowGrid] = useState(true); // Control grid visibility

  // Last point for throttling
  const lastPointRef = useRef({ x: 0, y: 0 });

  const activeDrawingTimeoutRef = useRef(null);

  // Stop drawing or panning when the mouse is released
  const stopDrawing = () => {
    handleStopDrawing({
      panningRef,
      isSpacePressed,
      currentTool,
      canvasRef,
      setIsDrawing,
      paths,
    });
  };

  // Add a more comprehensive touch monitoring system
  useEffect(() => {
    // Touch tracking to ensure drawing state is reset properly
    let touchTimeoutId = null;

    const handleTouchStart = () => {
      // Clear any existing timeout
      if (touchTimeoutId) {
        clearTimeout(touchTimeoutId);
        touchTimeoutId = null;
      }
    };

    const handleTouchEnd = () => {
      // If still drawing after touch end, set a timeout to force stop
      if (isDrawing) {
        // Set a short timeout to allow legitimate touchEnd events to be processed first
        touchTimeoutId = setTimeout(() => {
          console.log("Touch monitoring: Forcing drawing state cleanup");
          stopDrawing();
          touchTimeoutId = null;
        }, 100);
      }
    };

    // Add global touch event listeners that will catch ALL touch events
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    // Also monitor "pointerup" events which are more reliable on some devices
    document.addEventListener("pointerup", () => {
      if (isDrawing) {
        console.log(
          "Pointer up detected: Ensuring drawing state is cleaned up"
        );
        stopDrawing();
      }
    });

    return () => {
      // Clean up all event listeners
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
      document.removeEventListener("pointerup", handleTouchEnd);

      if (touchTimeoutId) {
        clearTimeout(touchTimeoutId);
      }
    };
  }, [isDrawing, stopDrawing]);

  // Register global error handler
  useEffect(() => {
    const originalWindowOnError = window.onerror;

    // Define custom error handler
    window.onerror = (message, source, lineno, colno, error) => {
      console.error("Global error detected:", message, error);

      // If we're currently drawing, force stop drawing
      if (isDrawing) {
        console.log("Detected error while drawing, force stopping drawing");
        stopDrawing();

        // Also try to force clear the drawing state
        const socket = getSocket();
        if (socket) {
          socket.emit("force-clear-drawing-state");
        }
      }

      // Call original error handler if it exists
      if (typeof originalWindowOnError === "function") {
        return originalWindowOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Cleanup function
    return () => {
      window.onerror = originalWindowOnError;
    };
  }, [isDrawing, stopDrawing]);

  // Add touch event handler to document to catch touch ends outside the canvas
  useEffect(() => {
    const handleDocumentTouchEnd = () => {
      if (isDrawing) {
        console.log("Touch ended outside canvas, stopping drawing");
        stopDrawing();
      }
    };

    document.addEventListener("touchend", handleDocumentTouchEnd);

    return () => {
      document.removeEventListener("touchend", handleDocumentTouchEnd);
    };
  }, [isDrawing, stopDrawing]);

  // Initialize socket connection and load existing data
  useEffect(() => {
    const setupApp = async () => {
      setIsLoading(true);

      // Initialize the socket connection
      const socket = initializeSocket();

      // Handle reconnection events
      socket.on("reconnect", () => {
        console.log("Socket reconnected, reloading data");
        loadDrawings();
      });

      // Set up socket listeners for real-time updates
      initializeSocketListeners(
        (newPaths) => {
          // When receiving paths from the server, update the local state
          // but don't add to history to avoid duplicate history entries
          console.log(
            "Setting paths from socket event:",
            newPaths ? newPaths.length : 0,
            "paths"
          );

          // Check if this is a clear operation (empty paths)
          if (newPaths.length === 0) {
            console.log("Received clear canvas operation from server");
          }

          // Update paths without affecting history
          // This is important to prevent duplicate history entries
          // when receiving updates from other clients
          setPaths(newPaths);
        },
        setStickyNotes,
        canvasRef
      );

      // Set up user presence listener with a callback for the currently drawing user
      setupUserPresenceListener((users) => {
        setConnectedUsers(users);

        // Find the user who is currently drawing, if any
        const drawingUser = users.find((user) => user.isDrawing);
        setCurrentlyDrawingUser(drawingUser || null);
      });

      // Setup drawing-not-allowed listener
      socket.on("drawing-not-allowed", () => {
        setShowDrawingNotAllowed(true);
        // Hide the notification after 3 seconds
        setTimeout(() => {
          setShowDrawingNotAllowed(false);
        }, 3000);
      });

      try {
        // Load existing drawings from the server
        await loadDrawings();
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading initial data:", error);
        setIsLoading(false);
      }
    };

    setupApp();

    // Cleanup function
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off("reconnect");
        socket.off("user-presence-update");
        socket.off("drawing-not-allowed");
      }

      // Clear any active drawing timeout
      if (activeDrawingTimeoutRef.current) {
        clearTimeout(activeDrawingTimeoutRef.current);
      }
    };
  }, []);

  // Add a safety mechanism to release drawing state after inactivity
  useEffect(() => {
    // When drawing starts, set a timeout to force stop drawing if it doesn't stop naturally
    if (isDrawing) {
      // Clear any existing timeout
      if (activeDrawingTimeoutRef.current) {
        clearTimeout(activeDrawingTimeoutRef.current);
      }

      // Set a new timeout - if drawing doesn't stop in 10 seconds, force stop it
      activeDrawingTimeoutRef.current = setTimeout(() => {
        console.log("Drawing safety timeout triggered - forcing stop drawing");
        if (isDrawing) {
          stopDrawing();
        }
      }, 10000); // 10 seconds timeout
    } else {
      // Clear the timeout when drawing stops normally
      if (activeDrawingTimeoutRef.current) {
        clearTimeout(activeDrawingTimeoutRef.current);
        activeDrawingTimeoutRef.current = null;
      }
    }

    return () => {
      // Cleanup timeout on component unmount or when dependencies change
      if (activeDrawingTimeoutRef.current) {
        clearTimeout(activeDrawingTimeoutRef.current);
      }
    };
  }, [isDrawing]);

  // Add visibility change detection to stop drawing when app loses focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isDrawing) {
        console.log("Page visibility changed - forcing stop drawing");
        stopDrawing();
      }
    };

    // Listen for visibility change events
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isDrawing]);

  // Handle keyboard events for spacebar
  useEffect(() => {
    // Use the keyboard utility to set up event listeners
    const cleanupKeyboardEvents = setupKeyboardEvents(setIsSpacePressed);

    // Return cleanup function
    return cleanupKeyboardEvents;
  }, []);

  // Set up the canvas size when the component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use the canvas utility to set up the canvas
    setupCanvas(canvas, null, gridSize, showGrid);
  }, [gridSize, showGrid]);

  // Draw paths whenever they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use requestAnimationFrame for smoother rendering
    const animationFrameId = requestAnimationFrame(() => {
      if (paths.length > 0) {
        // Draw paths if there are any
        drawPaths(canvas, paths, gridSize, showGrid);
      } else {
        // Clear the canvas if paths array is empty
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Redraw the grid if it's enabled
        if (showGrid) {
          setupCanvas(canvas, ctx, gridSize, showGrid);
        }
      }
    });

    // Clean up function
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [paths, gridSize, showGrid]);

  // Add passive touch event listeners to prevent default behavior
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // This function prevents default touch behavior like scrolling
    const preventDefaultTouch = (e) => {
      // Allow default behavior for two-finger gestures when not in pen mode
      if (e.touches && e.touches.length === 2) {
        // Don't prevent default for two-finger gestures
        return;
      }

      if (currentTool === "pen") {
        e.preventDefault();
      }
    };

    // Add the event listener with passive: false to allow preventDefault
    canvas.addEventListener("touchstart", preventDefaultTouch, {
      passive: false,
    });
    canvas.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });
    canvas.addEventListener("touchend", preventDefaultTouch, {
      passive: false,
    });

    // Clean up the event listeners
    return () => {
      canvas.removeEventListener("touchstart", preventDefaultTouch);
      canvas.removeEventListener("touchmove", preventDefaultTouch);
      canvas.removeEventListener("touchend", preventDefaultTouch);
    };
  }, [currentTool, canvasRef]);

  // Handle canvas click for different tools
  const handleCanvasClick = (e) => {
    if (currentTool === "sticky") {
      // Create a new sticky note at the click position using the utility function
      const newNote = createStickyNote(e, containerRef);

      // Update local state
      setStickyNotes((prevNotes) => [...prevNotes, newNote]);

      // Send the new sticky note to the server for real-time sync
      sendNewStickyNote(newNote);

      // Reset the current tool after creating a sticky note
      setCurrentTool("");
    }
  };

  // Start drawing or panning on the canvas
  const startDrawing = (e) => {
    // Check if anyone is drawing and show notification if needed
    if (currentTool === "pen" && isAnyUserDrawing()) {
      setShowDrawingNotAllowed(true);
      // Hide the notification after 3 seconds
      setTimeout(() => {
        setShowDrawingNotAllowed(false);
      }, 3000);
    }

    handleStartDrawing(e, {
      isSpacePressed,
      panningRef,
      currentTool,
      canvasRef,
      currentColor,
      setPaths: (newPathsFn) => {
        // Call the original setPaths function
        setPaths((prevPaths) => {
          const updatedPaths = newPathsFn(prevPaths);

          // If we're starting a new drawing, save the current state to history
          if (updatedPaths.length > prevPaths.length) {
            setPathHistory((history) => ({
              past: [...history.past, prevPaths],
              future: [], // Clear future when a new action is performed
            }));
          }

          return updatedPaths;
        });
      },
      setIsDrawing,
      lastPointRef,
      handleCanvasClick,
      containerRef,
    });
  };

  // Draw or pan on the canvas as the mouse moves
  const draw = (e) => {
    handleDraw(e, {
      panningRef,
      isSpacePressed,
      isDrawing,
      currentTool,
      lastPointRef,
      paths,
      setPaths,
      currentColor,
      canvasRef,
      containerRef,
      gridSize,
      showGrid,
    });
  };

  // Handle sticky note updates
  const handleUpdateStickyNote = (id, updates) => {
    // Use the sticky note utility to update the note
    setStickyNotes((prevNotes) => updateStickyNote(prevNotes, id, updates));

    // Send updated sticky notes to server (for sync)
    sendDrawingData({
      paths,
      stickyNotes: updateStickyNote(stickyNotes, id, updates),
    });
  };

  // Handle sticky note deletion
  const handleDeleteStickyNote = (id) => {
    // Find the note to delete
    const noteToDelete = stickyNotes.find((note) => note.id === id);
    if (!noteToDelete) return;

    // Use the sticky note utility to update local state
    setStickyNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

    // Send delete event to server for sync
    deleteStickyNoteFromServer(noteToDelete);
  };

  // Handle undo action
  const handleUndo = () => {
    if (pathHistory.past.length === 0) return; // Nothing to undo

    // Get the last state from past
    const previous = pathHistory.past[pathHistory.past.length - 1];
    const newPast = pathHistory.past.slice(0, pathHistory.past.length - 1);

    // Update history
    setPathHistory({
      past: newPast,
      future: [paths, ...pathHistory.future],
    });

    // Update paths
    setPaths(previous);

    // Sync with server - ensure we're sending a complete drawing object
    console.log("Syncing undo operation with server");
    sendDrawingData({
      paths: previous,
      stickyNotes,
      operation: "undo", // Specify the operation type
    });
  };

  // Handle redo action
  const handleRedo = () => {
    if (pathHistory.future.length === 0) return; // Nothing to redo

    // Get the first state from future
    const next = pathHistory.future[0];
    const newFuture = pathHistory.future.slice(1);

    // Update history
    setPathHistory({
      past: [...pathHistory.past, paths],
      future: newFuture,
    });

    // Update paths
    setPaths(next);

    // Sync with server - ensure we're sending a complete drawing object
    console.log("Syncing redo operation with server");
    sendDrawingData({
      paths: next,
      stickyNotes,
      operation: "redo", // Specify the operation type
    });
  };

  // Handle clear canvas action
  const handleClearCanvas = () => {
    // Save current state to history before clearing
    setPathHistory((history) => ({
      past: [...history.past, paths],
      future: [], // Clear future when a new action is performed
    }));

    // Clear the canvas by setting paths to empty array
    setPaths([]);

    // Get the canvas and manually clear it to ensure no artifacts remain
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Redraw the grid if it's enabled
      if (showGrid) {
        drawGrid(ctx, canvas.width, canvas.height, gridSize, showGrid);
      }
    }

    // Sync the empty paths array with the server using update-drawing
    console.log("Syncing clear canvas operation with server");
    sendDrawingData({
      paths: [],
      stickyNotes,
      operation: "clear", // Specify the operation type
    });
  };

  // Show a descriptive notification if someone else is drawing
  const getDrawingNotificationText = () => {
    if (!currentlyDrawingUser) return "Someone else is currently drawing";

    // Use the initial and first 6 characters of the ID if no name is available
    return `User ${currentlyDrawingUser.initial} is currently drawing`;
  };

  // Make stopDrawing consistent for use in event handlers
  const stopDrawingHandler = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  // Add another effect for focus/blur events
  useEffect(() => {
    const handleFocusChange = () => {
      // When the window regains focus, check if we were drawing and force cleanup if needed
      if (isDrawing) {
        console.log(
          "Window focus changed, ensuring drawing state is cleaned up"
        );
        stopDrawing();

        // Also force clear on the server
        const socket = getSocket();
        if (socket) {
          socket.emit("force-clear-drawing-state");
        }
      }
    };

    // Listen for both focus and blur events to catch all cases
    window.addEventListener("focus", handleFocusChange);
    window.addEventListener("blur", handleFocusChange);

    return () => {
      window.removeEventListener("focus", handleFocusChange);
      window.removeEventListener("blur", handleFocusChange);
    };
  }, [isDrawing, stopDrawing]);

  return (
    <main
      className="overflow-visible"
      style={{ minWidth: `${CANVAS_WIDTH}px` }}
    >
      <InfoButton connectedUsers={connectedUsers} />
      <UserPresence users={connectedUsers} />
      {showDrawingNotAllowed && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-[9999] animate-pulse">
          {getDrawingNotificationText()}
        </div>
      )}
      <div
        className="relative"
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
        }}
        ref={containerRef}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
            <div className="text-xl font-semibold">
              Loading drawing board...
            </div>
          </div>
        ) : null}
        <div
          className="relative"
          style={{
            minWidth: "100%",
            minHeight: "100%",
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        >
          <canvas
            id="syncboard-canvas"
            ref={canvasRef}
            className="absolute inset-0"
            style={{ touchAction: "none" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawingHandler}
            onMouseOut={stopDrawingHandler}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawingHandler}
            onTouchCancel={stopDrawingHandler}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawingHandler}
            onPointerLeave={stopDrawingHandler}
            onBlur={stopDrawingHandler}
          />

          {/* Sticky Notes Layer */}
          <StickyNoteContainer
            notes={stickyNotes}
            onDeleteNote={handleDeleteStickyNote}
            onUpdateNote={handleUpdateStickyNote}
          />
        </div>
      </div>
      <Navbar
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        setCurrentColor={setCurrentColor}
        currentColor={currentColor}
        gridSize={gridSize}
        setGridSize={setGridSize}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
      />
      {currentTool === "pen" && (
        <ActionButtons
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearCanvas={handleClearCanvas}
          canUndo={pathHistory.past.length > 0}
          canRedo={pathHistory.future.length > 0}
        />
      )}
    </main>
  );
}

export default App;
