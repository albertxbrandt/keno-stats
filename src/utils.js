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
    const candidates = Array.from(document.querySelectorAll('button, [role="button"], a'));
    const validLabels = ["Play", "Place Bet", "Bet", "Spin", "Confirm", "Submit"];
    for (const el of candidates) {
        const text = (el.textContent || '').trim();
        const testid = el.getAttribute && el.getAttribute('data-testid');
        if (/my game play/i.test(text)) continue;
        if (testid && /play|bet|confirm/i.test(testid)) {
            simulatePointerClick(el);
            return el;
        }
        if (validLabels.some(label => text.toLowerCase() === label.toLowerCase())) {
            simulatePointerClick(el);
            return el;
        }
    }
    return null;
}
