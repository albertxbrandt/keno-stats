/**
 * VIP feature types
 */

export interface VIPFlag {
  flag: string;
}

export interface VIPFlagProgress {
  flag: string;
  progress: number;
}

export interface VIPUserData {
  user?: {
    id: string;
    flags?: VIPFlag[];
    flagProgress?: VIPFlagProgress;
  };
  data?: {
    user?: {
      id: string;
      flagProgress?: VIPFlagProgress;
    };
  };
}

export interface VIPLevel {
  name: string;
  flag: string;
  requirement: number; // in dollars
  displayName: string;
}

export interface VIPProgress {
  currentLevel: VIPLevel;
  nextLevel: VIPLevel | null;
  progress: number; // 0-1
  wagered: number; // dollars
  remaining: number; // dollars
}
