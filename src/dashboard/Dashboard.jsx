// src/dashboard/Dashboard.jsx
// Main dashboard application component

import { useState } from 'preact/hooks';
import { BarChart3, TrendingUp, Search } from 'lucide-preact';
import { Sidebar } from './components/Sidebar.jsx';
import { BetHistory } from './sections/BetHistory.jsx';
import { Statistics } from './sections/Statistics.jsx';
import { Analytics } from './sections/Analytics.jsx';
import { WinLinks } from './sections/WinLinks.tsx';
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
  const [activeFeature, setActiveFeature] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const tabs = [
    { id: 'history', label: 'Bet History', icon: <BarChart3 size={16} />, component: BetHistory },
    { id: 'stats', label: 'Statistics', icon: <TrendingUp size={16} />, component: Statistics },
    { id: 'analytics', label: 'Analytics', icon: <Search size={16} />, component: Analytics }
  ];

  const features = {
    'saved-links': WinLinks
  };

  // Determine what to display
  let ActiveComponent;
  let displayTitle;
  
  if (activeFeature && features[activeFeature]) {
    ActiveComponent = features[activeFeature];
    displayTitle = activeFeature === 'saved-links' ? 'Saved Win Links' : 'Feature';
  } else {
    ActiveComponent = tabs.find(t => t.id === activeTab)?.component || BetHistory;
    displayTitle = `${activeGame.charAt(0).toUpperCase() + activeGame.slice(1)} Stats`;
  }

  const handleGameChange = (gameId) => {
    setActiveGame(gameId);
    setActiveFeature(null);
    setActiveTab('history');
  };

  const handleFeatureChange = (featureId) => {
    setActiveFeature(featureId);
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
        activeFeature={activeFeature}
        onFeatureChange={handleFeatureChange}
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
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm
            }}>
              <BarChart3 size={24} color={COLORS.accent.info} />
              {displayTitle}
            </h1>

            {/* Tab Navigation - Only show for games, not features */}
            {!activeFeature && (
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
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs
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
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
              </nav>
            )}
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
