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
import { loadProfitLoss, updateProfitLossUI } from './features/profitLoss.js';
import { initComparisonWindow } from './features/comparison.js';
import './features/patterns.js'; // Import pattern analysis module (sets up window hooks)

console.log('Keno Tracker loaded');

// Track if we've already initialized to prevent double-initialization
let extensionInitialized = false;
let lastUrl = window.location.href;

// Check if we're on the Keno page
function isOnKenoPage() {
	return window.location.href.includes('/casino/games/keno');
}

// Check if disclaimer has been accepted before initializing extension
const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

// Wait for Keno game elements to be present in DOM
function waitForKenoElements(callback, maxAttempts = 50) {
	let attempts = 0;

	const checkElements = () => {
		// Check for key Keno game elements
		const kenoContainer = document.querySelector('div[data-testid="game-keno"]');
		const betButton = document.querySelector('button[data-testid="bet-button"]');

		if (kenoContainer && betButton) {
			console.log('[Keno Tracker] Keno elements found after', attempts, 'attempts, ready to initialize');
			callback();
		} else if (attempts < maxAttempts) {
			attempts++;
			setTimeout(checkElements, 100);
		} else {
			console.warn('[Keno Tracker] Keno elements not found after', maxAttempts, 'attempts (5 seconds)');
			console.warn('[Keno Tracker] Initializing anyway - UI may not be fully ready');
			// Initialize anyway - better to try than not load at all
			callback();
		}
	};

	checkElements();
}

function checkAndInitialize() {
	if (!isOnKenoPage()) {
		console.log('[Keno Tracker] Not on Keno page, skipping initialization');
		extensionInitialized = false;
		return;
	}

	// Check if overlay already exists (more reliable than flag)
	const existingOverlay = document.getElementById('keno-tracker-overlay');
	if (existingOverlay && extensionInitialized) {
		console.log('[Keno Tracker] Already initialized (overlay exists)');
		return;
	}

	if (extensionInitialized && !existingOverlay) {
		console.log('[Keno Tracker] Was initialized but overlay missing, re-initializing');
		extensionInitialized = false;
	}

	storageApi.storage.local.get('disclaimerAccepted', (result) => {
		if (!result.disclaimerAccepted) {
			console.log('[Keno Tracker] Disclaimer not accepted. Extension will not function.');
			return;
		}

		console.log('[Keno Tracker] Disclaimer accepted, waiting for Keno elements...');

		// Wait for Keno game to fully load before initializing
		waitForKenoElements(() => {
			console.log('[Keno Tracker] Initializing extension...');
			initializeExtension();
			extensionInitialized = true;
		});
	});
}

// Initial check on load
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', checkAndInitialize);
} else {
	checkAndInitialize();
}

// Watch for URL changes (for SPA navigation)
const observer = new MutationObserver(() => {
	const currentUrl = window.location.href;
	if (currentUrl !== lastUrl) {
		console.log('[Keno Tracker] URL changed from', lastUrl, 'to', currentUrl);
		lastUrl = currentUrl;
		checkAndInitialize();
	}
});

// Start observing URL changes via DOM changes
observer.observe(document.body, {
	childList: true,
	subtree: true
});

// Message listener for intercepted game data (only add once!)
let messageListenerAdded = false;

function addMessageListener() {
	if (messageListenerAdded) {
		console.log('[Keno Tracker] Message listener already added, skipping');
		return;
	}

	messageListenerAdded = true;
	console.log('[Keno Tracker] Adding message listener');

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
		const { state: originalState, ...kenoBetData } = data;
		// Capture generator state if active
		const generatorInfo = state.isGeneratorActive ? {
			method: state.generatorMethod,
			count: state.generatorCount,
			interval: state.generatorInterval,
			autoSelect: state.generatorAutoSelect,
			sampleSize: state.generatorSampleSize,
			// Method-specific settings
			shapesPattern: state.shapesPattern,
			shapesPlacement: state.shapesPlacement,
			momentumDetectionWindow: state.momentumDetectionWindow,
			momentumBaselineGames: state.momentumBaselineGames,
			momentumThreshold: state.momentumThreshold,
			momentumPoolSize: state.momentumPoolSize
		} : null;

		const betData = {
			id: data.id,
			kenoBet: {
				...data, // Preserve all kenoBet fields (amount, payout, currency, etc.)
				state: {
					...(data.state || {}), // Preserve all original state fields
					drawnNumbers: drawn,
					selectedNumbers: selected
				}
			},
			generator: generatorInfo, // Store generator info if used
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
			try { updateMultiplierBarStats(); } catch (_e) { console.error('[stats] update failed:', _e); }
		}, 500);

		// Capture predictions BEFORE regenerating (these are what were actually played)
		const playedPredictions = state.lastGeneratedPredictions ? { ...state.lastGeneratedPredictions } : null;

		// Track comparison BEFORE auto-generation (use numbers that were actually played)
		if (state.isComparisonWindowOpen && window.__keno_trackRound && playedPredictions) {
			try {
				window.__keno_trackRound({ drawn, selected, predictions: playedPredictions });
			} catch (_e) {
				console.error('[Comparison] track round failed:', _e);
			}
		}

		// NOW generate new numbers for next round
		if ((state.isComparisonWindowOpen || state.isGeneratorActive) && window.__keno_generateAllPredictions) {
			try {
				const allPredictions = window.__keno_generateAllPredictions();
				// Store for next round's comparison
				state.lastGeneratedPredictions = allPredictions;
			} catch (_e) {
				console.error('[Generator] Generate all predictions failed:', _e);
			}
		}

		// If generator is active (not just comparison), also generate and select numbers
		if (state.isGeneratorActive && window.__keno_generateNumbers) {
			try {
				waitForBetButtonReady(3000).then(() => {
					window.__keno_generateNumbers(); // This will check auto-refresh interval

					// Update preview after generation
					if (window.__keno_updateGeneratorPreview) {
						window.__keno_updateGeneratorPreview();
					}
				}).catch(err => {
					console.error('[Content] Bet button timeout, generating anyway:', err);
					window.__keno_generateNumbers(); // Try anyway

					// Update preview even on timeout
					if (window.__keno_updateGeneratorPreview) {
						window.__keno_updateGeneratorPreview();
					}
				});
			} catch (e) {
				console.error('[Generator] Generate numbers failed:', e);
			}
		} else if (window.__keno_updateGeneratorPreview) {
			// Even if not generating, update the countdown
			window.__keno_updateGeneratorPreview();
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
					try { updateAutoPlayUI(); } catch { }
				});
			} else {
				state.isAutoPlayMode = false;
				if (state.autoPlayStartTime) {
					state.autoPlayElapsedTime = Math.floor((Date.now() - state.autoPlayStartTime) / 1000);
				}
				try { updateAutoPlayUI(); } catch { }
				console.log('[AutoPlay] Finished all rounds');
			}
		}
	});
}

function initializeExtension() {
	// Add message listener (only once)
	addMessageListener();

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
				try { updateAutoPlayUI(); } catch { }
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
