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
  },
  jesus: {
    name: 'Jesus Saves',
    emoji: '✝️',
    offsets: [
      // Order matters for trimming - most important parts first
      { dRow: -2, dCol: 0 },  // top
      { dRow: -1, dCol: -1 }, // left arm
      { dRow: -1, dCol: 1 },  // right arm
      { dRow: 0, dCol: 0 },   // center
      { dRow: 1, dCol: 0 },   // bottom
      { dRow: -1, dCol: 0 }   // crossing point (fills in the gap at count 6)
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
 * @param {string} pattern - Shape pattern key or 'random' for random selection
 * @param {string} placement - Placement strategy ('random', 'hot', 'trending')
 * @param {Array} historyData - Game history for hot/trending placement
 * @returns {Array} Array of numbers forming a shape
 */
export function getShapePredictions(count = 5, pattern = 'random', placement = 'random', historyData = []) {
  let selectedShape;
  let shapeKey;

  // Select shape based on pattern parameter
  if (pattern === 'random') {
    // Filter shapes that match the requested count
    const availableShapes = Object.entries(SHAPE_DEFINITIONS).filter(
      ([key, shape]) => shape.offsets.length === count
    );

    if (availableShapes.length === 0) {
      console.warn('[Shapes] No shapes with exactly', count, 'numbers, using any available shape');
      const allShapes = Object.entries(SHAPE_DEFINITIONS);
      [shapeKey, selectedShape] = allShapes[Math.floor(Math.random() * allShapes.length)];
    } else {
      [shapeKey, selectedShape] = availableShapes[Math.floor(Math.random() * availableShapes.length)];
    }
  } else {
    // Use specific pattern
    selectedShape = SHAPE_DEFINITIONS[pattern];
    shapeKey = pattern;

    if (!selectedShape) {
      console.error('[Shapes] Invalid pattern:', pattern, '- using random');
      const allShapes = Object.entries(SHAPE_DEFINITIONS);
      [shapeKey, selectedShape] = allShapes[Math.floor(Math.random() * allShapes.length)];
    }
  }

  // Get valid positions for this shape (use full offsets for validation)
  const validPositions = getValidPositions(selectedShape.offsets);

  if (validPositions.length === 0) {
    console.error('[Shapes] No valid positions for shape:', selectedShape.name);
    return [];
  }

  // Slice offsets to match desired count (important for shapes like crucifix)
  const offsetsToUse = selectedShape.offsets.slice(0, count);

  // Select position based on placement strategy
  let position;
  switch (placement) {
    case 'hot':
      position = selectHotPosition(validPositions, offsetsToUse, historyData);
      break;
    case 'cold':
      position = selectColdPosition(validPositions, offsetsToUse, historyData);
      break;
    case 'trending':
      position = selectTrendingPosition(validPositions, offsetsToUse, historyData);
      break;
    case 'random':
    default:
      position = validPositions[Math.floor(Math.random() * validPositions.length)];
      break;
  }

  // Generate the shape at selected position using sliced offsets
  let numbers = generateShape(position.row, position.col, offsetsToUse);

  // Adjust size if needed
  if (numbers.length !== count) {
    numbers = adjustShapeSize(numbers, count);
  }

  console.log(`[Shapes] Generated ${selectedShape.emoji} ${selectedShape.name} at (${position.row}, ${position.col}) using ${placement} placement:`, numbers);

  // Store last shape info for UI display
  if (typeof window !== 'undefined') {
    window.__keno_lastShapeInfo = {
      name: selectedShape.name,
      emoji: selectedShape.emoji,
      numbers: numbers,
      placement: placement
    };
  }

  return numbers;
}

/**
 * Adjust shape to match desired count by adding/removing numbers
 */
function adjustShapeSize(numbers, targetCount) {
  if (numbers.length === targetCount) return numbers;

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

  return numbers;
}

/**
 * Select shape position covering the most frequently drawn numbers
 * @param {Array<{row: number, col: number}>} validPositions - All valid positions for shape
 * @param {Array<{dRow: number, dCol: number}>} offsets - Shape offsets from center
 * @param {Array<Object>} historyData - Game history (last 20 rounds analyzed)
 * @returns {{row: number, col: number}} Position (randomly selected from top 3 scores)
 * @description
 * 1. Counts frequency of each number 1-40 in last 20 rounds
 * 2. Scores each position by sum of frequencies of numbers in that shape placement
 * 3. Returns random pick from top 3 positions (adds variety)
 */
function selectHotPosition(validPositions, offsets, historyData) {
  if (!historyData || historyData.length === 0) {
    return validPositions[Math.floor(Math.random() * validPositions.length)];
  }

  // Count frequency of each number
  const frequency = {};
  for (let i = 1; i <= 40; i++) {
    frequency[i] = 0;
  }

  // Use last 20 rounds for hot analysis
  const recentHistory = historyData.slice(-20);
  recentHistory.forEach(round => {
    const drawn = round.kenoBet?.state?.drawnNumbers || round.drawn || [];
    drawn.forEach(num => {
      if (frequency[num] !== undefined) frequency[num]++;
    });
  });

  // Score each valid position by sum of frequencies of numbers in shape
  const scoredPositions = validPositions.map(pos => {
    const shapeNumbers = generateShape(pos.row, pos.col, offsets);
    const score = shapeNumbers.reduce((sum, num) => sum + (frequency[num] || 0), 0);
    return { ...pos, score };
  });

  // Sort by score descending and pick from top 3
  scoredPositions.sort((a, b) => b.score - a.score);
  const topPositions = scoredPositions.slice(0, 3);
  return topPositions[Math.floor(Math.random() * topPositions.length)];
}

/**
 * Select position based on cold areas (least frequently drawn numbers)
 * Strategy:
 * 1. Counts frequency of each number 1-40 in last 20 rounds
 * 2. Scores each position by sum of frequencies (LOWER is better for cold)
 * 3. Returns random pick from bottom 3 positions (adds variety)
 */
function selectColdPosition(validPositions, offsets, historyData) {
  if (!historyData || historyData.length === 0) {
    return validPositions[Math.floor(Math.random() * validPositions.length)];
  }

  // Count frequency of each number
  const frequency = {};
  for (let i = 1; i <= 40; i++) {
    frequency[i] = 0;
  }

  // Use last 20 rounds for cold analysis
  const recentHistory = historyData.slice(-20);
  recentHistory.forEach(round => {
    const drawn = round.kenoBet?.state?.drawnNumbers || round.drawn || [];
    drawn.forEach(num => {
      if (frequency[num] !== undefined) frequency[num]++;
    });
  });

  // Score each valid position by sum of frequencies of numbers in shape
  const scoredPositions = validPositions.map(pos => {
    const shapeNumbers = generateShape(pos.row, pos.col, offsets);
    const score = shapeNumbers.reduce((sum, num) => sum + (frequency[num] || 0), 0);
    return { ...pos, score };
  });

  // Sort by score ASCENDING (lowest frequency first) and pick from bottom 3
  scoredPositions.sort((a, b) => a.score - b.score);
  const coldPositions = scoredPositions.slice(0, 3);
  return coldPositions[Math.floor(Math.random() * coldPositions.length)];
}

/**
 * Select position based on trending areas (momentum-like analysis)
 */
function selectTrendingPosition(validPositions, offsets, historyData) {
  if (!historyData || historyData.length < 10) {
    return validPositions[Math.floor(Math.random() * validPositions.length)];
  }

  // Analyze recent vs baseline frequency for each position
  const recentWindow = Math.min(5, Math.floor(historyData.length / 4));
  const baselineWindow = Math.min(20, historyData.length - recentWindow);

  const recent = historyData.slice(-recentWindow);
  const baseline = historyData.slice(-(recentWindow + baselineWindow), -recentWindow);

  // Calculate frequency for recent and baseline
  const recentFreq = {};
  const baselineFreq = {};

  for (let i = 1; i <= 40; i++) {
    recentFreq[i] = 0;
    baselineFreq[i] = 0;
  }

  recent.forEach(round => {
    const drawn = round.kenoBet?.state?.drawnNumbers || round.drawn || [];
    drawn.forEach(num => {
      if (recentFreq[num] !== undefined) recentFreq[num]++;
    });
  });

  baseline.forEach(round => {
    const drawn = round.kenoBet?.state?.drawnNumbers || round.drawn || [];
    drawn.forEach(num => {
      if (baselineFreq[num] !== undefined) baselineFreq[num]++;
    });
  });

  // Calculate momentum for each number (recent/baseline ratio)
  const momentum = {};
  for (let i = 1; i <= 40; i++) {
    const baseRate = baselineFreq[i] / baselineWindow || 0.001;
    const recentRate = recentFreq[i] / recentWindow || 0;
    momentum[i] = recentRate / baseRate; // Ratio > 1 means trending up
  }

  // Score each position by momentum
  const scoredPositions = validPositions.map(pos => {
    const shapeNumbers = generateShape(pos.row, pos.col, offsets);
    const score = shapeNumbers.reduce((sum, num) => sum + (momentum[num] || 0), 0);
    return { ...pos, score };
  });

  // Sort by score descending and pick from top 3
  scoredPositions.sort((a, b) => b.score - a.score);
  const topPositions = scoredPositions.slice(0, 3);
  return topPositions[Math.floor(Math.random() * topPositions.length)];
}

/**
 * Adjust shape to match desired count (legacy function for compatibility)
 */
function adjustShapeToCount(shapeKey, shape, targetCount) {
  const validPositions = getValidPositions(shape.offsets);
  if (validPositions.length === 0) return [];

  const position = validPositions[Math.floor(Math.random() * validPositions.length)];
  let numbers = generateShape(position.row, position.col, shape.offsets);

  numbers = adjustShapeSize(numbers, targetCount);

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
