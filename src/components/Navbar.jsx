import {
  PencilLine,
  NoteBlank,
  Palette,
  GridFour,
} from "@phosphor-icons/react";
import { useState } from "react";
import ColorPicker from "./ColorPicker";

const Navbar = ({
  currentTool,
  setCurrentTool,
  setCurrentColor,
  currentColor,
  gridSize,
  setGridSize,
  showGrid,
  setShowGrid,
}) => {
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [showGridControls, setShowGridControls] = useState(false);

  const handleColorChange = (color) => {
    setCurrentColor(color);
  };

  const handleGridSizeChange = (newSize) => {
    setGridSize(Number(newSize));
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  return (
    <div className="fixed bottom-8 left-[calc(50%-162px)] z-50 h-16 bg-white border border-gray-200 rounded-md">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto divide-x divide-gray-200">
        <button
          type="button"
          className={`inline-flex flex-col items-center justify-center px-2 hover:bg-gray-50 rounded-l-md cursor-pointer ${
            currentTool === "pen" ? "bg-gray-50" : ""
          }`}
          onClick={() => setCurrentTool("pen")}
        >
          <PencilLine
            size={24}
            className="mb-1 text-gray-500"
            weight={currentTool === "pen" ? "fill" : "regular"}
            color={currentTool === "pen" ? "#973c00" : "#808080"}
          />
          <span
            className={`text-xs ${
              currentTool === "pen" ? "text-amber-800" : "text-gray-400"
            }`}
          >
            Pen Tool
          </span>
        </button>
        <div className="relative">
          <button
            type="button"
            className={`inline-flex flex-col items-center justify-center px-2 hover:bg-gray-50 cursor-pointer h-full w-full`}
            onClick={() => setOpenColorPicker(!openColorPicker)}
          >
            <Palette
              size={24}
              className="mb-1"
              weight="fill"
              color={currentColor}
            />
            <span className={`text-xs text-gray-400`}>Color</span>
          </button>

          <ColorPicker
            isOpen={openColorPicker}
            onClose={() => setOpenColorPicker(false)}
            currentColor={currentColor}
            onColorChange={handleColorChange}
          />
        </div>
        <div className="relative">
          <button
            type="button"
            className={`inline-flex flex-col items-center justify-center px-2 hover:bg-gray-50 cursor-pointer h-full w-full`}
            onClick={() => setShowGridControls(!showGridControls)}
          >
            <GridFour
              size={24}
              className="mb-1 text-gray-500"
              weight={showGrid ? "fill" : "regular"}
              color={showGrid ? "#4b5563" : "#808080"}
            />
            <span className="text-xs text-gray-400">Grid</span>
          </button>

          {showGridControls && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-md shadow-lg border border-gray-200">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs text-gray-500">Show Grid</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={toggleGrid}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <span className="text-xs text-gray-500 mb-1">
                  Grid Size: {gridSize}px
                </span>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={gridSize}
                  onChange={(e) => handleGridSizeChange(e.target.value)}
                  className="w-32"
                  disabled={!showGrid}
                />
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          className={`inline-flex flex-col items-center justify-center px-2 hover:bg-gray-50 rounded-r-md cursor-pointer ${
            currentTool === "sticky" ? "bg-gray-50" : ""
          }`}
          onClick={() => setCurrentTool("sticky")}
        >
          <NoteBlank
            size={24}
            className="mb-1 text-gray-500"
            weight={currentTool === "sticky" ? "fill" : "regular"}
            color={currentTool === "sticky" ? "#973c00" : "#808080"}
          />
          <span
            className={`text-xs ${
              currentTool === "sticky" ? "text-amber-800" : "text-gray-400"
            }`}
          >
            Sticky Note
          </span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
