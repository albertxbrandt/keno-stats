# Keno Stats Extension

A Chrome/Firefox browser extension that tracks Keno game statistics on Stake.com.

## ⚠️ Disclaimer

**This extension is for experimental and educational purposes only.**

- The extension tracks game statistics and provides heatmap analysis based on historical data.
- **It does NOT guarantee wins** and should not be relied upon for making betting decisions.
- Use this extension **at your own discretion**.
- Gambling carries risk. Past performance and statistical patterns do not predict future outcomes.

## Features

- **Heatmap Stats**: View which numbers appear most frequently in recent games
- **Prediction Mode**: See top predicted numbers based on historical frequency
- **Hot 5 Mode**: Analyze the last 5 games for recent trends
- **Auto-Play**: Automatically place bets using prediction algorithms
- **History Tracking**: Keep a record of your last 100 rounds with hit/miss analysis

## Installation

1. Clone or download this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to bundle the extension
4. Load the extension unpacked:
   - **Chrome**: `chrome://extensions/` → Enable "Developer mode" → "Load unpacked" → Select this folder
   - **Firefox**: `about:debugging` → "This Firefox" → "Load Temporary Add-on" → Select `manifest.json`

## Development

- Source files are in `src/`
- Build with `npm run build`
- Watch mode: `npm run watch`
- Built output goes to `dist/content.bundle.js`

## How It Works

The extension intercepts Keno game data from Stake.com and:
1. Extracts drawn numbers and your selected numbers
2. Records hits and misses in local storage
3. Calculates frequency statistics for a heatmap
4. Offers optional prediction highlights and auto-play

## Responsible Use

- Only use this extension for testing and learning
- Do not rely on predictions for real money decisions
- Understand that randomness cannot be predicted
- Gamble responsibly and within your limits

## License

Experimental - use at your own risk.
