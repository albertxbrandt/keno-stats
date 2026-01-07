/**
 * VIP level mappings and calculation logic
 */

import type {
  VIPLevel,
  VIPUserData,
  VIPProgress,
  VIPFlagProgress,
} from "./types";

// VIP level definitions
export const VIP_LEVELS: VIPLevel[] = [
  { name: "bronze", flag: "bronze", requirement: 10000, displayName: "Bronze" },
  { name: "silver", flag: "silver", requirement: 50000, displayName: "Silver" },
  { name: "gold", flag: "gold", requirement: 100000, displayName: "Gold" },
  {
    name: "platinum",
    flag: "platinum",
    requirement: 250000,
    displayName: "Platinum",
  },
  {
    name: "platinum2",
    flag: "wagered(500k)",
    requirement: 500000,
    displayName: "Platinum II",
  },
  {
    name: "platinum3",
    flag: "wagered(1m)",
    requirement: 1000000,
    displayName: "Platinum III",
  },
  {
    name: "platinum4",
    flag: "wagered(2.5m)",
    requirement: 2500000,
    displayName: "Platinum IV",
  },
  {
    name: "platinum5",
    flag: "wagered(5m)",
    requirement: 5000000,
    displayName: "Platinum V",
  },
  {
    name: "platinum6",
    flag: "wagered(10m)",
    requirement: 10000000,
    displayName: "Platinum VI",
  },
  {
    name: "diamond",
    flag: "wagered(25m)",
    requirement: 25000000,
    displayName: "Diamond",
  },
];

/**
 * Find VIP level by flag name
 */
export function findLevelByFlag(flag: string): VIPLevel | null {
  return VIP_LEVELS.find((level) => level.flag === flag) || null;
}

/**
 * Get current level from flags array
 */
export function getCurrentLevel(flags: string[]): VIPLevel {
  // Start from highest level and work down
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    const level = VIP_LEVELS[i];
    if (level && flags.includes(level.flag)) {
      return level;
    }
  }
  // Default to Bronze if no flags found
  return VIP_LEVELS[0]!;
}

/**
 * Get next level after current
 */
export function getNextLevel(currentLevel: VIPLevel): VIPLevel | null {
  const currentIndex = VIP_LEVELS.findIndex(
    (level) => level.name === currentLevel.name
  );
  if (currentIndex === -1 || currentIndex === VIP_LEVELS.length - 1) {
    return null; // Max level reached
  }
  return VIP_LEVELS[currentIndex + 1] ?? null;
}

/**
 * Calculate VIP progress from API data
 */
export function calculateVIPProgress(vipData: VIPUserData): VIPProgress | null {
  let flagProgress: VIPFlagProgress | null = null;

  // Extract progress from either response format
  if (vipData.user?.flagProgress) {
    flagProgress = vipData.user.flagProgress;
  } else if (vipData.data?.user?.flagProgress) {
    flagProgress = vipData.data.user.flagProgress;
  }

  if (!flagProgress) {
    return null; // Need progress data to calculate
  }

  // Find current level based on progress flag
  const currentLevel = findLevelByFlag(flagProgress.flag);
  if (!currentLevel) {
    return null;
  }

  const nextLevel = getNextLevel(currentLevel);
  const progress = flagProgress.progress;
  const wagered = currentLevel.requirement * progress;
  const remaining = currentLevel.requirement - wagered;

  return {
    currentLevel,
    nextLevel,
    progress,
    wagered,
    remaining,
  };
}

/**
 * Format currency with commas and 2 decimals
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
