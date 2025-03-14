import { useState, useRef, useEffect } from "react";
import { X } from "@phosphor-icons/react";

const StickyNote = ({
  id,
  initialPosition,
  initialContent = "",
  onDelete,
  onUpdate,
  scrollOffset,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [content, setContent] = useState(initialContent);
  const [isDragging, setIsDragging] = useState(false);
  const noteRef = useRef(null);

  // Store the initial drag start position
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Store the initial scroll offset at the start of dragging
  const initialScrollRef = useRef({ x: 0, y: 0 });

  // Store the absolute position (in canvas coordinates)
  const absolutePositionRef = useRef({
    x: initialPosition.x + scrollOffset.x,
    y: initialPosition.y + scrollOffset.y,
  });

  // Debounce timer for content updates
  const contentUpdateTimerRef = useRef(null);

  // Handle dragging
  const handleMouseDown = (e) => {
    // Prevent event from reaching the canvas
    e.stopPropagation();

    // Only start dragging if clicking on the header part, not the textarea
    if (
      e.target.classList.contains("sticky-header") ||
      e.target.closest(".sticky-header")
    ) {
      setIsDragging(true);

      // Store the current mouse position as the drag start position
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      // Store the current scroll offset at the start of dragging
      initialScrollRef.current = { ...scrollOffset };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      // Calculate the mouse movement delta from the start of the drag
      const mouseDeltaX = e.clientX - dragStartRef.current.x;
      const mouseDeltaY = e.clientY - dragStartRef.current.y;

      // Calculate the scroll delta since the start of the drag
      const scrollDeltaX = scrollOffset.x - initialScrollRef.current.x;
      const scrollDeltaY = scrollOffset.y - initialScrollRef.current.y;

      // Calculate new visible position based on the initial position, mouse movement, and scroll change
      const newVisibleX = initialPosition.x + mouseDeltaX;
      const newVisibleY = initialPosition.y + mouseDeltaY;

      // Update local position state (visible position)
      setPosition({ x: newVisibleX, y: newVisibleY });

      // Calculate the new absolute position in canvas coordinates
      // This accounts for both mouse movement and scroll changes
      const newAbsoluteX =
        absolutePositionRef.current.x + mouseDeltaX + scrollDeltaX;
      const newAbsoluteY =
        absolutePositionRef.current.y + mouseDeltaY + scrollDeltaY;

      // Update the position in the parent component with the absolute position
      onUpdate(id, {
        position: { x: newAbsoluteX, y: newAbsoluteY },
        content,
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      // Update the absolute position reference with the final position
      absolutePositionRef.current = {
        x: initialPosition.x + scrollOffset.x,
        y: initialPosition.y + scrollOffset.y,
      };

      setIsDragging(false);
    }
  };

  // Handle content changes
  const handleContentChange = (e) => {
    // Prevent event from reaching the canvas
    e.stopPropagation();

    const newContent = e.target.value;
    setContent(newContent);

    // Clear any existing timer
    if (contentUpdateTimerRef.current) {
      clearTimeout(contentUpdateTimerRef.current);
    }

    // Set a new timer to update the content after a short delay
    contentUpdateTimerRef.current = setTimeout(() => {
      // Update the content in the parent component
      onUpdate(id, {
        position: {
          x: initialPosition.x + scrollOffset.x,
          y: initialPosition.y + scrollOffset.y,
        },
        content: newContent,
      });
      contentUpdateTimerRef.current = null;
    }, 300); // 300ms debounce delay
  };

  // Handle delete
  const handleDelete = (e) => {
    // Prevent event from reaching the canvas
    e.stopPropagation();

    onDelete(id);
  };

  // Prevent click events from reaching the canvas
  const handleClick = (e) => {
    e.stopPropagation();
  };

  // Update position when initialPosition or scrollOffset changes
  useEffect(() => {
    if (!isDragging) {
      setPosition(initialPosition);
      absolutePositionRef.current = {
        x: initialPosition.x + scrollOffset.x,
        y: initialPosition.y + scrollOffset.y,
      };
    }
  }, [initialPosition, scrollOffset, isDragging]);

  // Add and remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, scrollOffset]);

  // Clean up the debounce timer when the component unmounts
  useEffect(() => {
    return () => {
      if (contentUpdateTimerRef.current) {
        clearTimeout(contentUpdateTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={noteRef}
      className="absolute shadow-md rounded-md w-64 h-64 bg-yellow-100 flex flex-col overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "default",
        zIndex: isDragging ? 100 : 10,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="sticky-header bg-yellow-200 p-2 flex justify-between items-center cursor-grab">
        <div className="text-xs text-gray-600">Sticky Note</div>
        <button
          onClick={handleDelete}
          className="text-gray-600 hover:text-red-600 focus:outline-none"
        >
          <X size={18} />
        </button>
      </div>
      <textarea
        className="flex-grow p-3 bg-yellow-100 resize-none focus:outline-none text-gray-800"
        placeholder="Type your note here..."
        value={content}
        onChange={handleContentChange}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default StickyNote;
