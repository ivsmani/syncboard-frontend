import StickyNote from "./StickyNote";
import { useRef, useEffect, useState } from "react";

// Define canvas dimensions as constants
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Default dimensions for sticky notes
const DEFAULT_NOTE_WIDTH = 256;
const DEFAULT_NOTE_HEIGHT = 256;

const StickyNoteContainer = ({ notes, onDeleteNote, onUpdateNote }) => {
  const containerRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const scrollableParentRef = useRef(null);
  const lastScrollOffsetRef = useRef({ x: 0, y: 0 });

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

      const newScrollOffset = {
        x: scrollableParentRef.current.scrollLeft,
        y: scrollableParentRef.current.scrollTop,
      };

      // Only update if the scroll position has actually changed
      if (
        newScrollOffset.x !== lastScrollOffsetRef.current.x ||
        newScrollOffset.y !== lastScrollOffsetRef.current.y
      ) {
        lastScrollOffsetRef.current = newScrollOffset;
        setScrollOffset(newScrollOffset);
      }
    };

    // Find the scrollable parent once and store it
    scrollableParentRef.current = findScrollableParent(containerRef.current);

    // Initial update
    updateScrollPosition();

    // Add scroll event listener to the scrollable parent
    if (scrollableParentRef.current) {
      // Use passive event listener for better performance
      scrollableParentRef.current.addEventListener(
        "scroll",
        updateScrollPosition,
        {
          passive: true,
        }
      );

      // Also listen for resize events which might affect scroll position
      window.addEventListener("resize", updateScrollPosition, {
        passive: true,
      });

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
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
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
          visiblePosition.x > -buffer - DEFAULT_NOTE_WIDTH &&
          visiblePosition.y > -buffer - DEFAULT_NOTE_HEIGHT &&
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
