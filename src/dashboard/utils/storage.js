// src/dashboard/utils/storage.js
// Dashboard-specific storage utilities

// Re-export shared storage functions with dashboard-friendly names
export { loadHistoryRaw as loadBetHistory } from '@/shared/storage/history.js';

/**
 * Export bet history as JSON file
 * @param {Array} history - Bet history to export
 */
export function exportBetHistory(history) {
  const dataStr = JSON.stringify(history, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `keno-history-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Delete all bet history
 * @returns {Promise<void>}
 */
export async function deleteAllHistory() {
  const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

  try {
    // Get total count to know how many chunks to delete
    const countResult = await storageApi.storage.local.get('history_count');
    const totalCount = countResult.history_count || 0;

    if (totalCount === 0) {
      return;
    }

    // Calculate chunk keys to delete
    const CHUNK_SIZE = 1000;
    const numChunks = Math.ceil(totalCount / CHUNK_SIZE);
    const keysToDelete = ['history_count'];
    for (let i = 0; i < numChunks; i++) {
      keysToDelete.push(`history_chunk_${i}`);
    }

    await storageApi.storage.local.remove(keysToDelete);
    // eslint-disable-next-line no-console
    console.log('[Dashboard] All history deleted');
  } catch (err) {
    console.error('[Dashboard] Failed to delete history:', err);
  }
}
