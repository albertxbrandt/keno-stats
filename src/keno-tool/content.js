// src/content.js - entry point for bundled content script
import { state } from '@/keno-tool/core/state.js';
import { stateEvents, EVENTS } from '@/keno-tool/core/stateEvents.js';
import { initOverlay, observeFooterForButton } from '@/keno-tool/ui/overlayInit.js';
import { loadHistory, updateHistoryUI } from '@/keno-tool/core/storage.js';
import { selectPredictedNumbers, updateGeneratorPreview } from '@/keno-tool/ui/numberSelection.js';
import { initHotkeys, registerHotkey } from '@/keno-tool/ui/hotkeys.js';
// AUTO-PLAY DISABLED FOR TOS COMPLIANCE
// import { autoPlayPlaceBet, updateAutoPlayUI } from './features/autoplay.js';
import { waitForBetButtonReady } from '@/shared/utils/dom/utils.js';
import { updateHeatmap } from '@/shared/utils/dom/heatmap.js';
import { initStatsObserver, updateMultiplierBarStats } from '@/shared/utils/stats.js';
import { trackPlayedNumbers } from '@/shared/storage/savedNumbers.js';
import { COLORS } from '@/shared/constants/colors.js';
import { loadProfitLoss } from '@/shared/storage/profitLoss.js';
import { updateProfitLossUI } from '@/shared/utils/dom/profitLossUI.js';
import '@/keno-tool/ui/previewHighlight.js'; // Preview highlight module

// eslint-disable-next-line no-console
console.log('Keno Tracker loaded');

// Expose state globally for shuffle functionality
window.__keno_state = state;

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
			// eslint-disable-next-line no-console
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
		extensionInitialized = false;
		return;
	}

	// Check if overlay already exists (more reliable than flag)
	const existingOverlay = document.getElementById('keno-tracker-overlay');
	if (existingOverlay && extensionInitialized) {
		return;
	}

	if (extensionInitialized && !existingOverlay) {
		extensionInitialized = false;
	}

	storageApi.storage.local.get('disclaimerAccepted', (result) => {
		if (!result.disclaimerAccepted) {
			// eslint-disable-next-line no-console
			console.log('[Keno Tracker] Disclaimer not accepted. Extension will not function.');
			return;
		}

		// eslint-disable-next-line no-console
		console.log('[Keno Tracker] Disclaimer accepted, waiting for Keno elements...');

		// Wait for Keno game to fully load before initializing
		waitForKenoElements(() => {
			// eslint-disable-next-line no-console
			console.log('[Keno Tracker] Initializing extension...');
			initializeExtension();
			extensionInitialized = true;
		});
	});
}

// Listen for settings changes to update generator preview
stateEvents.on(EVENTS.SETTINGS_CHANGED, () => {
	updateGeneratorPreview();
});

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
		return;
	}

	messageListenerAdded = true;
	// eslint-disable-next-line no-console
	console.log('[Keno Tracker] Adding message listener');

	window.addEventListener('message', (event) => {
		if (event.source !== window || !event.data || event.data.type !== 'KENO_DATA_FROM_PAGE') return;
		const statusDot = document.getElementById('tracker-status');
		if (statusDot) { statusDot.style.color = COLORS.accent.success; statusDot.style.textShadow = `0 0 5px ${COLORS.accent.success}`; }
		const data = event.data.payload || {};
		const rawDrawn = data.state?.drawnNumbers || [];
		const rawSelected = data.state?.selectedNumbers || [];
		const drawn = rawDrawn.map(n => n + 1);
		const selected = rawSelected.map(n => n + 1);
		const hits = []; const misses = [];
		selected.forEach(num => { if (drawn.includes(num)) hits.push(num); });
		drawn.forEach(num => { if (!selected.includes(num)) misses.push(num); });
		hits.sort((a, b) => a - b); misses.sort((a, b) => a - b);

		// Update state for components to consume
		state.trackerHits = hits.join(', ') || 'None';
		state.trackerMisses = misses.join(', ') || 'None';

		// Update DOM elements (legacy support)
		const hEl = document.getElementById('tracker-hits'); const mEl = document.getElementById('tracker-misses');
		if (hEl) hEl.innerText = state.trackerHits; if (mEl) mEl.innerText = state.trackerMisses;

		// Emit event for components
		stateEvents.emit(EVENTS.ROUND_SAVED, { hits, misses, drawn, selected });

		// Capture generator state
		const generatorInfo = {
			method: state.generatorMethod,
			count: state.generatorCount,
			interval: state.generatorInterval,
			autoRefresh: state.generatorAutoRefresh,
			sampleSize: state.generatorSampleSize,
			// Method-specific settings
			shapesPattern: state.shapesPattern,
			shapesPlacement: state.shapesPlacement,
			momentumDetectionWindow: state.momentumDetectionWindow,
			momentumBaselineGames: state.momentumBaselineGames,
			momentumThreshold: state.momentumThreshold,
			momentumPoolSize: state.momentumPoolSize
		};

		// data is already the kenoBet object from interceptor
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

		// Wait for saveRound to complete before checking history.length for preview updates
		import('./core/storage.js').then(async mod => {
			await mod.saveRound(betData);

			// Track the played numbers for recent plays section
			// Note: updateRecentPlayedUI removed - RecentPlays component handles UI updates automatically via event subscription
			trackPlayedNumbers(selected).catch(err => console.error('[savedNumbers] trackPlayedNumbers failed:', err));

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

			// NOW generate new numbers for next round (for comparison tracking)
			if (state.isComparisonWindowOpen && window.__keno_generateAllPredictions) {
				try {
					const allPredictions = window.__keno_generateAllPredictions();
					// Store for next round's comparison
					state.lastGeneratedPredictions = allPredictions;
				} catch (_e) {
					console.error('[Generator] Generate all predictions failed:', _e);
				}
			}

			// Auto-place numbers on board if Auto-Refresh is enabled and interval reached
			if (state.generatorAutoRefresh && window.__keno_generateNumbers) {
				const interval = state.generatorInterval || 5;
				const currentRound = state.currentHistory.length;
				const lastRefresh = state.generatorLastRefresh || 0;
				const roundsSinceRefresh = currentRound - lastRefresh;

				// Only auto-place if interval has been reached
				if (roundsSinceRefresh >= interval) {
					try {
						waitForBetButtonReady(3000).then(async () => {
							// Use previewed numbers if available
							if (state.nextNumbers && state.nextNumbers.length > 0) {
								state.generatedNumbers = state.nextNumbers;

								if (window.__keno_selectPredictedNumbers) {
									await window.__keno_selectPredictedNumbers();
								}

								state.generatorLastRefresh = currentRound;
							} else {
								// Fallback: generate fresh
								await window.__keno_generateNumbers();
							}

							// Update preview after generation
							if (updateGeneratorPreview) {
								updateGeneratorPreview();
							}
						}).catch(async err => {
							console.error('[Content] Bet button timeout, generating anyway:', err);

							// Use previewed numbers even on timeout
							if (state.nextNumbers && state.nextNumbers.length > 0) {
								state.generatedNumbers = state.nextNumbers;

								if (window.__keno_selectPredictedNumbers) {
									await window.__keno_selectPredictedNumbers();
								}

								state.generatorLastRefresh = currentRound;
							} else {
								await window.__keno_generateNumbers();
							}

							// Update preview even on timeout
							if (updateGeneratorPreview) {
								updateGeneratorPreview();
							}
						});
					} catch (e) {
						console.error('[Generator] Generate numbers failed:', e);
					}
				} else if (updateGeneratorPreview) {
					// Not yet time to refresh, just update preview countdown
					updateGeneratorPreview();
				}
			} else if (updateGeneratorPreview) {
				// Auto-refresh disabled, still update preview
				updateGeneratorPreview();
			}

			// AUTO-PLAY DISABLED FOR TOS COMPLIANCE
			/*
			// Auto Play Logic
			if (state.isAutoPlayMode && state.autoPlayRoundsRemaining > 0) {
				state.autoPlayRoundsRemaining--;
				// update UI immediately so Playing: <num> reflects remaining rounds
				try { updateAutoPlayUI(); } catch (e) { console.warn('[content] updateAutoPlayUI failed', e); }
				// Wait for bet button to be ready, then place next bet
				if (state.autoPlayRoundsRemaining > 0) {
					waitForBetButtonReady(3000).then(() => {
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
				}
			}
			*/
		});
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
		// Ensure history list in overlay shows current history
		try { updateHistoryUI(state.currentHistory || []); } catch (e) { console.warn('[content] updateHistoryUI failed', e); }
		// Initial heatmap update
		updateHeatmap();
		// Observe footer for button injection (reactive, no polling)
		observeFooterForButton();
		// AUTO-PLAY DISABLED FOR TOS COMPLIANCE
		/*
		// Update autoplay timer every second (only runs when autoplay active)
		setInterval(() => {
			if (state.isAutoPlayMode) {
				try { updateAutoPlayUI(); } catch { }
			}
		}, 1000);
		*/
		// Initialize stats observer for multiplier bar
		console.warn('[CONTENT] About to call initStatsObserver in 3s');
		setTimeout(() => {
			console.warn('[CONTENT] Calling initStatsObserver NOW');
			initStatsObserver();
		}, 3000);

		// Initialize keyboard shortcuts system
		initHotkeys();
		
		// Register hotkeys
		registerHotkey('b', () => {
			selectPredictedNumbers();
		}, {
			description: 'Select predicted numbers on the board',
			preventDefault: true,
			requireKeno: true
		});
	});
}
