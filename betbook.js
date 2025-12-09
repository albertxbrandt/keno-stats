// betbook.js
// Handles bet history import, search, and table rendering

let betHistory = [];
let currentSort = 'date';
let sortDirection = 'desc'; // 'asc' or 'desc'
let currentPage = 1;
const itemsPerPage = 25;

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const exportBtn = document.getElementById('exportBtn');
const deleteBtn = document.getElementById('deleteBtn');
const searchInput = document.getElementById('searchInput');
const betTableBody = document.querySelector('#betTable tbody');
const totalCount = document.getElementById('totalCount');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const sortDateBtn = document.getElementById('sortDate');
const sortHitsBtn = document.getElementById('sortHits');
const sortMissesBtn = document.getElementById('sortMisses');

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);
searchInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
exportBtn.addEventListener('click', exportData);
deleteBtn.addEventListener('click', deleteAllData);
prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
nextBtn.addEventListener('click', () => { currentPage++; renderTable(); });

sortDateBtn.addEventListener('click', () => setSortColumn('date'));
sortHitsBtn.addEventListener('click', () => setSortColumn('hits'));
sortMissesBtn.addEventListener('click', () => setSortColumn('misses'));

function setSortColumn(column) {
  if (currentSort === column) {
    sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
  } else {
    currentSort = column;
    sortDirection = 'desc';
  }
  currentPage = 1;
  updateSortArrows();
  renderTable();
}

function updateSortArrows() {
  document.querySelectorAll('.sort-arrow').forEach(arrow => arrow.classList.remove('active'));
  let activeHeader;
  if (currentSort === 'date') activeHeader = sortDateBtn;
  else if (currentSort === 'hits') activeHeader = sortHitsBtn;
  else if (currentSort === 'misses') activeHeader = sortMissesBtn;
  
  if (activeHeader) {
    const arrow = activeHeader.querySelector('.sort-arrow');
    arrow.classList.add('active');
    arrow.textContent = sortDirection === 'desc' ? '▼' : '▲';
  }
}

function exportData() {
  const dataStr = JSON.stringify(betHistory, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `keno-history-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function deleteAllData() {
  if (confirm('Are you sure you want to delete ALL bet history? This action cannot be undone!')) {
    betHistory = [];
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ history: [] }, () => {
        alert('All bet history has been deleted.');
        renderTable();
      });
    } else {
      alert('All bet history has been cleared from this page.');
      renderTable();
    }
  }
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      betHistory = JSON.parse(evt.target.result);
      // Save imported data to chrome storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ history: betHistory }, () => {
          alert('Bet history imported and saved successfully!');
          renderTable();
        });
      } else {
        alert('Bet history imported (not saved to extension storage).');
        renderTable();
      }
    } catch (err) {
      alert('Invalid file format. Please upload a valid JSON bet history.');
    }
  };
  reader.readAsText(file);
}

function renderTable() {
  const query = searchInput.value.trim().toLowerCase();
  betTableBody.innerHTML = '';
  let filtered = betHistory.filter(bet => {
    // Search by date, hits, misses
    const dateStr = new Date(bet.time).toLocaleString();
    const hits = bet.hits.join(', ');
    const misses = bet.misses.join(', ');
    return (
      dateStr.toLowerCase().includes(query) ||
      hits.includes(query) ||
      misses.includes(query)
    );
  });
  
  // Apply sorting
  if (currentSort === 'date') {
    filtered.sort((a, b) => sortDirection === 'desc' ? b.time - a.time : a.time - b.time);
  } else if (currentSort === 'hits') {
    filtered.sort((a, b) => sortDirection === 'desc' ? b.hits.length - a.hits.length : a.hits.length - b.hits.length);
  } else if (currentSort === 'misses') {
    filtered.sort((a, b) => sortDirection === 'desc' ? b.misses.length - a.misses.length : a.misses.length - b.misses.length);
  }
  
  // Update total count
  totalCount.textContent = `Total Bets: ${betHistory.length}`;
  
  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedBets = filtered.slice(startIdx, endIdx);
  
  // Update pagination controls
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
  pageInfo.textContent = totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : 'No results';
  
  paginatedBets.forEach(bet => {
    const dateStr = new Date(bet.time).toLocaleString();
    const row = document.createElement('tr');
    row.dataset.betTime = bet.time; // Store bet time as identifier
    row.innerHTML = `
      <td>${dateStr}</td>
      <td class="hits">${bet.hits.join(', ')}</td>
      <td class="misses">${bet.misses.join(', ')}</td>
    `;
    betTableBody.appendChild(row);
  });
}

function deleteBet(betTime) {
  if (confirm('Are you sure you want to delete this bet?')) {
    betHistory = betHistory.filter(bet => bet.time !== betTime);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ history: betHistory }, () => {
        renderTable();
      });
    } else {
      renderTable();
    }
  }
}

// Context menu handling
const contextMenu = document.getElementById('contextMenu');
const deleteMenuItem = document.getElementById('deleteMenuItem');
let selectedBetTime = null;

// Show context menu on right-click on table rows
document.addEventListener('contextmenu', (e) => {
  const row = e.target.closest('tr');
  if (row && row.dataset.betTime) {
    e.preventDefault();
    selectedBetTime = parseInt(row.dataset.betTime);
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
  }
});

// Hide context menu on click elsewhere
document.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

// Delete bet when menu item clicked
deleteMenuItem.addEventListener('click', () => {
  if (selectedBetTime !== null) {
    deleteBet(selectedBetTime);
    selectedBetTime = null;
  }
  contextMenu.style.display = 'none';
});

// Optionally, load from chrome.storage.local if running as extension page
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get('history', (result) => {
    if (Array.isArray(result.history)) {
      betHistory = result.history;
      renderTable();
    }
  });
  
  // Listen for storage changes to auto-refresh when new bets are added
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.history) {
      betHistory = changes.history.newValue || [];
      renderTable();
    }
  });
}
