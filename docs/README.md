# Keno Stats Extension - Documentation

Welcome to the documentation for the Keno Stats browser extension!

## 📚 Documentation Files

### [USER_GUIDE.md](USER_GUIDE.md)

**Comprehensive user documentation** covering:

- How to use all features
- Heatmap modes (Hot Numbers vs Trending)
- Number Generator strategies
- Pattern Analysis
- Profit/Loss Tracking
- Tips & Best Practices
- Troubleshooting

**Start here if you're a user** wanting to learn how to use the extension.

### [DEVELOPER_GUIDE.md](dev/DEVELOPER_GUIDE.md)

**Technical documentation** covering:

- Architecture overview (Two-World system)
- Project structure and modules
- Core concepts (State, Storage, Generators)
- Data flow and processing pipelines
- Adding new features
- Testing & debugging
- Best practices and patterns

**Start here if you're a developer** wanting to understand or contribute to the codebase.

### Additional Documentation

- **[../README.md](../README.md)**: Main project README with installation instructions
- **[../.github/copilot-instructions.md](../.github/copilot-instructions.md)**: AI coding guidelines and architecture decisions
- **[dev/GENERATOR_REFACTORING.md](dev/GENERATOR_REFACTORING.md)**: History of generator system refactoring
- **[dev/REFACTORING_SUMMARY.md](dev/REFACTORING_SUMMARY.md)**: Detailed refactoring documentation
- **[dev/momentum-generator.md](dev/momentum-generator.md)**: Momentum generator implementation details
- **[dev/DOM_READER_IMPLEMENTATION.md](dev/DOM_READER_IMPLEMENTATION.md)**: DOM reader module documentation
- **[dev/DOM_READER_GUIDE.md](dev/DOM_READER_GUIDE.md)**: DOM reader usage guide

## 🚀 Quick Start

### For Users

1. Install the extension (see [main README](../README.md))
2. Navigate to Stake.com Keno
3. Accept the disclaimer
4. Read [USER_GUIDE.md](USER_GUIDE.md) to learn features

### For Developers

1. Clone the repository
2. Run `npm install`
3. Run `npm run build`
4. Load in browser (see [DEVELOPER_GUIDE.md](dev/DEVELOPER_GUIDE.md))
5. Read architecture docs to understand structure

## 📖 Documentation Index

### User Topics

- [Getting Started](USER_GUIDE.md#getting-started)
- [Heatmap Analysis](USER_GUIDE.md#heatmap-analysis) - Hot vs Trending explained
- [Number Generator](USER_GUIDE.md#number-generator) - All methods
- [Pattern Analysis](USER_GUIDE.md#pattern-analysis)
- [Tips & Best Practices](USER_GUIDE.md#tips--best-practices)
- [Troubleshooting](USER_GUIDE.md#troubleshooting)

### Developer Topics

- [Architecture Overview](dev/DEVELOPER_GUIDE.md#architecture-overview)
- [Module Reference](dev/DEVELOPER_GUIDE.md#module-reference)
- [Data Flow](dev/DEVELOPER_GUIDE.md#data-flow)
- [Adding Features](dev/DEVELOPER_GUIDE.md#adding-features)
- [Testing & Debugging](dev/DEVELOPER_GUIDE.md#testing--debugging)
- [Best Practices](dev/DEVELOPER_GUIDE.md#best-practices)

## 🔑 Key Concepts

### Heatmap Modes

- **Hot Numbers**: Frequency-based percentages (e.g., `35%`)
- **Trending**: Momentum multipliers (e.g., `1.5x` = 50% increase)

### Generator Methods

- **Frequency**: Most frequent numbers
- **Cold**: Least frequent numbers
- **Momentum**: Numbers gaining frequency
- **Shapes**: Geometric patterns with smart placement
- **Mixed/Average**: Combination strategies

### Architecture

- **MAIN World**: Page-level fetch() interception
- **ISOLATED World**: Extension logic with Chrome APIs
- **Chunked Storage**: Unlimited history via 1000-round chunks
- **Cache Manager**: Universal refresh interval logic

## ⚠️ Important Disclaimers

This extension is for **educational and entertainment purposes only**:

- Statistical analysis does **not predict future outcomes**
- Keno is random - past results don't influence future draws
- No strategy can overcome the house edge
- Use responsibly and within your limits

## 🤝 Contributing

See [Contributing section](dev/DEVELOPER_GUIDE.md#contributing) in the Developer Guide for:

- Workflow guidelines
- Commit message format
- Code review checklist
- Development setup

## 📝 Recent Updates

### December 2024

- ✨ Added heatmap mode toggle (hot vs trending)
- 📊 Changed trending display to momentum multipliers (1.5x vs %)
- 🔧 Fixed generator refresh interval logic
- 🎯 Fixed SPA navigation with URL change detection
- ⚡ Replaced setTimeout with proper DOM observation
- 🧹 Code cleanup and ESLint configuration
- 📚 Comprehensive documentation added

## 📞 Support

- **Issues**: Report bugs or request features on GitHub
- **Questions**: Check [USER_GUIDE.md](USER_GUIDE.md) troubleshooting section
- **Development**: See [DEVELOPER_GUIDE.md](dev/DEVELOPER_GUIDE.md)

---

**Version**: 1.0  
**Last Updated**: December 19, 2024  
**License**: Experimental - use at your own risk
