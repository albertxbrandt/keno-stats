// src/dashboard/sections/BetHistory.jsx
// Bet history section (moved from betbook)

import { useState, useEffect } from 'preact/hooks';
import { BetTable } from '../components/BetTable.jsx';
import { SearchBar } from '../components/SearchBar.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { SettingsModal } from '../components/SettingsModal.jsx';
import { BetDetailsModal } from '../components/BetDetailsModal.jsx';
import { loadBetHistory, exportBetHistory, deleteAllHistory } from '../utils/storage.js';
import { COLORS } from '../../ui/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '../../ui/constants/styles.js';

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
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bet => {
        const currency = bet.kenoBet?.currency?.toLowerCase() || '';
        const amount = bet.kenoBet?.amount?.toString() || '';
        const payout = bet.kenoBet?.payout?.toString() || '';
        const risk = bet.kenoBet?.risk?.toLowerCase() || '';
        
        return currency.includes(query) || 
               amount.includes(query) || 
               payout.includes(query) ||
               risk.includes(query);
      });
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          setBetHistory(data);
          setFilteredBets(data);
        }
      } catch (err) {
        alert('Failed to parse JSON file');
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
        <button
          onClick={() => document.getElementById('fileInput').click()}
          style={{
            background: COLORS.bg.darker,
            color: COLORS.text.primary,
            border: 'none',
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📂 Upload History
        </button>
        
        <button
          onClick={handleExport}
          style={{
            background: COLORS.bg.darker,
            color: COLORS.text.primary,
            border: 'none',
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          💾 Export
        </button>

        <button
          onClick={handleDeleteAll}
          style={{
            background: COLORS.bg.darker,
            color: COLORS.accent.error,
            border: 'none',
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗑️ Delete All
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          style={{
            background: COLORS.bg.darker,
            color: COLORS.text.primary,
            border: 'none',
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            cursor: 'pointer',
            fontSize: '14px',
            marginLeft: 'auto'
          }}
        >
          ⚙️ Columns
        </button>

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
