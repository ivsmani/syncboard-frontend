import React from "react";

const ColorPicker = ({ isOpen, onClose, currentColor, onColorChange }) => {
  const colors = [
    "#1A1A2E", // Dark Blue
    "#16213E", // Navy Blue
    "#0F3460", // Deep Blue
    "#E94560", // Coral Red
    "#FF7700", // Bright Orange
    "#06D6A0", // Mint Green
    "#118AB2", // Teal Blue
    "#7209B7", // Purple
    "#F72585", // Hot Pink
    "#4CC9F0", // Sky Blue
  ];

  const handleColorSelect = (color) => {
    onColorChange(color);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-18 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-md border border-gray-200 grid grid-cols-5 gap-1 w-48">
      {colors.map((color) => (
        <button
          key={color}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
          style={{ backgroundColor: color }}
          onClick={() => handleColorSelect(color)}
        >
          {color === currentColor && (
            <div className="w-3 h-3 bg-white rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default ColorPicker;
