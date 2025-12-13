"""
Analyze optimization results and provide clear insights

USAGE:
  Default (looks for optimization-results.json):
    python scripts/analyze-results.py
  
  Specific file:
    python scripts/analyze-results.py scripts/optimization-results-p5-medium-001.json
  
  With wildcards:
    python scripts/analyze-results.py scripts/optimization-results-p345-*.json
"""

import json
import sys
import argparse
from pathlib import Path
import glob

def load_results(filepath=None):
    """Load optimization results from JSON"""
    if filepath:
        results_file = Path(filepath)
    else:
        # Default to optimization-results.json in scripts directory
        results_file = Path(__file__).parent / 'optimization-results.json'
    
    if not results_file.exists():
        print(f"Error: Results file not found: {results_file}")
        sys.exit(1)
    
    print(f"Loading results from: {results_file}\n")
    with open(results_file, 'r') as f:
        return json.load(f)

def analyze_pattern_size(pattern_size, results):
    """Analyze results for a specific pattern size"""
    print(f"\n{'='*100}")
    print(f"PATTERN SIZE {pattern_size} ANALYSIS")
    print(f"{'='*100}\n")
    
    if not results:
        print("No results found.")
        return
    
    # Best by success rate
    best = results[0]
    p = best['params']
    
    print(f"📊 BEST OVERALL (Highest Success Rate):")
    print(f"   Settings: sample_size={p['sample_size']}, min_hits={p['min_hits']}, max_hits={p['max_hits']}, not_hit_in={p['not_hit_in']}")
    print(f"   Success Rate: {best['success_rate']:.2f}% ({best['total_successes']}/{best['total_predictions']} patterns completed)")
    
    # Show maintaining metrics if available
    if 'maintaining_rate' in best and best['maintaining_rate'] is not None:
        print(f"   Maintaining Rate: {best['maintaining_rate']:.2f}% (patterns that didn't lose money)")
    if 'avg_profit' in best and best['avg_profit'] is not None:
        print(f"   Avg Profit: {best['avg_profit']:.2f}x per pattern (includes losses)")
    
    print(f"   Avg Rounds to Complete: {best['avg_rounds_to_hit']:.1f} rounds")
    print(f"   Avg Patterns Shown: {best['avg_predictions_per_point']:.1f} per prediction")
    print(f"   What this means: Out of every {best['avg_predictions_per_point']:.0f} patterns shown, about {best['success_rate']/100 * best['avg_predictions_per_point']:.1f} will complete")
    
    # Find fastest completion (min 5% success rate)
    fast_results = [r for r in results if r['success_rate'] >= 5 and r['avg_rounds_to_hit'] > 0]
    if fast_results:
        fast_results.sort(key=lambda x: x['avg_rounds_to_hit'])
        fastest = fast_results[0]
        p = fastest['params']
        print(f"\n⚡ FASTEST COMPLETIONS (≥5% success):")
        print(f"   Settings: sample_size={p['sample_size']}, min_hits={p['min_hits']}, max_hits={p['max_hits']}, not_hit_in={p['not_hit_in']}")
        print(f"   Success Rate: {fastest['success_rate']:.2f}%")
        if 'maintaining_rate' in fastest and fastest['maintaining_rate'] is not None:
            print(f"   Maintaining Rate: {fastest['maintaining_rate']:.2f}%")
        if 'avg_profit' in fastest and fastest['avg_profit'] is not None:
            print(f"   Avg Profit: {fastest['avg_profit']:.2f}x")
        print(f"   Avg Rounds to Complete: {fastest['avg_rounds_to_hit']:.1f} rounds")
    
    # Best balance
    balanced_results = [r for r in results if r.get('balance_score', 0) > 0]
    if balanced_results:
        balanced_results.sort(key=lambda x: x['balance_score'], reverse=True)
        balanced = balanced_results[0]
        p = balanced['params']
        print(f"\n⚖️  BEST BALANCED (Success × Speed):")
        print(f"   Settings: sample_size={p['sample_size']}, min_hits={p['min_hits']}, max_hits={p['max_hits']}, not_hit_in={p['not_hit_in']}")
        print(f"   Success Rate: {balanced['success_rate']:.2f}%")
        if 'maintaining_rate' in balanced and balanced['maintaining_rate'] is not None:
            print(f"   Maintaining Rate: {balanced['maintaining_rate']:.2f}%")
        if 'avg_profit' in balanced and balanced['avg_profit'] is not None:
            print(f"   Avg Profit: {balanced['avg_profit']:.2f}x")
        print(f"   Avg Rounds to Complete: {balanced['avg_rounds_to_hit']:.1f} rounds")
        print(f"   Balance Score: {balanced['balance_score']:.2f}")
    
    # Most profitable (if maintaining data available)
    profitable_results = [r for r in results if 'avg_profit' in r and r['avg_profit'] is not None and r['avg_profit'] > 0]
    if profitable_results:
        profitable_results.sort(key=lambda x: x['avg_profit'], reverse=True)
        profitable = profitable_results[0]
        p = profitable['params']
        print(f"\n💰 MOST PROFITABLE (Highest avg profit):")
        print(f"   Settings: sample_size={p['sample_size']}, min_hits={p['min_hits']}, max_hits={p['max_hits']}, not_hit_in={p['not_hit_in']}")
        print(f"   Avg Profit: {profitable['avg_profit']:.2f}x per pattern")
        print(f"   Success Rate: {profitable['success_rate']:.2f}%")
        print(f"   Maintaining Rate: {profitable.get('maintaining_rate', 0):.2f}%")
        print(f"   Why it matters: Accounts for partial hits + full completions profitability")
    
    # Most selective (fewest predictions, but high success)
    selective_results = [r for r in results if r['success_rate'] >= 10]
    if selective_results:
        selective_results.sort(key=lambda x: x['avg_predictions_per_point'])
        selective = selective_results[0]
        p = selective['params']
        print(f"\n🎯 MOST SELECTIVE (≥10% success, fewest predictions):")
        print(f"   Settings: sample_size={p['sample_size']}, min_hits={p['min_hits']}, max_hits={p['max_hits']}, not_hit_in={p['not_hit_in']}")
        print(f"   Success Rate: {selective['success_rate']:.2f}%")
        print(f"   Avg Patterns Shown: {selective['avg_predictions_per_point']:.1f} per prediction")
        print(f"   Why it matters: Fewer patterns = easier to track, higher quality signals")
    
    # Sample size impact
    print(f"\n📈 SAMPLE SIZE IMPACT:")
    sample_sizes = {}
    for r in results:
        size = r['params']['sample_size']
        if size not in sample_sizes:
            sample_sizes[size] = []
        sample_sizes[size].append(r['success_rate'])
    
    for size in sorted(sample_sizes.keys()):
        avg_success = sum(sample_sizes[size]) / len(sample_sizes[size])
        print(f"   Sample Size {size:3d}: Avg {avg_success:.2f}% success across {len(sample_sizes[size])} tests")

def compare_pattern_sizes(all_results):
    """Compare performance across different pattern sizes"""
    print(f"\n{'='*100}")
    print(f"PATTERN SIZE COMPARISON")
    print(f"{'='*100}\n")
    
    comparison = []
    
    for key, results in all_results.items():
        pattern_size = results[0]['pattern_size'] if results else 0
        best = results[0] if results else None
        
        if best:
            comparison.append({
                'size': pattern_size,
                'success_rate': best['success_rate'],
                'avg_rounds': best['avg_rounds_to_hit'],
                'avg_patterns': best['avg_predictions_per_point'],
                'expected_hits': best['success_rate']/100 * best['avg_predictions_per_point'],
                'params': best['params']
            })
    
    # Sort by success rate
    comparison.sort(key=lambda x: x['success_rate'], reverse=True)
    
    print(f"{'Size':<6} {'Success%':<12} {'Avg Rounds':<12} {'Patterns/Pred':<15} {'Expected Hits':<15} {'Best Config'}")
    print("-" * 100)
    
    for c in comparison:
        p = c['params']
        config = f"s={p['sample_size']},h={p['min_hits']}-{p['max_hits']},n={p['not_hit_in']}"
        print(f"{c['size']:<6} {c['success_rate']:<12.2f} {c['avg_rounds']:<12.1f} {c['avg_patterns']:<15.1f} {c['expected_hits']:<15.2f} {config}")
    
    print(f"\n💡 INTERPRETATION:")
    print(f"   - Success%: What % of shown patterns will complete")
    print(f"   - Patterns/Pred: How many patterns shown on average")
    print(f"   - Expected Hits: How many patterns will complete per prediction (Success% × Patterns/Pred)")
    print(f"   - Smaller patterns = Higher success rates but you need to track more")
    print(f"   - Larger patterns = Lower success but cleaner signals\n")

def recommendation(all_results):
    """Provide actionable recommendations"""
    print(f"\n{'='*100}")
    print(f"🎯 RECOMMENDATIONS")
    print(f"{'='*100}\n")
    
    # Find best of each category
    all_configs = []
    for key, results in all_results.items():
        for r in results:
            r['pattern_size'] = r.get('pattern_size', 5)
            all_configs.append(r)
    
    # Best overall
    all_configs.sort(key=lambda x: x['success_rate'], reverse=True)
    best_overall = all_configs[0]
    
    print(f"1️⃣  FOR HIGHEST SUCCESS RATE:")
    print(f"   Use Pattern Size: {best_overall['pattern_size']}")
    print(f"   Settings: {best_overall['params']}")
    print(f"   Expected: {best_overall['success_rate']:.1f}% of patterns complete in ~{best_overall['avg_rounds_to_hit']:.0f} rounds")
    print(f"   Trade-off: Will show ~{best_overall['avg_predictions_per_point']:.0f} patterns (more to track)\n")
    
    # Best balance
    for r in all_configs:
        if r['avg_rounds_to_hit'] > 0:
            r['balance'] = r['success_rate'] * (50 / r['avg_rounds_to_hit'])
    all_configs.sort(key=lambda x: x.get('balance', 0), reverse=True)
    best_balance = all_configs[0]
    
    print(f"2️⃣  FOR BEST BALANCE (Success × Speed):")
    print(f"   Use Pattern Size: {best_balance['pattern_size']}")
    print(f"   Settings: {best_balance['params']}")
    print(f"   Expected: {best_balance['success_rate']:.1f}% success, completes in {best_balance['avg_rounds_to_hit']:.0f} rounds")
    print(f"   Shows: ~{best_balance['avg_predictions_per_point']:.0f} patterns per prediction\n")
    
    # Most selective
    selective_configs = [r for r in all_configs if r['success_rate'] >= 5]
    selective_configs.sort(key=lambda x: x['avg_predictions_per_point'])
    if selective_configs:
        best_selective = selective_configs[0]
        print(f"3️⃣  FOR CLEANEST SIGNALS (Fewest patterns, still ≥5% success):")
        print(f"   Use Pattern Size: {best_selective['pattern_size']}")
        print(f"   Settings: {best_selective['params']}")
        print(f"   Expected: {best_selective['success_rate']:.1f}% success")
        print(f"   Shows: Only ~{best_selective['avg_predictions_per_point']:.1f} patterns (easy to track)\n")

def main():
    parser = argparse.ArgumentParser(description='Analyze Keno optimization results')
    parser.add_argument('file', nargs='?', default=None,
                       help='Path to results JSON file (optional, uses optimization-results.json by default)')
    args = parser.parse_args()
    
    print("\n" + "="*100)
    print("KENO PATTERN OPTIMIZATION ANALYSIS")
    print("="*100 + "\n")
    
    results = load_results(args.file)
    
    # Analyze each pattern size
    for key in sorted(results.keys()):
        pattern_results = results[key]
        pattern_size = pattern_results[0]['pattern_size'] if pattern_results else 0
        analyze_pattern_size(pattern_size, pattern_results)
    
    # Compare across sizes
    compare_pattern_sizes(results)
    
    # Provide recommendations
    recommendation(results)
    
    print("\n" + "="*100)
    print("Analysis complete!")
    print("="*100 + "\n")

if __name__ == '__main__':
    main()
