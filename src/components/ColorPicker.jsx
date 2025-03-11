import React from "react";

const ColorPicker = ({ isOpen, onClose, currentColor, onColorChange }) => {
  const colors = [
    "#000000", // Black
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
    "#008000", // Dark Green
  ];

  const handleColorSelect = (color) => {
    onColorChange(color);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-md shadow-lg border border-gray-200 grid grid-cols-5 gap-1 w-48">
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
