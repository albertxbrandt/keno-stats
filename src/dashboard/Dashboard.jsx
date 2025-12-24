// src/dashboard/Dashboard.jsx
// Main dashboard application component

import { useState } from 'preact/hooks';
import { BetHistory } from './sections/BetHistory.jsx';
import { Statistics } from './sections/Statistics.jsx';
import { Analytics } from './sections/Analytics.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * Dashboard Component
 * 
 * Main application with multiple analytics sections
 * 
 * @component
 * @returns {preact.VNode} The rendered dashboard
 */
export function Dashboard() {
  const [activeTab, setActiveTab] = useState('history');

  const tabs = [
    { id: 'history', label: '📊 Bet History', component: BetHistory },
    { id: 'stats', label: '📈 Statistics', component: Statistics },
    { id: 'analytics', label: '🔍 Analytics', component: Analytics }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || BetHistory;

  return (
    <div style={{
      fontFamily: 'Sora, system-ui, sans-serif',
      background: COLORS.bg.dark,
      minHeight: '100vh',
      color: COLORS.text.primary
    }}>
      {/* Header */}
      <header style={{
        background: COLORS.bg.darker,
        padding: SPACING.lg,
        borderBottom: `2px solid ${COLORS.border.default}`,
        position: 'sticky',
        top: 0,
        zIndex: 100
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
            📊 Keno Stats Dashboard
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
        maxWidth: '1400px',
        margin: '0 auto',
        padding: `${SPACING.md} 0`
      }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
