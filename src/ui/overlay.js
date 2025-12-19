// src/overlay.js
import { state } from '../core/state.js';
import { updateHistoryUI, clearHistory, saveGeneratorSettings, loadGeneratorSettings } from '../core/storage.js';
import { updateHeatmap } from '../features/heatmap.js';
import { calculatePrediction, selectPredictedNumbers, generateNumbers, updateMomentumPredictions, selectMomentumNumbers } from './numberSelection.js';
import { updateAutoPlayUI, autoPlayPlaceBet } from '../features/autoplay.js';
import { getIntValue, getCheckboxValue, getSelectValue, getFloatValue } from '../utils/domReader.js';

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
            <div data-section="heatmap" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px; cursor:pointer;">
                <div id="heatmap-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span id="heatmap-label" style="color:#ffd700; font-weight:600;">🗺️ Heatmap</span>
                        <span id="heatmap-status" style="color:#aaa; font-size:9px;">Active</span>
                    </div>
                    
                    <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
                        <input type="checkbox" id="heatmap-mode-switch" style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#444; transition:.4s; border-radius:20px;"></span>
                        <span id="heatmap-slider-dot" style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; cursor:pointer;"></span>
                    </label>
                </div>
                
                <div id="heatmap-details" style="max-height:0; overflow:hidden; transition:max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease; opacity:0;">
                    <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                        <span style="color:#aaa; font-size:10px;">Sample Size:</span>
                        <input type="number" id="heatmap-sample-size" min="1" value="100" 
                            style="flex:1; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                    </div>
                </div>
            </div>

            <div data-section="numberGenerator" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px; cursor:pointer;">
                <div id="generator-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span id="generator-label" style="color:#74b9ff; font-weight:600;">🎲 Number Generator</span>
                        <span id="generator-status" style="color:#aaa; font-size:9px;">Off</span>
                    </div>
                    
                    <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
                        <input type="checkbox" id="generator-mode-switch" style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#444; transition:.4s; border-radius:20px;"></span>
                        <span id="generator-slider-dot" style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; cursor:pointer;"></span>
                    </label>
                </div>
                
                <div id="generator-details" style="max-height:0; overflow:hidden; transition:max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease; opacity:0;">
                    <div style="display:flex; align-items:center; gap:8px; margin-top:8px; margin-bottom:8px;">
                        <span style="color:#aaa; font-size:10px;">Count:</span>
                        <input type="number" id="generator-count" min="1" max="10" value="3" 
                            style="width:64px; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                    </div>
                    
                    <!-- Universal Refresh Control -->
                    <div style="margin-bottom:8px;">
                        <span style="color:#aaa; font-size:10px;">Refresh:</span>
                        <div style="display:flex; gap:4px; margin-top:4px;">
                            <button id="generator-refresh-btn" style="flex:1; background:#2a3f4f; color:#74b9ff; border:1px solid #3a5f6f; padding:4px; border-radius:4px; cursor:pointer; font-size:10px;">🔄 Refresh</button>
                            <input type="number" id="generator-interval" min="0" max="20" value="0" placeholder="Auto" style="width:50px; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:10px;">
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                            <span style="color:#666; font-size:8px;">Auto interval: rounds (0=manual)</span>
                            <span id="generator-rounds-until-refresh" style="color:#74b9ff; font-size:8px; font-weight:600;"></span>
                        </div>
                    </div>
                    
                    <!-- Live Preview of Next Numbers -->
                    <div id="generator-preview" style="margin-bottom:10px; padding:8px; background:#14202b; border-radius:4px; border:1px solid #3a5f6f;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <span style="color:#74b9ff; font-size:9px; font-weight:600;">Next Numbers:</span>
                            <span id="generator-preview-method" style="color:#666; font-size:8px;"></span>
                        </div>
                        <div id="generator-preview-numbers" style="display:flex; flex-wrap:wrap; gap:4px; min-height:24px; align-items:center;">
                            <span style="color:#666; font-size:9px;">-</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:8px;">
                        <span style="color:#aaa; font-size:10px;">Method:</span>
                        <select id="generator-method-select" style="width:100%; background:#14202b; border:1px solid #444; color:#fff; padding:6px; border-radius:4px; margin-top:4px; cursor:pointer; font-size:11px;">
                            <option value="frequency">🔥 Frequency (Hot Numbers)</option>
                            <option value="cold">❄️ Cold (Least Frequent)</option>
                            <option value="mixed">🔀 Mixed (Hot + Cold)</option>
                            <option value="average">📊 Average (Median Frequency)</option>
                            <option value="momentum">⚡ Momentum (Trending)</option>
                            <option value="auto">🤖 Auto (Best Performer)</option>
                            <option value="shapes">🔷 Shapes (Board Patterns)</option>
                        </select>
                    </div>
                    
                    <!-- Frequency/Cold/Mixed/Average parameters -->
                    <div id="frequency-params" style="display:block;">
                        <div style="margin-bottom:8px;">
                            <span style="color:#aaa; font-size:10px;">Sample Size:</span>
                            <input type="number" id="frequency-sample-size" min="1" value="5" 
                                style="width:100%; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px; margin-top:4px;">
                        </div>
                    </div>
                    
                    <!-- Shapes-specific parameters -->
                    <div id="shapes-params" style="display:none;">
                        <div style="margin-bottom:8px;">
                            <span style="color:#aaa; font-size:10px;">Pattern:</span>
                            <select id="shapes-pattern-select" style="width:100%; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; font-size:10px; margin-top:4px;">
                                <option value="random">🎲 Random Shape</option>
                                <option value="plus">➕ Plus</option>
                                <option value="cross">✖️ Cross</option>
                                <option value="jesus">✝️ Jesus Saves</option>
                                <option value="lShape">🔲 L-Shape</option>
                                <option value="tShape">🅣 T-Shape</option>
                                <option value="cShape">🌙 C-Shape</option>
                                <option value="square">⬛ Square</option>
                                <option value="lineHorizontal">➖ Horizontal Line</option>
                                <option value="lineVertical">| Vertical Line</option>
                                <option value="diagonalDown">↘️ Diagonal Down</option>
                                <option value="diagonalUp">↗️ Diagonal Up</option>
                                <option value="zigzag">⚡ Zigzag</option>
                                <option value="arrow">➡️ Arrow</option>
                            </select>
                        </div>
                        <div style="margin-bottom:8px;">
                            <span style="color:#aaa; font-size:10px;">Placement:</span>
                            <select id="shapes-placement-select" style="width:100%; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; font-size:10px; margin-top:4px;">
                                <option value="random">🎲 Random Position</option>
                                <option value="hot">🔥 Hot Numbers Area</option>
                                <option value="trending">📈 Trending Position</option>
                            </select>
                        </div>
                        <div style="padding:6px; background:#14202b; border-radius:4px; border:1px solid #fd79a830;">
                            <div style="color:#fd79a8; font-size:9px; margin-bottom:2px;">Current Shape:</div>
                            <div id="shapes-current-display" style="color:#aaa; font-size:9px; line-height:1.4;">-</div>
                        </div>
                    </div>
                    
                    <!-- Momentum-specific parameters -->
                    <div id="momentum-params" style="display:none;">
                        <div id="momentum-info" style="margin-bottom:6px; padding:6px; background:#14202b; border-radius:4px;">
                            <div style="display:flex; flex-direction:column; gap:2px;">
                                <span style="color:#666; font-size:9px;">Current Numbers:</span>
                                <span id="momentum-current-numbers" style="color:#74b9ff; font-size:8px; font-weight:500; line-height:1.3; word-break:break-all;">-</span>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:6px;">
                            <div>
                                <span style="color:#aaa; font-size:9px;">Detection:</span>
                                <input type="number" id="momentum-detection" min="3" max="20" value="5" 
                                    style="width:100%; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                            </div>
                            <div>
                                <span style="color:#aaa; font-size:9px;">Baseline:</span>
                                <input type="number" id="momentum-baseline" min="10" max="200" value="50" 
                                    style="width:100%; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                            </div>
                            <div>
                                <span style="color:#aaa; font-size:9px;">Threshold:</span>
                                <input type="number" id="momentum-threshold" min="1" max="3" step="0.1" value="1.5" 
                                    style="width:100%; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                            </div>
                            <div>
                                <span style="color:#aaa; font-size:9px;">Pool:</span>
                                <input type="number" id="momentum-pool" min="5" max="30" value="15" 
                                    style="width:100%; background:#14202b; border:1px solid #444; color:#fff; padding:4px; border-radius:4px; text-align:center; font-size:11px;">
                            </div>
                        </div>
                    </div>
                    
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-top:6px; margin-bottom:6px; padding:6px; background:#14202b; border-radius:4px;">
                        <span style="color:#aaa; font-size:10px;">Auto-Select Numbers</span>
                        <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
                            <input type="checkbox" id="generator-autoselect-switch" style="opacity:0; width:0; height:0;">
                            <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#444; transition:.4s; border-radius:20px;"></span>
                            <span id="generator-autoselect-dot" style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; cursor:pointer;"></span>
                        </label>
                    </div>
                    <button id="generate-numbers-btn" style="width:100%; background:#74b9ff; color:#fff; border:none; padding:6px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px; margin-top:4px;">Generate Numbers</button>
                    <button id="method-comparison-btn" style="width:100%; background:#2a3f4f; color:#74b9ff; border:1px solid #3a5f6f; padding:4px; border-radius:4px; cursor:pointer; font-size:9px; margin-top:4px;">📊 Compare Methods</button>
                </div>
            </div>

            <div data-section="hitsMiss" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px;">
                <div style="color:#00b894">Hits: <span id="tracker-hits">-</span></div>
                <div style="color:#ff7675">Miss: <span id="tracker-misses">-</span></div>
            </div>

            <div data-section="autoplay" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px; cursor:pointer;">
                <div id="autoplay-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <span id="autoplay-label" style="color:#74b9ff; font-weight:bold;">Auto-Play</span>
                    <span id="autoplay-status" style="color:#aaa; font-size:10px;">Ready</span>
                </div>
                <div id="autoplay-details" style="max-height:0; overflow:hidden; transition:max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease; opacity:0;">
                    <div style="display:flex; gap:5px; margin-top:8px; margin-bottom:6px;">
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
            </div>
            
            <div data-section="profitLoss" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px; cursor:pointer;">
                <div id="profitLoss-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#ffd700; font-weight:bold;">💰 Profit/Loss</span>
                    <select id="profit-currency-select" style="background:#14202b; border:1px solid #444; color:#fff; padding:2px 4px; border-radius:4px; font-size:10px; cursor:pointer;">
                        <option value="btc">BTC</option>
                    </select>
                </div>
                <div id="profitLoss-details" style="max-height:0; overflow:hidden; transition:max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease; opacity:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; margin-bottom:6px;">
                        <span style="color:#aaa; font-size:11px;">Session:</span>
                        <span id="session-profit-value" style="font-weight:bold; font-size:11px;">0.00 BTC</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="color:#aaa; font-size:11px;">Total:</span>
                        <span id="total-profit-value" style="font-weight:bold; font-size:11px;">0.00 BTC</span>
                    </div>
                    <button id="reset-session-profit-btn" style="width:100%; background:#2a3b4a; color:#74b9ff; border:none; padding:4px; border-radius:4px; font-size:9px; cursor:pointer; margin-top:4px;">Reset Session</button>
                </div>
            </div>
            
            <div data-section="patternAnalysis" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px; cursor:pointer;">
                <div id="patternAnalysis-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#ffd700; font-weight:bold;">Pattern Analysis</span>
                </div>
                <div id="patternAnalysis-details" style="max-height:0; overflow:hidden; transition:max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease; opacity:0;">
                    <div style="display:flex; gap:5px; align-items:center; margin-top:8px; margin-bottom:8px;">
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
            </div>
            
            <div data-section="recentPlays" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px; cursor:pointer;">
                <div id="recentPlays-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#00b894; font-weight:bold;">Recent Plays</span>
                    <button id="view-saved-numbers-btn" style="background:#2a3b4a; color:#74b9ff; border:none; padding:3px 8px; border-radius:4px; font-size:9px; cursor:pointer; font-weight:bold;">Saved Combos</button>
                </div>
                <div id="recentPlays-details" style="max-height:0; overflow:hidden; transition:max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease; opacity:0;">
                    <div id="recent-played-list" style="min-height:60px; margin-top:8px;">
                        <div style="color:#666; font-size:10px; padding:8px; text-align:center;">No recent plays</div>
                    </div>
                </div>
            </div>
            
            <div data-section="history" style="margin-bottom:15px; background:#0f212e; padding:8px; border-radius:4px; cursor:pointer;">
                <div id="history-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#fff; font-weight:bold;">History (Last 100)</span>
                    <button id="clear-btn" style="background:none; border:none; color:#f55; cursor:pointer; font-size:11px;">Reset</button>
                </div>
                <div id="history-details" style="max-height:0; overflow:hidden; transition:max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease; opacity:0;">
                    <div id="history-list" style="height:150px; overflow-y:auto; border:1px solid #333; background:#14202b; padding:5px; border-radius:4px; margin-top:8px;"></div>
                    <button id="open-betbook-btn" style="width:100%; background:#ffd700; color:#222; border:none; padding:6px 10px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px; margin-top:8px;">Open Stats Book</button>
                </div>
            </div>
        </div>

        <!-- Settings Tab Content -->
        <div id="keno-settings-content" class="tab-content" style="padding:15px; background:#213743; border-bottom-left-radius:8px; border-bottom-right-radius:8px; display:none;">
            <div id="settings-list" style="background: #0f212e; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="color: #aaa; font-size: 12px; margin-bottom: 10px;">Show/Hide Panel Sections (Drag to Reorder)</div>
                
                <div class="settings-row" draggable="true" data-section="heatmap" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a2c38; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">🗺️</span>
                        <span style="color: #fff; font-size: 12px;">Heatmap</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="heatmap" style="opacity: 0; width: 0; height: 0;">
                        <span class="settings-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: 0.4s; border-radius: 24px;"></span>
                        <span class="settings-slider-dot" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.4s; border-radius: 50%; transform: translateX(0); cursor: pointer;"></span>
                    </label>
                </div>
                
                <div class="settings-row" draggable="true" data-section="numberGenerator" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a2c38; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">🎲</span>
                        <span style="color: #fff; font-size: 12px;">Number Generator</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="numberGenerator" style="opacity: 0; width: 0; height: 0;">
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
                
                <div class="settings-row" draggable="true" data-section="profitLoss" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a2c38; cursor: move;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #666; font-size: 14px;">☰</span>
                        <span style="font-size: 16px;">💰</span>
                        <span style="color: #fff; font-size: 12px;">Profit/Loss</span>
                    </div>
                    <label class="settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" class="panel-toggle" data-section="profitLoss" style="opacity: 0; width: 0; height: 0;">
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

    // Heatmap handlers
    const heatmapDot = document.getElementById('heatmap-slider-dot');
    const heatmapSwitch = document.getElementById('heatmap-mode-switch');
    const heatmapStatus = document.getElementById('heatmap-status');
    const heatmapHeader = document.getElementById('heatmap-header');
    const heatmapDetails = document.getElementById('heatmap-details');
    const heatmapSampleInput = document.getElementById('heatmap-sample-size');

    // Collapsible heatmap section
    if (heatmapHeader && heatmapDetails) {
        heatmapHeader.addEventListener('click', (e) => {
            if (e.target.closest('label') || e.target.closest('input')) return;
            const isExpanded = heatmapDetails.style.maxHeight && heatmapDetails.style.maxHeight !== '0px';
            if (isExpanded) {
                heatmapDetails.style.maxHeight = '0';
                heatmapDetails.style.opacity = '0';
            } else {
                heatmapDetails.style.maxHeight = '100px';
                heatmapDetails.style.opacity = '1';
            }
        });
    }

    if (heatmapSwitch) {
        // Initialize visual state
        if (state.isHeatmapActive) {
            if (heatmapDot) { heatmapDot.style.transform = 'translateX(14px)'; heatmapDot.style.backgroundColor = '#ffd700'; }
            if (heatmapStatus) heatmapStatus.textContent = 'Active';
            if (heatmapDetails) {
                heatmapDetails.style.maxHeight = '100px';
                heatmapDetails.style.opacity = '1';
            }
        }
        heatmapSwitch.checked = !!state.isHeatmapActive;
        heatmapSwitch.addEventListener('change', (e) => {
            state.isHeatmapActive = getCheckboxValue(heatmapSwitch);
            if (heatmapDot) {
                heatmapDot.style.transform = state.isHeatmapActive ? 'translateX(14px)' : 'translateX(0px)';
                heatmapDot.style.backgroundColor = state.isHeatmapActive ? '#ffd700' : 'white';
            }
            // Update status text
            if (heatmapStatus) {
                heatmapStatus.textContent = state.isHeatmapActive ? 'Active' : 'Off';
                heatmapStatus.style.color = state.isHeatmapActive ? '#ffd700' : '#aaa';
            }
            // Update track background
            try {
                const parentLabel = heatmapSwitch.closest('label');
                if (parentLabel) {
                    const track = Array.from(parentLabel.querySelectorAll('span')).find(s => s.id !== 'heatmap-slider-dot');
                    if (track) track.style.backgroundColor = state.isHeatmapActive ? '#2a3b4a' : '#444';
                }
            } catch (err) { }

            // Expand details when enabled
            if (state.isHeatmapActive && heatmapDetails) {
                heatmapDetails.style.maxHeight = '100px';
                heatmapDetails.style.opacity = '1';
            }

            // Refresh heatmap
            if (state.isHeatmapActive) {
                updateHeatmap();
            } else if (window.__keno_clearHighlight) {
                window.__keno_clearHighlight();
            }
        });
    }

    if (heatmapSampleInput) {
        heatmapSampleInput.value = state.heatmapSampleSize || 100;
        heatmapSampleInput.max = Math.max(state.currentHistory.length, 1);
        heatmapSampleInput.addEventListener('input', () => {
            const max = Math.max(state.currentHistory.length, 1);
            const val = getIntValue(heatmapSampleInput, 1, { min: 1, max });
            state.heatmapSampleSize = val;
            heatmapSampleInput.value = val;
            if (state.isHeatmapActive) updateHeatmap();
        });
    }

    // Legacy sample size input (kept for backward compatibility)
    const sampleInput = document.getElementById('sample-size-input');
    const sampleLabel = document.getElementById('sample-label');
    if (sampleInput) {
        sampleInput.value = state.sampleSize || 5;
        sampleInput.max = Math.max(state.currentHistory.length, 1);
        if (sampleLabel) {
            sampleLabel.title = `Last ${sampleInput.value} Bets`;
        }
        sampleInput.addEventListener('input', () => {
            const max = Math.max(state.currentHistory.length, 1);
            const val = getIntValue(sampleInput, 1, { min: 1, max });
            state.sampleSize = val;
            sampleInput.value = val;
            if (sampleLabel) {
                sampleLabel.title = `Last ${val} Bets`;
            }
            updateHeatmap();
            if (state.isPredictMode) calculatePrediction();
        });
    }

    // Unified Number Generator handlers
    const genDot = document.getElementById('generator-slider-dot');
    const generatorSwitch = document.getElementById('generator-mode-switch');
    const generatorStatus = document.getElementById('generator-status');
    const generatorHeader = document.getElementById('generator-header');
    const generatorDetails = document.getElementById('generator-details');
    const generatorCount = document.getElementById('generator-count');
    const frequencySampleInput = document.getElementById('frequency-sample-size');
    const methodSelect = document.getElementById('generator-method-select');
    const generateBtn = document.getElementById('generate-numbers-btn');
    const frequencyParams = document.getElementById('frequency-params');
    const momentumParams = document.getElementById('momentum-params');
    const momentumInfo = document.querySelector('#momentum-params #momentum-info');

    // Collapsible generator section
    if (generatorHeader && generatorDetails) {
        generatorHeader.addEventListener('click', (e) => {
            if (e.target.closest('label') || e.target.closest('input') || e.target.closest('select') || e.target.closest('button')) return;
            const isExpanded = generatorDetails.style.maxHeight && generatorDetails.style.maxHeight !== '0px';
            if (isExpanded) {
                generatorDetails.style.maxHeight = '0';
                generatorDetails.style.opacity = '0';
            } else {
                generatorDetails.style.maxHeight = '650px';
                generatorDetails.style.opacity = '1';
            }
        });
    }

    // Unified count input
    if (generatorCount) {
        generatorCount.value = state.generatorCount || 3;
        generatorCount.addEventListener('change', () => {
            state.generatorCount = getIntValue(generatorCount, 3);
            saveGeneratorSettings();
            if (state.isGeneratorActive && window.__keno_generateNumbers) {
                window.__keno_generateNumbers();
            }
            if (window.__keno_updateGeneratorPreview) {
                window.__keno_updateGeneratorPreview();
            }
        });
    }

    // Frequency sample size input (specific to frequency method)
    if (frequencySampleInput) {
        frequencySampleInput.value = state.generatorSampleSize || 5;
        frequencySampleInput.max = Math.max(state.currentHistory.length, 1);
        frequencySampleInput.addEventListener('input', () => {
            const max = Math.max(state.currentHistory.length, 1);
            const val = getIntValue(frequencySampleInput, 1, { min: 1, max });
            state.generatorSampleSize = val;
            frequencySampleInput.value = val;
            saveGeneratorSettings();
            if (state.isGeneratorActive && window.__keno_generateNumbers) {
                window.__keno_generateNumbers();
            }
        });
    }

    // Method selector - show/hide relevant parameters
    if (methodSelect) {
        methodSelect.value = state.generatorMethod || 'frequency';
        methodSelect.addEventListener('change', (e) => {
            state.generatorMethod = getSelectValue(methodSelect, 'frequency');
            saveGeneratorSettings();

            // Show/hide parameters based on method
            // frequency, cold, mixed, average, auto use frequency params (sample size)
            const usesFrequencyParams = ['frequency', 'cold', 'mixed', 'average', 'auto'].includes(state.generatorMethod);
            if (frequencyParams) frequencyParams.style.display = usesFrequencyParams ? 'block' : 'none';
            if (momentumParams) momentumParams.style.display = state.generatorMethod === 'momentum' ? 'block' : 'none';

            // Show/hide shapes params
            const shapesParams = document.getElementById('shapes-params');
            if (shapesParams) {
                shapesParams.style.display = state.generatorMethod === 'shapes' ? 'block' : 'none';
            }

            // Update legacy state for backward compatibility
            state.isPredictMode = state.isGeneratorActive && usesSampleSize;
            state.isMomentumMode = state.isGeneratorActive && state.generatorMethod === 'momentum';

            // Update momentum countdown if switching to momentum
            if (state.generatorMethod === 'momentum' && window.__keno_updateMomentumCountdown) {
                window.__keno_updateMomentumCountdown();
            }

            // Regenerate with new method and update preview
            if (state.isGeneratorActive && window.__keno_generateNumbers) {
                window.__keno_generateNumbers(true); // Force refresh with new method
            }
            if (window.__keno_updateGeneratorPreview) {
                window.__keno_updateGeneratorPreview();
            }
        });

        // Initialize parameter visibility
        const usesFrequencyParams = ['frequency', 'cold', 'mixed', 'average', 'auto'].includes(state.generatorMethod);
        if (frequencyParams) frequencyParams.style.display = usesFrequencyParams ? 'block' : 'none';
        if (momentumParams) momentumParams.style.display = state.generatorMethod === 'momentum' ? 'block' : 'none';

        // Initialize shapes params visibility
        const shapesParams = document.getElementById('shapes-params');
        if (shapesParams) {
            shapesParams.style.display = state.generatorMethod === 'shapes' ? 'block' : 'none';
        }
    }

    if (generatorSwitch) {
        // Initialize visual state
        if (state.isGeneratorActive) {
            if (genDot) { genDot.style.transform = 'translateX(14px)'; genDot.style.backgroundColor = '#74b9ff'; }
            if (generatorStatus) generatorStatus.textContent = 'Active';
            if (generatorDetails) {
                generatorDetails.style.maxHeight = '650px';
                generatorDetails.style.opacity = '1';
            }
        }
        generatorSwitch.checked = !!state.isGeneratorActive;
        generatorSwitch.addEventListener('change', (e) => {
            state.isGeneratorActive = getCheckboxValue(generatorSwitch);
            if (genDot) {
                genDot.style.transform = state.isGeneratorActive ? 'translateX(14px)' : 'translateX(0px)';
                genDot.style.backgroundColor = state.isGeneratorActive ? '#74b9ff' : 'white';
            }
            // Update status text
            if (generatorStatus) {
                generatorStatus.textContent = state.isGeneratorActive ? 'Active' : 'Off';
                generatorStatus.style.color = state.isGeneratorActive ? '#74b9ff' : '#aaa';
            }
            // Update track background
            try {
                const parentLabel = generatorSwitch.closest('label');
                if (parentLabel) {
                    const track = Array.from(parentLabel.querySelectorAll('span')).find(s => s.id !== 'generator-slider-dot');
                    if (track) track.style.backgroundColor = state.isGeneratorActive ? '#2a3b4a' : '#444';
                }
            } catch (err) { }

            // Expand details when enabled
            if (state.isGeneratorActive && generatorDetails) {
                generatorDetails.style.maxHeight = '650px';
                generatorDetails.style.opacity = '1';
            }

            // Update legacy state for backward compatibility
            state.isPredictMode = state.isGeneratorActive && state.generatorMethod === 'frequency';
            state.isMomentumMode = state.isGeneratorActive && state.generatorMethod === 'momentum';

            // Update momentum countdown if active
            if (state.isGeneratorActive && state.generatorMethod === 'momentum' && window.__keno_updateMomentumCountdown) {
                window.__keno_updateMomentumCountdown();
            }

            if (!state.isGeneratorActive) {
                if (window.__keno_clearHighlight) window.__keno_clearHighlight();
            }
        });
    }

    // Auto-select toggle handler
    const genAutoSelectSwitch = document.getElementById('generator-autoselect-switch');
    const genAsDot = document.getElementById('generator-autoselect-dot');
    if (genAutoSelectSwitch) {
        genAutoSelectSwitch.checked = !!state.generatorAutoSelect;
        genAutoSelectSwitch.addEventListener('change', (e) => {
            state.generatorAutoSelect = e.target.checked;
            saveGeneratorSettings();
            // Update legacy state
            state.momentumAutoSelect = e.target.checked;

            if (genAsDot) {
                genAsDot.style.transform = state.generatorAutoSelect ? 'translateX(14px)' : 'translateX(0px)';
                genAsDot.style.backgroundColor = state.generatorAutoSelect ? '#74b9ff' : 'white';
            }
            // Update track background
            try {
                const parentLabel = genAutoSelectSwitch.closest('label');
                if (parentLabel) {
                    const track = Array.from(parentLabel.querySelectorAll('span')).find(s => s.id !== 'generator-autoselect-dot');
                    if (track) track.style.backgroundColor = state.generatorAutoSelect ? '#2a3b4a' : '#444';
                }
            } catch (err) { }
        });
    }

    // Generate button handler
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            if (window.__keno_generateNumbers) {
                window.__keno_generateNumbers(true); // Force refresh even for momentum
            }
        });
    }

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete ALL bet history? This action cannot be undone!')) {
                clearHistory().then(h => {
                    updateHistoryUI(h);
                    updateHeatmap();
                    if (window.__keno_clearHighlight) window.__keno_clearHighlight();
                    if (window.__keno_recalculateTotalProfit) window.__keno_recalculateTotalProfit();
                }).catch(err => {
                    console.error('[overlay] Error clearing history:', err);
                });
            }
        });
    }

    const resetSessionBtn = document.getElementById('reset-session-profit-btn');
    if (resetSessionBtn) {
        resetSessionBtn.addEventListener('click', () => {
            if (window.__keno_resetSessionProfit) {
                window.__keno_resetSessionProfit();
            }
        });
    }

    const currencySelect = document.getElementById('profit-currency-select');
    if (currencySelect) {
        currencySelect.addEventListener('change', (e) => {
            if (window.__keno_changeCurrency) {
                window.__keno_changeCurrency(e.target.value);
            }
        });
    }

    // Profit/Loss hover expand/collapse with pin functionality
    const profitLossSection = document.querySelector('[data-section="profitLoss"]');
    const profitLossDetails = document.getElementById('profitLoss-details');
    const profitLossHeader = document.getElementById('profitLoss-header');
    let profitLossPinned = false;

    if (profitLossSection && profitLossDetails && profitLossHeader) {
        // Click to pin/unpin
        profitLossHeader.addEventListener('click', (e) => {
            // Don't toggle if clicking the currency select
            if (e.target.id === 'profit-currency-select' || e.target.closest('#profit-currency-select')) {
                return;
            }

            profitLossPinned = !profitLossPinned;

            if (profitLossPinned) {
                profitLossDetails.style.maxHeight = '200px';
                profitLossDetails.style.opacity = '1';
                profitLossHeader.style.backgroundColor = '#1a2c38';
            } else {
                profitLossDetails.style.maxHeight = '0';
                profitLossDetails.style.opacity = '0';
                profitLossHeader.style.backgroundColor = '';
            }
        });

        // Hover only works when not pinned
        profitLossSection.addEventListener('mouseenter', () => {
            if (!profitLossPinned) {
                profitLossDetails.style.maxHeight = '200px';
                profitLossDetails.style.opacity = '1';
            }
        });
        profitLossSection.addEventListener('mouseleave', () => {
            if (!profitLossPinned) {
                profitLossDetails.style.maxHeight = '0';
                profitLossDetails.style.opacity = '0';
            }
        });
    }

    // Auto-Play hover expand/collapse with pin functionality
    const autoplaySection = document.querySelector('[data-section="autoplay"]');
    const autoplayDetails = document.getElementById('autoplay-details');
    const autoplayHeader = document.getElementById('autoplay-header');
    let autoplayPinned = false;

    if (autoplaySection && autoplayDetails && autoplayHeader) {
        autoplayHeader.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            autoplayPinned = !autoplayPinned;

            if (autoplayPinned) {
                autoplayDetails.style.maxHeight = '200px';
                autoplayDetails.style.opacity = '1';
                autoplayHeader.style.backgroundColor = '#1a2c38';
            } else {
                autoplayDetails.style.maxHeight = '0';
                autoplayDetails.style.opacity = '0';
                autoplayHeader.style.backgroundColor = '';
            }
        });

        autoplaySection.addEventListener('mouseenter', () => {
            if (!autoplayPinned) {
                autoplayDetails.style.maxHeight = '200px';
                autoplayDetails.style.opacity = '1';
            }
        });
        autoplaySection.addEventListener('mouseleave', () => {
            if (!autoplayPinned) {
                autoplayDetails.style.maxHeight = '0';
                autoplayDetails.style.opacity = '0';
            }
        });
    }

    // Pattern Analysis hover expand/collapse with pin functionality
    const patternSection = document.querySelector('[data-section="patternAnalysis"]');
    const patternDetails = document.getElementById('patternAnalysis-details');
    const patternHeader = document.getElementById('patternAnalysis-header');
    let patternPinned = false;

    if (patternSection && patternDetails && patternHeader) {
        patternHeader.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            patternPinned = !patternPinned;

            if (patternPinned) {
                patternDetails.style.maxHeight = '200px';
                patternDetails.style.opacity = '1';
                patternHeader.style.backgroundColor = '#1a2c38';
            } else {
                patternDetails.style.maxHeight = '0';
                patternDetails.style.opacity = '0';
                patternHeader.style.backgroundColor = '';
            }
        });

        patternSection.addEventListener('mouseenter', () => {
            if (!patternPinned) {
                patternDetails.style.maxHeight = '200px';
                patternDetails.style.opacity = '1';
            }
        });
        patternSection.addEventListener('mouseleave', () => {
            if (!patternPinned) {
                patternDetails.style.maxHeight = '0';
                patternDetails.style.opacity = '0';
            }
        });
    }

    // Recent Plays hover expand/collapse with pin functionality
    const recentPlaysSection = document.querySelector('[data-section="recentPlays"]');
    const recentPlaysDetails = document.getElementById('recentPlays-details');
    const recentPlaysHeader = document.getElementById('recentPlays-header');
    let recentPlaysPinned = false;

    if (recentPlaysSection && recentPlaysDetails && recentPlaysHeader) {
        recentPlaysHeader.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            recentPlaysPinned = !recentPlaysPinned;

            if (recentPlaysPinned) {
                recentPlaysDetails.style.maxHeight = '300px';
                recentPlaysDetails.style.opacity = '1';
                recentPlaysHeader.style.backgroundColor = '#1a2c38';
            } else {
                recentPlaysDetails.style.maxHeight = '0';
                recentPlaysDetails.style.opacity = '0';
                recentPlaysHeader.style.backgroundColor = '';
            }
        });

        recentPlaysSection.addEventListener('mouseenter', () => {
            if (!recentPlaysPinned) {
                recentPlaysDetails.style.maxHeight = '300px';
                recentPlaysDetails.style.opacity = '1';
            }
        });
        recentPlaysSection.addEventListener('mouseleave', () => {
            if (!recentPlaysPinned) {
                recentPlaysDetails.style.maxHeight = '0';
                recentPlaysDetails.style.opacity = '0';
            }
        });
    }

    // History hover expand/collapse with pin functionality
    const historySection = document.querySelector('[data-section="history"]');
    const historyDetails = document.getElementById('history-details');
    const historyHeader = document.getElementById('history-header');
    let historyPinned = false;

    if (historySection && historyDetails && historyHeader) {
        historyHeader.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            historyPinned = !historyPinned;

            if (historyPinned) {
                historyDetails.style.maxHeight = '300px';
                historyDetails.style.opacity = '1';
                historyHeader.style.backgroundColor = '#1a2c38';
            } else {
                historyDetails.style.maxHeight = '0';
                historyDetails.style.opacity = '0';
                historyHeader.style.backgroundColor = '';
            }
        });

        historySection.addEventListener('mouseenter', () => {
            if (!historyPinned) {
                historyDetails.style.maxHeight = '300px';
                historyDetails.style.opacity = '1';
            }
        });
        historySection.addEventListener('mouseleave', () => {
            if (!historyPinned) {
                historyDetails.style.maxHeight = '0';
                historyDetails.style.opacity = '0';
            }
        });
    }

    const apBtn = document.getElementById('autoplay-btn');
    if (apBtn) apBtn.addEventListener('click', () => {
        const roundsInput = document.getElementById('autoplay-rounds');
        const roundsToPlay = getIntValue(roundsInput, 5);
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
            const rawPredCount = getIntValue('autoplay-pred-count', 3);
            state.autoPlayPredictionCount = Math.min(Math.max(rawPredCount, 1), 40);
            autoPlayPlaceBet();
        }
        updateAutoPlayUI();
    });
    const apPredCount = document.getElementById('autoplay-pred-count');
    if (apPredCount) apPredCount.addEventListener('change', () => { const rawVal = parseInt(apPredCount.value) || 3; state.autoPlayPredictionCount = Math.min(Math.max(rawVal, 1), 40); });

    const analyzePatternBtn = document.getElementById('analyze-pattern-btn');
    if (analyzePatternBtn) {
        analyzePatternBtn.addEventListener('click', () => {
            const targetInput = document.getElementById('pattern-target');
            const patternSize = getIntValue(targetInput, 5);

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

    const methodComparisonBtn = document.getElementById('method-comparison-btn');
    if (methodComparisonBtn) {
        methodComparisonBtn.addEventListener('click', () => {
            if (window.__keno_toggleComparison) {
                window.__keno_toggleComparison(true);
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

    // Shapes configuration event handlers
    const shapesPatternSelect = document.getElementById('shapes-pattern-select');
    if (shapesPatternSelect) {
        shapesPatternSelect.addEventListener('change', (e) => {
            state.shapesPattern = getSelectValue(e.target, 'cross');
            saveGeneratorSettings();

            // Update current display
            const currentDisplay = document.getElementById('shapes-current-display');
            if (currentDisplay) {
                currentDisplay.innerHTML = `<span style="color:#888; font-size:9px;">Pattern: ${state.shapesPattern}</span>`;
            }
        });
    }

    const shapesPlacementSelect = document.getElementById('shapes-placement-select');
    if (shapesPlacementSelect) {
        shapesPlacementSelect.addEventListener('change', (e) => {
            state.shapesPlacement = getSelectValue(e.target, 'center');
            saveGeneratorSettings();

            // Update current display
            const currentDisplay = document.getElementById('shapes-current-display');
            if (currentDisplay) {
                const existingText = currentDisplay.textContent;
                if (existingText.includes('Pattern:')) {
                    currentDisplay.innerHTML += `<br><span style="color:#888; font-size:9px;">Placement: ${state.shapesPlacement}</span>`;
                } else {
                    currentDisplay.innerHTML = `<span style="color:#888; font-size:9px;">Placement: ${state.shapesPlacement}</span>`;
                }
            }
        });
    }

    // Momentum configuration event handlers
    const momentumDetectionInput = document.getElementById('momentum-detection');
    if (momentumDetectionInput) {
        momentumDetectionInput.addEventListener('change', () => {
            state.momentumDetectionWindow = getIntValue(momentumDetectionInput, 5, { min: 3, max: 20 });
            saveGeneratorSettings();
        });
    }

    const momentumBaselineInput = document.getElementById('momentum-baseline');
    if (momentumBaselineInput) {
        momentumBaselineInput.addEventListener('change', () => {
            state.momentumBaselineGames = getIntValue(momentumBaselineInput, 50, { min: 10, max: 200 });
            saveGeneratorSettings();
        });
    }

    const momentumThresholdInput = document.getElementById('momentum-threshold');
    if (momentumThresholdInput) {
        momentumThresholdInput.addEventListener('change', () => {
            state.momentumThreshold = getFloatValue(momentumThresholdInput, 1.5, { min: 1, max: 3 });
            saveGeneratorSettings();
        });
    }

    const momentumPoolInput = document.getElementById('momentum-pool');
    if (momentumPoolInput) {
        momentumPoolInput.addEventListener('change', () => {
            state.momentumPoolSize = getIntValue(momentumPoolInput, 15, { min: 5, max: 30 });
            saveGeneratorSettings();
        });
    }

    // Universal generator refresh controls
    const generatorIntervalInput = document.getElementById('generator-interval');
    if (generatorIntervalInput) {
        generatorIntervalInput.addEventListener('change', (e) => {
            const value = getIntValue(e.target, 0, { min: 0, max: 20 });
            state.generatorInterval = value;
            generatorIntervalInput.value = value; // Update display with clamped value
            saveGeneratorSettings();

            // Reset last refresh counter
            state.generatorLastRefresh = 0;
        });
    }

    const generatorRefreshBtn = document.getElementById('generator-refresh-btn');
    if (generatorRefreshBtn) {
        generatorRefreshBtn.addEventListener('click', () => {
            // Trigger immediate regeneration
            if (window.__keno_generateNumbers) {
                window.__keno_generateNumbers(true); // Force refresh
            }

            // Update last refresh counter
            state.generatorLastRefresh = state.currentHistory.length;

            // Update preview UI
            if (window.__keno_updateGeneratorPreview) {
                window.__keno_updateGeneratorPreview();
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
    const sections = ['heatmap', 'numberGenerator', 'hitsMiss', 'autoplay', 'profitLoss', 'patternAnalysis', 'recentPlays', 'history'];

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
export function initOverlay() {
    loadGeneratorSettings().then(() => {
        createOverlay();
        // Update UI with loaded settings after overlay is created
        setTimeout(() => {
            const countInput = document.getElementById('generator-count');
            if (countInput) countInput.value = state.generatorCount || 3;

            const methodSelect = document.getElementById('generator-method-select');
            if (methodSelect) methodSelect.value = state.generatorMethod || 'frequency';

            const intervalInput = document.getElementById('generator-interval');
            if (intervalInput) intervalInput.value = state.generatorInterval || 0;

            const autoSelectSwitch = document.getElementById('generator-autoselect-switch');
            if (autoSelectSwitch) autoSelectSwitch.checked = state.generatorAutoSelect || false;

            const sampleInput = document.getElementById('frequency-sample-size');
            if (sampleInput) sampleInput.value = state.generatorSampleSize || 5;

            const shapesPattern = document.getElementById('shapes-pattern-select');
            if (shapesPattern) shapesPattern.value = state.shapesPattern || 'random';

            const shapesPlacement = document.getElementById('shapes-placement-select');
            if (shapesPlacement) shapesPlacement.value = state.shapesPlacement || 'random';

            const momentumDetection = document.getElementById('momentum-detection');
            if (momentumDetection) momentumDetection.value = state.momentumDetectionWindow || 5;

            const momentumBaseline = document.getElementById('momentum-baseline');
            if (momentumBaseline) momentumBaseline.value = state.momentumBaselineGames || 50;

            const momentumThreshold = document.getElementById('momentum-threshold');
            if (momentumThreshold) momentumThreshold.value = state.momentumThreshold || 1.5;

            const momentumPool = document.getElementById('momentum-pool');
            if (momentumPool) momentumPool.value = state.momentumPoolSize || 15;
        }, 100);
    });
    setInterval(injectFooterButton, 1000);
}

/**
 * Update shapes info display with last generated shape
 */
export function updateShapesInfo() {
    const shapesLastShape = document.getElementById('shapes-last-shape');
    if (!shapesLastShape) return;

    if (window.__keno_lastShapeInfo) {
        const info = window.__keno_lastShapeInfo;
        shapesLastShape.innerHTML = `${info.emoji} ${info.name}<br><span style="color:#666; font-size:9px;">${info.numbers.join(', ')}</span>`;
    } else {
        shapesLastShape.textContent = 'Generate to see shape';
    }
}

// Expose updateShapesInfo globally
window.__keno_updateShapesInfo = updateShapesInfo;
