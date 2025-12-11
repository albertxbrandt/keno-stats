// background.js - Background service worker for extension

// Open disclaimer page on installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Background] Extension installed, checking disclaimer acceptance');
    
    // Check if disclaimer has been accepted
    chrome.storage.local.get('disclaimerAccepted', (result) => {
      if (!result.disclaimerAccepted) {
        // Open disclaimer page
        chrome.tabs.create({
          url: chrome.runtime.getURL('disclaimer.html'),
          active: true
        });
      }
    });
  }
});

// Prevent extension from working if disclaimer not accepted
chrome.storage.local.get('disclaimerAccepted', (result) => {
  if (!result.disclaimerAccepted) {
    console.log('[Background] Disclaimer not accepted yet');
  }
});
