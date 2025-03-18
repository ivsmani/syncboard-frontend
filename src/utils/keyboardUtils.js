// Keyboard event utility functions

/**
 * Set up keyboard event listeners for spacebar (panning)
 * @param {Function} setIsSpacePressed - State setter for space pressed state
 * @returns {Function} Cleanup function to remove event listeners
 */
export const setupKeyboardEvents = (setIsSpacePressed) => {
  // Helper function to check if the event target is an input or textarea
  const isInputElement = (target) => {
    return (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable ||
      // Also check if this is a textarea within a sticky note
      target.closest(".bg-yellow-100 textarea") !== null
    );
  };

  const handleKeyDown = (e) => {
    // Check if the event target is an input element
    if (isInputElement(e.target)) {
      // Allow normal behavior for input elements
      return;
    }

    if (e.code === "Space" && !e.repeat) {
      // Prevent default scrolling behavior of spacebar
      e.preventDefault();
      setIsSpacePressed(true);
      document.body.style.cursor = "grab";
    }
  };

  const handleKeyUp = (e) => {
    // Check if the event target is an input element
    if (isInputElement(e.target)) {
      // Allow normal behavior for input elements
      return;
    }

    if (e.code === "Space") {
      // Prevent default scrolling behavior of spacebar
      e.preventDefault();
      setIsSpacePressed(false);
      document.body.style.cursor = "default";
    }
  };

  // Also prevent default on keypress to ensure it's blocked in all cases
  const handleKeyPress = (e) => {
    // Check if the event target is an input element
    if (isInputElement(e.target)) {
      // Allow normal behavior for input elements
      return;
    }

    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
    }
  };

  // Prevent spacebar from scrolling the page
  const handleWindowScroll = (e) => {
    // Check if the event target is an input element
    if (isInputElement(e.target)) {
      // Allow normal behavior for input elements
      return;
    }

    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      return false;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("keypress", handleKeyPress);
  window.addEventListener("keydown", handleWindowScroll, { passive: false });

  // Return cleanup function
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("keypress", handleKeyPress);
    window.removeEventListener("keydown", handleWindowScroll);
  };
};
