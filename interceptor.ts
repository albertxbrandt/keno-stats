// Keno Stats Tracker - interceptor.ts
// Intercepts fetch requests to extract Keno and Mines game data

import type { KenoBetResponse, MinesCashoutResponse } from "./src/shared/types/api.js";

// Extend window interface for interceptor flags
declare global {
  interface Window {
    kenoInterceptorActive?: boolean;
    minesInterceptorActive?: boolean;
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
  };
  minesCashout?: MinesCashoutResponse;
}

// Safeguard to prevent multiple injections
if (!window.kenoInterceptorActive && !window.minesInterceptorActive) {
  window.kenoInterceptorActive = true;
  window.minesInterceptorActive = true;
  // eslint-disable-next-line no-console
  console.log(
    "%c STAKE TOOLS TRACKER",
    "background: #0051e9ff; color: #fff; padding: 3px; border-radius: 3px;"
  );

  // Ping UI to turn dot Yellow
  setTimeout(() => {
    window.postMessage({ type: "KENO_CONNECTION_TEST" }, "*");
    window.postMessage({ type: "MINES_CONNECTION_TEST" }, "*");
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
    if (url.includes("graphql") || url.includes("bet")) {
      clone
        .json()
        .then((jsonBody: unknown) => {
          let kenoData: KenoBetResponse | null = null;
          let minesData: MinesCashoutResponse | null = null;

          // Type guard for response structure
          const kenoBody = jsonBody as KenoGraphQLResponse;
          const minesBody = jsonBody as MinesGraphQLResponse;

          // Check for Keno data
          // Path 1: { data: { kenoBet: ... } }
          if (kenoBody.data && kenoBody.data.kenoBet) {
            kenoData = kenoBody.data.kenoBet;
          }
          // Path 2: { kenoBet: ... }
          else if (kenoBody.kenoBet) {
            kenoData = kenoBody.kenoBet;
          }

          // Check for Mines data
          // Path 1: { data: { minesCashout: ... } }
          if (minesBody.data && minesBody.data.minesCashout) {
            minesData = minesBody.data.minesCashout;
          }
          // Path 2: { minesCashout: ... }
          else if (minesBody.minesCashout) {
            minesData = minesBody.minesCashout;
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
              "background: #ff7675; color: white; font-size: 14px;"
            );

            window.postMessage(
              {
                type: "MINES_DATA_FROM_PAGE",
                payload: minesData,
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
