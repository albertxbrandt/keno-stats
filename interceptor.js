// Keno Stats Tracker - interceptor.js
// Intercepts fetch requests to extract Keno game data

// Safeguard to prevent multiple injections
if (!window.kenoInterceptorActive) {
    window.kenoInterceptorActive = true;

    // Only log if on Keno page
    if (window.location.href.includes('/casino/games/keno')) {
        console.log("%c KENO TRACKER", "background: #0051e9ff; color: #fff; padding: 3px; border-radius: 3px;");
        // Ping UI to turn dot Yellow
        setTimeout(() => window.postMessage({ type: "KENO_CONNECTION_TEST" }, "*"), 500);
    }

    const originalFetch = window.fetch;

    window.fetch = async function (...args) {

        // Skip interception if not on Keno page
        if (!window.location.href.includes('/casino/games/keno')) {
            return originalFetch.apply(this, args);
        }

        // 1. Pass request through
        let response;
        try {
            response = await originalFetch.apply(this, args);
        } catch (err) {
            throw err;
        }

        // 2. Clone and inspect
        const clone = response.clone();

        // Get URL correctly
        const resource = args[0];
        let url = "";
        if (typeof resource === 'string') url = resource;
        else if (resource instanceof Request) url = resource.url;

        // Your screenshot shows the data comes from a request named "bet"
        if (url.includes("graphql") || url.includes("bet")) {

            clone.json().then(jsonBody => {

                let kenoData = null;

                // Path 1: { data: { kenoBet: ... } }
                if (jsonBody.data && jsonBody.data.kenoBet) {
                    kenoData = jsonBody.data.kenoBet;
                }

                // Path 2: { kenoBet: ... } 
                else if (jsonBody.kenoBet) {
                    kenoData = jsonBody.kenoBet;
                }

                // If valid game data found
                if (kenoData && kenoData.state) {
                    console.log("%c ✅ BET DATA FOUND! ", "background: #00b894; color: white; font-size: 14px;");

                    window.postMessage({
                        type: "KENO_DATA_FROM_PAGE",
                        payload: kenoData // Send full kenoBet object
                    }, "*");
                }

            }).catch(e => { error("Keno Interceptor JSON Parse Error:", e); });
        }

        return response;
    };
}