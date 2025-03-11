// Keyboard event utility functions

/**
 * Set up keyboard event listeners for spacebar (panning)
 * @param {Function} setIsSpacePressed - State setter for space pressed state
 * @returns {Function} Cleanup function to remove event listeners
 */
export const setupKeyboardEvents = (setIsSpacePressed) => {
  const handleKeyDown = (e) => {
    if (e.code === "Space" && !e.repeat) {
      // Prevent default scrolling behavior of spacebar
      e.preventDefault();
      setIsSpacePressed(true);
      document.body.style.cursor = "grab";
    }
  };

  const handleKeyUp = (e) => {
    if (e.code === "Space") {
      // Prevent default scrolling behavior of spacebar
      e.preventDefault();
      setIsSpacePressed(false);
      document.body.style.cursor = "default";
    }
  };

  // Also prevent default on keypress to ensure it's blocked in all cases
  const handleKeyPress = (e) => {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("keypress", handleKeyPress);

  // Return cleanup function
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("keypress", handleKeyPress);
  };
};
