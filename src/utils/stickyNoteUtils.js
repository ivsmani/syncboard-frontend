// Sticky note utility functions
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new sticky note
 * @param {Event} e - Mouse event
 * @param {Object} containerRef - Reference to the container element
 * @returns {Object} New sticky note object
 */
export const createStickyNote = (e, containerRef) => {
  // Calculate position relative to the canvas, accounting for scroll
  const container = containerRef.current;
  const scrollLeft = container ? container.scrollLeft : 0;
  const scrollTop = container ? container.scrollTop : 0;

  // Store the absolute position (including scroll offset)
  return {
    id: uuidv4(),
    position: {
      x: e.nativeEvent.offsetX + scrollLeft,
      y: e.nativeEvent.offsetY + scrollTop,
    },
    content: "",
  };
};

/**
 * Update a sticky note
 * @param {Array} notes - Array of sticky notes
 * @param {string} id - ID of the note to update
 * @param {Object} updates - Updates to apply to the note
 * @returns {Array} Updated array of sticky notes
 */
export const updateStickyNote = (notes, id, updates) => {
  return notes.map((note) => (note.id === id ? { ...note, ...updates } : note));
};

/**
 * Delete a sticky note
 * @param {Array} notes - Array of sticky notes
 * @param {string} id - ID of the note to delete
 * @returns {Array} Updated array of sticky notes with the note removed
 */
export const deleteStickyNote = (notes, id) => {
  return notes.filter((note) => note.id !== id);
};
