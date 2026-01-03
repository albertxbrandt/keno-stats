/**
 * Viewport utilities for UI positioning
 */

/**
 * Constrain position to viewport boundaries
 * Ensures at least minVisible pixels of the element remain accessible for dragging
 * 
 * @param {number} x - Desired x position
 * @param {number} y - Desired y position
 * @param {number} width - Element width
 * @param {number} minVisible - Minimum pixels to keep visible (default 50)
 * @returns {{x: number, y: number}} Constrained position
 */
export function constrainToViewport(x, y, width, minVisible = 50) {
  const maxX = window.innerWidth; // Allow reaching right edge
  const maxY = window.innerHeight - minVisible; // Keep at least minVisible px visible on bottom
  const minX = -(width - minVisible); // Allow dragging left but keep minVisible px visible
  const minY = 0; // Allow reaching top edge
  
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y))
  };
}
