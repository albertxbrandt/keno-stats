#!/usr/bin/env python3
"""
Keno History Trend Analysis
Identifies patterns and trends before all 40 numbers hit
"""

import json
import sys
from collections import defaultdict, Counter
from pathlib import Path

def load_history(file_path):
    """Load keno history from JSON file"""
    with open(file_path, 'r') as f:
        return json.load(f)

def analyze_number_appearance_order(history):
    """Analyze which numbers appear first vs last across all rounds"""
    print("\n" + "="*80)
    print("NUMBER APPEARANCE ORDER ANALYSIS")
    print("="*80)
    
    # Track when each number (1-40) first appears
    first_appearances = defaultdict(list)
    last_appearances = defaultdict(list)
    appearance_positions = defaultdict(list)
    
    # Track all 40 numbers seen
    all_numbers_seen = set()
    rounds_to_see_all = None
    
    for round_idx, bet in enumerate(history):
        drawn = bet.get('drawn', [])
        
        for pos, num in enumerate(drawn):
            if num not in all_numbers_seen:
                first_appearances[num].append(round_idx)
                all_numbers_seen.add(num)
            
            appearance_positions[num].append(pos)
        
        # Check if we've seen all 40 numbers
        if len(all_numbers_seen) == 40 and rounds_to_see_all is None:
            rounds_to_see_all = round_idx + 1
            # Identify which numbers appeared last
            for num in range(1, 41):
                if num in first_appearances and first_appearances[num]:
                    if first_appearances[num][0] >= round_idx - 10:
                        last_appearances[num] = first_appearances[num][0]
    
    print(f"\nTotal rounds analyzed: {len(history)}")
    print(f"Rounds needed to see all 40 numbers: {rounds_to_see_all}")
    
    # Find numbers that appear earliest on average
    avg_first_appearance = {}
    for num in range(1, 41):
        if num in first_appearances and first_appearances[num]:
            avg_first_appearance[num] = sum(first_appearances[num]) / len(first_appearances[num])
    
    sorted_early = sorted(avg_first_appearance.items(), key=lambda x: x[1])[:10]
    sorted_late = sorted(avg_first_appearance.items(), key=lambda x: x[1], reverse=True)[:10]
    
    print("\n--- EARLIEST APPEARING NUMBERS (most frequent) ---")
    for num, avg_round in sorted_early:
        print(f"  Number {num:2d}: First seen around round {avg_round:.1f}")
    
    print("\n--- LATEST APPEARING NUMBERS (rarest) ---")
    for num, avg_round in sorted_late:
        print(f"  Number {num:2d}: First seen around round {avg_round:.1f}")
    
    return first_appearances, appearance_positions

def analyze_hot_cold_streaks(history):
    """Analyze hot and cold streaks for each number"""
    print("\n" + "="*80)
    print("HOT/COLD STREAK ANALYSIS")
    print("="*80)
    
    # Track last seen round for each number
    last_seen = {}
    max_gap = defaultdict(int)
    current_gap = defaultdict(int)
    hot_streaks = defaultdict(list)  # Track consecutive appearances
    
    for round_idx, bet in enumerate(history):
        drawn = bet.get('drawn', [])
        
        # Increment gaps for all numbers
        for num in range(1, 41):
            current_gap[num] += 1
        
        # Reset gap for drawn numbers
        for num in drawn:
            if current_gap[num] > max_gap[num]:
                max_gap[num] = current_gap[num]
            
            # Track hot streaks
            if num in last_seen and round_idx - last_seen[num] <= 3:
                hot_streaks[num].append(round_idx)
            
            current_gap[num] = 0
            last_seen[num] = round_idx
    
    print("\n--- NUMBERS WITH LONGEST DRY SPELLS (max rounds without appearing) ---")
    sorted_gaps = sorted(max_gap.items(), key=lambda x: x[1], reverse=True)[:10]
    for num, gap in sorted_gaps:
        print(f"  Number {num:2d}: Max gap of {gap} rounds")
    
    print("\n--- NUMBERS WITH MOST HOT STREAKS (appeared within 3 rounds) ---")
    streak_counts = {num: len(streaks) for num, streaks in hot_streaks.items()}
    sorted_hot = sorted(streak_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    for num, count in sorted_hot:
        print(f"  Number {num:2d}: {count} hot streaks")
    
    return max_gap, hot_streaks

def analyze_pattern_before_rare_numbers(history):
    """Analyze what patterns appear before rarely seen numbers finally show up"""
    print("\n" + "="*80)
    print("PATTERNS BEFORE RARE NUMBERS APPEAR")
    print("="*80)
    
    # Identify rare numbers (those that take longest to appear)
    first_appearances = {}
    for round_idx, bet in enumerate(history):
        drawn = bet.get('drawn', [])
        for num in drawn:
            if num not in first_appearances:
                first_appearances[num] = round_idx
    
    # Get top 5 rarest (appeared latest)
    sorted_rare = sorted(first_appearances.items(), key=lambda x: x[1], reverse=True)[:5]
    
    print("\n--- ANALYZING PATTERNS BEFORE RARE NUMBERS ---")
    for rare_num, first_round in sorted_rare:
        if first_round < 5:
            continue
        
        print(f"\nNumber {rare_num} (first appeared in round {first_round + 1}):")
        
        # Look at 5 rounds before it appeared
        lookback = min(5, first_round)
        patterns_before = []
        
        for i in range(lookback):
            round_idx = first_round - lookback + i
            if round_idx >= 0:
                drawn = history[round_idx].get('drawn', [])
                patterns_before.extend(drawn)
        
        # Find most common numbers in rounds leading up
        common_before = Counter(patterns_before).most_common(10)
        print(f"  Most common numbers in {lookback} rounds before:")
        for num, count in common_before:
            print(f"    {num:2d} appeared {count} times")

def analyze_completion_patterns(history):
    """Analyze patterns when getting close to seeing all 40 numbers"""
    print("\n" + "="*80)
    print("COMPLETION PATTERN ANALYSIS")
    print("="*80)
    
    seen_numbers = set()
    numbers_per_round = []
    remaining_at_round = []
    
    for round_idx, bet in enumerate(history):
        drawn = bet.get('drawn', [])
        
        # Track how many new numbers each round
        new_numbers = 0
        for num in drawn:
            if num not in seen_numbers:
                seen_numbers.add(num)
                new_numbers += 1
        
        numbers_per_round.append(new_numbers)
        remaining_at_round.append(40 - len(seen_numbers))
        
        if len(seen_numbers) == 40:
            print(f"\nAll 40 numbers seen after {round_idx + 1} rounds")
            break
    
    # Analyze when most new numbers appear
    print("\n--- NEW NUMBERS DISCOVERY RATE ---")
    for i in range(0, min(len(numbers_per_round), 50), 10):
        window = numbers_per_round[i:i+10]
        avg_new = sum(window) / len(window) if window else 0
        print(f"  Rounds {i+1}-{i+10}: Avg {avg_new:.2f} new numbers per round")
    
    # Find which rounds had the most discovery
    top_discovery_rounds = sorted(enumerate(numbers_per_round), key=lambda x: x[1], reverse=True)[:5]
    print("\n--- ROUNDS WITH MOST NEW NUMBER DISCOVERIES ---")
    for round_idx, count in top_discovery_rounds:
        if count > 0:
            print(f"  Round {round_idx + 1}: {count} new numbers")

def find_predictive_patterns(history):
    """Try to find any predictive patterns"""
    print("\n" + "="*80)
    print("PREDICTIVE PATTERN ANALYSIS")
    print("="*80)
    
    # Analyze if certain number combinations predict others
    print("\n--- ANALYZING NUMBER PAIR CORRELATIONS ---")
    
    # Track which numbers appear together frequently
    pair_counts = defaultdict(int)
    total_rounds = len(history)
    
    for bet in history:
        drawn = bet.get('drawn', [])
        # Check all pairs
        for i, num1 in enumerate(drawn):
            for num2 in drawn[i+1:]:
                pair = tuple(sorted([num1, num2]))
                pair_counts[pair] += 1
    
    # Find strongest correlations
    sorted_pairs = sorted(pair_counts.items(), key=lambda x: x[1], reverse=True)[:15]
    print("\nMost frequently occurring number pairs:")
    for (num1, num2), count in sorted_pairs:
        percentage = (count / total_rounds) * 100
        print(f"  {num1:2d} & {num2:2d}: {count} times ({percentage:.1f}% of rounds)")
    
    # Analyze follow-up patterns
    print("\n--- FOLLOW-UP PATTERNS (if X appears, what's likely next round?) ---")
    follow_patterns = defaultdict(lambda: defaultdict(int))
    
    for i in range(len(history) - 1):
        current_drawn = history[i].get('drawn', [])
        next_drawn = history[i + 1].get('drawn', [])
        
        for curr_num in current_drawn:
            for next_num in next_drawn:
                follow_patterns[curr_num][next_num] += 1
    
    # Find numbers with strongest follow patterns
    print("\nNumbers that often predict others in next round:")
    for num in range(1, 11):  # Check first 10 numbers
        if num in follow_patterns:
            sorted_followers = sorted(follow_patterns[num].items(), key=lambda x: x[1], reverse=True)[:3]
            if sorted_followers:
                print(f"  After {num:2d}, most likely to see:", end=" ")
                for follower, count in sorted_followers:
                    print(f"{follower:2d}({count}x)", end=" ")
                print()

def analyze_pattern_completion_behavior(history, pattern_size=5, min_occurrences=5):
    """
    Analyze which patterns 'tease' with near-misses vs patterns that build up and complete.
    Identifies patterns that frequently hit 3/5, 4/5 but rarely complete vs patterns that
    build momentum and hit multiple times after first completion.
    """
    from itertools import combinations
    
    print("\n" + "="*80)
    print(f"PATTERN COMPLETION BEHAVIOR ANALYSIS (Size {pattern_size})")
    print("="*80)
    
    # First pass: count pattern frequency to filter out rare ones early
    print("\nPhase 1: Counting pattern frequencies...")
    pattern_frequency = defaultdict(int)
    
    for bet in history:
        drawn = bet.get('drawn', [])
        for combo in combinations(sorted(drawn), pattern_size):
            pattern_frequency[combo] += 1
    
    # Only analyze patterns that appear at least min_occurrences times
    frequent_patterns = {p for p, count in pattern_frequency.items() if count >= min_occurrences}
    
    print(f"Found {len(pattern_frequency)} unique patterns")
    print(f"Filtering to {len(frequent_patterns)} patterns with >={min_occurrences} appearances")
    print(f"\nPhase 2: Analyzing completion behavior across {len(history)} rounds...")
    
    # Pre-compute drawn sets for faster lookups
    drawn_sets = [set(bet.get('drawn', [])) for bet in history]
    
    pattern_stats = {}
    
    for pattern in frequent_patterns:
        pattern_set = set(pattern)
        hit_sequence = []  # Track hits over time: [2, 3, 4, 5, 3, 5, 2, ...]
        completion_rounds = []  # Rounds where it hit fully
        
        for round_idx, drawn_set in enumerate(drawn_sets):
            hits = len(pattern_set & drawn_set)
            hit_sequence.append((round_idx, hits))
            
            if hits == pattern_size:
                completion_rounds.append(round_idx)
        
        # Calculate metrics
        total_completions = len(completion_rounds)
        near_misses = sum(1 for _, hits in hit_sequence if hits >= pattern_size - 1 and hits < pattern_size)
        partial_hits = sum(1 for _, hits in hit_sequence if hits >= pattern_size - 2 and hits < pattern_size)
        
        # Find buildups before first completion
        buildups_before_first = []
        if completion_rounds:
            first_completion = completion_rounds[0]
            for round_idx, hits in hit_sequence:
                if round_idx < first_completion and hits >= pattern_size - 2:
                    buildups_before_first.append(hits)
        
        # Calculate time between consecutive completions
        completion_gaps = []
        if len(completion_rounds) > 1:
            for i in range(1, len(completion_rounds)):
                gap = completion_rounds[i] - completion_rounds[i-1]
                completion_gaps.append(gap)
        
        pattern_stats[pattern] = {
            'completions': total_completions,
            'near_misses': near_misses,
            'partial_hits': partial_hits,
            'buildups_before_first': len(buildups_before_first),
            'avg_buildup_hits': sum(buildups_before_first) / len(buildups_before_first) if buildups_before_first else 0,
            'completion_gaps': completion_gaps,
            'avg_gap': sum(completion_gaps) / len(completion_gaps) if completion_gaps else 0,
            'min_gap': min(completion_gaps) if completion_gaps else 0,
            'tease_ratio': near_misses / max(total_completions, 1)  # High ratio = teaser pattern
        }
    
    # Filter patterns with enough data
    filtered_patterns = {k: v for k, v in pattern_stats.items() if v['near_misses'] + v['completions'] >= min_occurrences}
    
    print(f"Filtered to {len(filtered_patterns)} patterns with at least {min_occurrences} near-misses or completions\n")
    
    # Debug: Show distribution of metrics
    if filtered_patterns:
        all_tease_ratios = [s['tease_ratio'] for s in filtered_patterns.values()]
        all_completions = [s['completions'] for s in filtered_patterns.values()]
        print(f"Tease ratio range: {min(all_tease_ratios):.1f} - {max(all_tease_ratios):.1f}")
        print(f"Completions range: {min(all_completions)} - {max(all_completions)}")
        print()
    
    # Category 1: TEASER PATTERNS (lots of near-misses, few completions)
    print("="*80)
    print("WARNING: TEASER PATTERNS (High near-misses, low completion rate)")
    print("="*80)
    print("These patterns frequently hit 3/5 or 4/5 but rarely complete - AVOID CHASING\n")
    
    teasers = sorted(
        [(p, s) for p, s in filtered_patterns.items() if s['tease_ratio'] >= 6 and s['completions'] <= 11],
        key=lambda x: x[1]['tease_ratio'],
        reverse=True
    )[:15]
    
    for pattern, stats in teasers:
        print(f"Pattern {list(pattern)}:")
        print(f"  Near-misses: {stats['near_misses']} | Completions: {stats['completions']} | Tease Ratio: {stats['tease_ratio']:.1f}x")
        print(f"  Total partial hits (3-4/5): {stats['partial_hits']}")
        print()
    
    # Category 2: MOMENTUM BUILDERS (build up and then hit multiple times)
    print("="*80)
    print("SUCCESS: MOMENTUM BUILDERS (Build up and deliver multiple completions)")
    print("="*80)
    print("These patterns show buildup (3->4->5) and hit multiple times quickly after first completion\n")
    
    builders = sorted(
        [(p, s) for p, s in filtered_patterns.items() 
         if s['completions'] >= 11 and s['buildups_before_first'] >= 5 and s['avg_gap'] > 0],
        key=lambda x: (x[1]['completions'], -x[1]['avg_gap']),
        reverse=True
    )[:15]
    
    for pattern, stats in builders:
        print(f"Pattern {list(pattern)}:")
        print(f"  Completions: {stats['completions']} | Buildups before 1st: {stats['buildups_before_first']}")
        print(f"  Avg gap between completions: {stats['avg_gap']:.1f} rounds | Min gap: {stats['min_gap']}")
        if stats['completion_gaps']:
            quick_hits = sum(1 for gap in stats['completion_gaps'] if gap <= 50)
            print(f"  Quick succession hits (<=50 rounds): {quick_hits}/{len(stats['completion_gaps'])}")
        print()
    
    # Category 3: CONSISTENT PERFORMERS (moderate completions, low tease ratio)
    print("="*80)
    print("TARGET: CONSISTENT PERFORMERS (Reliable completions, low noise)")
    print("="*80)
    print("These patterns complete regularly without excessive teasing\n")
    
    consistent = sorted(
        [(p, s) for p, s in filtered_patterns.items() 
         if s['completions'] >= 10 and s['tease_ratio'] <= 5],
        key=lambda x: x[1]['completions'],
        reverse=True
    )[:15]
    
    for pattern, stats in consistent:
        completion_rate = stats['completions'] / (stats['near_misses'] + stats['completions']) * 100
        print(f"Pattern {list(pattern)}:")
        print(f"  Completions: {stats['completions']} | Near-misses: {stats['near_misses']} | Tease Ratio: {stats['tease_ratio']:.1f}x")
        print(f"  Completion rate: {completion_rate:.1f}%")
        print()
    
    print("="*80)
    print("TIMING ANALYSIS: When to Chase vs Avoid")
    print("="*80)
    print("\nAnalyzing buildup windows before completions...\n")
    
    # Analyze buildup windows for all patterns
    buildup_windows = []
    for pattern, stats in filtered_patterns.items():
        pattern_set = set(pattern)
        
        # For each completion, look back to find when buildup started
        for round_idx, drawn_set in enumerate(drawn_sets):
            hits = len(pattern_set & drawn_set)
            if hits == pattern_size:  # This is a completion
                # Look back up to 50 rounds to find buildup
                buildup_start = None
                for lookback in range(1, min(51, round_idx + 1)):
                    prev_round = round_idx - lookback
                    prev_hits = len(pattern_set & drawn_sets[prev_round])
                    if prev_hits >= pattern_size - 2:  # 3/5 or 4/5
                        buildup_start = lookback
                    else:
                        break  # No longer in buildup zone
                
                if buildup_start:
                    buildup_windows.append(buildup_start)
    
    if buildup_windows:
        avg_window = sum(buildup_windows) / len(buildup_windows)
        print(f"Average buildup window: {avg_window:.1f} rounds before completion")
        print(f"Typical range: {min(buildup_windows)} - {max(buildup_windows)} rounds")
        
        # Find most common windows
        window_counts = Counter(buildup_windows)
        print("\nMost common buildup lengths:")
        for window, count in window_counts.most_common(10):
            pct = (count / len(buildup_windows)) * 100
            print(f"  {window} rounds: {count} times ({pct:.1f}%)")
    
    print("\n" + "="*80)
    print("RECOMMENDATIONS FOR LIVE PATTERN TOOL")
    print("="*80)
    print("1. EXCLUDE RECENT COMPLETIONS: Hide patterns that hit fully in last 20-50 rounds")
    print("2. SHOW BUILDING MOMENTUM: Display patterns with 3/5 or 4/5 in last 5-10 rounds")
    print("3. FLAG STALE BUILDUPS: If pattern shows 4/5 for >30 rounds without completing, likely a teaser")
    print("4. TRACK PROGRESSION: Prioritize patterns showing 2/5 -> 3/5 -> 4/5 trend in last 20 rounds")
    print("5. AVOID POST-HIT NOISE: Most patterns need 50+ rounds cooldown before next completion")
    print()

def main():
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = Path(__file__).parent.parent / 'data' / 'keno-history-1765486600537.json'
    
    print("="*80)
    print("KENO HISTORY TREND ANALYSIS")
    print("="*80)
    print(f"\nLoading data from: {file_path}")
    
    try:
        history = load_history(file_path)
        print(f"Loaded {len(history)} rounds of history")
        
        # Run all analyses
        analyze_number_appearance_order(history)
        analyze_hot_cold_streaks(history)
        analyze_pattern_before_rare_numbers(history)
        analyze_completion_patterns(history)
        find_predictive_patterns(history)
        analyze_pattern_completion_behavior(history, pattern_size=5, min_occurrences=10)
        
        print("\n" + "="*80)
        print("ANALYSIS COMPLETE")
        print("="*80)
        print("\nPOTENTIAL ALGORITHMS FOR PATTERN TOOL:")
        print("1. Prioritize numbers with shortest dry spells (recently hot)")
        print("2. Track pair correlations for combination suggestions")
        print("3. Use follow-up patterns to predict next round probabilities")
        print("4. Identify and avoid numbers in long cold streaks")
        print("5. Weight patterns based on recency (recent = more weight)")
        print("="*80)
        
    except FileNotFoundError:
        print(f"\nError: Could not find file: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"\nError: Invalid JSON in file: {file_path}")
        sys.exit(1)

if __name__ == "__main__":
    main()
