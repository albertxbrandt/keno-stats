// src/games/keno/generators/shapes/shapeDefinitions.ts
// Pure data: shape definitions and metadata

/**
 * Shape offset definition
 */
export interface ShapeOffset {
  dRow: number;
  dCol: number;
}

/**
 * Shape definition with visual metadata
 */
export interface ShapeDefinition {
  name: string;
  emoji: string;
  offsets: ShapeOffset[];
}

/**
 * Shape metadata for UI display
 */
export interface ShapeInfo {
  key: string;
  name: string;
  emoji: string;
  size: number;
}

/**
 * Shape definitions as relative offsets from center
 * Each shape is { name, emoji, offsets: [{dRow, dCol}] }
 *
 * Keno board layout (8x5 grid):
 * Row 1:  1  2  3  4  5  6  7  8
 * Row 2:  9 10 11 12 13 14 15 16
 * Row 3: 17 18 19 20 21 22 23 24
 * Row 4: 25 26 27 28 29 30 31 32
 * Row 5: 33 34 35 36 37 38 39 40
 */
export const SHAPE_DEFINITIONS: Record<string, ShapeDefinition> = {
  plus: {
    name: "Plus",
    emoji: "➕",
    offsets: [
      { dRow: 0, dCol: 0 }, // center
      { dRow: -1, dCol: 0 }, // up
      { dRow: 1, dCol: 0 }, // down
      { dRow: 0, dCol: -1 }, // left
      { dRow: 0, dCol: 1 }, // right
    ],
  },
  cross: {
    name: "Cross",
    emoji: "✖️",
    offsets: [
      { dRow: 0, dCol: 0 }, // center
      { dRow: -1, dCol: -1 }, // up-left
      { dRow: -1, dCol: 1 }, // up-right
      { dRow: 1, dCol: -1 }, // down-left
      { dRow: 1, dCol: 1 }, // down-right
    ],
  },
  lShape: {
    name: "L-Shape",
    emoji: "🔲",
    offsets: [
      { dRow: 0, dCol: 0 }, // corner
      { dRow: -1, dCol: 0 }, // up
      { dRow: -2, dCol: 0 }, // up more
      { dRow: 0, dCol: 1 }, // right
      { dRow: 0, dCol: 2 }, // right more
    ],
  },
  tShape: {
    name: "T-Shape",
    emoji: "🅣",
    offsets: [
      { dRow: 0, dCol: 0 }, // center of T top
      { dRow: 0, dCol: -1 }, // left
      { dRow: 0, dCol: 1 }, // right
      { dRow: 1, dCol: 0 }, // down
      { dRow: 2, dCol: 0 }, // down more
    ],
  },
  cShape: {
    name: "C-Shape",
    emoji: "🌙",
    offsets: [
      { dRow: 0, dCol: 0 }, // top-left
      { dRow: 0, dCol: 1 }, // top-right
      { dRow: 1, dCol: 0 }, // middle-left
      { dRow: 2, dCol: 0 }, // bottom-left
      { dRow: 2, dCol: 1 }, // bottom-right
    ],
  },
  square: {
    name: "Square",
    emoji: "⬛",
    offsets: [
      { dRow: 0, dCol: 0 }, // top-left
      { dRow: 0, dCol: 1 }, // top-right
      { dRow: 1, dCol: 0 }, // bottom-left
      { dRow: 1, dCol: 1 }, // bottom-right
      { dRow: 0, dCol: 2 }, // extra to make 5
    ],
  },
  lineHorizontal: {
    name: "Horizontal Line",
    emoji: "➖",
    offsets: [
      { dRow: 0, dCol: 0 },
      { dRow: 0, dCol: 1 },
      { dRow: 0, dCol: 2 },
      { dRow: 0, dCol: 3 },
      { dRow: 0, dCol: 4 },
    ],
  },
  lineVertical: {
    name: "Vertical Line",
    emoji: "|",
    offsets: [
      { dRow: 0, dCol: 0 },
      { dRow: 1, dCol: 0 },
      { dRow: 2, dCol: 0 },
      { dRow: 3, dCol: 0 },
      { dRow: 4, dCol: 0 },
    ],
  },
  diagonalDown: {
    name: "Diagonal ↘",
    emoji: "↘️",
    offsets: [
      { dRow: 0, dCol: 0 },
      { dRow: 1, dCol: 1 },
      { dRow: 2, dCol: 2 },
      { dRow: 3, dCol: 3 },
      { dRow: 4, dCol: 4 },
    ],
  },
  diagonalUp: {
    name: "Diagonal ↗",
    emoji: "↗️",
    offsets: [
      { dRow: 4, dCol: 0 },
      { dRow: 3, dCol: 1 },
      { dRow: 2, dCol: 2 },
      { dRow: 1, dCol: 3 },
      { dRow: 0, dCol: 4 },
    ],
  },
  zigzag: {
    name: "Zigzag",
    emoji: "⚡",
    offsets: [
      { dRow: 0, dCol: 0 },
      { dRow: 1, dCol: 1 },
      { dRow: 1, dCol: 2 },
      { dRow: 2, dCol: 3 },
      { dRow: 2, dCol: 4 },
    ],
  },
  arrow: {
    name: "Arrow",
    emoji: "➡️",
    offsets: [
      { dRow: 0, dCol: 2 }, // tip
      { dRow: 0, dCol: 1 }, // shaft
      { dRow: 0, dCol: 0 }, // shaft
      { dRow: -1, dCol: 2 }, // top wing
      { dRow: 1, dCol: 2 }, // bottom wing
    ],
  },
  jesus: {
    name: "Jesus Saves",
    emoji: "✝️",
    offsets: [
      // Order matters for trimming - most important parts first
      { dRow: -2, dCol: 0 }, // top
      { dRow: -1, dCol: -1 }, // left arm
      { dRow: -1, dCol: 1 }, // right arm
      { dRow: 0, dCol: 0 }, // center
      { dRow: 1, dCol: 0 }, // bottom
      { dRow: -1, dCol: 0 }, // crossing point (fills in the gap at count 6)
    ],
  },
};

/**
 * Get all available shapes info for UI display
 */
export function getAllShapes(): ShapeInfo[] {
  return Object.entries(SHAPE_DEFINITIONS).map(([key, shape]) => ({
    key,
    name: shape.name,
    emoji: shape.emoji,
    size: shape.offsets.length,
  }));
}
