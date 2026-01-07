// src/shared/types/winLinks.ts
// Type definitions for saved win links (bet replays)

/**
 * Base user information
 */
export interface User {
  id: string;
  name: string;
  __typename?: string;
}

/**
 * Keno-specific game state
 */
export interface KenoGameState {
  drawnNumbers: number[];
  selectedNumbers: number[];
  risk: "low" | "medium" | "high" | "classic";
  __typename?: string;
}

/**
 * Third-party game provider information
 */
export interface ThirdPartyProvider {
  id: string;
  name: string;
}

/**
 * Third-party game information
 */
export interface ThirdPartyGame {
  id: string;
  name: string;
  edge: number;
  extId: string;
  provider: ThirdPartyProvider;
}

/**
 * Stake Casino/Original bet data structure (Keno, Plinko, etc.)
 */
export interface CasinoBet {
  id: string;
  active: boolean;
  payoutMultiplier: number;
  amountMultiplier?: number;
  amount: number;
  payout: number;
  updatedAt?: string;
  currency: string;
  game: string;
  user?: User;
  state?: KenoGameState; // Only present for Keno
  __typename?: string;
}

/**
 * Third-party game bet data structure
 */
export interface ThirdPartyBet {
  id: string;
  amount: number;
  currency: string;
  updatedAt: string;
  payout: number;
  payoutMultiplier: number;
  betReplay?: string;
  user: User;
  thirdPartyGame: ThirdPartyGame;
  __typename?: string;
}

/**
 * Game information (for third-party games)
 */
export interface GameInfo {
  name: string;
  icon: string;
  slug: string;
}

/**
 * Bet wrapper structure (top level)
 */
export interface BetWrapper {
  id: string;
  iid: string;
  type?: "casino" | "thirdparty";
  scope?: string;
  game?: GameInfo;
  bet: CasinoBet | ThirdPartyBet;
  __typename?: string;
}

/**
 * API response structure
 */
export interface BetApiResponse {
  data: {
    bet: BetWrapper;
  };
}

/**
 * Saved win link entry (with metadata)
 */
export interface SavedWinLink {
  id: string;
  savedAt: number;
  note?: string;
  tags?: string[];
  betData: BetWrapper;
  gameType: "casino" | "thirdparty";
  gameName: string;
  profit: number;
  multiplier: number;
}

/**
 * Type guard to check if bet is a Stake Casino/Original game bet
 */
export function isCasinoBet(bet: CasinoBet | ThirdPartyBet): bet is CasinoBet {
  return "game" in bet && typeof (bet as CasinoBet).game === "string";
}

/**
 * Type guard to check if bet is a third-party game bet
 */
export function isThirdPartyBet(
  bet: CasinoBet | ThirdPartyBet
): bet is ThirdPartyBet {
  return "thirdPartyGame" in bet;
}

/**
 * Type guard to check if a casino bet is specifically a Keno bet
 */
export function isKenoBet(bet: CasinoBet): boolean {
  return bet.game === "keno" && "state" in bet && !!bet.state;
}
