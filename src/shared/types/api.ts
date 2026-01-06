// src/shared/types/api.ts
// TypeScript interfaces for Keno API responses
// Used across interceptor, content, storage, and UI components

/**
 * Risk level for Keno game
 */
export type RiskLevel = "classic" | "low" | "medium" | "high";

/**
 * Currency codes supported by Stake
 */
export type CurrencyCode =
  | "btc"
  | "eth"
  | "ltc"
  | "doge"
  | "bch"
  | "xrp"
  | "trx"
  | "eos"
  | "usdt"
  | "usdc"
  | string;

/**
 * User information from API response
 */
export interface KenoUser {
  id: string;
  name: string;
}

/**
 * Game state containing drawn and selected numbers
 * NOTE: API returns 0-39 indices, we transform to 1-40 for display
 */
export interface KenoGameState {
  risk: RiskLevel;
  drawnNumbers: number[]; // API format: 0-39
  selectedNumbers: number[]; // API format: 0-39
}

/**
 * Complete Keno bet response from API
 * This is the structure we receive from the interceptor
 */
export interface KenoBetResponse {
  id: string;
  active: boolean;
  currency: CurrencyCode;
  amountMultiplier: number;
  payoutMultiplier: number;
  amount: number;
  payout: number;
  updatedAt: string; // ISO date string
  game: "keno";
  user: KenoUser;
  state: KenoGameState;
}

/**
 * Wrapper for GraphQL response (Path 1)
 */
export interface KenoGraphQLResponse {
  data: {
    kenoBet: KenoBetResponse;
  };
}

/**
 * Direct response (Path 2)
 */
export interface KenoDirectResponse {
  kenoBet: KenoBetResponse;
}

/**
 * Message payload sent from interceptor to content script
 */
export interface KenoDataMessage {
  type: "KENO_DATA_FROM_PAGE";
  payload: KenoBetResponse;
}

/**
 * Generator settings captured when bet is placed
 */
export interface GeneratorSettings {
  method: string;
  count: number;
  interval: number;
  autoRefresh: boolean;
  sampleSize: number;
  // Shapes-specific
  shapesPattern?: string;
  shapesPlacement?: string;
  // Momentum-specific
  momentumDetectionWindow?: number;
  momentumBaselineGames?: number;
  momentumThreshold?: number;
  momentumPoolSize?: number;
}

/**
 * Transformed game state with 1-40 number format
 * This is what we store in history and use in the UI
 */
export interface TransformedGameState
  extends Omit<KenoGameState, "drawnNumbers" | "selectedNumbers"> {
  drawnNumbers: number[]; // Transformed to 1-40
  selectedNumbers: number[]; // Transformed to 1-40
}

/**
 * Round data stored in history
 * Combines API response with our calculated data
 */
export interface RoundData {
  id: string;
  kenoBet: KenoBetResponse & {
    state: TransformedGameState;
  };
  generator?: GeneratorSettings;
  time: number; // Unix timestamp
}

/**
 * Event payload for ROUND_SAVED event
 * Sent to components after processing a round
 */
export interface RoundSavedEvent {
  hits: number[]; // Numbers that matched (1-40)
  misses: number[]; // Drawn numbers not selected (1-40)
  drawn: number[]; // All drawn numbers (1-40)
  selected: number[]; // All selected numbers (1-40)
}

// ============================================================================
// Mines Types
// ============================================================================

/**
 * User information from Mines API response
 */
export interface MinesUser {
  id: string;
  name: string;
}

/**
 * Single round in Mines game (one revealed tile)
 */
export interface MinesRound {
  field: number; // 0-indexed position (0-24 for 5x5 grid)
  payoutMultiplier: number;
}

/**
 * Mines game state containing revealed tiles and mine positions
 * NOTE: All positions are 0-indexed (0-24 for 5x5 grid)
 */
export interface MinesGameState {
  rounds: MinesRound[]; // All revealed safe tiles in order
  minesCount: number; // Number of mines on the board
  mines: number[]; // Mine positions (0-indexed: 0-24)
}

/**
 * Complete Mines cashout response from API
 * This is the structure we receive from the interceptor
 */
export interface MinesCashoutResponse {
  id: string;
  active: boolean;
  currency: CurrencyCode;
  amountMultiplier: number;
  payoutMultiplier: number;
  amount: number;
  payout: number;
  updatedAt: string; // ISO date string
  game: "mines";
  user: MinesUser;
  state: MinesGameState;
}

/**
 * Mines next move response from API
 * Sent after each tile click (safe or mine)
 */
export interface MinesNextResponse {
  id: string;
  active: boolean; // false if game ended (hit mine or cashed out)
  currency: CurrencyCode;
  amountMultiplier: number;
  payoutMultiplier: number;
  amount: number;
  payout: number;
  updatedAt: string; // ISO date string
  game: "mines";
  user: MinesUser;
  state: MinesGameState;
}

/**
 * Mines bet start response from API
 * Sent when player clicks "Bet" button to start round
 */
export interface MinesBetResponse {
  id: string;
  active: boolean; // true when round starts
  currency: CurrencyCode;
  amountMultiplier: number;
  payoutMultiplier: number;
  amount: number;
  payout: number;
  updatedAt: string; // ISO date string
  game: "mines";
  user: MinesUser;
  state: MinesGameState;
}

/**
 * Union type for all Mines responses
 */
export type MinesResponse = MinesCashoutResponse | MinesNextResponse | MinesBetResponse;

/**
 * Wrapper for GraphQL response (Path 1)
 */
export interface MinesGraphQLResponse {
  data: {
    minesCashout?: MinesCashoutResponse;
    minesNext?: MinesNextResponse;
    minesBet?: MinesBetResponse;
  };
}

/**
 * Direct response (Path 2)
 */
export interface MinesDirectResponse {
  minesCashout?: MinesCashoutResponse;
  minesNext?: MinesNextResponse;
  minesBet?: MinesBetResponse;
}

/**
 * Message payload sent from interceptor to content script
 */
export interface MinesDataMessage {
  type: "MINES_DATA_FROM_PAGE";
  payload: MinesResponse;
}

/**
 * Mines round data stored in history
 * Combines API response with calculated data
 */
export interface MinesRoundData {
  id: string;
  minesResponse: MinesResponse; // Store the full response
  time: number; // Unix timestamp
  // Calculated values for easy access
  revealedCount: number; // Number of tiles revealed
  finalMultiplier: number; // Final payout multiplier
  won: boolean; // Did player cash out (true) or hit mine (false)
  minesCount: number; // Number of mines in the game
  minePositions: number[]; // Where the mines were (0-indexed)
}
