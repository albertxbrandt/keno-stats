// src/dashboard/utils/storage.js
// Storage utilities for dashboard

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

const CHUNK_SIZE = 1000; // Same as history.js

/**
 * Get chunk key for storage
 * @param {number} index - Round index
 * @returns {string} Chunk key
 */
function getChunkKey(index) {
  return `history_chunk_${Math.floor(index / CHUNK_SIZE)}`;
}

/**
 * Load all bet history from chunked storage
 * @returns {Promise<Array>} Complete bet history
 */
export async function loadBetHistory() {
  try {
    // Get total count first
    const countResult = await storageApi.storage.local.get('history_count');
    const totalCount = countResult.history_count || 0;

    if (totalCount === 0) {
      return [];
    }

    // Calculate how many chunks we need to load
    const numChunks = Math.ceil(totalCount / CHUNK_SIZE);
    const chunkKeys = [];
    for (let i = 0; i < numChunks; i++) {
      chunkKeys.push(`history_chunk_${i}`);
    }

    // Load all chunks
    const result = await storageApi.storage.local.get(chunkKeys);

    // Combine all chunks into single array
    const history = [];
    for (let i = 0; i < numChunks; i++) {
      const chunk = result[`history_chunk_${i}`] || [];
      history.push(...chunk);
    }

    return history;
  } catch (err) {
    console.error('[Dashboard] Failed to load history:', err);
    return [];
  }
}

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
  try {
    // Get total count to know how many chunks to delete
    const countResult = await storageApi.storage.local.get('history_count');
    const totalCount = countResult.history_count || 0;

    if (totalCount === 0) {
      return;
    }

    // Calculate chunk keys to delete
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
