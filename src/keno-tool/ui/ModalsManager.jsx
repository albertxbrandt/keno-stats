import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useModals } from '@/keno-tool/hooks/useModals.js';
import { SavedNumbersModal } from './components/modals/SavedNumbersModal.jsx';
import { StatsModal } from './components/modals/StatsModal.jsx';
import { PatternAnalysisModal } from './components/modals/PatternAnalysisModal.jsx';
import { PatternLoadingModal } from './components/modals/PatternLoadingModal.jsx';
import { LivePatternAnalysisModal } from './components/modals/LivePatternAnalysisModal.jsx';
import { ComparisonWindow } from './components/modals/ComparisonWindow.jsx';
import {
  getSavedNumbers,
  deleteSavedNumber,
  saveNumberCombination,
  loadBetMultipliers
} from '@/shared/storage/savedNumbers.js';
import {
  findCommonPatterns,
  getPatternStats
} from '@/shared/utils/calculations/patternAlgorithms.js';
import { waitForBetButtonReady } from '@/shared/utils/dom/utils.js';
import { replaceSelection } from '@/shared/utils/dom/tileSelection.js';
import { trackRoundComparison } from '@/shared/storage/comparison.js';

/**
 * Select numbers on the board
 */
async function selectNumbers(numbers) {
  try {
    await waitForBetButtonReady(3000);
    await replaceSelection(numbers);
  } catch (err) {
    console.warn('[ModalsManager] Failed to select numbers:', err);
  }
}

/**
 * Central manager for all modal windows
 */
export function ModalsManager() {
  const { activeModals, statsModals, closeModal, closeStatsModal, openModal, openStatsModal, hidePatternLoading } = useModals();

  // Saved numbers modal state
  const [savedNumbers, setSavedNumbers] = useState([]);

  // Pattern analysis modal state
  const [patternData, setPatternData] = useState(null);

  // Bet multipliers (for PayoutGraph component)
  const [betMultipliers, setBetMultipliers] = useState(null);

  // Load bet multipliers on mount
  useEffect(() => {
    loadBetMultipliers().then(setBetMultipliers);
  }, []);

  // Load saved numbers when modal opens
  useEffect(() => {
    if (activeModals.savedNumbers.open) {
      getSavedNumbers().then(setSavedNumbers);
    }
  }, [activeModals.savedNumbers.open]);

  // Load pattern analysis data when modal opens
  useEffect(() => {
    if (activeModals.patternAnalysis.open && activeModals.patternAnalysis.data) {
      const { patternSize, sortBy = 'frequency', sampleSize = 0 } = activeModals.patternAnalysis.data;

      // Show loading first
      openModal('patternLoading');

      setTimeout(() => {
        try {
          let patterns = findCommonPatterns(patternSize, 100, true, sampleSize);

          // Apply sorting
          if (sortBy === 'recent') {
            patterns.sort((a, b) => b.lastOccurrenceIndex - a.lastOccurrenceIndex);
          } else if (sortBy === 'hot') {
            patterns.sort((a, b) => a.hotness - b.hotness);
          }

          patterns = patterns.slice(0, 15);
          const stats = getPatternStats(patternSize, sampleSize);

          hidePatternLoading();

          if (patterns.length === 0) {
            alert(
              `No pattern data available.\nPlay more rounds to analyze patterns of size ${patternSize}.`
            );
            closeModal('patternAnalysis');
            return;
          }

          setPatternData({ patternSize, patterns, stats, sortBy, sampleSize });
        } catch (error) {
          console.error('[ModalsManager] Error analyzing patterns:', error);
          hidePatternLoading();
          alert('Error analyzing patterns. Please try again.');
          closeModal('patternAnalysis');
        }
      }, 100);
    }
  }, [activeModals.patternAnalysis.open, activeModals.patternAnalysis.data]);

  // Handlers for SavedNumbersModal
  const handleSavedNumbersSelect = (numbers) => {
    selectNumbers(numbers);
    closeModal('savedNumbers');
  };

  const handleSavedNumbersDelete = (id) => {
    return deleteSavedNumber(id).then(() => {
      setSavedNumbers((prev) => prev.filter((c) => c.id !== id));
    });
  };

  const handleSavedNumbersInfo = (numbers, name) => {
    closeModal('savedNumbers');
    openStatsModal(numbers, name, false);
  };

  // Handlers for PatternAnalysisModal
  const handlePatternRefresh = (newSortBy, newSampleSize) => {
    if (!patternData) return;
    const { patternSize } = patternData;
    // Re-open with new parameters
    openModal('patternAnalysis', { patternSize, sortBy: newSortBy, sampleSize: newSampleSize });
  };

  const handlePatternSelect = (numbers) => {
    selectNumbers(numbers);
  };

  const handlePatternSave = (numbers, name) => {
    return saveNumberCombination(numbers, name);
  };

  return (
    <>
      {/* Saved Numbers Modal */}
      {activeModals.savedNumbers.open && (
        <SavedNumbersModal
          savedNumbers={savedNumbers}
          onClose={() => closeModal('savedNumbers')}
          onSelect={handleSavedNumbersSelect}
          onDelete={handleSavedNumbersDelete}
          onInfo={handleSavedNumbersInfo}
        />
      )}

      {/* Pattern Analysis Modal */}
      {activeModals.patternAnalysis.open && patternData && (
        <PatternAnalysisModal
          patternSize={patternData.patternSize}
          patterns={patternData.patterns}
          stats={patternData.stats}
          sortBy={patternData.sortBy}
          sampleSize={patternData.sampleSize}
          onClose={() => closeModal('patternAnalysis')}
          onRefresh={handlePatternRefresh}
          onSelectNumbers={handlePatternSelect}
          onSavePattern={handlePatternSave}
        />
      )}

      {/* Pattern Loading Modal */}
      {activeModals.patternLoading.open && <PatternLoadingModal />}

      {/* Live Pattern Analysis Modal */}
      {activeModals.livePatternAnalysis.open && (
        <LivePatternAnalysisModal
          isOpen={activeModals.livePatternAnalysis.open}
          onClose={() => closeModal('livePatternAnalysis')}
        />
      )}

      {/* Comparison Window */}
      {activeModals.comparison.open && (
        <ComparisonWindow
          onClose={() => closeModal('comparison')}
          onRoundSaved={trackRoundComparison}
        />
      )}

      {/* Stats Modals - Multiple instances supported */}
      {statsModals.map((modal) => (
        <StatsModal
          key={modal.id}
          initialNumbers={modal.numbers}
          name={modal.name}
          trackLive={modal.trackLive}
          betMultipliers={betMultipliers}
          onClose={() => closeStatsModal(modal.id)}
        />
      ))}
    </>
  );
}
