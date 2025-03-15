// Sticky note utility functions
import { v4 as uuidv4 } from "uuid";

// Define canvas dimensions as constants
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Define sticky note dimensions - match the w-64 and h-64 classes (16rem = 256px)
const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 256;

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

  // Calculate absolute position on the canvas (including scroll offset)
  let posX = e.nativeEvent.offsetX + scrollLeft;
  let posY = e.nativeEvent.offsetY + scrollTop;

  // Apply boundary limits to keep the note within the canvas
  // Ensure the note stays completely within the canvas boundaries
  posX = Math.max(0, Math.min(CANVAS_WIDTH - NOTE_WIDTH, posX));
  posY = Math.max(0, Math.min(CANVAS_HEIGHT - NOTE_HEIGHT, posY));

  // Return the absolute position on the canvas (not affected by scroll)
  return {
    id: uuidv4(),
    position: {
      x: posX,
      y: posY,
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
