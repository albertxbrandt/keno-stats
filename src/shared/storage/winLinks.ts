// src/shared/storage/winLinks.ts
// Storage utilities for saved win links

import type {
  SavedWinLink,
  BetWrapper,
  BetApiResponse,
} from "@/shared/types/winLinks";
import { isCasinoBet, isThirdPartyBet } from "@/shared/types/winLinks";

// Global declarations for browser extension APIs
declare const browser: typeof chrome | undefined;
declare const chrome: {
  storage: {
    local: {
      get: (keys: string | string[]) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
    };
  };
};

const STORAGE_KEY = "savedWinLinks";

/**
 * Get storage API (Chrome or Firefox)
 */
function getStorageApi() {
  return typeof browser !== "undefined"
    ? browser.storage.local
    : chrome.storage.local;
}

/**
 * Load all saved win links
 * @returns Promise<SavedWinLink[]>
 */
export async function loadWinLinks(): Promise<SavedWinLink[]> {
  try {
    const storage = getStorageApi();
    const result = await storage.get(STORAGE_KEY);
    return (result[STORAGE_KEY] as SavedWinLink[]) || [];
  } catch (error) {
    console.error("[winLinks] Error loading win links:", error);
    return [];
  }
}

/**
 * Save a new win link
 * @param betData - Bet data from API response
 * @param note - Optional note/description
 * @param tags - Optional tags for categorization
 * @returns Promise<SavedWinLink>
 */
export async function saveWinLink(
  betData: BetWrapper,
  note?: string,
  tags?: string[]
): Promise<SavedWinLink> {
  try {
    const bet = betData.bet;

    // Determine game type and name
    let gameType: "casino" | "thirdparty";
    let gameName: string;

    if (isThirdPartyBet(bet)) {
      gameType = "thirdparty";
      gameName = bet.thirdPartyGame.name;
    } else if (isCasinoBet(bet)) {
      gameType = "casino";
      // Capitalize first letter of game name
      gameName = bet.game.charAt(0).toUpperCase() + bet.game.slice(1);
    } else {
      throw new Error("Unknown bet type");
    }

    // Calculate profit
    const profit = bet.payout - bet.amount;

    // Create saved win link entry
    const winLink: SavedWinLink = {
      id: betData.id,
      savedAt: Date.now(),
      note,
      tags,
      betData,
      gameType,
      gameName,
      profit,
      multiplier: bet.payoutMultiplier,
    };

    // Load existing links
    const existingLinks = await loadWinLinks();

    // Check if already exists
    const existingIndex = existingLinks.findIndex(
      (link) => link.id === winLink.id
    );
    if (existingIndex !== -1) {
      // Update existing
      existingLinks[existingIndex] = winLink;
    } else {
      // Add new
      existingLinks.unshift(winLink);
    }

    // Save to storage
    const storage = getStorageApi();
    await storage.set({ [STORAGE_KEY]: existingLinks });

    return winLink;
  } catch (error) {
    console.error("[winLinks] Error saving win link:", error);
    throw error;
  }
}

/**
 * Delete a win link by ID
 * @param id - Win link ID
 * @returns Promise<void>
 */
export async function deleteWinLink(id: string): Promise<void> {
  try {
    const existingLinks = await loadWinLinks();
    const filteredLinks = existingLinks.filter((link) => link.id !== id);

    const storage = getStorageApi();
    await storage.set({ [STORAGE_KEY]: filteredLinks });
  } catch (error) {
    console.error("[winLinks] Error deleting win link:", error);
    throw error;
  }
}

/**
 * Update a win link's note and tags
 * @param id - Win link ID
 * @param note - Optional note
 * @param tags - Optional tags
 * @returns Promise<SavedWinLink | null>
 */
export async function updateWinLink(
  id: string,
  note?: string,
  tags?: string[]
): Promise<SavedWinLink | null> {
  try {
    const existingLinks = await loadWinLinks();
    const linkIndex = existingLinks.findIndex((link) => link.id === id);

    if (linkIndex === -1) {
      return null;
    }

    const link = existingLinks[linkIndex]!;
    link.note = note;
    link.tags = tags;

    const storage = getStorageApi();
    await storage.set({ [STORAGE_KEY]: existingLinks });

    return link;
  } catch (error) {
    console.error("[winLinks] Error updating win link:", error);
    throw error;
  }
}

/**
 * Import win links from JSON
 * @param jsonData - Bet API response or array of responses
 * @returns Promise<number> - Number of links imported
 */
export async function importWinLinks(
  jsonData: BetApiResponse | BetApiResponse[]
): Promise<number> {
  try {
    const responses = Array.isArray(jsonData) ? jsonData : [jsonData];
    let importedCount = 0;

    for (const response of responses) {
      if (response.data && response.data.bet) {
        await saveWinLink(response.data.bet);
        importedCount++;
      }
    }

    return importedCount;
  } catch (error) {
    console.error("[winLinks] Error importing win links:", error);
    throw error;
  }
}

/**
 * Export win links to JSON
 * @returns Promise<string> - JSON string of all win links
 */
export async function exportWinLinks(): Promise<string> {
  try {
    const links = await loadWinLinks();
    return JSON.stringify(links, null, 2);
  } catch (error) {
    console.error("[winLinks] Error exporting win links:", error);
    throw error;
  }
}

/**
 * Delete all win links
 * @returns Promise<void>
 */
export async function deleteAllWinLinks(): Promise<void> {
  try {
    const storage = getStorageApi();
    await storage.set({ [STORAGE_KEY]: [] });
  } catch (error) {
    console.error("[winLinks] Error deleting all win links:", error);
    throw error;
  }
}
