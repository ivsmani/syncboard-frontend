import Navbar from "./components/Navbar";
import { useState, useRef, useEffect } from "react";
import InfoButton from "./components/InfoButton";
import StickyNoteContainer from "./components/StickyNoteContainer";

// Import utility functions from the index file
import {
  drawPaths,
  setupCanvas,
  handleStartDrawing,
  handleDraw,
  handleStopDrawing,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
  sendDrawingData,
  setupKeyboardEvents,
  initializeSocketListeners,
  initializeSocket,
  loadDrawings,
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

  // Sticky notes state
  const [stickyNotes, setStickyNotes] = useState([]);

  // Use refs to store panning state to avoid re-renders during panning
  const panningRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  // Grid state
  const [gridSize, setGridSize] = useState(20); // Grid cell size in pixels
  const [showGrid, setShowGrid] = useState(true); // Control grid visibility

  // Set up the canvas size when the component mounts
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Last point for throttling
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Initialize socket connection and load existing data
  useEffect(() => {
    const setupApp = async () => {
      setIsLoading(true);

      // Initialize the socket connection
      initializeSocket();

      // Set up socket listeners for real-time updates
      initializeSocketListeners(setPaths, setStickyNotes, canvasRef);

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
  }, []);

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
    setupCanvas(canvas, setCanvasDimensions, gridSize, showGrid);
  }, [gridSize, showGrid]);

  // Draw paths whenever they change
  useEffect(() => {
    if (canvasRef.current && paths.length > 0) {
      drawPaths(canvasRef.current, paths, gridSize, showGrid);
    }
  }, [paths, gridSize, showGrid]);

  // Handle canvas click for different tools
  const handleCanvasClick = (e) => {
    if (currentTool === "sticky") {
      // Create a new sticky note at the click position using the utility function
      const newNote = createStickyNote(e, containerRef);
      setStickyNotes((prevNotes) => [...prevNotes, newNote]);
    }
  };

  // Start drawing or panning on the canvas
  const startDrawing = (e) => {
    handleStartDrawing(e, {
      isSpacePressed,
      panningRef,
      currentTool,
      canvasRef,
      currentColor,
      setPaths,
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
    // Use the sticky note utility to delete the note
    setStickyNotes((prevNotes) => deleteStickyNote(prevNotes, id));

    // Send updated sticky notes to server (for sync)
    sendDrawingData({ paths, stickyNotes: deleteStickyNote(stickyNotes, id) });
  };

  return (
    <main>
      <InfoButton />
      <div
        className="h-screen w-screen overflow-auto relative"
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
            width: canvasDimensions.width > 0 ? canvasDimensions.width : "100%",
            height:
              canvasDimensions.height > 0 ? canvasDimensions.height : "100%",
          }}
        >
          <canvas
            id="syncboard-canvas"
            ref={canvasRef}
            className="absolute inset-0"
            style={{ touchAction: "auto" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
          />

          {/* Sticky Notes Layer */}
          <StickyNoteContainer
            notes={stickyNotes}
            onDeleteNote={handleDeleteStickyNote}
            onUpdateNote={handleUpdateStickyNote}
            canvasDimensions={canvasDimensions}
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
    </main>
  );
}

export default App;
