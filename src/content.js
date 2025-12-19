// src/content.js - entry point for bundled content script
import { state } from './state.js';
import { initOverlay, injectFooterButton } from './overlay.js';
import { loadHistory, updateHistoryUI } from './storage.js';
import { calculatePrediction, autoPlayPlaceBet, updateAutoPlayUI, selectPredictedNumbers } from './autoplay.js';
import { updateHeatmap } from './heatmap.js';
import { initStatsObserver, updateMultiplierBarStats } from './stats.js';
import { trackPlayedNumbers, updateRecentPlayedUI } from './savedNumbers.js';
import { loadProfitLoss, updateProfitLossUI, recalculateTotalProfit } from './profitLoss.js';
import { initComparisonWindow } from './comparison.js';
import './patterns.js'; // Import pattern analysis module (sets up window hooks)

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
		import('./storage.js').then(mod => mod.saveRound(betData));

		// Track the played numbers for recent plays section
		trackPlayedNumbers(selected).then(() => {
			updateRecentPlayedUI();
		}).catch(err => console.error('[savedNumbers] trackPlayedNumbers failed:', err));

		// Update stats after new round
		setTimeout(() => {
			try { updateMultiplierBarStats(); } catch (e) { console.error('[stats] update failed:', e); }
		}, 500);

		// If comparison window is open OR generator is active, generate predictions for all methods
		if ((state.isComparisonWindowOpen || state.isGeneratorActive) && window.__keno_generateAllPredictions) {
			try {
				const allPredictions = window.__keno_generateAllPredictions();

				// Track comparison if window open
				if (state.isComparisonWindowOpen && window.__keno_trackRound) {
					window.__keno_trackRound({ drawn, selected, predictions: allPredictions });
				}
			} catch (e) {
				console.error('[Generator] Generate all predictions failed:', e);
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
			// schedule next bet or finish
			setTimeout(() => {
				if (state.autoPlayRoundsRemaining > 0) {
					console.log('[AutoPlay] Rounds remaining, placing next bet:', state.autoPlayRoundsRemaining);
					autoPlayPlaceBet();
				} else {
					state.isAutoPlayMode = false;
					if (state.autoPlayStartTime) {
						state.autoPlayElapsedTime = Math.floor((Date.now() - state.autoPlayStartTime) / 1000);
					}
					try { updateAutoPlayUI(); } catch (e) { }
					console.log('[AutoPlay] Finished all rounds');
				}
			}, 1500);
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
