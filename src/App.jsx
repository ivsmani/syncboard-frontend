import Navbar from "./components/Navbar";
import { useState, useRef, useEffect } from "react";

function App() {
  const canvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000");
  const [paths, setPaths] = useState([]);

  // Set up the canvas size when the component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions to be larger than most screens
    const canvasWidth = Math.max(1920, window.innerWidth);
    const canvasHeight = Math.max(1080, window.innerHeight);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Initialize canvas with a white background
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }, []);

  // Load drawing data from the server
  const loadDrawingData = async () => {
    const response = await fetch("/api/drawing-data"); // Fetch drawing data
    const data = await response.json();
    setPaths(data.paths); // Update paths with loaded data
    drawPaths(data.paths); // Draw the loaded paths on the canvas
  };

  // Draw the paths on the canvas
  const drawPaths = (paths) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Repaint background

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

  // Start drawing on the canvas
  const startDrawing = (e) => {
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

  // Draw on the canvas as the mouse moves
  const draw = (e) => {
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

  // Stop drawing when the mouse is released
  const stopDrawing = () => {
    if (currentTool !== "pen") return; // Only stop drawing with the pen
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.closePath(); // Close the current path
    setIsDrawing(false); // Set drawing state to false
  };

  // Send drawing data to the server
  const sendDrawingData = () => {
    console.log(paths); // Log the paths for debugging
  };

  useEffect(() => {
    sendDrawingData(); // Send drawing data whenever paths change
  }, [paths]);

  return (
    <main>
      <div className="h-screen w-screen overflow-auto relative">
        <div className="min-w-full min-h-full relative">
          <canvas
            id="canvas"
            ref={canvasRef}
            className="absolute inset-0"
            style={{ touchAction: "auto" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
          />
        </div>
      </div>
      <Navbar currentTool={currentTool} setCurrentTool={setCurrentTool} />
    </main>
  );
}

export default App;
