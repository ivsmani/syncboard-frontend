import Navbar from "./components/Navbar";
import { useState, useRef, useEffect } from "react";
import InfoButton from "./components/InfoButton";
import StickyNoteContainer from "./components/StickyNoteContainer";
import { v4 as uuidv4 } from "uuid";

function App() {
  const canvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000");
  const [paths, setPaths] = useState([]);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const containerRef = useRef(null);

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

  // Draw grid on the canvas
  const drawGrid = (ctx, width, height, gridSize) => {
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

  // Handle keyboard events for spacebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && !isSpacePressed) {
        // Prevent default scrolling behavior of spacebar
        e.preventDefault();
        setIsSpacePressed(true);
        document.body.style.cursor = "grab";
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        // Prevent default scrolling behavior of spacebar
        e.preventDefault();
        setIsSpacePressed(false);
        panningRef.current.isPanning = false;
        document.body.style.cursor = "default";
      }
    };

    // Also prevent default on keypress to ensure it's blocked in all cases
    const handleKeyPress = (e) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, [isSpacePressed]);

  // Set up the canvas size when the component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions to be larger than most screens
    const canvasWidth = Math.max(1920, window.innerWidth);
    const canvasHeight = Math.max(1080, window.innerHeight);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Update canvas dimensions state
    setCanvasDimensions({ width: canvasWidth, height: canvasHeight });

    // Initialize canvas with a white background
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw the grid
    drawGrid(ctx, canvasWidth, canvasHeight, gridSize);
  }, [gridSize, showGrid]);

  // Load drawing data from the server
  const loadDrawingData = async () => {
    const response = await fetch("/api/drawing-data"); // Fetch drawing data
    const data = await response.json();
    setPaths(data.paths); // Update paths with loaded data
    drawPaths(data.paths); // Draw the loaded paths on the canvas

    // If there are sticky notes in the data, load them too
    if (data.stickyNotes) {
      setStickyNotes(data.stickyNotes);
    }
  };

  // Draw the paths on the canvas
  const drawPaths = (paths) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Repaint background

    // Redraw the grid
    drawGrid(ctx, canvas.width, canvas.height, gridSize);

    paths.forEach((path) => {
      ctx.strokeStyle = path.color; // Set color for the path
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(path.start.x, path.start.y);
      path.points.forEach((point) => {
        ctx.lineTo(point.x, point.y); // Draw each point in the path
      });
      ctx.stroke();
    });
  };

  useEffect(() => {
    // Load drawing data when the component mounts
    loadDrawingData();
  }, []);

  // Handle canvas click for different tools
  const handleCanvasClick = (e) => {
    if (currentTool === "sticky") {
      // Create a new sticky note at the click position
      // Calculate position relative to the canvas, accounting for scroll
      const container = containerRef.current;
      const scrollLeft = container ? container.scrollLeft : 0;
      const scrollTop = container ? container.scrollTop : 0;

      // Store the absolute position (including scroll offset)
      const newNote = {
        id: uuidv4(),
        position: {
          x: e.nativeEvent.offsetX + scrollLeft,
          y: e.nativeEvent.offsetY + scrollTop,
        },
        content: "",
      };

      setStickyNotes((prevNotes) => [...prevNotes, newNote]);
    }
  };

  // Start drawing or panning on the canvas
  const startDrawing = (e) => {
    if (isSpacePressed) {
      // Start panning - use the ref for direct manipulation
      panningRef.current.isPanning = true;
      panningRef.current.startX = e.clientX;
      panningRef.current.startY = e.clientY;
      panningRef.current.scrollLeft = containerRef.current.scrollLeft;
      panningRef.current.scrollTop = containerRef.current.scrollTop;

      document.body.style.cursor = "grabbing";
      return;
    }

    if (currentTool === "sticky") {
      // Handle sticky note creation on mousedown
      handleCanvasClick(e);
      return;
    }

    if (currentTool !== "pen") return; // Only allow drawing with the pen tool

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = currentColor; // Set the current color
    ctx.lineWidth = 2;
    ctx.beginPath();

    const startPoint = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }; // Get starting point
    ctx.moveTo(startPoint.x, startPoint.y);
    setIsDrawing(true); // Set drawing state to true

    // Create a new path for the drawing
    setPaths((prevPaths) => [
      ...prevPaths,
      { color: currentColor, start: startPoint, points: [] },
    ]);
  };

  // Draw or pan on the canvas as the mouse moves
  const draw = (e) => {
    // Use the ref for checking panning state to avoid render delays
    if (panningRef.current.isPanning && isSpacePressed) {
      // Handle panning using direct DOM manipulation
      const container = containerRef.current;
      if (!container) return;

      // Calculate how far the mouse has moved from the start position
      const dx = e.clientX - panningRef.current.startX;
      const dy = e.clientY - panningRef.current.startY;

      // Set the scroll position directly
      container.scrollLeft = panningRef.current.scrollLeft - dx;
      container.scrollTop = panningRef.current.scrollTop - dy;

      return;
    }

    if (!isDrawing || currentTool !== "pen") return; // Only draw if currently drawing with the pen

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const point = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }; // Get current point

    // Add the point to the current path
    setPaths((prevPaths) => {
      const newPaths = [...prevPaths];
      newPaths[newPaths.length - 1].points.push(point); // Add point to the last path
      return newPaths;
    });

    ctx.lineTo(point.x, point.y); // Draw line to the current point
    ctx.stroke();
  };

  // Stop drawing or panning when the mouse is released
  const stopDrawing = () => {
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
  };

  // Handle sticky note updates
  const handleUpdateStickyNote = (id, updates) => {
    // Make sure we're getting the absolute position (including scroll)
    setStickyNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );

    // Send updated sticky notes to server (for sync)
    sendDrawingData();
  };

  // Handle sticky note deletion
  const handleDeleteStickyNote = (id) => {
    setStickyNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

    // Send updated sticky notes to server (for sync)
    sendDrawingData();
  };

  // Send drawing data to the server
  const sendDrawingData = () => {
    // Include both paths and sticky notes in the data to be sent
    const drawingData = {
      paths,
      stickyNotes,
    };

    console.log("Syncing data:", drawingData); // Log the data for debugging

    // Here you would implement the actual API call to sync data
    // Example: fetch('/api/save-drawing', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(drawingData)
    // });
  };

  // Send data when paths or sticky notes change
  useEffect(() => {
    sendDrawingData();
  }, [paths, stickyNotes]);

  return (
    <main>
      <InfoButton />
      <div
        className="h-screen w-screen overflow-auto relative"
        ref={containerRef}
      >
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
