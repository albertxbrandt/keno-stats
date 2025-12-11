// disclaimer.js - Handles disclaimer acceptance logic

const acceptCheckbox = document.getElementById('acceptCheckbox');
const acceptBtn = document.getElementById('acceptBtn');
const declineBtn = document.getElementById('declineBtn');

// Enable/disable accept button based on checkbox
acceptCheckbox.addEventListener('change', (e) => {
  acceptBtn.disabled = !e.target.checked;
});

// Handle accept button click
acceptBtn.addEventListener('click', () => {
  // Save acceptance to storage
  chrome.storage.local.set({ disclaimerAccepted: true, acceptedDate: Date.now() }, () => {
    console.log('[Disclaimer] User accepted terms');
    // Close this tab
    window.close();
  });
});

// Handle decline button click
declineBtn.addEventListener('click', () => {
  if (confirm('Are you sure? Declining will uninstall the extension.')) {
    // Uninstall the extension
    chrome.management.uninstallSelf();
  }
});

// Check if already accepted (shouldn't normally happen, but just in case)
chrome.storage.local.get('disclaimerAccepted', (result) => {
  if (result.disclaimerAccepted) {
    console.log('[Disclaimer] Already accepted, closing page');
    window.close();
  }
});
