import { PencilLine, NoteBlank } from "@phosphor-icons/react";

const Navbar = ({ currentTool, setCurrentTool }) => {
  return (
    <div className="fixed bottom-4 left-[calc(50%-82px)] z-50 h-16 bg-white border border-gray-200 rounded-md">
      <div className="grid h-full max-w-lg grid-cols-2 mx-auto divide-x divide-gray-200">
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
