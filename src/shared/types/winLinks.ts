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
 * Keno bet data structure
 */
export interface KenoBet {
  id: string;
  active: boolean;
  payoutMultiplier: number;
  amountMultiplier: number;
  amount: number;
  payout: number;
  updatedAt: string;
  currency: string;
  game: string;
  user: User;
  state: KenoGameState;
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
  type?: "thirdparty";
  scope?: string;
  game?: GameInfo;
  bet: KenoBet | ThirdPartyBet;
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
  gameType: "keno" | "thirdparty";
  gameName: string;
  profit: number;
  multiplier: number;
}

/**
 * Type guard to check if bet is a Keno bet
 */
export function isKenoBet(bet: KenoBet | ThirdPartyBet): bet is KenoBet {
  return "state" in bet && "selectedNumbers" in (bet as KenoBet).state;
}

/**
 * Type guard to check if bet is a third-party game bet
 */
export function isThirdPartyBet(
  bet: KenoBet | ThirdPartyBet
): bet is ThirdPartyBet {
  return "thirdPartyGame" in bet;
}
