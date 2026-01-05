// src/dashboard/Dashboard.jsx
// Main dashboard application component

import { useState } from 'preact/hooks';
import { Sidebar } from './components/Sidebar.jsx';
import { BetHistory } from './sections/BetHistory.jsx';
import { Statistics } from './sections/Statistics.jsx';
import { Analytics } from './sections/Analytics.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * Dashboard Component
 * 
 * Main application with sidebar navigation and multiple game/feature sections
 * 
 * @component
 * @returns {preact.VNode} The rendered dashboard
 */
export function Dashboard() {
  const [activeTab, setActiveTab] = useState('history');
  const [activeGame, setActiveGame] = useState('keno');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const tabs = [
    { id: 'history', label: '📊 Bet History', component: BetHistory },
    { id: 'stats', label: '📈 Statistics', component: Statistics },
    { id: 'analytics', label: '🔍 Analytics', component: Analytics }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || BetHistory;

  const handleGameChange = (gameId) => {
    setActiveGame(gameId);
    // Reset to history tab when switching games
    setActiveTab('history');
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'Sora, system-ui, sans-serif',
      background: COLORS.bg.dark,
      color: COLORS.text.primary,
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <Sidebar 
        activeGame={activeGame}
        onGameChange={handleGameChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <header style={{
          background: COLORS.bg.darker,
          padding: SPACING.lg,
          borderBottom: `2px solid ${COLORS.border.default}`,
          flexShrink: 0
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '1.5em',
              fontWeight: 'bold'
            }}>
              📊 {activeGame.charAt(0).toUpperCase() + activeGame.slice(1)} Stats
            </h1>

            {/* Tab Navigation */}
            <nav style={{
              display: 'flex',
              gap: SPACING.sm
            }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? COLORS.bg.darker : 'transparent',
                    color: activeTab === tab.id ? COLORS.text.primary : COLORS.text.secondary,
                    border: `1px solid ${activeTab === tab.id ? COLORS.border.default : 'transparent'}`,
                    padding: `${SPACING.sm} ${SPACING.md}`,
                    borderRadius: BORDER_RADIUS.md,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.background = COLORS.bg.darkest;
                      e.target.style.color = COLORS.text.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.background = 'transparent';
                      e.target.style.color = COLORS.text.secondary;
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: `${SPACING.md} 0`
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: `0 ${SPACING.md}`
          }}>
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
