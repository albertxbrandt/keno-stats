// Keno Stats Tracker - interceptor.ts
// Intercepts fetch requests to extract Keno and Mines game data

import type {
  KenoBetResponse,
  MinesCashoutResponse,
  MinesNextResponse,
  MinesBetResponse,
} from "./src/shared/types/api.js";

// Extend window interface for interceptor flags
declare global {
  interface Window {
    kenoInterceptorActive?: boolean;
    minesInterceptorActive?: boolean;
    vipInterceptorActive?: boolean;
  }
}

// GraphQL response structure for Keno
interface KenoGraphQLResponse {
  data?: {
    kenoBet?: KenoBetResponse;
  };
  kenoBet?: KenoBetResponse;
}

// GraphQL response structure for Mines
interface MinesGraphQLResponse {
  data?: {
    minesCashout?: MinesCashoutResponse;
    minesNext?: MinesNextResponse;
    minesBet?: MinesBetResponse;
  };
  minesCashout?: MinesCashoutResponse;
  minesNext?: MinesNextResponse;
  minesBet?: MinesBetResponse;
}

// VIP data structures
interface VIPFlag {
  flag: string;
}

interface VIPFlagProgress {
  flag: string;
  progress: number;
}

interface VIPUserResponse {
  user?: {
    id: string;
    flags?: VIPFlag[];
    flagProgress?: VIPFlagProgress;
  };
  data?: {
    user?: {
      id: string;
      flags?: VIPFlag[];
      flagProgress?: VIPFlagProgress;
    };
  };
}

// Safeguard to prevent multiple injections
if (!window.kenoInterceptorActive && !window.minesInterceptorActive) {
  window.kenoInterceptorActive = true;
  window.minesInterceptorActive = true;
  window.vipInterceptorActive = true;
  // eslint-disable-next-line no-console
  console.log(
    "%c STAKE TOOLS TRACKER",
    "background: #0051e9ff; color: #fff; padding: 3px; border-radius: 3px;"
  );

  // Ping UI to turn dot Yellow
  setTimeout(() => {
    window.postMessage({ type: "KENO_CONNECTION_TEST" }, "*");
    window.postMessage({ type: "MINES_CONNECTION_TEST" }, "*");
    window.postMessage({ type: "VIP_CONNECTION_TEST" }, "*");
  }, 500);

  const originalFetch = window.fetch;

  window.fetch = async function (
    ...args: Parameters<typeof fetch>
  ): Promise<Response> {
    // 1. Pass request through
    const response = await originalFetch.apply(this, args);

    // 2. Clone and inspect
    const clone = response.clone();

    // Get URL correctly
    const resource = args[0];
    let url = "";
    if (typeof resource === "string") url = resource;
    else if (resource instanceof Request) url = resource.url;

    // Check for game data in response
    // Match Keno (graphql) and all Mines endpoints (/mines/bet, /mines/next, /mines/cashout)
    if (
      url.includes("graphql") ||
      url.includes("bet") ||
      url.includes("mines")
    ) {
      clone
        .json()
        .then((jsonBody: unknown) => {
          // Log all GraphQL responses for debugging
          if (url.includes("graphql")) {
            // eslint-disable-next-line no-console
            console.log("[Interceptor] GraphQL response:", jsonBody);
          }

          let kenoData: KenoBetResponse | null = null;
          let minesData:
            | MinesCashoutResponse
            | MinesNextResponse
            | MinesBetResponse
            | null = null;
          let vipData: VIPUserResponse | null = null;

          // Type guard for response structure
          const kenoBody = jsonBody as KenoGraphQLResponse;
          const minesBody = jsonBody as MinesGraphQLResponse;
          const vipBody = jsonBody as VIPUserResponse;

          // Check for Keno data
          // Path 1: { data: { kenoBet: ... } }
          if (kenoBody.data && kenoBody.data.kenoBet) {
            kenoData = kenoBody.data.kenoBet;
          }
          // Path 2: { kenoBet: ... }
          else if (kenoBody.kenoBet) {
            kenoData = kenoBody.kenoBet;
          }

          // Check for Mines data (all 3 types)
          // Path 1: { data: { minesCashout/minesNext/minesBet: ... } }
          if (minesBody.data) {
            if (minesBody.data.minesCashout) {
              minesData = minesBody.data.minesCashout;
            } else if (minesBody.data.minesNext) {
              minesData = minesBody.data.minesNext;
            } else if (minesBody.data.minesBet) {
              minesData = minesBody.data.minesBet;
            }
          }
          // Path 2: { minesCashout/minesNext/minesBet: ... }
          else if (minesBody.minesCashout) {
            minesData = minesBody.minesCashout;
          } else if (minesBody.minesNext) {
            minesData = minesBody.minesNext;
          } else if (minesBody.minesBet) {
            minesData = minesBody.minesBet;
          }

          // If valid Keno data found
          if (kenoData && kenoData.state) {
            // eslint-disable-next-line no-console
            console.log(
              "%c ✅ KENO DATA FOUND! ",
              "background: #00b894; color: white; font-size: 14px;"
            );

            window.postMessage(
              {
                type: "KENO_DATA_FROM_PAGE",
                payload: kenoData,
              },
              "*"
            );
          }

          // If valid Mines data found
          if (minesData && minesData.state) {
            // eslint-disable-next-line no-console
            console.log(
              "%c ✅ MINES DATA FOUND! ",
              "background: #ff7675; color: white; font-size: 14px;",
              minesData
            );

            window.postMessage(
              {
                type: "MINES_DATA_FROM_PAGE",
                payload: minesData,
              },
              "*"
            );
          }

          // Check for VIP data
          // Path 1: { user: { flags: [...], flagProgress: {...} } }
          if (
            vipBody.user &&
            (vipBody.user.flags || vipBody.user.flagProgress)
          ) {
            vipData = vipBody;
          }
          // Path 2: { data: { user: { flagProgress: {...} } } }
          else if (vipBody.data?.user?.flagProgress) {
            vipData = vipBody;
          }
          // Path 3: { data: { user: { flags: [...] } } }
          else if (vipBody.data?.user?.flags) {
            vipData = vipBody;
          }

          // If valid VIP data found
          if (vipData) {
            // eslint-disable-next-line no-console
            console.log(
              "%c ✅ VIP DATA FOUND! ",
              "background: #fdcb6e; color: black; font-size: 14px;",
              vipData
            );

            window.postMessage(
              {
                type: "VIP_DATA_FROM_PAGE",
                payload: vipData,
              },
              "*"
            );
          }
        })
        .catch((e: unknown) => {
          console.error("Stake Tools Interceptor JSON Parse Error:", e);
        });
    }

    return response;
  };
}
