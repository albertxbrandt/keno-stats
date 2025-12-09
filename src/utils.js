// src/utils.js - misc helpers
import { state } from './state.js';

export function simulatePointerClick(el) {
    try {
        const rect = el.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        ['pointerover','pointerenter','pointermove','pointerdown'].forEach(type => {
            el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX, clientY, pointerType: 'mouse' }));
        });
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX, clientY }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX, clientY }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY }));
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX, clientY, pointerType: 'mouse' }));
    } catch (e) {
        try { el.click(); } catch (e2) { console.error('[simulateClick] fallback failed', e2); }
    }
}

export function findAndClickPlayButton() {
    // Finding by data-testid="bet-button"
    const betButton = document.querySelector('button[data-testid="bet-button"]');
    if (betButton) {
        simulatePointerClick(betButton);
        return betButton;
    }

   return null;
}
