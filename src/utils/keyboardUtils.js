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
      target.isContentEditable
    );
  };

  const handleKeyDown = (e) => {
    console.log("handleKeyDown", e.code, isInputElement(e.target));
    if (e.code === "Space" && !e.repeat && !isInputElement(e.target)) {
      // Prevent default scrolling behavior of spacebar
      e.preventDefault();
      setIsSpacePressed(true);
      document.body.style.cursor = "grab";
    }
  };

  const handleKeyUp = (e) => {
    if (e.code === "Space" && !isInputElement(e.target)) {
      // Prevent default scrolling behavior of spacebar
      e.preventDefault();
      setIsSpacePressed(false);
      document.body.style.cursor = "default";
    }
  };

  // Also prevent default on keypress to ensure it's blocked in all cases
  const handleKeyPress = (e) => {
    if ((e.code === "Space" || e.key === " ") && !isInputElement(e.target)) {
      e.preventDefault();
    }
  };

  // Prevent spacebar from scrolling the page
  const handleWindowScroll = (e) => {
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
