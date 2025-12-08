// src/overlay.js
import { state } from './state.js';
import { updateHistoryUI, clearHistory } from './storage.js';
import { updateHeatmap } from './heatmap.js';
import { calculatePrediction, updateAutoPlayUI, autoPlayPlaceBet } from './autoplay.js';

export function createOverlay() {
    if (document.getElementById('keno-tracker-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'keno-tracker-overlay';
    Object.assign(overlay.style, { position: 'fixed', top: '80px', right: '20px', width: '240px', backgroundColor: 'transparent', color: '#fff', padding: '0', borderRadius: '8px', zIndex: '999999', fontFamily: 'monospace', border: '1px solid #1a2c38', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', fontSize: '11px', display: 'block', overflow: 'visible' });
    overlay.innerHTML = `
        <div id="drag-handle" style="display:flex; justify-content:space-between; align-items:center; cursor: move; user-select: none; background:#1a2c38; padding:8px 12px; border-top-left-radius:8px; border-top-right-radius:8px;">
            <h3 id="mode-title" style="margin:0; color:#fff; font-weight:bold; pointer-events:none;">Tracker: 100</h3>
            <div style="display:flex; gap:10px; align-items:center;">
                <span id="tracker-status" style="color:#f55; font-size:16px; pointer-events:none;">●</span>
                <span id="close-overlay" style="cursor:pointer; font-weight:bold; color:#fff; font-size:14px;">✕</span>
            </div>
        </div>

        <div id="keno-overlay-content" style="padding:15px; background:#213743; border-bottom-left-radius:8px; border-bottom-right-radius:8px;">
            <div style="margin-bottom:10px; background:#0f212e; padding:8px; border-radius:4px; display:flex; align-items:center; justify-content:space-between;">
                <span id="hot5-label" style="color:#ff7675; font-weight:600;">Hot 5</span>
                <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
                    <input type="checkbox" id="hot-mode-switch" style="opacity:0; width:0; height:0;">
                    <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#444; transition:.4s; border-radius:20px;"></span>
                    <span id="slider-dot" style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%;"></span>
                </label>
            </div>

            <div style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span id="predict-label" style="color:#74b9ff; font-weight:600;">Predict:</span>
                        <input type="number" id="predict-count" min="1" max="10" value="3" 
                            style="width:48px; background:#0f212e; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center;">
                    </div>
                    
                    <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
                        <input type="checkbox" id="predict-mode-switch" style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#444; transition:.4s; border-radius:20px;"></span>
                        <span id="predict-slider-dot" style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%;"></span>
                    </label>
                </div>
            </div>

            <div style="margin-bottom:10px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="color:#00b894">Hits: <span id="tracker-hits">-</span></div>
                <div style="color:#ff7675">Miss: <span id="tracker-misses">-</span></div>
            </div>

            <div style="margin-bottom:15px; border-top:1px solid #444; padding-top:10px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="margin-bottom:8px;">
                    <span id="autoplay-label" style="color:#74b9ff; font-weight:bold;">Auto-Play:</span>
                    <span id="autoplay-status" style="color:#aaa; float:right;">Ready</span>
                </div>
                <div style="display:flex; gap:5px; margin-bottom:6px;">
                    <input type="number" id="autoplay-rounds" min="1" max="100" value="5" 
                        style="flex:1; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                    <button id="autoplay-btn" style="flex:1; background:#00b894; color:#000; border:none; padding:4px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px;">Play</button>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <span style="color:#aaa; font-size:10px;">Predictions:</span>
                        <input type="number" id="autoplay-pred-count" min="1" max="10" value="3" 
                        style="width:48px; background:#0f212e; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                </div>
            </div>
            
            <div style="border-top:1px solid #444; padding-top:5px;">
                HISTORY <button id="clear-btn" style="float:right; background:none; border:none; color:#f55; cursor:pointer;">Reset</button>
                <div id="history-list" style="height:150px; overflow-y:auto; margin-top:5px; border:1px solid #333; background:#0f212e; padding:5px;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    // Find site font and apply to overlay for better integration
    try {
        const siteFont = window.getComputedStyle(document.body).fontFamily;
        if (siteFont) overlay.style.fontFamily = siteFont;
        else overlay.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial';
    } catch (e) { overlay.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial'; }
    // Make the top bar (drag-handle) visually distinct and darker
    try {
        const topBar = document.getElementById('drag-handle');
        if (topBar) {
            topBar.style.backgroundColor = '#1a2c38';
            topBar.style.padding = '8px 12px';
            topBar.style.borderTopLeftRadius = '8px';
            topBar.style.borderTopRightRadius = '8px';
            topBar.style.boxSizing = 'border-box';
            // ensure overlay doesn't show the original background above/below
            overlay.style.overflow = 'hidden';
        }
    } catch (e) { console.warn('[overlay] could not style top bar', e); }
    // Ensure switch track and dot transitions are explicit for smooth visuals
    try {
        const switchLabels = overlay.querySelectorAll('label.switch');
        switchLabels.forEach(label => {
            const spans = Array.from(label.querySelectorAll('span'));
            // track is the span without an id (or not the slider-dot)
            const track = spans.find(s => !s.id || s.id.indexOf('slider-dot') === -1);
            const dot = spans.find(s => s.id && s.id.indexOf('slider-dot') !== -1);
            if (track) {
                track.style.transition = 'background-color 220ms ease, opacity 220ms ease';
                // ensure initial bg matches inline style if not changed
                if (!track.style.backgroundColor) track.style.backgroundColor = '#444';
            }
            if (dot) {
                // dot transition for transform + color
                dot.style.transition = 'transform 200ms cubic-bezier(.2,.9,.3,1), background-color 220ms ease';
            }
        });
    } catch (e) { console.warn('[overlay] switch transition setup failed', e); }
    // DRAG, CLOSE, and UI wiring
    // --- Drag logic (allow moving the overlay by drag-handle) ---
    const handle = document.getElementById('drag-handle');
    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
    if (handle) {
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = overlay.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            // Set explicit left/top to avoid jump when switching from right-anchored positioning
            overlay.style.transition = 'none';
            overlay.style.left = `${initialLeft}px`;
            overlay.style.top = `${initialTop}px`;
            overlay.style.right = 'auto';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            overlay.style.left = `${initialLeft + dx}px`;
            overlay.style.top = `${initialTop + dy}px`;
        });

        document.addEventListener('mouseup', () => { isDragging = false; overlay.style.transition = ''; });
        // touch support
        handle.addEventListener('touchstart', (e) => {
            const t = e.touches && e.touches[0];
            if (!t) return;
            isDragging = true; startX = t.clientX; startY = t.clientY;
            const rect = overlay.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
            overlay.style.transition = 'none';
            overlay.style.left = `${initialLeft}px`;
            overlay.style.top = `${initialTop}px`;
            overlay.style.right = 'auto';
            e.preventDefault();
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return; const t = e.touches && e.touches[0]; if (!t) return; const dx = t.clientX - startX; const dy = t.clientY - startY; overlay.style.left = `${initialLeft + dx}px`; overlay.style.top = `${initialTop + dy}px`; e.preventDefault();
        }, { passive: false });
        document.addEventListener('touchend', () => { isDragging = false; overlay.style.transition = ''; });
    }
    const closeBtn = document.getElementById('close-overlay');
    if (closeBtn) closeBtn.addEventListener('click', ()=>{ state.isOverlayVisible=false; overlay.style.display='none'; });

    const sliderDot = document.getElementById('slider-dot');
    const title = document.getElementById('mode-title');
    const hotSwitch = document.getElementById('hot-mode-switch');
    if (hotSwitch) {
        // initialize visual state
            if (state.isHotMode) {
            if (sliderDot) { sliderDot.style.transform = 'translateX(14px)'; sliderDot.style.backgroundColor = '#ff7675'; }
            if (title) { title.innerText = 'Tracker: Hot 5'; title.style.color = '#ff7675'; }
            updateHeatmap();
        }
        hotSwitch.checked = !!state.isHotMode;
        hotSwitch.addEventListener('change', (e)=>{
            state.isHotMode = e.target.checked;
            if (sliderDot) {
                sliderDot.style.transform = state.isHotMode ? 'translateX(14px)' : 'translateX(0px)';
                sliderDot.style.backgroundColor = state.isHotMode ? '#ff7675' : 'white';
            }
            // update track background for clearer visual cue
            try {
                const parentLabel = hotSwitch.closest('label');
                if (parentLabel) {
                    const track = Array.from(parentLabel.querySelectorAll('span')).find(s => s.id !== 'slider-dot');
                    if (track) track.style.backgroundColor = state.isHotMode ? '#333' : '#444';
                }
            } catch (err) {}
            if (title) {
                title.innerText = state.isHotMode ? 'Tracker: Hot 5' : 'Tracker: 100';
                // default title is white; when hot use the red accent
                title.style.color = state.isHotMode ? '#ff7675' : '#ffffff';
            }
            updateHeatmap();
            if (state.isPredictMode) calculatePrediction();
        });
    }

    const pDot = document.getElementById('predict-slider-dot');
    const predictSwitch = document.getElementById('predict-mode-switch');
    if (predictSwitch) {
        // initialize visual state
        if (state.isPredictMode) {
            if (pDot) { pDot.style.transform = 'translateX(14px)'; pDot.style.backgroundColor = '#74b9ff'; }
            if (window.__keno_calculatePrediction) window.__keno_calculatePrediction();
        }
        predictSwitch.checked = !!state.isPredictMode;
        predictSwitch.addEventListener('change', (e)=>{
            state.isPredictMode = e.target.checked;
            if (pDot) {
                pDot.style.transform = state.isPredictMode ? 'translateX(14px)' : 'translateX(0px)';
                pDot.style.backgroundColor = state.isPredictMode ? '#74b9ff' : 'white';
            }
            // update predict track background for visible cue
            try {
                const parentLabel = predictSwitch.closest('label');
                if (parentLabel) {
                    const track = Array.from(parentLabel.querySelectorAll('span')).find(s => s.id !== 'predict-slider-dot');
                    if (track) track.style.backgroundColor = state.isPredictMode ? '#2a3b4a' : '#444';
                }
            } catch (err) {}
            if (state.isPredictMode) { calculatePrediction(); }
            else { if (window.__keno_clearHighlight) window.__keno_clearHighlight(); }
        });
    }

    const predictCount = document.getElementById('predict-count');
    if (predictCount) predictCount.addEventListener('change', ()=>{ if (state.isPredictMode) calculatePrediction(); });

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', ()=>{ clearHistory().then(h=>{ updateHistoryUI(h); updateHeatmap(); if (window.__keno_clearHighlight) window.__keno_clearHighlight(); }); });

    const apBtn = document.getElementById('autoplay-btn');
    if (apBtn) apBtn.addEventListener('click', ()=>{
        const roundsInput = document.getElementById('autoplay-rounds');
        const roundsToPlay = parseInt(roundsInput.value) || 5;
        if (state.isAutoPlayMode) { state.isAutoPlayMode = false; state.autoPlayRoundsRemaining = 0; }
        else { state.isAutoPlayMode = true; state.autoPlayRoundsRemaining = roundsToPlay; const rawPredCount = parseInt(document.getElementById('autoplay-pred-count').value) || 3; state.autoPlayPredictionCount = Math.min(Math.max(rawPredCount,1),40); console.log('[AutoPlay] Starting with predictionCount:', state.autoPlayPredictionCount); autoPlayPlaceBet(); }
        updateAutoPlayUI();
    });
    const apPredCount = document.getElementById('autoplay-pred-count');
    if (apPredCount) apPredCount.addEventListener('change', ()=>{ const rawVal = parseInt(apPredCount.value) || 3; state.autoPlayPredictionCount = Math.min(Math.max(rawVal,1),40); console.log('[AutoPlay] Prediction count updated to:', state.autoPlayPredictionCount); });
}

// Try to inject footer button periodically (original behavior)
export function injectFooterButton() {
    if (!window.location.href.includes('keno')) {
        const existingBtn = document.getElementById('keno-toggle-btn'); if (existingBtn) existingBtn.remove(); const overlay = document.getElementById('keno-tracker-overlay'); if (overlay) overlay.style.display='none'; return;
    }
    const footerStack = document.querySelector('.game-footer .stack');
    if (!footerStack || document.getElementById('keno-toggle-btn')) return;
    const btn = document.createElement('div'); btn.id='keno-toggle-btn'; Object.assign(btn.style,{display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0 10px',opacity:'0.7',transition:'opacity 0.2s'});
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #fff;">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <span style="margin-left:5px; font-size:12px; font-weight:bold; color:#fff;">Tracker</span>
    `;
    btn.addEventListener('mouseenter', ()=>btn.style.opacity='1'); btn.addEventListener('mouseleave', ()=>btn.style.opacity='0.7');
    btn.addEventListener('click', ()=>{ const overlay = document.getElementById('keno-tracker-overlay'); if (overlay) { state.isOverlayVisible = !state.isOverlayVisible; overlay.style.display = state.isOverlayVisible ? 'block' : 'none'; }});
    footerStack.insertBefore(btn, footerStack.firstChild);
}

// Expose for main entry to call
export function initOverlay() { createOverlay(); setInterval(injectFooterButton, 1000); }

