// src/shared/utils/stakeBetApi.ts
// Utility for fetching bet data from Stake API

import type { BetApiResponse } from "@/shared/types/winLinks";

// GraphQL query for fetching bet data
const BETLOOKUP_QUERY = `query BetLookup($iid: String, $betId: String) {
  bet(iid: $iid, betId: $betId) {
    ...BetFragment
  }
}

fragment BetFragment on Bet {
  id
  iid
  type
  scope
  game {
    name
    icon
    slug
  }
  bet {
    ... on CasinoBet {
      id
      active
      payoutMultiplier
      amount
      payout
      currency
      game
    }
    ... on ThirdPartyBet {
      id
      amount
      currency
      payout
      payoutMultiplier
      betReplay
      thirdPartyGame: game {
        id
        name
        edge
        extId
        provider {
          id
          name
        }
      }
    }
  }
}`;

/**
 * Parse bet ID from various input formats
 * @param input - Bet ID or URL
 * @returns Parsed bet ID (e.g., "house:123456789")
 */
export function parseBetId(input: string): string | null {
  const trimmed = input.trim();

  // Convert casino: to house: (API treats them the same)
  if (/^casino:\d+$/.test(trimmed)) {
    return trimmed.replace('casino:', 'house:');
  }

  // Already in correct format (house:123456789)
  if (/^house:\d+$/.test(trimmed)) {
    return trimmed;
  }

  // Extract from URL query param and convert casino: to house:
  const urlMatch = trimmed.match(/[?&]betId=([^&]+)/);
  if (urlMatch && urlMatch[1]) {
    const decoded = decodeURIComponent(urlMatch[1]);
    return decoded.replace('casino:', 'house:');
  }

  // Just numbers - prepend "house:"
  if (/^\d+$/.test(trimmed)) {
    return `house:${trimmed}`;
  }

  return null;
}

/**
 * Fetch bet data from Stake GraphQL API
 * @param betId - Bet ID (e.g., "house:123456789")
 * @returns Bet data from API
 */
export async function fetchBetData(betId: string): Promise<BetApiResponse> {
  const response = await fetch("https://stake.com/_api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-operation-name": "BetLookup",
      "x-operation-type": "query",
    },
    credentials: "include", // Use existing auth cookies
    body: JSON.stringify({
      query: BETLOOKUP_QUERY,
      variables: { iid: betId },
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Not authenticated. Please log in to Stake.");
    }
    throw new Error(`Failed to fetch bet data: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message || "GraphQL error");
  }

  if (!data.data?.bet) {
    throw new Error("Bet not found");
  }

  return data as BetApiResponse;
}
