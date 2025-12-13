"""
Optimize Live Pattern Tool Parameters
Backtests different parameter combinations to find optimal settings for:
- Sample Size (how many recent rounds to analyze for buildups)
- Min/Max Hits (partial hit range, e.g., 3-4 out of 5)
- Not Hit In (exclude patterns that completed recently)

Strategy: Find patterns showing momentum (buildups), track if they complete in next N rounds

USAGE:
  Basic test with default settings (pattern size 5):
    python scripts/optimize-pattern-params.py
  
  Test multiple pattern sizes:
    python scripts/optimize-pattern-params.py --pattern-sizes 3 4 5
  
  With maintaining/profitability tracking (high difficulty):
    python scripts/optimize-pattern-params.py --pattern-sizes 3 4 5 -m
  
  With maintaining tracking (medium difficulty):
    python scripts/optimize-pattern-params.py --pattern-sizes 3 4 5 -m -d medium
  
  Limit dataset to last 5000 rounds (faster testing):
    python scripts/optimize-pattern-params.py --pattern-sizes 5 --limit 5000
  
  Test with recency weighting (favor recent patterns):
    python scripts/optimize-pattern-params.py --pattern-sizes 5 -r
  
  Recency weighting with custom decay factor:
    python scripts/optimize-pattern-params.py --pattern-sizes 5 -r --decay 0.95
  
  Custom data file:
    python scripts/optimize-pattern-params.py --data-file path/to/data.json --pattern-sizes 5
  
FLAGS:
  --pattern-sizes      Pattern sizes to test (3-10), space-separated
  --data-file          Path to history JSON file (optional, uses latest by default)
  --limit              Limit dataset to last N rounds (optional, for faster testing)
  -m, --track-maintaining   Enable profitability tracking using bet multipliers
  -d, --difficulty     Bet difficulty: high, medium, low (default: high)
  -r, --recency-weight Enable recency-weighted scoring (recent patterns weighted higher)
  --decay              Decay factor for recency weighting (0.9-0.99, default: 0.98)
  
OUTPUT:
  Results saved to: optimization-results-p{sizes}-{difficulty}-{index}.json
  Example: optimization-results-p345-medium-001.json
"""

import json
import sys
import argparse
from pathlib import Path
from collections import defaultdict
from itertools import combinations
import time

def load_bet_multis():
    """Load bet multiplier config for profitability calculations"""
    multis_file = Path(__file__).parent.parent / 'config' / 'bet-multis.json'
    with open(multis_file, 'r') as f:
        return json.load(f)

def load_history(filepath):
    """Load Keno game history from JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)

def get_drawn_numbers(round_data):
    """Extract drawn numbers from round data"""
    if 'drawn' in round_data:
        return round_data['drawn']
    # Fallback: combine hits and misses
    return sorted(round_data.get('hits', []) + round_data.get('misses', []))

def get_combinations(arr, k):
    """Generate all combinations of size k from array"""
    return list(combinations(arr, k))

def find_common_patterns(history, pattern_size, top_n, discovery_window, use_recency=False, decay_factor=0.98):
    """
    Find most common patterns in discovery window
    Returns list of pattern objects with numbers and frequency/score
    
    If use_recency=True, applies exponential decay weighting where recent appearances
    are weighted higher than older ones (tests if recent patterns predict near-future)
    """
    pattern_scores = defaultdict(float)
    
    # Use specified discovery window
    sample = history[-discovery_window:]
    total_rounds = len(sample)
    
    for idx, round_data in enumerate(sample):
        drawn = get_drawn_numbers(round_data)
        combos = get_combinations(drawn, pattern_size)
        
        # Calculate weight based on recency (most recent = weight 1.0)
        if use_recency:
            # Exponential decay: recent rounds get higher weight
            rounds_ago = total_rounds - idx - 1
            weight = decay_factor ** rounds_ago
        else:
            weight = 1.0
        
        for combo in combos:
            key = tuple(sorted(combo))
            pattern_scores[key] += weight
    
    # Sort by score and return top N
    sorted_patterns = sorted(pattern_scores.items(), key=lambda x: x[1], reverse=True)
    return [{'numbers': list(nums), 'count': score} for nums, score in sorted_patterns[:top_n]]

def check_pattern_buildup(pattern, sample_cache, min_hits, max_hits, pattern_size):
    """Check if pattern shows buildups (partial hits) in sample"""
    buildups = []
    
    for drawn_set in sample_cache:
        matches = sum(1 for num in pattern if num in drawn_set)
        if min_hits <= matches <= max_hits:
            buildups.append(matches)
    
    return buildups

def check_last_full_hit(pattern, tracking_cache, pattern_size):
    """Find when pattern last hit fully in tracking window"""
    for i in range(len(tracking_cache) - 1, -1, -1):
        matches = sum(1 for num in pattern if num in tracking_cache[i])
        if matches == pattern_size:
            return i
    return -1

def evaluate_predictions(history, current_idx, patterns, lookahead_rounds, pattern_size, bet_multis=None, difficulty='high'):
    """
    Check if predicted patterns completed in the next lookahead_rounds
    Returns: (predictions_made, successful_predictions, avg_rounds_to_hit, maintaining_count, avg_profit)
    """
    if current_idx + lookahead_rounds > len(history):
        return 0, 0, 0, 0, 0  # Not enough future data
    
    future_rounds = history[current_idx:current_idx + lookahead_rounds]
    
    successes = 0
    maintaining = 0  # Patterns that didn't lose money (profit >= 0)
    rounds_to_hit = []
    profits = []  # Track profit/loss for each pattern
    
    for pattern_obj in patterns:
        pattern = set(pattern_obj['numbers'])
        pattern_completed = False
        
        # Check if pattern completes in future rounds
        for rounds_ahead, round_data in enumerate(future_rounds, 1):
            drawn = set(get_drawn_numbers(round_data))
            hits = len(pattern.intersection(drawn))
            
            # Check for full completion
            if pattern.issubset(drawn):  # All pattern numbers drawn
                successes += 1
                rounds_to_hit.append(rounds_ahead)
                pattern_completed = True
                
                # Calculate profit if bet_multis provided
                if bet_multis:
                    multiplier = bet_multis.get(difficulty, {}).get(str(pattern_size), {}).get(str(pattern_size), 0)
                    profit = (multiplier - rounds_ahead)  # Win - cost of rounds
                    profits.append(profit)
                    if profit >= 0:
                        maintaining += 1
                break
        
        # If didn't complete fully, check if it "maintained" (partial hit with positive return)
        if not pattern_completed and bet_multis:
            # Find best partial hit in lookahead window
            best_profit = -lookahead_rounds  # Worst case: lose all rounds
            for rounds_ahead, round_data in enumerate(future_rounds, 1):
                drawn = set(get_drawn_numbers(round_data))
                hits = len(pattern.intersection(drawn))
                
                if hits > 0:
                    # Get multiplier for partial hit
                    multiplier = bet_multis.get(difficulty, {}).get(str(pattern_size), {}).get(str(hits), 0)
                    if multiplier > 0:
                        profit = multiplier - rounds_ahead
                        best_profit = max(best_profit, profit)
                        if profit >= 0:
                            # Found a maintaining hit
                            break
            
            profits.append(best_profit)
            if best_profit >= 0:
                maintaining += 1
    
    avg_rounds = sum(rounds_to_hit) / len(rounds_to_hit) if rounds_to_hit else 0
    avg_profit = sum(profits) / len(profits) if profits else 0
    maintaining_rate = (maintaining / len(patterns) * 100) if patterns else 0
    
    return len(patterns), successes, avg_rounds, maintaining, avg_profit

def run_backtest(history, params, test_num=None, total_tests=None, pattern_size=5, bet_multis=None, difficulty='high', use_recency=False, decay_factor=0.98):
    """
    Backtest a specific parameter combination
    
    Params:
    - sample_size: Recent rounds to check for buildups
    - min_hits: Minimum partial matches
    - max_hits: Maximum partial matches
    - not_hit_in: Exclude patterns that completed in last X rounds
    - difficulty: Bet difficulty level ('high', 'medium', 'low')
    """
    sample_size = params['sample_size']
    min_hits = params['min_hits']
    max_hits = params['max_hits']
    not_hit_in = params['not_hit_in']
    
    discovery_window = 500
    lookahead = 30
    
    total_predictions = 0
    total_successes = 0
    total_maintaining = 0
    total_rounds_to_hit = []
    total_profit = []
    evaluation_points = 0
    
    # Start from discovery_window + sample_size to have enough history
    start_idx = max(discovery_window, sample_size) + 200  # Add buffer
    
    # Evaluate every 50 rounds to balance speed vs accuracy
    step_size = 50
    
    total_iterations = len(range(start_idx, len(history) - lookahead, step_size))
    
    for iteration, current_idx in enumerate(range(start_idx, len(history) - lookahead, step_size), 1):
        # Log progress every 20 iterations
        if test_num and iteration % 20 == 0:
            iter_progress = (iteration / total_iterations) * 100
            print(f"  [{test_num}/{total_tests}] Iteration {iteration}/{total_iterations} ({iter_progress:.1f}%)")
        # Get patterns from discovery window
        discovery_history = history[max(0, current_idx - discovery_window):current_idx]
        all_patterns = find_common_patterns(discovery_history, pattern_size, 100, discovery_window, use_recency, decay_factor)
        
        if not all_patterns:
            continue
        
        # Build caches for this point in time
        sample = history[current_idx - sample_size:current_idx]
        tracking = history[max(0, current_idx - 1000):current_idx]  # Reduced from 2000 for speed
        
        sample_cache = [set(get_drawn_numbers(r)) for r in sample]
        tracking_cache = [set(get_drawn_numbers(r)) for r in tracking]
        
        # Filter patterns based on params
        filtered_patterns = []
        
        for pattern_obj in all_patterns:
            pattern = pattern_obj['numbers']
            
            # Check buildups in sample
            buildups = check_pattern_buildup(pattern, sample_cache, min_hits, max_hits, pattern_size)
            if not buildups:
                continue
            
            # Calculate hit rate in sample
            hit_count = len(buildups)
            hit_rate = (hit_count / len(sample)) * 100
            if hit_rate < 10:  # Min 10% hit rate filter
                continue
            
            # Check last full hit
            last_full_hit_idx = check_last_full_hit(pattern, tracking_cache, pattern_size)
            
            if not_hit_in > 0:
                tracking_size = len(tracking_cache)
                if last_full_hit_idx != -1:
                    bets_ago = (tracking_size - 1) - last_full_hit_idx
                    if bets_ago < not_hit_in:
                        continue  # Pattern hit too recently
            
            filtered_patterns.append(pattern_obj)
        
        # Evaluate predictions
        if filtered_patterns:
            preds, successes, avg_rounds, maintaining, avg_profit = evaluate_predictions(
                history, current_idx, filtered_patterns, lookahead, pattern_size, bet_multis, difficulty
            )
            total_predictions += preds
            total_successes += successes
            total_maintaining += maintaining
            if avg_rounds > 0:
                total_rounds_to_hit.append(avg_rounds)
            if avg_profit != 0:
                total_profit.append(avg_profit)
            evaluation_points += 1
    
    # Calculate metrics
    success_rate = (total_successes / total_predictions * 100) if total_predictions > 0 else 0
    maintaining_rate = (total_maintaining / total_predictions * 100) if total_predictions > 0 else 0
    avg_rounds_to_hit = sum(total_rounds_to_hit) / len(total_rounds_to_hit) if total_rounds_to_hit else 0
    avg_predictions_per_point = total_predictions / evaluation_points if evaluation_points > 0 else 0
    avg_profit = sum(total_profit) / len(total_profit) if total_profit else 0
    
    return {
        'params': params,
        'evaluation_points': evaluation_points,
        'total_predictions': total_predictions,
        'total_successes': total_successes,
        'total_maintaining': total_maintaining,
        'success_rate': success_rate,
        'maintaining_rate': maintaining_rate,
        'avg_rounds_to_hit': avg_rounds_to_hit,
        'avg_predictions_per_point': avg_predictions_per_point,
        'avg_profit': avg_profit
    }

def optimize_parameters(history, pattern_size, bet_multis=None, difficulty='high', use_recency=False, decay_factor=0.98):
    """
    Test various parameter combinations and find optimal settings
    """
    print(f"\n{'='*80}")
    print(f"TESTING PATTERN SIZE: {pattern_size} (Difficulty: {difficulty})")
    print(f"{'='*80}\n")
    
    # Define parameter ranges to test based on pattern size
    # min_hits and max_hits must be less than pattern_size (full hit = completion, not buildup)
    # Generate sensible ranges based on pattern size
    if pattern_size == 3:
        min_hits_range = [1, 2]
        max_hits_range = [2, 3]
    elif pattern_size == 4:
        min_hits_range = [1, 3]
        max_hits_range = [3, 5]
    elif pattern_size == 5:
        min_hits_range = [1, 4]
        max_hits_range = [3, 4]
    elif pattern_size == 6:
        min_hits_range = [3, 4, 5]
        max_hits_range = [4, 5]
    elif pattern_size == 7:
        min_hits_range = [4, 5, 6]
        max_hits_range = [5, 6]
    elif pattern_size == 8:
        min_hits_range = [5, 6, 7]
        max_hits_range = [6, 7]
    elif pattern_size == 9:
        min_hits_range = [6, 7, 8]
        max_hits_range = [7, 8]
    elif pattern_size == 10:
        min_hits_range = [7, 8, 9]
        max_hits_range = [8, 9]
    else:
        # Fallback for any other size
        min_hits_range = [max(1, pattern_size - 2), pattern_size - 1]
        max_hits_range = [pattern_size - 1]
    
    param_grid = {
        'sample_size': [5, 10, 25 ,50, 75, 100, 150, 200],
        'min_hits': min_hits_range,
        'max_hits': max_hits_range,
        'not_hit_in': [0, 50, 100, 1000]
    }
    
    results = []
    total_tests = (
        len(param_grid['sample_size']) * 
        len(param_grid['min_hits']) * 
        len(param_grid['max_hits']) * 
        len(param_grid['not_hit_in'])
    )
    
    print(f"Testing {total_tests} parameter combinations...")
    print("This may take a few minutes...\n")
    
    test_num = 0
    start_time = time.time()
    
    for sample_size in param_grid['sample_size']:
        for min_hits in param_grid['min_hits']:
            for max_hits in param_grid['max_hits']:
                if min_hits > max_hits:
                    continue
                
                for not_hit_in in param_grid['not_hit_in']:
                    test_num += 1
                    
                    params = {
                        'sample_size': sample_size,
                        'min_hits': min_hits,
                        'max_hits': max_hits,
                        'not_hit_in': not_hit_in
                    }
                    
                    elapsed = time.time() - start_time
                    progress = (test_num / total_tests) * 100
                    remaining = (elapsed / test_num) * (total_tests - test_num)
                    print(f"\n[TEST {test_num}/{total_tests}] ({progress:.1f}%) - Elapsed: {elapsed:.0f}s, Est. Remaining: {remaining:.0f}s")
                    print(f"  Parameters: sample={sample_size}, hits={min_hits}-{max_hits}, notHitIn={not_hit_in}")
                    
                    result = run_backtest(history, params, test_num, total_tests, pattern_size, bet_multis, difficulty, use_recency, decay_factor)
                    result['pattern_size'] = pattern_size
                    results.append(result)
                    
                    # Show result immediately
                    if result['total_predictions'] > 0:
                        maintaining_info = f", {result['maintaining_rate']:.1f}% maintaining" if bet_multis else ""
                        profit_info = f", avg profit: {result['avg_profit']:.2f}x" if bet_multis else ""
                        print(f"  ✓ Result: {result['success_rate']:.2f}% success{maintaining_info}{profit_info}, {result['avg_rounds_to_hit']:.1f} avg rounds, {result['total_predictions']} predictions")
                    else:
                        print(f"  ✗ No predictions with these parameters")
                    if result['total_predictions'] > 0:
                        print(f"  ✓ Result: {result['success_rate']:.2f}% success, {result['avg_rounds_to_hit']:.1f} avg rounds, {result['total_predictions']} predictions")
                    else:
                        print(f"  ✗ No predictions with these parameters")
    
    elapsed = time.time() - start_time
    print(f"\nCompleted {total_tests} tests in {elapsed:.1f}s")
    print(f"Average: {elapsed/total_tests:.2f}s per test\n")
    
    # Sort by success rate
    results.sort(key=lambda x: x['success_rate'], reverse=True)
    
    return results

def print_results(results, top_n=20):
    """Print top N results"""
    pattern_size = results[0].get('pattern_size', 5) if results else 5
    print("="*100)
    print(f"TOP {top_n} PARAMETER COMBINATIONS (by Success Rate) - Pattern Size: {pattern_size}")
    print("=" * 100)
    print()
    
    header = f"{'Rank':<5} {'Sample':<8} {'Hits':<8} {'NotHit':<8} {'Success%':<10} {'AvgRounds':<10} {'Preds/Eval':<12} {'Evals':<8}"
    print(header)
    print("-" * 100)
    
    for i, result in enumerate(results[:top_n], 1):
        p = result['params']
        hits = f"{p['min_hits']}-{p['max_hits']}"
        
        print(f"{i:<5} {p['sample_size']:<8} {hits:<8} {p['not_hit_in']:<8} "
              f"{result['success_rate']:<10.2f} {result['avg_rounds_to_hit']:<10.1f} "
              f"{result['avg_predictions_per_point']:<12.1f} {result['evaluation_points']:<8}")
    
    print("\n" + "=" * 100)
    print("ANALYSIS")
    print("=" * 100)
    
    # Best overall
    best = results[0]
    p = best['params']
    print(f"\nBest Overall Settings:")
    print(f"  Sample Size: {p['sample_size']} rounds")
    print(f"  Min/Max Hits: {p['min_hits']}-{p['max_hits']} out of {pattern_size}")
    print(f"  Not Hit In: {p['not_hit_in']} rounds")
    print(f"  Success Rate: {best['success_rate']:.2f}%")
    print(f"  Avg Rounds to Hit: {best['avg_rounds_to_hit']:.1f}")
    print(f"  Predictions per Evaluation: {best['avg_predictions_per_point']:.1f}")
    
    # Best for quick hits (lowest avg rounds to hit, min 15% success rate)
    quick_results = [r for r in results if r['success_rate'] >= 15]
    if quick_results:
        quick_results.sort(key=lambda x: x['avg_rounds_to_hit'])
        quick = quick_results[0]
        p = quick['params']
        print(f"\nBest for Quick Hits (≥15% success, fastest completion):")
        print(f"  Sample Size: {p['sample_size']} rounds")
        print(f"  Min/Max Hits: {p['min_hits']}-{p['max_hits']} out of {pattern_size}")
        print(f"  Not Hit In: {p['not_hit_in']} rounds")
        print(f"  Success Rate: {quick['success_rate']:.2f}%")
        print(f"  Avg Rounds to Hit: {quick['avg_rounds_to_hit']:.1f}")
    
    # Best balance (success rate * (1 / avg_rounds), more weight on success)
    for r in results:
        if r['avg_rounds_to_hit'] > 0:
            r['balance_score'] = r['success_rate'] * (50 / r['avg_rounds_to_hit'])
        else:
            r['balance_score'] = 0
    
    results.sort(key=lambda x: x['balance_score'], reverse=True)
    balanced = results[0]
    p = balanced['params']
    print(f"\nBest Balanced (success rate weighted by speed):")
    print(f"  Sample Size: {p['sample_size']} rounds")
    print(f"  Min/Max Hits: {p['min_hits']}-{p['max_hits']} out of {pattern_size}")
    print(f"  Not Hit In: {p['not_hit_in']} rounds")
    print(f"  Success Rate: {balanced['success_rate']:.2f}%")
    print(f"  Avg Rounds to Hit: {balanced['avg_rounds_to_hit']:.1f}")
    print(f"  Balance Score: {balanced['balance_score']:.2f}")
    
    print("\n" + "=" * 100)

def get_output_filename(pattern_sizes, difficulty, track_maintaining):
    """Generate indexed output filename based on parameters"""
    # Build filename components
    sizes_str = ''.join(str(s) for s in sorted(pattern_sizes))
    diff_str = difficulty if track_maintaining else 'notrack'
    base_name = f"optimization-results-p{sizes_str}-{diff_str}"
    
    # Find next available index
    output_dir = Path(__file__).parent / 'output'
    output_dir.mkdir(exist_ok=True)  # Create output directory if it doesn't exist
    
    index = 1
    while True:
        filename = f"{base_name}-{index:03d}.json"
        filepath = output_dir / filename
        if not filepath.exists():
            return filepath
        index += 1

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Optimize Keno pattern parameters')
    parser.add_argument('--pattern-sizes', type=int, nargs='+', default=[5],
                      help='Pattern sizes to test (e.g., --pattern-sizes 3 4 5 6 7 8 9 10)')
    parser.add_argument('--data-file', type=str,
                      help='Path to data file (optional, will use latest by default)')
    parser.add_argument('-m', '--track-maintaining', action='store_true',
                      help='Track profitability and maintaining patterns (uses bet multipliers)')
    parser.add_argument('-d', '--difficulty', type=str, choices=['high', 'medium', 'low'], default='high',
                      help='Bet difficulty level for profitability calculations (default: high)')
    parser.add_argument('--limit', type=int, default=None,
                      help='Limit dataset to last N rounds (default: use all rounds)')
    parser.add_argument('-r', '--recency-weight', action='store_true',
                      help='Enable recency-weighted scoring (favor recent pattern appearances)')
    parser.add_argument('--decay', type=float, default=0.98,
                      help='Decay factor for recency weighting, 0.9-0.99 (default: 0.98, higher=stronger recency bias)')
    args = parser.parse_args()
    
    # Get data file path
    if args.data_file:
        data_file = Path(args.data_file)
    else:
        # Use the latest file from data directory
        data_file = Path(__file__).parent.parent / 'data' / 'keno-history-1765519065670.json'
    
    if not data_file.exists():
        print(f"Error: Data file not found: {data_file}")
        sys.exit(1)
    
    print(f"Loading data from: {data_file}")
    history = load_history(data_file)
    
    # Apply dataset limit if specified
    if args.limit and args.limit < len(history):
        original_length = len(history)
        history = history[-args.limit:]  # Take last N rounds
        print(f"Limited dataset to last {args.limit} rounds (from {original_length} total)")
    
    print(f"Using {len(history)} rounds of history for optimization")
    
    # Load bet multipliers if tracking maintaining
    bet_multis = None
    if args.track_maintaining:
        bet_multis = load_bet_multis()
        print(f"Loaded bet multipliers for maintaining analysis (difficulty: {args.difficulty})")
    
    # Display recency weighting status
    if args.recency_weight:
        print(f"Recency weighting ENABLED (decay factor: {args.decay})")
        print("Testing if recent patterns predict near-future completions better than frequency alone...\n")
    
    # Run optimization for each pattern size
    print("Starting parameter optimization...\n")
    
    all_results = {}
    for pattern_size in args.pattern_sizes:
        if pattern_size < 3 or pattern_size > 10:
            print(f"Warning: Skipping pattern_size={pattern_size} (must be 3-10)")
            continue
            
        results = optimize_parameters(history, pattern_size, bet_multis, args.difficulty, args.recency_weight, args.decay)
        all_results[pattern_size] = results
    
    # Print and save results for each pattern size
    output_data = {}
    for pattern_size, results in all_results.items():
        print_results(results)
        output_data[f"pattern_size_{pattern_size}"] = results
    
    # Save detailed results to JSON with indexed filename
    output_file = get_output_filename(args.pattern_sizes, args.difficulty, args.track_maintaining)
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    print(f"\nDetailed results saved to: {output_file}")

if __name__ == '__main__':
    main()
