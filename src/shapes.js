// src/shapes.js
// Shape-based number generation for Keno board (8x5 grid)

/**
 * Keno board layout:
 * Row 1:  1  2  3  4  5  6  7  8
 * Row 2:  9 10 11 12 13 14 15 16
 * Row 3: 17 18 19 20 21 22 23 24
 * Row 4: 25 26 27 28 29 30 31 32
 * Row 5: 33 34 35 36 37 38 39 40
 */

/**
 * Get row and column for a number (1-40)
 */
function getPosition(num) {
  const row = Math.floor((num - 1) / 8);
  const col = (num - 1) % 8;
  return { row, col };
}

/**
 * Get number from row and column
 */
function getNumber(row, col) {
  if (row < 0 || row > 4 || col < 0 || col > 7) return null;
  return row * 8 + col + 1;
}

/**
 * Shape definitions as relative offsets from center
 * Each shape is { name, emoji, offsets: [{dRow, dCol}] }
 */
const SHAPE_DEFINITIONS = {
  plus: {
    name: 'Plus',
    emoji: '➕',
    offsets: [
      { dRow: 0, dCol: 0 },   // center
      { dRow: -1, dCol: 0 },  // up
      { dRow: 1, dCol: 0 },   // down
      { dRow: 0, dCol: -1 },  // left
      { dRow: 0, dCol: 1 }    // right
    ]
  },
  cross: {
    name: 'Cross',
    emoji: '✖️',
    offsets: [
      { dRow: 0, dCol: 0 },   // center
      { dRow: -1, dCol: -1 }, // up-left
      { dRow: -1, dCol: 1 },  // up-right
      { dRow: 1, dCol: -1 },  // down-left
      { dRow: 1, dCol: 1 }    // down-right
    ]
  },
  lShape: {
    name: 'L-Shape',
    emoji: '🔲',
    offsets: [
      { dRow: 0, dCol: 0 },   // corner
      { dRow: -1, dCol: 0 },  // up
      { dRow: -2, dCol: 0 },  // up more
      { dRow: 0, dCol: 1 },   // right
      { dRow: 0, dCol: 2 }    // right more
    ]
  },
  tShape: {
    name: 'T-Shape',
    emoji: '🅣',
    offsets: [
      { dRow: 0, dCol: 0 },   // center of T top
      { dRow: 0, dCol: -1 },  // left
      { dRow: 0, dCol: 1 },   // right
      { dRow: 1, dCol: 0 },   // down
      { dRow: 2, dCol: 0 }    // down more
    ]
  },
  cShape: {
    name: 'C-Shape',
    emoji: '🌙',
    offsets: [
      { dRow: 0, dCol: 0 },   // top-left
      { dRow: 0, dCol: 1 },   // top-right
      { dRow: 1, dCol: 0 },   // middle-left
      { dRow: 2, dCol: 0 },   // bottom-left
      { dRow: 2, dCol: 1 }    // bottom-right
    ]
  },
  square: {
    name: 'Square',
    emoji: '⬛',
    offsets: [
      { dRow: 0, dCol: 0 },   // top-left
      { dRow: 0, dCol: 1 },   // top-right
      { dRow: 1, dCol: 0 },   // bottom-left
      { dRow: 1, dCol: 1 },   // bottom-right
      { dRow: 0, dCol: 2 }    // extra to make 5
    ]
  },
  lineHorizontal: {
    name: 'Horizontal Line',
    emoji: '➖',
    offsets: [
      { dRow: 0, dCol: 0 },
      { dRow: 0, dCol: 1 },
      { dRow: 0, dCol: 2 },
      { dRow: 0, dCol: 3 },
      { dRow: 0, dCol: 4 }
    ]
  },
  lineVertical: {
    name: 'Vertical Line',
    emoji: '|',
    offsets: [
      { dRow: 0, dCol: 0 },
      { dRow: 1, dCol: 0 },
      { dRow: 2, dCol: 0 },
      { dRow: 3, dCol: 0 },
      { dRow: 4, dCol: 0 }
    ]
  },
  diagonalDown: {
    name: 'Diagonal ↘',
    emoji: '↘️',
    offsets: [
      { dRow: 0, dCol: 0 },
      { dRow: 1, dCol: 1 },
      { dRow: 2, dCol: 2 },
      { dRow: 3, dCol: 3 },
      { dRow: 4, dCol: 4 }
    ]
  },
  diagonalUp: {
    name: 'Diagonal ↗',
    emoji: '↗️',
    offsets: [
      { dRow: 4, dCol: 0 },
      { dRow: 3, dCol: 1 },
      { dRow: 2, dCol: 2 },
      { dRow: 1, dCol: 3 },
      { dRow: 0, dCol: 4 }
    ]
  },
  zigzag: {
    name: 'Zigzag',
    emoji: '⚡',
    offsets: [
      { dRow: 0, dCol: 0 },
      { dRow: 1, dCol: 1 },
      { dRow: 1, dCol: 2 },
      { dRow: 2, dCol: 3 },
      { dRow: 2, dCol: 4 }
    ]
  },
  arrow: {
    name: 'Arrow',
    emoji: '➡️',
    offsets: [
      { dRow: 0, dCol: 2 },   // tip
      { dRow: 0, dCol: 1 },   // shaft
      { dRow: 0, dCol: 0 },   // shaft
      { dRow: -1, dCol: 2 },  // top wing
      { dRow: 1, dCol: 2 }    // bottom wing
    ]
  }
};

/**
 * Check if a shape can fit at a given center position
 */
function canShapeFit(centerRow, centerCol, offsets) {
  for (const offset of offsets) {
    const row = centerRow + offset.dRow;
    const col = centerCol + offset.dCol;
    if (row < 0 || row > 4 || col < 0 || col > 7) {
      return false;
    }
  }
  return true;
}

/**
 * Generate numbers for a shape at a given position
 */
function generateShape(centerRow, centerCol, offsets) {
  const numbers = [];
  for (const offset of offsets) {
    const row = centerRow + offset.dRow;
    const col = centerCol + offset.dCol;
    const num = getNumber(row, col);
    if (num) numbers.push(num);
  }
  return numbers.sort((a, b) => a - b);
}

/**
 * Get all valid positions for a shape
 */
function getValidPositions(offsets) {
  const validPositions = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      if (canShapeFit(row, col, offsets)) {
        validPositions.push({ row, col });
      }
    }
  }
  return validPositions;
}

/**
 * Generate shape-based predictions
 * @param {number} count - Number of predictions (will try to match with shape size)
 * @returns {Array} Array of numbers forming a shape
 */
export function getShapePredictions(count = 5) {
  // Filter shapes that match the requested count
  const availableShapes = Object.entries(SHAPE_DEFINITIONS).filter(
    ([key, shape]) => shape.offsets.length === count
  );

  // If no exact match, use any shape and adjust
  if (availableShapes.length === 0) {
    console.warn('[Shapes] No shapes with exactly', count, 'numbers, using any available shape');
    const allShapes = Object.entries(SHAPE_DEFINITIONS);
    const [shapeKey, shape] = allShapes[Math.floor(Math.random() * allShapes.length)];
    return adjustShapeToCount(shapeKey, shape, count);
  }

  // Pick a random shape from matching shapes
  const [shapeKey, shape] = availableShapes[Math.floor(Math.random() * availableShapes.length)];

  // Get all valid positions for this shape
  const validPositions = getValidPositions(shape.offsets);

  if (validPositions.length === 0) {
    console.error('[Shapes] No valid positions for shape:', shape.name);
    return [];
  }

  // Pick a random valid position
  const position = validPositions[Math.floor(Math.random() * validPositions.length)];

  // Generate the shape
  const numbers = generateShape(position.row, position.col, shape.offsets);

  console.log(`[Shapes] Generated ${shape.emoji} ${shape.name} at position (${position.row}, ${position.col}):`, numbers);

  // Store last shape info for UI display
  if (typeof window !== 'undefined') {
    window.__keno_lastShapeInfo = {
      name: shape.name,
      emoji: shape.emoji,
      numbers: numbers
    };
  }

  return numbers;
}

/**
 * Adjust shape to match desired count by adding/removing numbers
 */
function adjustShapeToCount(shapeKey, shape, targetCount) {
  const validPositions = getValidPositions(shape.offsets);
  if (validPositions.length === 0) return [];

  const position = validPositions[Math.floor(Math.random() * validPositions.length)];
  let numbers = generateShape(position.row, position.col, shape.offsets);

  // If we need more numbers, add adjacent ones
  if (numbers.length < targetCount) {
    const needed = targetCount - numbers.length;
    const adjacent = getAdjacentNumbers(numbers);
    const toAdd = adjacent.filter(n => !numbers.includes(n)).slice(0, needed);
    numbers = [...numbers, ...toAdd].sort((a, b) => a - b);
  }
  // If we have too many, trim
  else if (numbers.length > targetCount) {
    numbers = numbers.slice(0, targetCount);
  }

  console.log(`[Shapes] Adjusted ${shape.emoji} ${shape.name} to ${targetCount} numbers:`, numbers);

  if (typeof window !== 'undefined') {
    window.__keno_lastShapeInfo = {
      name: shape.name + ' (adjusted)',
      emoji: shape.emoji,
      numbers: numbers
    };
  }

  return numbers;
}

/**
 * Get numbers adjacent to a set of numbers
 */
function getAdjacentNumbers(numbers) {
  const adjacent = new Set();
  const offsets = [
    { dRow: -1, dCol: 0 }, { dRow: 1, dCol: 0 },
    { dRow: 0, dCol: -1 }, { dRow: 0, dCol: 1 }
  ];

  for (const num of numbers) {
    const pos = getPosition(num);
    for (const offset of offsets) {
      const newNum = getNumber(pos.row + offset.dRow, pos.col + offset.dCol);
      if (newNum && !numbers.includes(newNum)) {
        adjacent.add(newNum);
      }
    }
  }

  return Array.from(adjacent);
}

/**
 * Get all available shapes info
 */
export function getAllShapes() {
  return Object.entries(SHAPE_DEFINITIONS).map(([key, shape]) => ({
    key,
    name: shape.name,
    emoji: shape.emoji,
    size: shape.offsets.length
  }));
}
