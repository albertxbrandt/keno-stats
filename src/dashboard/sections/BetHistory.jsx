// src/dashboard/sections/BetHistory.jsx
// Bet history section (moved from betbook)

import { useState, useEffect } from 'preact/hooks';
import { Download, Trash2, Settings, Upload } from 'lucide-preact';
import { Button } from '@/shared/components/Button.jsx';
import { BetTable } from '../components/BetTable.jsx';
import { SearchBar } from '../components/SearchBar.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { SettingsModal } from '../components/SettingsModal.jsx';
import { BetDetailsModal } from '../components/BetDetailsModal.jsx';
import { loadBetHistory, exportBetHistory, deleteAllHistory, importHistory } from '../utils/storage.js';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING } from '@/shared/constants/styles.js';

/**
 * BetHistory Section
 * View and manage bet history with search, sort, and pagination
 */
export function BetHistory() {
  const [betHistory, setBetHistory] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [itemsPerPage] = useState(25);
  const [columnVisibility, setColumnVisibility] = useState({
    date: true,
    amount: true,
    payout: true,
    multiplier: true,
    currency: true,
    risk: true,
    hits: true,
    misses: true
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);

  // Load bet history on mount
  useEffect(() => {
    loadBetHistory().then(history => {
      setBetHistory(history);
      setFilteredBets(history);
    });

    // Load column visibility from localStorage
    const saved = localStorage.getItem('columnVisibility');
    if (saved) {
      setColumnVisibility(JSON.parse(saved));
    }
  }, []);

  // Filter and sort bets
  useEffect(() => {
    let filtered = [...betHistory];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      
      // Parse field-specific searches (e.g., "amount:100 currency:gold")
      // Handle spaces after colon: "amount: 1000" -> "amount:1000"
      const normalizedQuery = query.replace(/(\w+):\s+/g, '$1:');
      const fieldMatches = normalizedQuery.match(/(\w+):([^\s]+)/g);

      if (fieldMatches && fieldMatches.length > 0) {
        // Field-specific search: check all field:value pairs
        filtered = filtered.filter(bet => {
          return fieldMatches.every(fieldQuery => {
            const [field, value] = fieldQuery.split(':');
            const searchValue = value.toLowerCase();

            switch (field) {
              case 'amount': {
                const betAmount = (bet.kenoBet?.amount || 0).toFixed(2);
                return betAmount.includes(searchValue) || betAmount === parseFloat(searchValue).toFixed(2);
              }
              case 'payout': {
                const betPayout = (bet.kenoBet?.payout || 0).toFixed(2);
                return betPayout.includes(searchValue) || betPayout === parseFloat(searchValue).toFixed(2);
              }
              case 'multiplier': {
                const betMult = (bet.kenoBet?.payoutMultiplier || 0).toFixed(2);
                return betMult.includes(searchValue) || betMult === parseFloat(searchValue).toFixed(2);
              }
              case 'currency':
                return (bet.kenoBet?.currency || '').toLowerCase().includes(searchValue);
              case 'risk':
                return (bet.kenoBet?.risk || '').toLowerCase().includes(searchValue);
              case 'hits': {
                const hits = bet.kenoBet?.state?.selectedNumbers?.filter(n => 
                  bet.kenoBet?.state?.drawnNumbers?.includes(n)
                ) || [];
                return hits.join(',').toLowerCase().includes(searchValue);
              }
              case 'misses': {
                const misses = bet.kenoBet?.state?.drawnNumbers?.filter(n => 
                  !bet.kenoBet?.state?.selectedNumbers?.includes(n)
                ) || [];
                return misses.join(',').toLowerCase().includes(searchValue);
              }
              case 'date':
                return new Date(bet.time).toLocaleString().toLowerCase().includes(searchValue);
              default:
                return false;
            }
          });
        });
      } else {
        // General search across all fields
        filtered = filtered.filter(bet => {
          const dateStr = new Date(bet.time).toLocaleString().toLowerCase();
          const hits = (bet.kenoBet?.state?.selectedNumbers?.filter(n => 
            bet.kenoBet?.state?.drawnNumbers?.includes(n)
          ) || []).join(', ');
          const misses = (bet.kenoBet?.state?.drawnNumbers?.filter(n => 
            !bet.kenoBet?.state?.selectedNumbers?.includes(n)
          ) || []).join(', ');
          const amount = (bet.kenoBet?.amount || 0).toFixed(2);
          const payout = (bet.kenoBet?.payout || 0).toFixed(2);
          const multiplier = (bet.kenoBet?.payoutMultiplier || 0).toFixed(2);
          const currency = (bet.kenoBet?.currency || '').toLowerCase();
          const risk = (bet.kenoBet?.risk || '').toLowerCase();
          
          return dateStr.includes(query) ||
                 hits.toLowerCase().includes(query) ||
                 misses.toLowerCase().includes(query) ||
                 amount.includes(query) ||
                 payout.includes(query) ||
                 multiplier.includes(query) ||
                 currency.includes(query) ||
                 risk.includes(query);
        });
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'date':
          aVal = a.time || 0;
          bVal = b.time || 0;
          break;
        case 'amount':
          aVal = parseFloat(a.kenoBet?.amount) || 0;
          bVal = parseFloat(b.kenoBet?.amount) || 0;
          break;
        case 'payout':
          aVal = parseFloat(a.kenoBet?.payout) || 0;
          bVal = parseFloat(b.kenoBet?.payout) || 0;
          break;
        case 'multiplier':
          aVal = parseFloat(a.kenoBet?.payoutMultiplier) || 0;
          bVal = parseFloat(b.kenoBet?.payoutMultiplier) || 0;
          break;
        case 'currency':
          aVal = a.kenoBet?.currency || '';
          bVal = b.kenoBet?.currency || '';
          break;
        case 'risk':
          aVal = a.kenoBet?.risk || '';
          bVal = b.kenoBet?.risk || '';
          break;
        case 'hits':
          aVal = a.kenoBet?.state?.selectedNumbers?.filter(n => 
            a.kenoBet?.state?.drawnNumbers?.includes(n)
          ).length || 0;
          bVal = b.kenoBet?.state?.selectedNumbers?.filter(n => 
            b.kenoBet?.state?.drawnNumbers?.includes(n)
          ).length || 0;
          break;
        case 'misses':
          aVal = a.kenoBet?.state?.drawnNumbers?.filter(n => 
            !a.kenoBet?.state?.selectedNumbers?.includes(n)
          ).length || 0;
          bVal = b.kenoBet?.state?.drawnNumbers?.filter(n => 
            !b.kenoBet?.state?.selectedNumbers?.includes(n)
          ).length || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredBets(filtered);
    setCurrentPage(1);
  }, [betHistory, searchQuery, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleColumnVisibilityChange = (column, visible) => {
    const newVisibility = { ...columnVisibility, [column]: visible };
    setColumnVisibility(newVisibility);
    localStorage.setItem('columnVisibility', JSON.stringify(newVisibility));
  };

  const handleExport = () => {
    exportBetHistory(betHistory);
  };

  const handleDeleteAll = () => {
    if (confirm('Are you sure you want to delete all bet history? This cannot be undone.')) {
      deleteAllHistory().then(() => {
        setBetHistory([]);
        setFilteredBets([]);
      });
    }
  };

  const handleUpload = () => {
    document.getElementById('fileInput').click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          // Save to storage
          await importHistory(data);
          // Update UI
          setBetHistory(data);
          setFilteredBets(data);
          alert(`Successfully imported ${data.length} rounds!`);
        } else {
          alert('Invalid file format - expected an array of rounds');
        }
      } catch (err) {
        alert('Failed to parse JSON file: ' + err.message);
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Pagination
  const totalPages = Math.ceil(filteredBets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBets = filteredBets.slice(startIndex, endIndex);

  return (
    <div>
      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
        flexWrap: 'wrap'
      }}>
        <Button
          variant="secondary"
          size="md"
          icon={<Upload size={16} />}
          iconPosition="left"
          onClick={handleUpload}
        >
          Upload History
        </Button>
        
        <Button
          variant="secondary"
          size="md"
          icon={<Download size={16} />}
          iconPosition="left"
          onClick={handleExport}
        >
          Export
        </Button>

        <Button
          variant="danger"
          size="md"
          icon={<Trash2 size={16} />}
          iconPosition="left"
          onClick={handleDeleteAll}
        >
          Delete All
        </Button>

        <Button
          variant="secondary"
          size="md"
          icon={<Settings size={16} />}
          iconPosition="left"
          onClick={() => setIsSettingsOpen(true)}
          style={{ marginLeft: 'auto' }}
        >
          Columns
        </Button>

        <input
          id="fileInput"
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {/* Stats */}
      <div style={{
        marginBottom: SPACING.md,
        color: COLORS.text.secondary,
        fontSize: '14px'
      }}>
        Total Bets: <strong>{filteredBets.length}</strong>
      </div>

      {/* Table */}
      <BetTable
        bets={currentBets}
        columnVisibility={columnVisibility}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={setSelectedBet}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      {isSettingsOpen && (
        <SettingsModal
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {selectedBet && (
        <BetDetailsModal
          bet={selectedBet}
          onClose={() => setSelectedBet(null)}
        />
      )}
    </div>
  );
}
