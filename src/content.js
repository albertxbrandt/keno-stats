// src/content.js - entry point for bundled content script
import { state } from './core/state.js';
import { initOverlay, injectFooterButton } from './ui/overlay.js';
import { loadHistory, updateHistoryUI } from './core/storage.js';
import { calculatePrediction, selectPredictedNumbers } from './ui/numberSelection.js';
import { autoPlayPlaceBet, updateAutoPlayUI } from './features/autoplay.js';
import { waitForBetButtonReady } from './utils/utils.js';
import { updateHeatmap } from './features/heatmap.js';
import { initStatsObserver, updateMultiplierBarStats } from './utils/stats.js';
import { trackPlayedNumbers, updateRecentPlayedUI } from './features/savedNumbers.js';
import { loadProfitLoss, updateProfitLossUI, recalculateTotalProfit } from './features/profitLoss.js';
import { initComparisonWindow } from './features/comparison.js';
import './features/patterns.js'; // Import pattern analysis module (sets up window hooks)

console.log('Keno Tracker loaded');

// Check if disclaimer has been accepted before initializing extension
const storageApi = (typeof browser !== 'undefined') ? browser : chrome;
storageApi.storage.local.get('disclaimerAccepted', (result) => {
	if (!result.disclaimerAccepted) {
		console.log('[Keno Tracker] Disclaimer not accepted. Extension will not function.');
		return;
	}

	console.log('[Keno Tracker] Disclaimer accepted, initializing extension...');
	initializeExtension();
});

function initializeExtension() {
	// Message listener moved from original content.js
	window.addEventListener('message', (event) => {
		if (event.source !== window || !event.data || event.data.type !== 'KENO_DATA_FROM_PAGE') return;
		const statusDot = document.getElementById('tracker-status');
		if (statusDot) { statusDot.style.color = '#00b894'; statusDot.style.textShadow = '0 0 5px #00b894'; }
		const data = event.data.payload || {};
		const rawDrawn = data.state?.drawnNumbers || [];
		const rawSelected = data.state?.selectedNumbers || [];
		const drawn = rawDrawn.map(n => n + 1);
		const selected = rawSelected.map(n => n + 1);
		const hits = []; const misses = [];
		selected.forEach(num => { if (drawn.includes(num)) hits.push(num); });
		drawn.forEach(num => { if (!selected.includes(num)) misses.push(num); });
		hits.sort((a, b) => a - b); misses.sort((a, b) => a - b);
		const hEl = document.getElementById('tracker-hits'); const mEl = document.getElementById('tracker-misses');
		if (hEl) hEl.innerText = hits.join(', ') || 'None'; if (mEl) mEl.innerText = misses.join(', ') || 'None';
		console.log('[KENO] Round received:', { rawDrawn, rawSelected, drawn, selected, hits, misses, fullData: data });
		// Save full kenoBet structure - preserve all fields except user
		const { user, state: originalState, ...kenoBetData } = data;
		const betData = {
			id: data.id,
			kenoBet: {
				...kenoBetData, // Spread all fields except user and state
				state: {
					...(originalState || {}), // Preserve all original state fields
					drawnNumbers: drawn,
					selectedNumbers: selected
				}
			},
			time: Date.now()
		};
		console.log('[KENO] Saving bet data:', betData);
		import('./core/storage.js').then(mod => mod.saveRound(betData));

		// Track the played numbers for recent plays section
		trackPlayedNumbers(selected).then(() => {
			updateRecentPlayedUI();
		}).catch(err => console.error('[savedNumbers] trackPlayedNumbers failed:', err));

		// Update stats after new round
		setTimeout(() => {
			try { updateMultiplierBarStats(); } catch (e) { console.error('[stats] update failed:', e); }
		}, 500);

		// Capture predictions BEFORE regenerating (these are what were actually played)
		const playedPredictions = state.lastGeneratedPredictions ? { ...state.lastGeneratedPredictions } : null;

		// Track comparison BEFORE auto-generation (use numbers that were actually played)
		if (state.isComparisonWindowOpen && window.__keno_trackRound && playedPredictions) {
			try {
				window.__keno_trackRound({ drawn, selected, predictions: playedPredictions });
			} catch (e) {
				console.error('[Comparison] track round failed:', e);
			}
		}

		// NOW generate new numbers for next round
		if ((state.isComparisonWindowOpen || state.isGeneratorActive) && window.__keno_generateAllPredictions) {
			try {
				const allPredictions = window.__keno_generateAllPredictions();
				// Store for next round's comparison
				state.lastGeneratedPredictions = allPredictions;
			} catch (e) {
				console.error('[Generator] Generate all predictions failed:', e);
			}
		}

		// If generator is active (not just comparison), also generate and select numbers
		if (state.isGeneratorActive && window.__keno_generateNumbers) {
			try {
				console.log('[Content] Waiting for bet button before generating numbers...');
				waitForBetButtonReady(3000).then(() => {
					console.log('[Content] Bet button ready, calling __keno_generateNumbers. History:', state.currentHistory.length, 'Last refresh:', state.generatorLastRefresh, 'Interval:', state.generatorInterval);
					window.__keno_generateNumbers(); // This will check auto-refresh interval
				}).catch(err => {
					console.error('[Content] Bet button timeout, generating anyway:', err);
					window.__keno_generateNumbers(); // Try anyway
				});
			} catch (e) {
				console.error('[Generator] Generate numbers failed:', e);
			}
		}

		// Legacy: Auto Predict (deprecated)
		else if (state.isPredictMode) {
			calculatePrediction();
		}
		// Auto Play Logic
		if (state.isAutoPlayMode && state.autoPlayRoundsRemaining > 0) {
			state.autoPlayRoundsRemaining--;
			// update UI immediately so Playing: <num> reflects remaining rounds
			try { updateAutoPlayUI(); } catch (e) { console.warn('[content] updateAutoPlayUI failed', e); }
			// Wait for bet button to be ready, then place next bet
			if (state.autoPlayRoundsRemaining > 0) {
				console.log('[AutoPlay] Waiting for bet button before next round...');
				waitForBetButtonReady(3000).then(() => {
					console.log('[AutoPlay] Bet button ready, placing next bet. Rounds remaining:', state.autoPlayRoundsRemaining);
					autoPlayPlaceBet();
				}).catch(err => {
					console.error('[AutoPlay] Bet button timeout:', err);
					state.isAutoPlayMode = false;
					try { updateAutoPlayUI(); } catch (e) { }
				});
			} else {
				state.isAutoPlayMode = false;
				if (state.autoPlayStartTime) {
					state.autoPlayElapsedTime = Math.floor((Date.now() - state.autoPlayStartTime) / 1000);
				}
				try { updateAutoPlayUI(); } catch (e) { }
				console.log('[AutoPlay] Finished all rounds');
			}
		}
	});

	// Initialize
	loadHistory().then(() => {
		// Load profit/loss data
		loadProfitLoss().then(() => {
			try { updateProfitLossUI(); } catch (e) { console.warn('[content] updateProfitLossUI failed', e); }
		});

		// Initialize UI after history has been loaded
		initOverlay();
		// Initialize comparison window
		initComparisonWindow();
		// Ensure history list in overlay shows current history
		try { updateHistoryUI(state.currentHistory || []); } catch (e) { console.warn('[content] updateHistoryUI failed', e); }
		// Initialize recent played UI
		try { updateRecentPlayedUI(); } catch (e) { console.warn('[content] updateRecentPlayedUI failed', e); }
		// Initial heatmap update
		updateHeatmap();
		// Check for footer button less frequently (performance optimization)
		setInterval(injectFooterButton, 3000);
		// Update autoplay timer every second (only runs when autoplay active)
		setInterval(() => {
			if (state.isAutoPlayMode) {
				try { updateAutoPlayUI(); } catch (e) { }
			}
		}, 1000);
		// Initialize stats observer for multiplier bar
		console.warn('[CONTENT] About to call initStatsObserver in 3s');
		setTimeout(() => {
			console.warn('[CONTENT] Calling initStatsObserver NOW');
			initStatsObserver();
		}, 3000);

		// Keyboard shortcuts
		document.addEventListener('keydown', (e) => {
			// Only trigger on Keno page
			if (!window.location.href.includes('keno')) return;

			// Ignore if typing in an input field
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

			// 'b' key - select all predicted numbers
			if (e.key === 'b' || e.key === 'B') {
				e.preventDefault();
				selectPredictedNumbers();
			}
		});
	});
}
