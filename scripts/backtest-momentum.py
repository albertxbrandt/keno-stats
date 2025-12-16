"""
Momentum Pattern Generator - Backtesting Script
Tests momentum-based pattern generation strategy across historical data.

The momentum approach:
1. Calculates Recent Frequency (last N rounds)
2. Calculates Baseline Frequency (last M rounds, M > N)
3. Momentum = Recent Frequency / Baseline Frequency
4. Numbers with momentum > threshold are "hot"
5. Generates patterns from top hot numbers

USAGE:
  Basic backtest with default settings:
    python scripts/backtest-momentum.py
  
  Test specific configuration:
    python scripts/backtest-momentum.py --pattern-size 10 --detection-window 5 --baseline-window 50
  
  Test multiple configurations:
    python scripts/backtest-momentum.py --optimize
  
  With profitability tracking:
    python scripts/backtest-momentum.py --track-maintaining -d high
  
  Custom data file:
    python scripts/backtest-momentum.py --data-file path/to/data.json
  
  Limit dataset:
    python scripts/backtest-momentum.py --limit 5000

FLAGS:
  --pattern-size       Pattern size (default: 10)
  --detection-window   Recent rounds for momentum detection (default: 5)
  --baseline-window    Historical rounds for baseline (default: 50)
  --momentum-threshold Minimum momentum to qualify as hot (default: 1.5)
  --refresh-frequency  Generate new pattern every N rounds (default: 5)
  --top-n-pool        Consider top N hot numbers (default: 15)
  --optimize          Test multiple configurations
  --data-file         Path to history JSON
  --limit             Limit dataset to last N rounds
  -m, --track-maintaining  Enable profitability tracking
  -d, --difficulty    Bet difficulty: high, medium, low
  
OUTPUT:
  Results saved to: scripts/output/momentum-results-{timestamp}.json
"""

import json
import sys
import argparse
from pathlib import Path
from collections import defaultdict
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

class MomentumPatternGenerator:
    """
    Momentum-based pattern generator
    Identifies numbers with acceleration above baseline frequency
    """
    
    def __init__(self, config=None):
        self.config = config or {
            'pattern_size': 10,
            'detection_window': 5,
            'baseline_window': 50,
            'momentum_threshold': 1.5,
            'refresh_frequency': 5,
            'top_n_pool': 15
        }
        self.current_pattern = []
        self.last_refresh_round = 0
    
    def get_pattern(self, history, current_round_number):
        """
        Main entry point - returns pattern for current round
        Auto-refreshes based on refresh_frequency
        """
        # Check if we need to refresh
        should_refresh = (
            len(self.current_pattern) == 0 or  # First time
            current_round_number % self.config['refresh_frequency'] == 0  # Time to refresh
        )
        
        if should_refresh:
            # Ensure minimum history available
            if len(history) < self.config['baseline_window']:
                return self.get_fallback_pattern(history)
            
            # Generate new pattern
            self.current_pattern = self.generate_pattern(history)
            self.last_refresh_round = current_round_number
        
        return self.current_pattern
    
    def generate_pattern(self, history):
        """Generate pattern from hot numbers"""
        hot_numbers = self.identify_hot_numbers(history)
        top_candidates = hot_numbers[:self.config['top_n_pool']]
        
        pattern = [item['number'] for item in top_candidates[:self.config['pattern_size']]]
        
        # Fill gaps if not enough hot numbers
        if len(pattern) < self.config['pattern_size']:
            fallback = self.get_most_frequent_numbers(
                history,
                self.config['pattern_size'] - len(pattern),
                pattern
            )
            pattern.extend(fallback)
        
        return sorted(pattern)
    
    def identify_hot_numbers(self, history):
        """Identify all hot numbers sorted by momentum"""
        hot_numbers = []
        
        for number in range(1, 41):
            momentum = self.calculate_momentum(number, history)
            
            if momentum is not None and momentum >= self.config['momentum_threshold']:
                hot_numbers.append({'number': number, 'momentum': momentum})
        
        return sorted(hot_numbers, key=lambda x: x['momentum'], reverse=True)
    
    def calculate_momentum(self, number, history):
        """
        Calculate momentum for a specific number
        Momentum = (Recent Frequency) / (Baseline Frequency)
        """
        if len(history) < self.config['baseline_window']:
            return None
        
        recent_rounds = history[-self.config['detection_window']:]
        baseline_rounds = history[-self.config['baseline_window']:]
        
        # Count appearances
        recent_count = sum(1 for round_data in recent_rounds 
                          if number in get_drawn_numbers(round_data))
        baseline_count = sum(1 for round_data in baseline_rounds 
                            if number in get_drawn_numbers(round_data))
        
        # Calculate frequencies
        recent_freq = recent_count / self.config['detection_window']
        baseline_freq = baseline_count / self.config['baseline_window']
        
        # Handle edge case: number never appeared in baseline
        if baseline_freq == 0:
            return 999 if recent_count > 0 else 0
        
        # Calculate momentum ratio
        return recent_freq / baseline_freq
    
    def get_most_frequent_numbers(self, history, count, exclude=None):
        """Get most frequent numbers from baseline as fallback"""
        if exclude is None:
            exclude = []
        
        frequencies = {i: 0 for i in range(1, 41)}
        
        baseline_rounds = history[-self.config['baseline_window']:]
        for round_data in baseline_rounds:
            for num in get_drawn_numbers(round_data):
                frequencies[num] += 1
        
        sorted_nums = sorted(
            [(num, freq) for num, freq in frequencies.items() if num not in exclude],
            key=lambda x: x[1],
            reverse=True
        )
        
        return [num for num, freq in sorted_nums[:count]]
    
    def get_fallback_pattern(self, history):
        """Fallback when not enough history"""
        if len(history) == 0:
            return self.get_random_pattern()
        
        return self.get_most_frequent_numbers(history, self.config['pattern_size'], [])
    
    def get_random_pattern(self):
        """Generate random pattern as last resort"""
        import random
        numbers = list(range(1, 41))
        random.shuffle(numbers)
        return sorted(numbers[:self.config['pattern_size']])
    
    def get_all_momentum_values(self, history):
        """Get momentum values for all 40 numbers"""
        results = []
        for number in range(1, 41):
            momentum = self.calculate_momentum(number, history)
            results.append({
                'number': number,
                'momentum': momentum,
                'is_hot': momentum is not None and momentum >= self.config['momentum_threshold']
            })
        return sorted(results, key=lambda x: x['momentum'] or 0, reverse=True)


def evaluate_pattern_performance(history, pattern, lookahead_rounds, bet_multis=None, difficulty='high'):
    """
    Evaluate if pattern completed in next lookahead_rounds
    Returns: (completed, rounds_to_hit, profit)
    """
    if lookahead_rounds > len(history):
        return False, 0, 0
    
    future_rounds = history[:lookahead_rounds]
    pattern_set = set(pattern)
    
    # Check if pattern completes
    for rounds_ahead, round_data in enumerate(future_rounds, 1):
        drawn = set(get_drawn_numbers(round_data))
        hits = len(pattern_set.intersection(drawn))
        
        # Check for full completion
        if pattern_set.issubset(drawn):
            profit = 0
            if bet_multis:
                pattern_size = len(pattern)
                multiplier = bet_multis.get(difficulty, {}).get(str(pattern_size), {}).get(str(pattern_size), 0)
                profit = multiplier - rounds_ahead
            
            return True, rounds_ahead, profit
    
    # Pattern didn't complete - check for best partial hit if tracking maintaining
    if bet_multis:
        best_profit = -lookahead_rounds  # Worst case: lose all rounds
        
        for rounds_ahead, round_data in enumerate(future_rounds, 1):
            drawn = set(get_drawn_numbers(round_data))
            hits = len(pattern_set.intersection(drawn))
            
            if hits > 0:
                pattern_size = len(pattern)
                multiplier = bet_multis.get(difficulty, {}).get(str(pattern_size), {}).get(str(hits), 0)
                if multiplier > 0:
                    profit = multiplier - rounds_ahead
                    best_profit = max(best_profit, profit)
        
        return False, 0, best_profit
    
    return False, 0, 0


def run_backtest(history, config, bet_multis=None, difficulty='high', verbose=False):
    """
    Backtest momentum strategy across historical data
    """
    generator = MomentumPatternGenerator(config)
    
    lookahead = 30  # Check if pattern completes in next 30 rounds
    start_idx = config['baseline_window'] + 100  # Need baseline + buffer
    
    total_predictions = 0
    total_completions = 0
    total_maintaining = 0
    rounds_to_hit = []
    profits = []
    
    # Track pattern changes
    pattern_changes = 0
    last_pattern = []
    
    print(f"\n{'='*80}")
    print(f"BACKTESTING MOMENTUM STRATEGY")
    print(f"{'='*80}")
    print(f"Config: pattern_size={config['pattern_size']}, detection={config['detection_window']}, "
          f"baseline={config['baseline_window']}, threshold={config['momentum_threshold']}")
    print(f"Dataset: {len(history)} rounds, testing from round {start_idx}")
    print(f"{'='*80}\n")
    
    # Evaluate every refresh_frequency rounds
    for current_idx in range(start_idx, len(history) - lookahead, config['refresh_frequency']):
        # Get history up to this point
        history_slice = history[:current_idx]
        
        # Get pattern for this round
        pattern = generator.get_pattern(history_slice, current_idx)
        
        # Track pattern changes
        if pattern != last_pattern:
            pattern_changes += 1
            last_pattern = pattern.copy()
            if verbose:
                print(f"Round {current_idx}: New pattern {pattern}")
        
        # Evaluate performance
        future_history = history[current_idx:]
        completed, rounds, profit = evaluate_pattern_performance(
            future_history, pattern, lookahead, bet_multis, difficulty
        )
        
        total_predictions += 1
        
        if completed:
            total_completions += 1
            rounds_to_hit.append(rounds)
        
        if bet_multis:
            profits.append(profit)
            if profit >= 0:
                total_maintaining += 1
        
        # Progress update every 50 evaluations
        if total_predictions % 50 == 0:
            progress = (current_idx - start_idx) / (len(history) - lookahead - start_idx) * 100
            print(f"Progress: {progress:.1f}% ({total_predictions} evaluations)")
    
    # Calculate metrics
    success_rate = (total_completions / total_predictions * 100) if total_predictions > 0 else 0
    maintaining_rate = (total_maintaining / total_predictions * 100) if total_predictions > 0 else 0
    avg_rounds_to_hit = sum(rounds_to_hit) / len(rounds_to_hit) if rounds_to_hit else 0
    avg_profit = sum(profits) / len(profits) if profits else 0
    
    results = {
        'config': config,
        'total_predictions': total_predictions,
        'total_completions': total_completions,
        'success_rate': success_rate,
        'avg_rounds_to_hit': avg_rounds_to_hit,
        'pattern_changes': pattern_changes,
    }
    
    if bet_multis:
        results['total_maintaining'] = total_maintaining
        results['maintaining_rate'] = maintaining_rate
        results['avg_profit'] = avg_profit
    
    return results


def print_results(results):
    """Print backtest results"""
    print(f"\n{'='*80}")
    print("RESULTS")
    print(f"{'='*80}")
    print(f"Total Predictions: {results['total_predictions']}")
    print(f"Completions: {results['total_completions']}")
    print(f"Success Rate: {results['success_rate']:.2f}%")
    print(f"Avg Rounds to Hit: {results['avg_rounds_to_hit']:.1f}")
    print(f"Pattern Changes: {results['pattern_changes']}")
    
    if 'maintaining_rate' in results:
        print(f"Maintaining Rate: {results['maintaining_rate']:.2f}%")
        print(f"Avg Profit: {results['avg_profit']:.2f}x")
    
    print(f"{'='*80}\n")


def optimize_parameters(history, bet_multis=None, difficulty='high'):
    """Test multiple configurations to find optimal settings"""
    print(f"\n{'='*80}")
    print("OPTIMIZING MOMENTUM PARAMETERS")
    print(f"{'='*80}\n")
    
    # Test grid
    configs = []
    
    for detection in [3, 5, 7, 10]:
        for baseline in [25, 50, 75, 100]:
            for threshold in [1.2, 1.5, 2.0, 2.5]:
                for refresh in [5, 10, 20]:
                    configs.append({
                        'pattern_size': 10,
                        'detection_window': detection,
                        'baseline_window': baseline,
                        'momentum_threshold': threshold,
                        'refresh_frequency': refresh,
                        'top_n_pool': 15
                    })
    
    results = []
    total_tests = len(configs)
    
    print(f"Testing {total_tests} configurations...\n")
    
    for i, config in enumerate(configs, 1):
        print(f"\n[TEST {i}/{total_tests}]")
        result = run_backtest(history, config, bet_multis, difficulty, verbose=False)
        results.append(result)
        
        print(f"Result: {result['success_rate']:.2f}% success, "
              f"{result['avg_rounds_to_hit']:.1f} avg rounds")
    
    # Sort by success rate
    results.sort(key=lambda x: x['success_rate'], reverse=True)
    
    return results


def print_top_configs(results, top_n=10):
    """Print top N configurations"""
    print(f"\n{'='*80}")
    print(f"TOP {top_n} CONFIGURATIONS (by Success Rate)")
    print(f"{'='*80}\n")
    
    for i, result in enumerate(results[:top_n], 1):
        c = result['config']
        print(f"{i}. Success: {result['success_rate']:.2f}% | "
              f"Avg Rounds: {result['avg_rounds_to_hit']:.1f} | "
              f"Detection: {c['detection_window']} | "
              f"Baseline: {c['baseline_window']} | "
              f"Threshold: {c['momentum_threshold']} | "
              f"Refresh: {c['refresh_frequency']}")
        
        if 'maintaining_rate' in result:
            print(f"   Maintaining: {result['maintaining_rate']:.2f}% | "
                  f"Avg Profit: {result['avg_profit']:.2f}x")
    
    print(f"\n{'='*80}\n")


def main():
    parser = argparse.ArgumentParser(description='Backtest momentum pattern generator')
    parser.add_argument('--pattern-size', type=int, default=10)
    parser.add_argument('--detection-window', type=int, default=5)
    parser.add_argument('--baseline-window', type=int, default=50)
    parser.add_argument('--momentum-threshold', type=float, default=1.5)
    parser.add_argument('--refresh-frequency', type=int, default=5)
    parser.add_argument('--top-n-pool', type=int, default=15)
    parser.add_argument('--optimize', action='store_true', help='Test multiple configurations')
    parser.add_argument('--data-file', type=str, help='Path to history JSON')
    parser.add_argument('--limit', type=int, help='Limit dataset to last N rounds')
    parser.add_argument('-m', '--track-maintaining', action='store_true')
    parser.add_argument('-d', '--difficulty', choices=['high', 'medium', 'low'], default='high')
    args = parser.parse_args()
    
    # Get data file
    if args.data_file:
        data_file = Path(args.data_file)
    else:
        data_file = Path(__file__).parent.parent / 'data' / 'keno-history-1765519065670.json'
    
    if not data_file.exists():
        print(f"Error: Data file not found: {data_file}")
        sys.exit(1)
    
    print(f"Loading data from: {data_file}")
    history = load_history(data_file)
    
    if args.limit and args.limit < len(history):
        history = history[-args.limit:]
        print(f"Limited to last {args.limit} rounds")
    
    print(f"Using {len(history)} rounds")
    
    # Load bet multipliers if needed
    bet_multis = None
    if args.track_maintaining:
        bet_multis = load_bet_multis()
        print(f"Tracking profitability (difficulty: {args.difficulty})")
    
    # Run optimization or single test
    if args.optimize:
        results = optimize_parameters(history, bet_multis, args.difficulty)
        print_top_configs(results)
        
        # Save results
        output_dir = Path(__file__).parent / 'output'
        output_dir.mkdir(exist_ok=True)
        output_file = output_dir / f"momentum-results-{int(time.time())}.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to: {output_file}")
    else:
        config = {
            'pattern_size': args.pattern_size,
            'detection_window': args.detection_window,
            'baseline_window': args.baseline_window,
            'momentum_threshold': args.momentum_threshold,
            'refresh_frequency': args.refresh_frequency,
            'top_n_pool': args.top_n_pool
        }
        
        results = run_backtest(history, config, bet_multis, args.difficulty, verbose=True)
        print_results(results)
        
        # Save results
        output_dir = Path(__file__).parent / 'output'
        output_dir.mkdir(exist_ok=True)
        output_file = output_dir / f"momentum-results-single-{int(time.time())}.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to: {output_file}")


if __name__ == '__main__':
    main()
