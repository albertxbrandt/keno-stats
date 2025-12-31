// src/keno-tool/generators/conditionEvaluator.js
// Evaluates advanced refresh conditions for generator auto-refresh

/**
 * Calculate metric value from round history
 * @param {string} metric - Metric type (betsWon, betsLost, winRate, etc.)
 * @param {Array} history - Round history array
 * @param {number} rounds - Lookback period
 * @returns {number} Calculated metric value
 */
export function calculateMetric(metric, history, rounds) {
  const recent = history.slice(-rounds);

  switch (metric) {
    case 'betsWon':
    case 'winCount':
      return recent.filter((round) => {
        const amount = parseFloat(round.kenoBet?.amount) || 0;
        const payout = parseFloat(round.kenoBet?.payout) || 0;
        return payout >= amount; // Win or break-even
      }).length;

    case 'betsLost':
    case 'lossCount':
      return recent.filter((round) => {
        const amount = parseFloat(round.kenoBet?.amount) || 0;
        const payout = parseFloat(round.kenoBet?.payout) || 0;
        return payout < amount; // Loss
      }).length;

    case 'winRate': {
      const wins = calculateMetric('betsWon', history, rounds);
      return rounds > 0 ? (wins / rounds) * 100 : 0;
    }

    case 'totalProfit':
      return recent.reduce((sum, round) => {
        const amount = parseFloat(round.kenoBet?.amount) || 0;
        const payout = parseFloat(round.kenoBet?.payout) || 0;
        return sum + (payout - amount);
      }, 0);

    case 'averageProfit': {
      const total = calculateMetric('totalProfit', history, rounds);
      return rounds > 0 ? total / rounds : 0;
    }

    case 'profitStreak':
      return calculateCurrentStreak(history, 'profit');

    case 'lossStreak':
      return calculateCurrentStreak(history, 'loss');

    case 'totalHits':
      return recent.reduce((sum, round) => sum + (round.hits?.length || 0), 0);

    case 'totalMisses':
      return recent.reduce((sum, round) => sum + (round.misses?.length || 0), 0);

    case 'hitRate': {
      const totalHits = calculateMetric('totalHits', history, rounds);
      const totalSelected = recent.reduce(
        (sum, round) => sum + (round.selected?.length || 0),
        0
      );
      return totalSelected > 0 ? (totalHits / totalSelected) * 100 : 0;
    }

    case 'averageHits': {
      const hits = calculateMetric('totalHits', history, rounds);
      return rounds > 0 ? hits / rounds : 0;
    }

    default:
      return 0;
  }
}

/**
 * Calculate current win/loss streak (ending at most recent round)
 * @param {Array} history - Round history array
 * @param {string} type - 'profit' or 'loss'
 * @returns {number} Current streak count
 */
function calculateCurrentStreak(history, type) {
  if (history.length === 0) return 0;

  let streak = 0;

  // Count backwards from most recent round
  for (let i = history.length - 1; i >= 0; i--) {
    const round = history[i];
    const amount = parseFloat(round.kenoBet?.amount) || 0;
    const payout = parseFloat(round.kenoBet?.payout) || 0;
    const isProfitable = payout >= amount;

    if ((type === 'profit' && isProfitable) || (type === 'loss' && !isProfitable)) {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}

/**
 * Evaluate a single condition against history
 * @param {Object} condition - Condition object { metric, operator, value, rounds }
 * @param {Array} history - Round history array
 * @returns {boolean} True if condition is met
 */
export function evaluateCondition(condition, history) {
  const { metric, operator, value, rounds } = condition;

  // Not enough history to evaluate
  if (history.length < rounds) {
    return false;
  }

  const metricValue = calculateMetric(metric, history, rounds);

  switch (operator) {
    case '>':
      return metricValue > value;
    case '<':
      return metricValue < value;
    case '>=':
      return metricValue >= value;
    case '<=':
      return metricValue <= value;
    case '==':
      return metricValue === value;
    default:
      return false;
  }
}

/**
 * Evaluate advanced rules and return action
 * @param {Object} rules - Advanced rules object from state
 * @param {Array} history - Round history array
 * @param {number} lastRefreshRound - Round number when numbers were last changed
 * @returns {string} 'stay' or 'switch'
 */
export function evaluateRules(rules, history, lastRefreshRound = 0) {
  // Rules disabled or no conditions
  if (!rules?.enabled || !rules.conditions || rules.conditions.length === 0) {
    return 'switch'; // Default to switching
  }

  const { conditions, logic, defaultAction } = rules;
  
  // Only look at rounds since last refresh (current number set)
  const roundsSinceRefresh = history.length - lastRefreshRound;
  const recentHistory = history.slice(lastRefreshRound);

  console.warn(`[Advanced Rules] Evaluating ${conditions.length} condition(s) with ${logic || 'OR'} logic, ${roundsSinceRefresh} rounds since refresh`);

  // Phase 3: Multiple conditions with AND/OR logic
  if (logic === 'AND' && conditions.length > 1) {
    // All conditions must match AND have same action
    let allMet = true;
    const firstAction = conditions[0].action;
    
    for (const cond of conditions) {
      // Skip condition if not enough data
      const minRounds = cond.metric.includes('Streak') ? 1 : cond.rounds;
      if (roundsSinceRefresh < minRounds) {
        console.warn(`[Advanced Rules] Not enough data for condition (need ${minRounds}, have ${roundsSinceRefresh})`);
        allMet = false;
        break;
      }
      
      const conditionMet = evaluateCondition(cond, recentHistory);
      const metricValue = calculateMetric(cond.metric, recentHistory, cond.rounds);
      
      console.warn(`[Advanced Rules] ${cond.metric} = ${metricValue} ${cond.operator} ${cond.value}: ${conditionMet ? 'MET' : 'NOT MET'}`);
      
      if (!conditionMet) {
        allMet = false;
        break;
      }
      
      // Check if all actions match
      if (cond.action !== firstAction) {
        console.warn(`[Advanced Rules] AND logic requires same action for all conditions`);
        return defaultAction || 'switch';
      }
    }
    
    if (allMet) {
      console.warn(`[Advanced Rules] All AND conditions met, action: ${firstAction}`);
      return firstAction;
    }
    
    console.warn(`[Advanced Rules] Not all AND conditions met, default: ${defaultAction || 'switch'}`);
    return defaultAction || 'switch';
  }
  
  // OR logic (default): First matching condition wins
  for (const cond of conditions) {
    // Skip condition if not enough data
    const minRounds = cond.metric.includes('Streak') ? 1 : cond.rounds;
    if (roundsSinceRefresh < minRounds) {
      console.warn(`[Advanced Rules] Skipping condition (need ${minRounds} rounds, have ${roundsSinceRefresh})`);
      continue;
    }
    
    const conditionMet = evaluateCondition(cond, recentHistory);
    const metricValue = calculateMetric(cond.metric, recentHistory, cond.rounds);
    
    console.warn(`[Advanced Rules] ${cond.metric} = ${metricValue} ${cond.operator} ${cond.value}: ${conditionMet ? 'MET' : 'NOT MET'}`);
    
    if (conditionMet) {
      console.warn(`[Advanced Rules] Condition met, action: ${cond.action}`);
      return cond.action;
    }
  }
  
  // No conditions met
  const oppositeAction = conditions[0].action === 'switch' ? 'stay' : 'switch';
  console.warn(`[Advanced Rules] No conditions met, returning: ${oppositeAction}`);
  return oppositeAction;
}

/**
 * Migrate legacy generatorStayIfProfitable to advanced rules
 * @param {boolean} stayIfProfitable - Legacy boolean setting
 * @param {Object} currentRules - Current advanced rules (if any)
 * @param {number} interval - Generator interval
 * @returns {Object} Migrated advanced rules object
 */
export function migrateLegacyRule(stayIfProfitable, currentRules, interval) {
  // Already migrated or advanced rules exist
  if (currentRules?.enabled || currentRules?.conditions?.length > 0) {
    return currentRules;
  }

  // Legacy toggle was enabled - convert to basic condition
  if (stayIfProfitable) {
    return {
      enabled: true,
      defaultAction: 'switch',
      logic: 'AND',
      conditions: [
        {
          id: 1,
          action: 'stay',
          metric: 'betsWon',
          operator: '>',
          value: 0,
          rounds: interval || 5
        }
      ]
    };
  }

  // No migration needed
  return currentRules;
}
