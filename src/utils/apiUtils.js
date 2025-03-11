// API utility functions

/**
 * Load drawing data from the server
 * @returns {Promise<Object>} Drawing data including paths and sticky notes
 */
export const loadDrawingData = async () => {
  try {
    const response = await fetch("/api/drawing-data");
    if (!response.ok) {
      throw new Error(`Failed to load drawing data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error loading drawing data:", error);
    // Return empty data structure if loading fails
    return { paths: [], stickyNotes: [] };
  }
};

/**
 * Send drawing data to the server
 * @param {Object} data - Drawing data including paths and sticky notes
 * @returns {Promise<void>}
 */
export const sendDrawingData = async (data) => {
  console.log("Syncing data:", data); // Log the data for debugging

  // Here you would implement the actual API call to sync data
  // Example implementation:
  /*
  try {
    const response = await fetch('/api/save-drawing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save drawing data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error saving drawing data:", error);
  }
  */
};
