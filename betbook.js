// betbook.js
// Handles bet history import, search, and table rendering

// Utility functions to handle both old and new data formats
function getHits(round) {
    if (!round) return [];
    if (round.hits) return round.hits; // Old format
    if (round.kenoBet?.state?.selectedNumbers && round.kenoBet?.state?.drawnNumbers) {
        const selected = round.kenoBet.state.selectedNumbers;
        const drawn = round.kenoBet.state.drawnNumbers;
        return selected.filter(num => drawn.includes(num));
    }
    return [];
}

function getMisses(round) {
    if (!round) return [];
    if (round.misses) return round.misses; // Old format
    if (round.kenoBet?.state?.selectedNumbers && round.kenoBet?.state?.drawnNumbers) {
        const selected = round.kenoBet.state.selectedNumbers;
        const drawn = round.kenoBet.state.drawnNumbers;
        return drawn.filter(num => !selected.includes(num));
    }
    return [];
}

let betHistory = [];
let currentSort = 'date';
let sortDirection = 'desc'; // 'asc' or 'desc'
let currentPage = 1;
const itemsPerPage = 25;

// Load column visibility from localStorage or use defaults
let columnVisibility = JSON.parse(localStorage.getItem('columnVisibility')) || {
    date: true,
    amount: true,
    payout: true,
    multiplier: true,
    currency: true,
    risk: true,
    hits: true,
    misses: true
};

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
const sortAmountBtn = document.getElementById('sortAmount');
const sortPayoutBtn = document.getElementById('sortPayout');
const sortMultiplierBtn = document.getElementById('sortMultiplier');
const sortCurrencyBtn = document.getElementById('sortCurrency');
const sortRiskBtn = document.getElementById('sortRisk');
const sortHitsBtn = document.getElementById('sortHits');
const sortMissesBtn = document.getElementById('sortMisses');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsClose = document.getElementById('settingsClose');
const autocompleteSuggestions = document.getElementById('autocompleteSuggestions');

let selectedSuggestionIndex = -1;

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);
searchInput.addEventListener('input', (e) => { 
    currentPage = 1; 
    renderTable(); 
    showAutocomplete(e.target.value);
});
searchInput.addEventListener('keydown', handleSearchKeydown);
searchInput.addEventListener('blur', () => setTimeout(() => hideAutocomplete(), 200));
exportBtn.addEventListener('click', exportData);
deleteBtn.addEventListener('click', deleteAllData);
prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
nextBtn.addEventListener('click', () => { currentPage++; renderTable(); });

settingsBtn.addEventListener('click', () => { settingsModal.style.display = 'flex'; });
settingsClose.addEventListener('click', () => { settingsModal.style.display = 'none'; });
settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.style.display = 'none'; });

// Column visibility toggles
Object.keys(columnVisibility).forEach(col => {
    const toggle = document.getElementById(`toggle-${col}`);
    if (toggle) {
        // Set initial checkbox state from loaded settings
        toggle.checked = columnVisibility[col];
        
        toggle.addEventListener('change', (e) => {
            columnVisibility[col] = e.target.checked;
            // Save to localStorage
            localStorage.setItem('columnVisibility', JSON.stringify(columnVisibility));
            updateColumnVisibility();
            renderTable();
        });
    }
});

sortDateBtn.addEventListener('click', () => setSortColumn('date'));
sortAmountBtn.addEventListener('click', () => setSortColumn('amount'));
sortPayoutBtn.addEventListener('click', () => setSortColumn('payout'));
sortMultiplierBtn.addEventListener('click', () => setSortColumn('multiplier'));
sortCurrencyBtn.addEventListener('click', () => setSortColumn('currency'));
sortRiskBtn.addEventListener('click', () => setSortColumn('risk'));
sortHitsBtn.addEventListener('click', () => setSortColumn('hits'));
sortMissesBtn.addEventListener('click', () => setSortColumn('misses'));

function showAutocomplete(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        hideAutocomplete();
        return;
    }

    // Get the current partial field being typed (normalize spaces after colons first)
    const normalized = trimmed.replace(/(\w+):\s+/g, '$1:');
    const parts = normalized.split(/\s+/);
    const currentPart = parts[parts.length - 1];
    
    // Get already used fields to exclude from suggestions
    const usedFields = new Set();
    parts.slice(0, -1).forEach(part => {
        const match = part.match(/^(\w+):/);
        if (match) usedFields.add(match[1]);
    });
    
    // Check if currently typing a field name (before colon)
    const fieldMatch = currentPart.match(/^(\w*)$/);
    const fieldValueMatch = currentPart.match(/^(\w+):(.*)$/);
    
    const suggestions = [];
    const fields = ['amount', 'payout', 'multiplier', 'currency', 'risk', 'hits', 'misses', 'date'];
    
    if (fieldMatch && !fieldValueMatch) {
        // Suggest field names (exclude already used fields)
        const partial = fieldMatch[1].toLowerCase();
        fields.forEach(field => {
            if (field.startsWith(partial) && !usedFields.has(field)) {
                suggestions.push({ type: 'field', value: field + ':', display: field + ':' });
            }
        });
    } else if (fieldValueMatch) {
        // Suggest values for the field
        const [, field, partial] = fieldValueMatch;
        const partialLower = partial.toLowerCase();
        
        // Automatically show suggestions when field is completed (no partial value yet)
        if (partial === '' || partial.length > 0) {
            if (field === 'currency') {
                const currencies = new Set();
                betHistory.forEach(bet => {
                    const curr = bet.kenoBet?.currency;
                    if (curr && (partial === '' || curr.toLowerCase().includes(partialLower))) {
                        currencies.add(curr);
                    }
                });
                currencies.forEach(curr => {
                    suggestions.push({ type: 'value', value: field + ':' + curr, display: field + ':' + curr });
                });
            } else if (field === 'risk') {
                ['low', 'medium', 'high'].forEach(risk => {
                    if (partial === '' || risk.startsWith(partialLower)) {
                        suggestions.push({ type: 'value', value: field + ':' + risk, display: field + ':' + risk });
                    }
                });
            } else if (field === 'amount' || field === 'payout' || field === 'multiplier') {
                const values = new Set();
                betHistory.forEach(bet => {
                    let val;
                    if (field === 'amount') val = bet.kenoBet?.amount;
                    else if (field === 'payout') val = bet.kenoBet?.payout;
                    else if (field === 'multiplier') val = bet.kenoBet?.payoutMultiplier;
                    
                    if (val !== undefined && val !== null) {
                        const formatted = val.toFixed(2);
                        if (partial === '' || formatted.includes(partial)) {
                            values.add(formatted);
                        }
                    }
                });
                Array.from(values).slice(0, 10).forEach(val => {
                    suggestions.push({ type: 'value', value: field + ':' + val, display: field + ':' + val });
                });
            }
        }
    }
    
    if (suggestions.length > 0) {
        autocompleteSuggestions.innerHTML = suggestions.map((s, i) => 
            `<div class="autocomplete-item" data-index="${i}" data-value="${s.value}" data-type="${s.type}">${s.display}</div>`
        ).join('');
        
        autocompleteSuggestions.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                // Normalize the search value and split into parts
                const normalized = searchInput.value.trim().replace(/(\w+):\s+/g, '$1:');
                const parts = normalized.split(/\s+/);
                parts[parts.length - 1] = item.dataset.value;
                
                // Add space only if completing a field value (type='value'), not field name (type='field')
                const shouldAddSpace = item.dataset.type === 'value';
                searchInput.value = parts.join(' ') + (shouldAddSpace ? ' ' : '');
                searchInput.focus();
                hideAutocomplete();
                currentPage = 1;
                renderTable();
            });
        });
        
        autocompleteSuggestions.style.display = 'block';
        selectedSuggestionIndex = -1;
    } else {
        hideAutocomplete();
    }
}

function hideAutocomplete() {
    autocompleteSuggestions.style.display = 'none';
    selectedSuggestionIndex = -1;
}

function handleSearchKeydown(e) {
    const items = autocompleteSuggestions.querySelectorAll('.autocomplete-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
            updateSelectedSuggestion(items);
            previewSuggestion(items[selectedSuggestionIndex]);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length > 0) {
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
            updateSelectedSuggestion(items);
            previewSuggestion(items[selectedSuggestionIndex]);
        }
    } else if (e.key === 'Tab') {
        if (items.length > 0) {
            e.preventDefault();
            // Cycle through suggestions
            if (e.shiftKey) {
                // Shift+Tab - go backwards
                selectedSuggestionIndex = selectedSuggestionIndex <= 0 ? items.length - 1 : selectedSuggestionIndex - 1;
            } else {
                // Tab - go forwards
                selectedSuggestionIndex = selectedSuggestionIndex >= items.length - 1 ? 0 : selectedSuggestionIndex + 1;
            }
            updateSelectedSuggestion(items);
            previewSuggestion(items[selectedSuggestionIndex]);
        }
    } else if (e.key === 'Enter') {
        if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
            e.preventDefault();
            items[selectedSuggestionIndex].click();
        }
    } else if (e.key === 'Escape') {
        hideAutocomplete();
    }
}

function previewSuggestion(item) {
    if (!item) return;
    
    // Update search input with the previewed suggestion
    const normalized = searchInput.value.trim().replace(/(\w+):\s+/g, '$1:');
    const parts = normalized.split(/\s+/);
    parts[parts.length - 1] = item.dataset.value;
    searchInput.value = parts.join(' ');
    
    // Set cursor to end
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
}

function updateSelectedSuggestion(items) {
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedSuggestionIndex);
    });
    if (items[selectedSuggestionIndex]) {
        items[selectedSuggestionIndex].scrollIntoView({ block: 'nearest' });
    }
}

function updateColumnVisibility() {
  const columns = ['date', 'amount', 'payout', 'multiplier', 'currency', 'risk', 'hits', 'misses'];
  columns.forEach((col, index) => {
    const thElements = document.querySelectorAll(`#betTable th`);
    const tdElements = document.querySelectorAll(`#betTable td:nth-child(${index + 1})`);
    
    if (!columnVisibility[col]) {
      thElements[index]?.classList.add('hidden-column');
      tdElements.forEach(td => td.classList.add('hidden-column'));
    } else {
      thElements[index]?.classList.remove('hidden-column');
      tdElements.forEach(td => td.classList.remove('hidden-column'));
    }
  });
}

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
  else if (currentSort === 'amount') activeHeader = sortAmountBtn;
  else if (currentSort === 'payout') activeHeader = sortPayoutBtn;
  else if (currentSort === 'multiplier') activeHeader = sortMultiplierBtn;
  else if (currentSort === 'currency') activeHeader = sortCurrencyBtn;
  else if (currentSort === 'risk') activeHeader = sortRiskBtn;
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
      chrome.storage.local.get('disclaimerAccepted', (result) => {
        chrome.storage.local.set({ 
          history: [],
          disclaimerAccepted: result.disclaimerAccepted || false
        }, () => {
          alert('All bet history has been deleted.');
          renderTable();
        });
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
      // Save imported data to chrome storage while preserving disclaimerAccepted
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get('disclaimerAccepted', (result) => {
          chrome.storage.local.set({ 
            history: betHistory,
            disclaimerAccepted: result.disclaimerAccepted || false
          }, () => {
            alert('Bet history imported and saved successfully!');
            renderTable();
          });
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
    // Parse multiple field-specific searches separated by spaces (e.g., "amount:100 currency:gold")
    // Also handle spaces after colon: "amount: 1000" -> "amount:1000"
    const normalizedQuery = query.replace(/(\w+):\s+/g, '$1:');
    const fieldMatches = normalizedQuery.match(/(\w+):([^\s]+)/g);
    
    if (fieldMatches && fieldMatches.length > 0) {
      // Check all field:value pairs
      return fieldMatches.every(fieldQuery => {
        const [field, value] = fieldQuery.split(':');
        const searchValue = value.toLowerCase();
        
        if (field === 'amount') {
          const betAmount = (bet.kenoBet?.amount || 0).toFixed(2);
          return betAmount.includes(searchValue) || betAmount === parseFloat(searchValue).toFixed(2);
        } else if (field === 'payout') {
          const betPayout = (bet.kenoBet?.payout || 0).toFixed(2);
          return betPayout.includes(searchValue) || betPayout === parseFloat(searchValue).toFixed(2);
        } else if (field === 'multiplier') {
          const betMult = (bet.kenoBet?.payoutMultiplier || 0).toFixed(2);
          return betMult.includes(searchValue) || betMult === parseFloat(searchValue).toFixed(2);
        } else if (field === 'currency') {
          return (bet.kenoBet?.currency || '').toLowerCase().includes(searchValue);
        } else if (field === 'risk') {
          return (bet.kenoBet?.state?.risk || '').toLowerCase().includes(searchValue);
        } else if (field === 'hits') {
          return getHits(bet).join(',').toLowerCase().includes(searchValue);
        } else if (field === 'misses') {
          return getMisses(bet).join(',').toLowerCase().includes(searchValue);
        } else if (field === 'date') {
          return new Date(bet.time).toLocaleString().toLowerCase().includes(searchValue);
        }
        return false;
      });
    }
    
    // General search across all fields
    const dateStr = new Date(bet.time).toLocaleString();
    const hits = getHits(bet).join(', ');
    const misses = getMisses(bet).join(', ');
    const amount = (bet.kenoBet?.amount || 0).toFixed(2);
    const payout = (bet.kenoBet?.payout || 0).toFixed(2);
    const multiplier = (bet.kenoBet?.payoutMultiplier || 0).toFixed(2);
    const currency = bet.kenoBet?.currency || '';
    const risk = bet.kenoBet?.state?.risk || '';
    
    return (
      dateStr.toLowerCase().includes(query) ||
      hits.toLowerCase().includes(query) ||
      misses.toLowerCase().includes(query) ||
      amount.includes(query) ||
      payout.includes(query) ||
      multiplier.includes(query) ||
      currency.toLowerCase().includes(query) ||
      risk.toLowerCase().includes(query)
    );
  });
  
  // Apply sorting
  if (currentSort === 'date') {
    filtered.sort((a, b) => sortDirection === 'desc' ? b.time - a.time : a.time - b.time);
  } else if (currentSort === 'amount') {
    filtered.sort((a, b) => {
      const amtA = a.kenoBet?.amount || 0;
      const amtB = b.kenoBet?.amount || 0;
      return sortDirection === 'desc' ? amtB - amtA : amtA - amtB;
    });
  } else if (currentSort === 'payout') {
    filtered.sort((a, b) => {
      const payA = a.kenoBet?.payout || 0;
      const payB = b.kenoBet?.payout || 0;
      return sortDirection === 'desc' ? payB - payA : payA - payB;
    });
  } else if (currentSort === 'multiplier') {
    filtered.sort((a, b) => {
      const multA = a.kenoBet?.payoutMultiplier || 0;
      const multB = b.kenoBet?.payoutMultiplier || 0;
      return sortDirection === 'desc' ? multB - multA : multA - multB;
    });
  } else if (currentSort === 'currency') {
    filtered.sort((a, b) => {
      const currA = a.kenoBet?.currency || '';
      const currB = b.kenoBet?.currency || '';
      return sortDirection === 'desc' ? currB.localeCompare(currA) : currA.localeCompare(currB);
    });
  } else if (currentSort === 'risk') {
    filtered.sort((a, b) => {
      const riskA = a.kenoBet?.state?.risk || '';
      const riskB = b.kenoBet?.state?.risk || '';
      return sortDirection === 'desc' ? riskB.localeCompare(riskA) : riskA.localeCompare(riskB);
    });
  } else if (currentSort === 'hits') {
    filtered.sort((a, b) => sortDirection === 'desc' ? getHits(b).length - getHits(a).length : getHits(a).length - getHits(b).length);
  } else if (currentSort === 'misses') {
    filtered.sort((a, b) => sortDirection === 'desc' ? getMisses(b).length - getMisses(a).length : getMisses(a).length - getMisses(b).length);
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
    const hits = getHits(bet);
    const misses = getMisses(bet);
    const amount = bet.kenoBet?.amount || 0;
    const payout = bet.kenoBet?.payout || 0;
    const multiplier = bet.kenoBet?.payoutMultiplier || 0;
    const currency = bet.kenoBet?.currency || 'N/A';
    const risk = bet.kenoBet?.state?.risk || 'N/A';
    
    const row = document.createElement('tr');
    row.dataset.betTime = bet.time; // Store bet time as identifier
    row.innerHTML = `
      <td class="${columnVisibility.date ? '' : 'hidden-column'}">${dateStr}</td>
      <td class="${columnVisibility.amount ? '' : 'hidden-column'}">${amount.toFixed(2)}</td>
      <td class="${columnVisibility.payout ? '' : 'hidden-column'}">${payout.toFixed(2)}</td>
      <td class="${columnVisibility.multiplier ? '' : 'hidden-column'}">${multiplier.toFixed(2)}x</td>
      <td class="${columnVisibility.currency ? '' : 'hidden-column'}">${currency}</td>
      <td class="${columnVisibility.risk ? '' : 'hidden-column'}" style="text-transform: capitalize;">${risk}</td>
      <td class="${columnVisibility.hits ? '' : 'hidden-column'} hits">${hits.join(', ')}</td>
      <td class="${columnVisibility.misses ? '' : 'hidden-column'} misses">${misses.join(', ')}</td>
    `;
    betTableBody.appendChild(row);
  });
  
  // Apply column visibility to headers
  updateColumnVisibility();
}

function deleteBet(betTime) {
  if (confirm('Are you sure you want to delete this bet?')) {
    betHistory = betHistory.filter(bet => bet.time !== betTime);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('disclaimerAccepted', (result) => {
        chrome.storage.local.set({ 
          history: betHistory,
          disclaimerAccepted: result.disclaimerAccepted || false
        }, () => {
          renderTable();
        });
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
