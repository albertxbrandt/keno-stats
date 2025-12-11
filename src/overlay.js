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
            <h3 id="mode-title" style="margin:0; color:#fff; font-weight:bold; pointer-events:none;">Keno Stats Tracker</h3>
            <div style="display:flex; gap:10px; align-items:center;">
                <span id="settings-icon" style="cursor:pointer; font-size:16px; color:#fff;" title="Settings">⚙️</span>
                <span id="tracker-status" style="color:#f55; font-size:16px; pointer-events:none;">●</span>
                <span id="close-overlay" style="cursor:pointer; font-weight:bold; color:#fff; font-size:14px;">✕</span>
            </div>
        </div>

        <!-- Tracker Tab Content -->
        <div id="keno-overlay-content" class="tab-content" style="padding:15px; background:#213743; border-bottom-left-radius:8px; border-bottom-right-radius:8px; display:block;">
            <div data-section="sampleSize" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <span id="sample-label" style="color:#ff7675; font-weight:600; cursor:help;" title="Last 5 Bets">Sample Size</span>
                <input type="number" id="sample-size-input" min="1" value="5"
                    style="width:64px; background:#0f212e; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center;">
            </div>

            <div data-section="predict" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span id="predict-label" style="color:#74b9ff; font-weight:600;">Predict:</span>
                        <input type="number" id="predict-count" min="1" max="10" value="3" 
                            style="width:48px; background:#0f212e; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center;">
                    </div>
                    
                    <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
                        <input type="checkbox" id="predict-mode-switch" style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#444; transition:.4s; border-radius:20px;"></span>
                        <span id="predict-slider-dot" style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; cursor:pointer;"></span>
                    </label>
                </div>
            </div>

            <div data-section="hitsMiss" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="color:#00b894">Hits: <span id="tracker-hits">-</span></div>
                <div style="color:#ff7675">Miss: <span id="tracker-misses">-</span></div>
            </div>

            <div data-section="autoplay" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="margin-bottom:8px;">
                    <span id="autoplay-label" style="color:#74b9ff; font-weight:bold;">Auto-Play:</span>
                    <span id="autoplay-status" style="color:#aaa; float:right;">Ready</span>
                </div>
                <div style="display:flex; gap:5px; margin-bottom:6px;">
                    <input type="number" id="autoplay-rounds" min="1" max="100" value="5" 
                        style="flex:1; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                    <button id="autoplay-btn" style="flex:1; background:#00b894; color:#000; border:none; padding:4px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px;">Play</button>
                </div>
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:6px;">
                    <span style="color:#aaa; font-size:10px;">Predictions:</span>
                        <input type="number" id="autoplay-pred-count" min="1" max="10" value="3" 
                        style="width:48px; background:#0f212e; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                </div>
                <div id="autoplay-timer" style="color:#74b9ff; font-size:10px; text-align:center; display:none;">
                    Timer: <span id="autoplay-timer-value">0:00</span>
                </div>
            </div>
            
            <div data-section="patternAnalysis" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="margin-bottom:8px;">
                    <span style="color:#ffd700; font-weight:bold;">Pattern Analysis</span>
                </div>
                <div style="display:flex; gap:5px; align-items:center; margin-bottom:8px;">
                    <span style="color:#aaa; font-size:11px; white-space:nowrap;">Size:</span>
                    <input type="number" id="pattern-target" min="3" max="10" value="5" placeholder="3-10"
                        style="flex:1; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                    <button id="analyze-pattern-btn" style="flex:1; background:#ffd700; color:#222; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px;">Analyze</button>
                </div>
                <button id="live-pattern-btn" style="width:100%; background:#00b894; color:#fff; border:none; padding:6px 8px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px;">
                    🔴 Live Analysis
                </button>
                <div style="color:#666; font-size:9px; margin-top:4px; line-height:1.3;">Find patterns of N numbers appearing together</div>
            </div>
            
            <div data-section="recentPlays" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="color:#00b894; font-weight:bold;">Recent Plays</span>
                    <button id="view-saved-numbers-btn" style="background:#2a3b4a; color:#74b9ff; border:none; padding:3px 8px; border-radius:4px; font-size:9px; cursor:pointer; font-weight:bold;">Saved Combos</button>
                </div>
                <div id="recent-played-list" style="min-height:60px;">
                    <div style="color:#666; font-size:10px; padding:8px; text-align:center;">No recent plays</div>
                </div>
            </div>
            
            <div data-section="history" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="color:#fff; font-weight:bold;">History (Last 100)</span>
                    <button id="clear-btn" style="background:none; border:none; color:#f55; cursor:pointer; font-size:11px;">Reset</button>
                </div>
                <div id="history-list" style="height:150px; overflow-y:auto; border:1px solid #333; background:#14202b; padding:5px; border-radius:4px;"></div>
                <button id="open-betbook-btn" style="width:100%; background:#ffd700; color:#222; border:none; padding:6px 10px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px; margin-top:8px;">Open Stats Book</button>
            </div>
        </div>

        <!-- Settings Tab Content -->
        <div id="keno-settings-content" class="tab-content" style="padding:15px; background:#213743; border-bottom-left-radius:8px; border-bottom-right-radius:8px; display:none;">
            <div id="settings-list" style="background: #0f212e; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="color: #aaa; font-size: 12px; margin-bottom: 10px;">Show/Hide Panel Sections (Drag to Reorder)</div>
                
                <div class="settings-row" draggable="true" data-section="sampleSize" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a2c38; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">📊</span>
                        <span style="color: #fff; font-size: 12px;">Sample Size</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="sampleSize" style="opacity: 0; width: 0; height: 0;">
                        <span class="settings-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: 0.4s; border-radius: 24px;"></span>
                        <span class="settings-slider-dot" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.4s; border-radius: 50%; transform: translateX(0); cursor: pointer;"></span>
                    </label>
                </div>
                
                <div class="settings-row" draggable="true" data-section="predict" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a2c38; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">🎯</span>
                        <span style="color: #fff; font-size: 12px;">Predict Mode</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="predict" style="opacity: 0; width: 0; height: 0;">
                        <span class="settings-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: 0.4s; border-radius: 24px;"></span>
                        <span class="settings-slider-dot" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.4s; border-radius: 50%; transform: translateX(0); cursor: pointer;"></span>
                    </label>
                </div>
                
                <div class="settings-row" draggable="true" data-section="hitsMiss" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a2c38; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">✅</span>
                        <span style="color: #fff; font-size: 12px;">Hits / Miss Display</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="hitsMiss" style="opacity: 0; width: 0; height: 0;">
                        <span class="settings-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: 0.4s; border-radius: 24px;"></span>
                        <span class="settings-slider-dot" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.4s; border-radius: 50%; transform: translateX(0); cursor: pointer;"></span>
                    </label>
                </div>
                
                <div class="settings-row" draggable="true" data-section="autoplay" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a2c38; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">▶️</span>
                        <span style="color: #fff; font-size: 12px;">Auto-Play</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="autoplay" style="opacity: 0; width: 0; height: 0;">
                        <span class="settings-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: 0.4s; border-radius: 24px;"></span>
                        <span class="settings-slider-dot" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.4s; border-radius: 50%; transform: translateX(0); cursor: pointer;"></span>
                    </label>
                </div>
                
                <div class="settings-row" draggable="true" data-section="patternAnalysis" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a2c38; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">🔍</span>
                        <span style="color: #fff; font-size: 12px;">Pattern Analysis</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="patternAnalysis" style="opacity: 0; width: 0; height: 0;">
                        <span class="settings-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: 0.4s; border-radius: 24px;"></span>
                        <span class="settings-slider-dot" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.4s; border-radius: 50%; transform: translateX(0); cursor: pointer;"></span>
                    </label>
                </div>
                
                <div class="settings-row" draggable="true" data-section="recentPlays" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a2c38; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">🎲</span>
                        <span style="color: #fff; font-size: 12px;">Recent Plays</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="recentPlays" style="opacity: 0; width: 0; height: 0;">
                        <span class="settings-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: 0.4s; border-radius: 24px;"></span>
                        <span class="settings-slider-dot" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.4s; border-radius: 50%; transform: translateX(0); cursor: pointer;"></span>
                    </label>
                </div>
                
                <div class="settings-row" draggable="true" data-section="history" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">📜</span>
                        <span style="color: #fff; font-size: 12px;">History</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="history" style="opacity: 0; width: 0; height: 0;">
                        <span class="settings-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: 0.4s; border-radius: 24px;"></span>
                        <span class="settings-slider-dot" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.4s; border-radius: 50%; transform: translateX(0); cursor: pointer;"></span>
                    </label>
                </div>
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
    // Open Bet Book button wiring
    const betBookBtn = document.getElementById('open-betbook-btn');
    if (betBookBtn) {
        betBookBtn.addEventListener('click', () => {
            window.open(chrome.runtime.getURL('betbook.html'), '_blank');
        });
    }
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
    if (closeBtn) closeBtn.addEventListener('click', () => { state.isOverlayVisible = false; overlay.style.display = 'none'; });

    const sampleInput = document.getElementById('sample-size-input');
    const sampleLabel = document.getElementById('sample-label');
    if (sampleInput) {
        sampleInput.value = state.sampleSize || 5;
        sampleInput.max = Math.max(state.currentHistory.length, 1);
        if (sampleLabel) {
            sampleLabel.title = `Last ${sampleInput.value} Bets`;
        }
        sampleInput.addEventListener('input', () => {
            let val = parseInt(sampleInput.value, 10);
            if (isNaN(val) || val < 1) val = 1;
            const max = Math.max(state.currentHistory.length, 1);
            if (val > max) val = max;
            state.sampleSize = val;
            sampleInput.value = val;
            if (sampleLabel) {
                sampleLabel.title = `Last ${val} Bets`;
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
        predictSwitch.addEventListener('change', (e) => {
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
            } catch (err) { }
            if (state.isPredictMode) { calculatePrediction(); }
            else { if (window.__keno_clearHighlight) window.__keno_clearHighlight(); }
        });
    }

    const predictCount = document.getElementById('predict-count');
    if (predictCount) predictCount.addEventListener('change', () => { if (state.isPredictMode) calculatePrediction(); });

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => { clearHistory().then(h => { updateHistoryUI(h); updateHeatmap(); if (window.__keno_clearHighlight) window.__keno_clearHighlight(); }); });

    const apBtn = document.getElementById('autoplay-btn');
    if (apBtn) apBtn.addEventListener('click', () => {
        const roundsInput = document.getElementById('autoplay-rounds');
        const roundsToPlay = parseInt(roundsInput.value) || 5;
        if (state.isAutoPlayMode) {
            state.isAutoPlayMode = false;
            state.autoPlayRoundsRemaining = 0;
            if (state.autoPlayStartTime) {
                state.autoPlayElapsedTime = Math.floor((Date.now() - state.autoPlayStartTime) / 1000);
            }
        }
        else {
            state.isAutoPlayMode = true;
            state.autoPlayRoundsRemaining = roundsToPlay;
            state.autoPlayStartTime = Date.now();
            state.autoPlayElapsedTime = 0;
            const rawPredCount = parseInt(document.getElementById('autoplay-pred-count').value) || 3;
            state.autoPlayPredictionCount = Math.min(Math.max(rawPredCount, 1), 40);
            console.log('[AutoPlay] Starting with predictionCount:', state.autoPlayPredictionCount);
            autoPlayPlaceBet();
        }
        updateAutoPlayUI();
    });
    const apPredCount = document.getElementById('autoplay-pred-count');
    if (apPredCount) apPredCount.addEventListener('change', () => { const rawVal = parseInt(apPredCount.value) || 3; state.autoPlayPredictionCount = Math.min(Math.max(rawVal, 1), 40); console.log('[AutoPlay] Prediction count updated to:', state.autoPlayPredictionCount); });

    const analyzePatternBtn = document.getElementById('analyze-pattern-btn');
    if (analyzePatternBtn) {
        analyzePatternBtn.addEventListener('click', () => {
            const targetInput = document.getElementById('pattern-target');
            const patternSize = parseInt(targetInput.value);

            if (isNaN(patternSize) || patternSize < 3 || patternSize > 10) {
                alert('Please enter a valid pattern size between 3 and 10');
                return;
            }

            if (state.currentHistory.length < 10) {
                alert('Not enough history data. Play at least 10 rounds to analyze patterns.');
                return;
            }

            // Call the pattern analysis function
            if (window.__keno_showPatternAnalysis) {
                window.__keno_showPatternAnalysis(patternSize);
            }
        });
    }

    const livePatternBtn = document.getElementById('live-pattern-btn');
    if (livePatternBtn) {
        livePatternBtn.addEventListener('click', () => {
            if (window.__keno_showLivePatternAnalysis) {
                window.__keno_showLivePatternAnalysis();
            }
        });
    }

    const viewSavedBtn = document.getElementById('view-saved-numbers-btn');
    if (viewSavedBtn) {
        viewSavedBtn.addEventListener('click', () => {
            if (window.__keno_showSavedNumbers) {
                window.__keno_showSavedNumbers();
            }
        });
    }

    // View switching
    const trackerContent = document.getElementById('keno-overlay-content');
    const settingsContent = document.getElementById('keno-settings-content');
    const settingsIcon = document.getElementById('settings-icon');

    let currentView = 'tracker'; // Track current view

    function showTracker() {
        if (trackerContent) trackerContent.style.display = 'block';
        if (settingsContent) settingsContent.style.display = 'none';
        if (settingsIcon) {
            settingsIcon.textContent = '⚙️'; // Settings gear
            settingsIcon.title = 'Settings';
        }
        currentView = 'tracker';
    }

    function showSettings() {
        if (settingsContent) settingsContent.style.display = 'block';
        if (trackerContent) trackerContent.style.display = 'none';
        if (settingsIcon) {
            settingsIcon.textContent = '🏠'; // Home icon
            settingsIcon.title = 'Back to Tracker';
        }
        currentView = 'settings';
    }

    if (settingsIcon) {
        settingsIcon.addEventListener('click', () => {
            if (currentView === 'tracker') {
                showSettings();
            } else {
                showTracker();
            }
        });
    }

    // Initialize settings toggle switches after loading settings
    function initializeSettingsSwitches() {
        const settingsToggles = document.querySelectorAll('#keno-settings-content .panel-toggle');
        settingsToggles.forEach(toggle => {
            const sectionKey = toggle.dataset.section;

            // Set initial state from state.panelVisibility
            const isVisible = state.panelVisibility[sectionKey] !== false;
            toggle.checked = isVisible;

            // Update visual state
            const parent = toggle.closest('.settings-switch');
            if (parent) {
                const slider = parent.querySelector('.settings-slider');
                const dot = parent.querySelector('.settings-slider-dot');
                if (slider) slider.style.backgroundColor = isVisible ? '#00b894' : '#444';
                if (dot) dot.style.transform = isVisible ? 'translateX(20px)' : 'translateX(0)';
            }

            toggle.addEventListener('change', (e) => {
                const isChecked = e.target.checked;

                // Update visual state of switch
                const parent = e.target.closest('.settings-switch');
                if (parent) {
                    const slider = parent.querySelector('.settings-slider');
                    const dot = parent.querySelector('.settings-slider-dot');
                    if (slider) slider.style.backgroundColor = isChecked ? '#00b894' : '#444';
                    if (dot) dot.style.transform = isChecked ? 'translateX(20px)' : 'translateX(0)';
                }

                // Update state
                state.panelVisibility[sectionKey] = isChecked;

                // Auto-save to storage
                const storageApi = (typeof browser !== 'undefined') ? browser : chrome;
                storageApi.storage.local.set({ panelVisibility: state.panelVisibility }, () => {
                    console.log('[Settings] Auto-saved panel visibility:', state.panelVisibility);
                    applyPanelVisibility();
                });
            });
        });

        // Initialize drag-and-drop for reordering
        initializeDragAndDrop();
    }

    // Drag-and-drop functionality for reordering settings
    function initializeDragAndDrop() {
        const settingsList = document.getElementById('settings-list');
        if (!settingsList) return;

        const rows = settingsList.querySelectorAll('.settings-row');
        let draggedElement = null;

        rows.forEach(row => {
            row.addEventListener('dragstart', (e) => {
                draggedElement = row;
                row.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
            });

            row.addEventListener('dragend', (e) => {
                row.style.opacity = '1';
                draggedElement = null;
            });

            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                if (draggedElement && draggedElement !== row) {
                    const rect = row.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;

                    if (e.clientY < midpoint) {
                        row.parentNode.insertBefore(draggedElement, row);
                    } else {
                        row.parentNode.insertBefore(draggedElement, row.nextSibling);
                    }
                }
            });

            row.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Save the new order
                savePanelOrder();
            });
        });
    }

    // Save the current order of settings rows
    function savePanelOrder() {
        const settingsList = document.getElementById('settings-list');
        if (!settingsList) return;

        const rows = settingsList.querySelectorAll('.settings-row');
        const newOrder = Array.from(rows).map(row => row.dataset.section);

        state.panelOrder = newOrder;

        const storageApi = (typeof browser !== 'undefined') ? browser : chrome;
        storageApi.storage.local.set({ panelOrder: state.panelOrder }, () => {
            console.log('[Settings] Auto-saved panel order:', state.panelOrder);
            reorderPanelSections();
        });
    }

    // Load and apply saved panel visibility settings, then initialize switches
    loadPanelVisibilitySettings(initializeSettingsSwitches);
}

// Reorder the settings rows based on saved order
function reorderSettingsRows() {
    const settingsList = document.getElementById('settings-list');
    if (!settingsList || !state.panelOrder) return;

    const rows = settingsList.querySelectorAll('.settings-row');
    const rowMap = new Map();

    rows.forEach(row => {
        rowMap.set(row.dataset.section, row);
    });

    // Reorder based on state.panelOrder
    state.panelOrder.forEach((sectionKey, index) => {
        const row = rowMap.get(sectionKey);
        if (row) {
            settingsList.appendChild(row);
        }
    });
}

// Reorder the main panel sections based on saved order
function reorderPanelSections() {
    const trackerContent = document.getElementById('keno-overlay-content');
    if (!trackerContent || !state.panelOrder) return;

    const sections = new Map();
    state.panelOrder.forEach(sectionKey => {
        const section = trackerContent.querySelector(`[data-section="${sectionKey}"]`);
        if (section) {
            sections.set(sectionKey, section);
        }
    });

    // Reorder by appending in the correct order
    state.panelOrder.forEach(sectionKey => {
        const section = sections.get(sectionKey);
        if (section) {
            trackerContent.appendChild(section);
        }
    });
}

/**
 * Load panel visibility settings from localStorage and apply them
 * @param {Function} callback - Optional callback to run after loading settings
 */
function loadPanelVisibilitySettings(callback) {
    const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

    storageApi.storage.local.get(['panelVisibility', 'panelOrder'], (result) => {
        if (result.panelVisibility) {
            state.panelVisibility = { ...state.panelVisibility, ...result.panelVisibility };
        }
        if (result.panelOrder) {
            state.panelOrder = result.panelOrder;
        }

        applyPanelVisibility();

        // Reorder settings rows to match saved order
        setTimeout(() => {
            reorderSettingsRows();
            reorderPanelSections();
        }, 100);

        // Call callback after settings are loaded
        if (callback && typeof callback === 'function') {
            callback();
        }
    });
}

/**
 * Apply panel visibility settings to the overlay
 */
function applyPanelVisibility() {
    const sections = ['sampleSize', 'predict', 'hitsMiss', 'autoplay', 'patternAnalysis', 'recentPlays', 'history'];

    sections.forEach(sectionName => {
        const element = document.querySelector(`[data-section="${sectionName}"]`);
        if (element) {
            element.style.display = state.panelVisibility[sectionName] ? 'block' : 'none';
        }
    });
}



// Try to inject footer button periodically (original behavior)
export function injectFooterButton() {
    if (!window.location.href.includes('keno')) {
        const existingBtn = document.getElementById('keno-toggle-btn'); if (existingBtn) existingBtn.remove(); const overlay = document.getElementById('keno-tracker-overlay'); if (overlay) overlay.style.display = 'none'; return;
    }
    const footerStack = document.querySelector('.game-footer .stack');
    if (!footerStack || document.getElementById('keno-toggle-btn')) return;
    const btn = document.createElement('div'); btn.id = 'keno-toggle-btn'; Object.assign(btn.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0 10px', opacity: '0.7', transition: 'opacity 0.2s' });
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #fff;">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <span style="margin-left:5px; font-size:12px; font-weight:bold; color:#fff;">Tracker</span>
    `;
    btn.addEventListener('mouseenter', () => btn.style.opacity = '1'); btn.addEventListener('mouseleave', () => btn.style.opacity = '0.7');
    btn.addEventListener('click', () => { const overlay = document.getElementById('keno-tracker-overlay'); if (overlay) { state.isOverlayVisible = !state.isOverlayVisible; overlay.style.display = state.isOverlayVisible ? 'block' : 'none'; } });
    footerStack.insertBefore(btn, footerStack.firstChild);
}

// Expose for main entry to call
export function initOverlay() { createOverlay(); setInterval(injectFooterButton, 1000); }

