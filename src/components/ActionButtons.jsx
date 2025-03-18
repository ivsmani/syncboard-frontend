import {
  ArrowCounterClockwise,
  ArrowClockwise,
  Eraser,
} from "@phosphor-icons/react";

// Simple Tooltip component
const Tooltip = ({ text, children }) => {
  return (
    <div className="group relative flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {text}
      </div>
    </div>
  );
};

const ActionButtons = ({ onUndo, onRedo, onClearCanvas, canUndo, canRedo }) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 h-12 bg-white border border-gray-200 rounded-md flex items-center px-1 space-x-1">
      <Tooltip text="Undo last action">
        <button
          type="button"
          className={`p-2 rounded-md ${
            canUndo
              ? "bg-white border border-gray-200 hover:bg-gray-50"
              : "bg-gray-100 cursor-not-allowed"
          }`}
          onClick={onUndo}
          disabled={!canUndo}
        >
          <ArrowCounterClockwise
            size={24}
            weight="bold"
            color={canUndo ? "#973c00" : "#cccccc"}
          />
        </button>
      </Tooltip>
      <Tooltip text="Redo last action">
        <button
          type="button"
          className={`p-2 rounded-md ${
            canRedo
              ? "bg-white border border-gray-200 hover:bg-gray-50"
              : "bg-gray-100 cursor-not-allowed"
          }`}
          onClick={onRedo}
          disabled={!canRedo}
        >
          <ArrowClockwise
            size={24}
            weight="bold"
            color={canRedo ? "#973c00" : "#cccccc"}
          />
        </button>
      </Tooltip>
      <Tooltip text="Clear entire canvas">
        <button
          type="button"
          className="p-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50"
          onClick={onClearCanvas}
        >
          <Eraser size={24} weight="bold" color="#973c00" />
        </button>
      </Tooltip>
    </div>
  );
};

export default ActionButtons;
