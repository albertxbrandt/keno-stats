// src/content.js - entry point for bundled content script
import { state } from './state.js';
import { initOverlay, injectFooterButton } from './overlay.js';
import { loadHistory, updateHistoryUI } from './storage.js';
import { calculatePrediction, autoPlayPlaceBet, updateAutoPlayUI } from './autoplay.js';
import { updateHeatmap } from './heatmap.js';

console.log('Keno Tracker loaded');

// Message listener moved from original content.js
window.addEventListener('message', (event) => {
	if (event.source !== window || !event.data || event.data.type !== 'KENO_DATA_FROM_PAGE') return;
	const statusDot = document.getElementById('tracker-status');
	if (statusDot) { statusDot.style.color = '#00b894'; statusDot.style.textShadow = '0 0 5px #00b894'; }
	const data = event.data.payload || {};
	const rawDrawn = data.drawnNumbers || [];
	const rawSelected = data.selectedNumbers || [];
	const drawn = rawDrawn.map(n => n + 1);
	const selected = rawSelected.map(n => n + 1);
	const hits = []; const misses = [];
	selected.forEach(num => { if (drawn.includes(num)) hits.push(num); });
	drawn.forEach(num => { if (!selected.includes(num)) misses.push(num); });
	hits.sort((a,b)=>a-b); misses.sort((a,b)=>a-b);
	const hEl = document.getElementById('tracker-hits'); const mEl = document.getElementById('tracker-misses');
	if (hEl) hEl.innerText = hits.join(', ') || 'None'; if (mEl) mEl.innerText = misses.join(', ') || 'None';
	console.log('[KENO] Round received:', { rawDrawn, rawSelected, drawn, selected, hits, misses });
	// Save
	import('./storage.js').then(mod => mod.saveRound({ hits, misses, time: Date.now() }));
	// Auto Predict
	if (state.isPredictMode) calculatePrediction();
	// Auto Play Logic
	if (state.isAutoPlayMode && state.autoPlayRoundsRemaining > 0) {
		state.autoPlayRoundsRemaining--;
		// update UI immediately so Playing: <num> reflects remaining rounds
		try { updateAutoPlayUI(); } catch (e) { console.warn('[content] updateAutoPlayUI failed', e); }
		// schedule next bet or finish
		setTimeout(()=>{
			if (state.autoPlayRoundsRemaining > 0) {
				console.log('[AutoPlay] Rounds remaining, placing next bet:', state.autoPlayRoundsRemaining);
				autoPlayPlaceBet();
			} else {
				state.isAutoPlayMode=false;
				try { updateAutoPlayUI(); } catch (e) {}
				const apStatus = document.getElementById('autoplay-status'); if (apStatus) apStatus.innerText='Finished!';
				console.log('[AutoPlay] Finished all rounds');
			}
		},1500);
	}
});

// Initialize
loadHistory().then(() => {
	// Initialize UI after history has been loaded
	initOverlay();
	// Ensure history list in overlay shows current history
	try { updateHistoryUI(state.currentHistory || []); } catch (e) { console.warn('[content] updateHistoryUI failed', e); }
	setTimeout(updateHeatmap, 2000);
	setInterval(injectFooterButton, 1000);
});

