import { useState, useRef, useEffect } from "react";
import { X } from "@phosphor-icons/react";

// Define canvas dimensions as constants
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Default dimensions for sticky notes - match the w-64 and h-64 classes (16rem = 256px)
const DEFAULT_NOTE_WIDTH = 256;
const DEFAULT_NOTE_HEIGHT = 256;

const StickyNote = ({
  id,
  initialPosition,
  initialContent = "",
  onDelete,
  onUpdate,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [content, setContent] = useState(initialContent);
  const [isDragging, setIsDragging] = useState(false);
  const noteRef = useRef(null);

  // Store note dimensions
  const [noteDimensions, setNoteDimensions] = useState({
    width: DEFAULT_NOTE_WIDTH,
    height: DEFAULT_NOTE_HEIGHT,
  });

  // Store the initial drag start position
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Debounce timer for content updates
  const contentUpdateTimerRef = useRef(null);

  // Throttle timer for position updates during dragging
  const positionUpdateTimerRef = useRef(null);
  const POSITION_THROTTLE_DELAY = 50; // 50ms throttle for position updates

  // Track if content has been updated from external source
  const contentUpdatedExternallyRef = useRef(false);

  // Measure note dimensions once on mount
  useEffect(() => {
    if (noteRef.current) {
      const width = noteRef.current.offsetWidth;
      const height = noteRef.current.offsetHeight;
      setNoteDimensions({ width, height });
    }
  }, []);

  // Ensure existing notes stay within boundaries when loaded
  useEffect(() => {
    // Only run this once on initial load
    if (noteRef.current && !isDragging) {
      // Get the current position
      const currentX = position.x;
      const currentY = position.y;

      // Calculate the boundaries
      const maxX = CANVAS_WIDTH - noteDimensions.width;
      const maxY = CANVAS_HEIGHT - noteDimensions.height;

      // Check if the note is outside the boundaries
      if (currentX < 0 || currentX > maxX || currentY < 0 || currentY > maxY) {
        // Apply boundary constraints
        const newX = Math.max(0, Math.min(maxX, currentX));
        const newY = Math.max(0, Math.min(maxY, currentY));

        // Update the position
        setPosition({ x: newX, y: newY });

        // Notify parent of the position update
        onUpdate(id, {
          position: { x: newX, y: newY },
          content,
        });
      }
    }
  }, [noteDimensions]);

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
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      // Calculate the mouse movement delta from the start of the drag
      const mouseDeltaX = e.clientX - dragStartRef.current.x;
      const mouseDeltaY = e.clientY - dragStartRef.current.y;

      // Calculate new position
      let newX = position.x + mouseDeltaX;
      let newY = position.y + mouseDeltaY;

      // Apply boundary limits to keep the note within the canvas
      // Use the actual measured dimensions for accurate boundary calculation
      newX = Math.max(0, Math.min(CANVAS_WIDTH - noteDimensions.width, newX));
      newY = Math.max(0, Math.min(CANVAS_HEIGHT - noteDimensions.height, newY));

      // Update local position state
      setPosition({ x: newX, y: newY });

      // Update drag start position for the next move event
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      // Throttle position updates to the server to improve performance
      if (!positionUpdateTimerRef.current) {
        positionUpdateTimerRef.current = setTimeout(() => {
          // Update the position in the parent component
          onUpdate(id, {
            position: { x: newX, y: newY },
            content,
          });
          positionUpdateTimerRef.current = null;
        }, POSITION_THROTTLE_DELAY);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      // Clear any pending position update timer
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
        positionUpdateTimerRef.current = null;
      }

      // Send the final position update
      onUpdate(id, {
        position,
        content,
        isFinalPosition: true,
      });

      setIsDragging(false);
    }
  };

  // Handle content changes
  const handleContentChange = (e) => {
    // Prevent event from reaching the canvas
    e.stopPropagation();

    const newContent = e.target.value;
    setContent(newContent);

    // Send an immediate update for real-time collaboration
    onUpdate(id, {
      content: newContent,
      isContentUpdate: true, // Mark this as a content update
    });

    // Clear any existing timer
    if (contentUpdateTimerRef.current) {
      clearTimeout(contentUpdateTimerRef.current);
    }

    // Set a new timer to update the content after a short delay
    // This is for the final update that will be saved to the database
    contentUpdateTimerRef.current = setTimeout(() => {
      // Send a final content update to be saved to the database
      onUpdate(id, {
        position,
        content: newContent,
        isFinalContent: true, // Mark this as the final content update
      });
      contentUpdateTimerRef.current = null;
    }, 500); // 500ms debounce delay
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

  // Update position when initialPosition changes (from other users)
  useEffect(() => {
    if (!isDragging) {
      setPosition(initialPosition);
    }
  }, [initialPosition, isDragging]);

  // Update content when initialContent changes (from other users)
  useEffect(() => {
    // Only update if the content is different and not being edited locally
    if (initialContent !== content && !contentUpdateTimerRef.current) {
      contentUpdatedExternallyRef.current = true;
      setContent(initialContent);
    }
  }, [initialContent]);

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
  }, [isDragging, position, content]);

  // Clean up the debounce timer when the component unmounts
  useEffect(() => {
    return () => {
      if (contentUpdateTimerRef.current) {
        clearTimeout(contentUpdateTimerRef.current);
      }
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
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
