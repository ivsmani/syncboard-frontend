import StickyNote from "./StickyNote";
import { useRef, useEffect, useState } from "react";

const StickyNoteContainer = ({
  notes,
  onDeleteNote,
  onUpdateNote,
  canvasDimensions,
}) => {
  const containerRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const scrollableParentRef = useRef(null);

  // Get the parent scrollable container
  useEffect(() => {
    const findScrollableParent = (element) => {
      if (!element) return null;

      let parent = element.parentElement;
      while (
        parent &&
        (getComputedStyle(parent).overflow === "visible" ||
          getComputedStyle(parent).overflow === "hidden")
      ) {
        parent = parent.parentElement;
      }
      return parent;
    };

    const updateScrollPosition = () => {
      if (!scrollableParentRef.current) return;

      setScrollOffset({
        x: scrollableParentRef.current.scrollLeft,
        y: scrollableParentRef.current.scrollTop,
      });
    };

    // Find the scrollable parent once and store it
    scrollableParentRef.current = findScrollableParent(containerRef.current);

    // Initial update
    updateScrollPosition();

    // Add scroll event listener to the scrollable parent
    if (scrollableParentRef.current) {
      scrollableParentRef.current.addEventListener(
        "scroll",
        updateScrollPosition
      );

      // Also listen for resize events which might affect scroll position
      window.addEventListener("resize", updateScrollPosition);

      return () => {
        scrollableParentRef.current.removeEventListener(
          "scroll",
          updateScrollPosition
        );
        window.removeEventListener("resize", updateScrollPosition);
      };
    }
  }, []);

  // This container uses pointer-events-none to allow clicks to pass through to the canvas
  // Each individual sticky note has pointer-events-auto to capture its own interactions
  return (
    <div
      ref={containerRef}
      className="sticky-note-container absolute inset-0 pointer-events-none z-10"
      style={{
        width:
          canvasDimensions.width > 0 ? `${canvasDimensions.width}px` : "100%",
        height:
          canvasDimensions.height > 0 ? `${canvasDimensions.height}px` : "100%",
        minWidth: "100%",
        minHeight: "100%",
      }}
    >
      {notes.map((note) => {
        // Calculate the visible position by subtracting the scroll offset
        const visiblePosition = {
          x: note.position.x - scrollOffset.x,
          y: note.position.y - scrollOffset.y,
        };

        // Only render notes that are within or near the viewport
        // This is an optimization to avoid rendering notes that are far outside the viewport
        const buffer = 500; // Buffer area around viewport to render notes
        const isNearViewport =
          visiblePosition.x > -buffer &&
          visiblePosition.y > -buffer &&
          visiblePosition.x < window.innerWidth + buffer &&
          visiblePosition.y < window.innerHeight + buffer;

        if (!isNearViewport) return null;

        return (
          <div key={note.id} className="pointer-events-auto">
            <StickyNote
              id={note.id}
              initialPosition={visiblePosition}
              initialContent={note.content}
              onDelete={onDeleteNote}
              onUpdate={onUpdateNote}
              scrollOffset={scrollOffset}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StickyNoteContainer;
