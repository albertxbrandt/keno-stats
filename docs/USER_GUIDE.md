# Keno Stats Extension - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Heatmap Analysis](#heatmap-analysis)
3. [Number Generator](#number-generator)
4. [Pattern Analysis](#pattern-analysis)
5. [Profit/Loss Tracking](#profitloss-tracking)
6. [Auto-Play System](#auto-play-system)
7. [Saved Number Sets](#saved-number-sets)
8. [History Management](#history-management)
9. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Time Setup

1. Install the extension in Chrome/Firefox
2. Navigate to Stake.com or Stake.us
3. Go to the Keno game page
4. The extension will show a disclaimer on first use
5. Accept the disclaimer to activate the extension
6. The tracker overlay will appear on the right side of the game

### Interface Overview

The extension adds:

- **Overlay Panel**: Collapsible sections for each feature (right side)
- **Footer Button**: Quick access toggle in the game footer
- **Board Overlays**: Statistics displayed directly on the Keno board
- **Status Indicator**: Connection status dot in the overlay header

---

## Heatmap Analysis

The heatmap displays statistical information directly on each number tile of the Keno board.

### Modes

#### 🔥 Hot Numbers Mode

Shows how frequently each number has appeared in your sample.

**Display**: Percentages (e.g., `35%`)

- **Green** (≥30%): High frequency numbers
- **Red** (≤10%): Low frequency numbers
- **White**: Average frequency

**Example**: `35%` means the number appeared in 35 out of 100 games

**Use Case**: Find consistently frequent numbers over time

#### 📈 Trending Mode

Shows momentum analysis - how numbers are performing recently vs historically.

**Display**: Multipliers (e.g., `1.5x`, `0.8x`)

- **`1.0x`**: Neutral (appearing at normal baseline rate)
- **`>1.0x`**: Trending up (appearing MORE frequently recently)
- **`<1.0x`**: Trending down (appearing LESS frequently recently)

**Color Thresholds**:

- **Green** (≥1.2x): 20%+ increase - Strong upward trend
- **Red** (≤0.8x): 20%+ decrease - Strong downward trend
- **White** (0.8x - 1.2x): Stable momentum

**Examples**:

- `1.5x` = Number appearing 50% more in recent games
- `2.0x` = Number appearing twice as often (100% increase)
- `0.5x` = Number appearing half as often (50% decrease)
- `0.8x` = Number cooling down (20% decrease)

**How It Works**:

1. Splits sample into recent 25% and baseline 75%
2. Calculates frequency in each window
3. Divides recent frequency by baseline frequency
4. Result is the momentum multiplier

**Use Case**: Catch numbers gaining momentum early (trend detection)

### Settings

**Sample Size**: Number of recent games to analyze (1-100+)

- Smaller = more reactive to recent changes
- Larger = more stable, long-term view
- Default: 100 games

**Toggle On/Off**: Click the switch to enable/disable heatmap display

**Expand/Collapse**: Click the section header to show/hide settings

---

## Number Generator

Intelligent number prediction system with multiple strategies.

### Generator Methods

#### 🔥 Frequency (Hot Numbers)

Selects the most frequently drawn numbers in your sample.

**Best For**: Conservative play based on historical frequency

#### ❄️ Cold Numbers

Selects the least frequently drawn numbers.

**Theory**: "Due" numbers that haven't appeared recently  
**Risk**: High variance, contrarian strategy

#### 🔀 Mixed

Combination of hot and cold numbers.

**Balance**: Hedges between frequent and rare numbers

#### 📊 Average

Numbers with median frequency (middle of the pack).

**Use Case**: Moderate approach, avoiding extremes

#### ⚡ Momentum

Numbers with increasing frequency (trending analysis).

**Algorithm**:

- Compares recent window vs baseline (4:1 ratio)
- Selects numbers with highest momentum ratios
- Filters by minimum threshold (default 1.5x)

**Advanced Settings**:

- **Threshold**: Minimum momentum to qualify (e.g., 1.5 = 50% increase)
- **Pool Size**: Top N trending numbers to select from

**Best For**: Catching early trends, reactive play

#### 🔷 Shapes

Places geometric patterns on the board with intelligent positioning.

**Patterns**: L-shape, T-shape, Plus, Box, Corners, Edges, Diagonals, Clusters, and more (12+ patterns)

**Placement Strategies**:

- **Random**: Any valid position for the pattern
- **Hot**: Positions covering most frequently drawn numbers
- **Trending**: Positions with highest momentum scores

**Use Case**: Fun, structured approach; can align with hot zones

### Universal Settings

**Count** (1-10): How many numbers to generate  
**Sample Size** (1-100+): Analysis window for all methods (default: 20)

- Hot/Cold: Uses full sample size
- Momentum: Recent = sample size, Baseline = 4× sample size

**Auto-Refresh Interval** (0 = manual):

- `0`: Manual - Click Refresh to regenerate
- `5`: Every 5 rounds
- `10`: Every 10 rounds
- Custom: Any number of rounds

**Auto-Select**: Automatically apply generated numbers to the board

**Live Preview**: Shows next predictions and countdown to refresh

### How to Use

1. **Choose Method**: Select your preferred strategy
2. **Set Count**: How many numbers you want (3-8 typical)
3. **Adjust Sample Size**: How much history to analyze
4. **Enable Auto-Refresh** (optional): Set interval or leave at 0 for manual
5. **Enable Auto-Select** (optional): Auto-apply numbers to board
6. **Click Refresh** (if manual): Generate new predictions
7. **Generated numbers appear**: On board or in preview area

**Tip**: Use Manual mode (interval = 0) to control exactly when to regenerate

---

## Pattern Analysis

Find common N-number combinations that appear together frequently in drawn results.

### How to Use

1. Click **"Analyze Patterns"** in the Pattern Analysis section
2. Select **Pattern Size** (3-10 numbers)
3. Click **"Find Patterns"**
4. Wait for analysis (cached for performance)
5. View results: Top 15 patterns with occurrence counts

### Understanding Results

**Pattern Card Example**:

```
🎯 [3, 12, 18, 25, 37]
Appeared together: 8 times
Most recent: Bet #245 (3 bets ago)
```

**Actions**:

- **Click pattern**: Auto-selects those numbers on the board
- **Expand occurrences**: See all times this pattern appeared with timestamps

### Statistics

- **Total Unique Patterns**: How many different combinations found
- **Average Appearance**: Mean occurrences per pattern
- **Cache Status**: Whether results are cached (faster on repeat queries)

### Performance Notes

- First analysis may take a few seconds for large datasets
- Results are cached for 5 minutes
- Cache automatically clears when new rounds are added
- Larger pattern sizes (8-10) take longer to compute

---

## Profit/Loss Tracking

Track betting performance across multiple cryptocurrencies.

### Features

**Multi-Currency Support**:

- BTC, LTC, DOGE, ETH, XRP, TRX, BNB, USDT, USDC, EOS, BCH

**Metrics**:

- **Session Profit**: Profit/loss since extension loaded
- **Total Profit**: All-time profit/loss from history
- **Profit %**: Percentage return on wagered amount

**Display**:

- Green = Profitable
- Red = Loss
- Real-time updates after each round

### Bet Book

**Export Feature**: Click "Open Stats Book" to view/export complete betting history

**Includes**:

- Bet amount, payout, profit
- Selected numbers, drawn numbers, hit count
- Multiplier, risk level, currency
- Timestamp for each bet

**Use Case**: External analysis, record keeping, strategy evaluation

---

## Auto-Play System

Automatically place bets using generator predictions.

### How to Use

1. **Enable Generator**: Turn on Number Generator first
2. **Configure Rounds**: Set how many rounds to play
3. **Click "Start Auto-Play"**
4. Extension will:
   - Generate numbers using active method
   - Apply numbers to board
   - Wait for bet button ready
   - Place bet automatically
   - Repeat for N rounds

### Safety Features

- **DOM State Detection**: Waits for actual bet button ready state
- **Error Handling**: Stops on timeout or errors
- **Manual Override**: Click "Stop Auto-Play" anytime
- **Profit Tracking**: Real-time P&L during auto-play

### Important Notes

⚠️ **Use Responsibly**:

- Monitor your balance
- Set round limits you're comfortable with
- Understand that predictions don't guarantee wins
- Auto-play can execute bets quickly - stay alert

---

## Saved Number Sets

Save and quickly reload your favorite number combinations.

### Creating Saved Sets

1. Select numbers on the Keno board manually
2. Click **"Save Current Selection"**
3. Enter a name for this set (e.g., "Lucky 7", "Hot Numbers")
4. Click Save

### Using Saved Sets

1. View saved sets in the Saved Numbers section
2. Click a saved set card to instantly apply those numbers
3. Edit/Delete sets using card buttons

### Recent Plays

- Automatically tracks your last 10 played number combinations
- Click any recent set to reuse it
- Shows timestamp for each play

---

## History Management

### Viewing History

- **History Panel**: Shows last 100 rounds (unlimited storage)
- **Hover**: Highlights hits (green) and misses (red) on the board
- **Click**: Expands details for that round

### Data Structure

Each round stores:

- Selected numbers (your picks)
- Drawn numbers (game results)
- Hits (matched numbers)
- Misses (drawn but not selected)
- Timestamp
- Bet details (if available)
- Generator info (if used)

### Management

**Clear History**: Removes all stored rounds (irreversible)  
**Export**: Via Bet Book for external analysis  
**Storage**: Unlimited rounds (chunked for performance)

---

## Tips & Best Practices

### Strategy Tips

1. **Start with Hot Numbers**: Most reliable for beginners
2. **Use Trending for Reactive Play**: Catch momentum shifts early
3. **Combine Methods**: Switch between modes based on observations
4. **Adjust Sample Size**:
   - 20-50 for recent trends
   - 100+ for long-term patterns
5. **Pattern Analysis**: Look for 5-7 number combinations (sweet spot)

### Performance Tips

1. **Keep History Reasonable**: Clear very old data periodically
2. **Disable Heatmap**: If you don't need it (slight performance boost)
3. **Manual Refresh**: Use interval = 0 for more control
4. **Cache Awareness**: Pattern analysis caches for 5 minutes

### Responsible Use

⚠️ **Critical Reminders**:

- Extension is for **educational and entertainment purposes only**
- Statistical patterns do **not predict future outcomes**
- Keno is a game of chance with a house edge
- No strategy can overcome the mathematical house advantage
- Set limits and gamble responsibly
- Never rely on predictions for financial decisions

### Understanding Limitations

**What Statistics Can Show**:
✅ Historical frequency patterns  
✅ Short-term momentum shifts  
✅ Common number combinations  
✅ Betting performance tracking

**What Statistics Cannot Do**:
❌ Predict future draws  
❌ Guarantee wins  
❌ Change the odds in your favor  
❌ Overcome randomness

**Remember**: Each Keno draw is independent and random. Past results do not influence future outcomes.

---

## Troubleshooting

### Extension Not Loading

- Refresh the Keno page
- Check if you accepted the disclaimer
- Verify extension is enabled in browser
- Check console for errors (F12)

### Numbers Not Auto-Selecting

- Ensure Auto-Select is enabled
- Check if bet button is ready
- Verify you're on the Keno page
- Wait for page to fully load

### Heatmap Not Showing

- Enable heatmap toggle
- Verify you have history data (play at least 1 round)
- Check sample size setting
- Refresh the heatmap manually

### Generator Not Refreshing

- Check interval setting (0 = manual)
- Verify you have enough history data
- Look at rounds countdown in preview
- Try manual refresh

### Slow Performance

- Clear old history data
- Reduce pattern analysis size
- Disable unused features
- Close other browser tabs

---

## Keyboard Shortcuts

- **`B` key**: Select all predicted numbers (when generator active)

_Note_: Shortcuts only work when not typing in input fields

---

## Getting Help

### Resources

- GitHub Repository: [Report issues, request features]
- README.md: Installation and setup
- DEVELOPER_GUIDE.md: Technical documentation
- Copilot Instructions: AI coding guidelines

### Common Questions

**Q: Why do predictions change?**  
A: Predictions recalculate based on your refresh interval and new game data.

**Q: What's the best method?**  
A: No method is "best" - experiment and see what you enjoy. Remember, no method guarantees wins.

**Q: Can I use this on mobile?**  
A: Extension requires desktop Chrome/Firefox with developer mode.

**Q: Does this work on all Stake games?**  
A: No, only designed for Keno on Stake.com and Stake.us.

**Q: Is my data private?**  
A: Yes, all data is stored locally in your browser. Nothing is sent to external servers.

---

**Last Updated**: December 19, 2025  
**Version**: 1.0  
**For**: Keno Stats Extension
