"""
Quick test script for momentum generator
Verifies basic functionality without full backtest
"""

import json
import sys
from pathlib import Path

def load_history(filepath):
    """Load Keno game history from JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)

def get_drawn_numbers(round_data):
    """Extract drawn numbers from round data"""
    if 'drawn' in round_data:
        return round_data['drawn']
    return sorted(round_data.get('hits', []) + round_data.get('misses', []))

class MomentumPatternGenerator:
    """Momentum-based pattern generator"""
    
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
        should_refresh = (
            len(self.current_pattern) == 0 or
            current_round_number % self.config['refresh_frequency'] == 0
        )
        
        if should_refresh:
            if len(history) < self.config['baseline_window']:
                return self.get_fallback_pattern(history)
            
            self.current_pattern = self.generate_pattern(history)
            self.last_refresh_round = current_round_number
        
        return self.current_pattern
    
    def generate_pattern(self, history):
        hot_numbers = self.identify_hot_numbers(history)
        top_candidates = hot_numbers[:self.config['top_n_pool']]
        
        pattern = [item['number'] for item in top_candidates[:self.config['pattern_size']]]
        
        if len(pattern) < self.config['pattern_size']:
            fallback = self.get_most_frequent_numbers(
                history,
                self.config['pattern_size'] - len(pattern),
                pattern
            )
            pattern.extend(fallback)
        
        return sorted(pattern)
    
    def identify_hot_numbers(self, history):
        hot_numbers = []
        
        for number in range(1, 41):
            momentum = self.calculate_momentum(number, history)
            
            if momentum is not None and momentum >= self.config['momentum_threshold']:
                hot_numbers.append({'number': number, 'momentum': momentum})
        
        return sorted(hot_numbers, key=lambda x: x['momentum'], reverse=True)
    
    def calculate_momentum(self, number, history):
        if len(history) < self.config['baseline_window']:
            return None
        
        recent_rounds = history[-self.config['detection_window']:]
        baseline_rounds = history[-self.config['baseline_window']:]
        
        recent_count = sum(1 for round_data in recent_rounds 
                          if number in get_drawn_numbers(round_data))
        baseline_count = sum(1 for round_data in baseline_rounds 
                            if number in get_drawn_numbers(round_data))
        
        recent_freq = recent_count / self.config['detection_window']
        baseline_freq = baseline_count / self.config['baseline_window']
        
        if baseline_freq == 0:
            return 999 if recent_count > 0 else 0
        
        return recent_freq / baseline_freq
    
    def get_most_frequent_numbers(self, history, count, exclude=None):
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
        if len(history) == 0:
            return self.get_random_pattern()
        
        return self.get_most_frequent_numbers(history, self.config['pattern_size'], [])
    
    def get_random_pattern(self):
        import random
        numbers = list(range(1, 41))
        random.shuffle(numbers)
        return sorted(numbers[:self.config['pattern_size']])

def test_basic_functionality():
    """Test basic momentum generator functions"""
    print("="*60)
    print("MOMENTUM GENERATOR - QUICK TEST")
    print("="*60)
    
    # Load data
    data_file = Path(__file__).parent.parent / 'data' / 'keno-history-1765519065670.json'
    if not data_file.exists():
        print(f"Error: Data file not found: {data_file}")
        return False
    
    history = load_history(data_file)
    print(f"\n✓ Loaded {len(history)} rounds of history")
    
    # Create generator
    config = {
        'pattern_size': 10,
        'detection_window': 5,
        'baseline_window': 50,
        'momentum_threshold': 1.5,
        'refresh_frequency': 5,
        'top_n_pool': 15
    }
    generator = MomentumPatternGenerator(config)
    print(f"✓ Created generator with config: {config}")
    
    # Test with sufficient history
    test_round = 100
    test_history = history[:test_round]
    
    if len(test_history) < config['baseline_window']:
        print(f"\n✗ Not enough history for test (need {config['baseline_window']}, have {len(test_history)})")
        return False
    
    print(f"\n✓ Testing with {len(test_history)} rounds")
    
    # Generate pattern
    pattern = generator.get_pattern(test_history, test_round)
    print(f"\n✓ Generated pattern: {pattern}")
    print(f"  Pattern size: {len(pattern)}")
    print(f"  All numbers 1-40: {all(1 <= n <= 40 for n in pattern)}")
    print(f"  No duplicates: {len(pattern) == len(set(pattern))}")
    
    # Test momentum calculation for a few numbers
    print(f"\n✓ Momentum values for sample numbers:")
    for num in [1, 10, 20, 30, 40]:
        momentum = generator.calculate_momentum(num, test_history)
        status = "HOT" if momentum and momentum >= config['momentum_threshold'] else "normal"
        print(f"  Number {num:2d}: {momentum:.2f} ({status})")
    
    # Get all hot numbers
    hot_numbers = generator.identify_hot_numbers(test_history)
    print(f"\n✓ Found {len(hot_numbers)} hot numbers (momentum ≥ {config['momentum_threshold']})")
    if hot_numbers:
        print(f"  Top 5 hottest:")
        for item in hot_numbers[:5]:
            print(f"    {item['number']:2d}: momentum={item['momentum']:.2f}")
    
    # Test pattern refresh
    print(f"\n✓ Testing pattern refresh:")
    pattern1 = generator.get_pattern(test_history, test_round)
    pattern2 = generator.get_pattern(test_history, test_round + 1)  # Not refresh time
    pattern3 = generator.get_pattern(test_history, test_round + 5)  # Refresh time
    
    print(f"  Round {test_round}: {pattern1}")
    print(f"  Round {test_round + 1}: {pattern2} (should be same)")
    print(f"  Round {test_round + 5}: {pattern3} (should refresh)")
    print(f"  Pattern persisted: {pattern1 == pattern2}")
    
    # Test with minimal history (fallback)
    print(f"\n✓ Testing fallback with minimal history:")
    minimal_history = history[:10]
    fallback_pattern = generator.get_pattern(minimal_history, 10)
    print(f"  Fallback pattern: {fallback_pattern}")
    print(f"  Valid pattern: {len(fallback_pattern) == config['pattern_size']}")
    
    print(f"\n{'='*60}")
    print("ALL TESTS PASSED ✓")
    print(f"{'='*60}\n")
    
    return True

if __name__ == '__main__':
    try:
        success = test_basic_functionality()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
