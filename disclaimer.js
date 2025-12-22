// disclaimer.js - Handles disclaimer acceptance logic

// Browser compatibility: Firefox uses 'browser', Chrome uses 'chrome'
const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

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
  storageApi.storage.local.set({ disclaimerAccepted: true, acceptedDate: Date.now() }, () => {
    console.log('[Disclaimer] User accepted terms');
    // Close this tab
    window.close();
  });
});

// Handle decline button click
declineBtn.addEventListener('click', () => {
  if (confirm('Are you sure? Declining will uninstall the extension.')) {
    // Uninstall the extension
    storageApi.management.uninstallSelf();
  }
});

// Check if already accepted (shouldn't normally happen, but just in case)
storageApi.storage.local.get('disclaimerAccepted', (result) => {
  if (result.disclaimerAccepted) {
    console.log('[Disclaimer] Already accepted, closing page');
    window.close();
  }
});
