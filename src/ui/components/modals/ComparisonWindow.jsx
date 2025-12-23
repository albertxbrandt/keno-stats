// src/ui/components/modals/ComparisonWindow.jsx
// Method comparison window - Preact refactor of comparison.js

import { useState, useEffect, useRef } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { stateEvents, EVENTS } from '../../../core/stateEvents.js';

/**
 * ComparisonWindow Component
 * 
 * Displays comparison of different generator methods' performance
 * Shows profit, hits, and performance charts
 */
export function ComparisonWindow({ onClose }) {
  const [lookback, setLookback] = useState(state.comparisonLookback || 100);
  const [showOthers, setShowOthers] = useState(false);
  const [comparisonData, setComparisonData] = useState([...state.comparisonData]);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 520, y: 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const windowRef = useRef(null);
  const canvasRef = useRef(null);
  const headerRef = useRef(null);

  // Update from state when data changes
  useEffect(() => {
    const updateData = () => {
      setComparisonData([...state.comparisonData]);
    };

    // Subscribe to round saved events
    const unsubscribe = stateEvents.on(EVENTS.ROUND_SAVED, updateData);

    return () => unsubscribe();
  }, []);

  // Redraw chart when data changes
  useEffect(() => {
    if (canvasRef.current) {
      drawChart();
    }
  }, [comparisonData]);

  // Handle lookback change
  const handleLookbackChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 10) {
      setLookback(val);
      state.comparisonLookback = val;
      if (state.comparisonData.length > val) {
        state.comparisonData = state.comparisonData.slice(-val);
        setComparisonData([...state.comparisonData]);
      }
    }
  };

  // Dragging handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('input') || e.target.closest('button')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Calculate method stats
  const methods = [
    { name: 'Frequency', key: 'frequency', color: '#e17055', emoji: '🔥' },
    { name: 'Cold', key: 'cold', color: '#74b9ff', emoji: '❄️' },
    { name: 'Mixed', key: 'mixed', color: '#a29bfe', emoji: '🔀' },
    { name: 'Average', key: 'average', color: '#55efc4', emoji: '📊' },
    { name: 'Momentum', key: 'momentum', color: '#fdcb6e', emoji: '⚡' },
    { name: 'Auto', key: 'auto', color: '#00cec9', emoji: '🤖' },
    { name: 'Shapes', key: 'shapes', color: '#fd79a8', emoji: '🔷' }
  ];

  const methodStats = methods.map(method => {
    const data = comparisonData.filter(d => d[method.key].predicted.length > 0);
    const totalHits = data.reduce((sum, d) => sum + d[method.key].hits, 0);
    const totalProfit = data.reduce((sum, d) => sum + (d[method.key].profit || 0), 0);
    const avgProfit = data.length > 0 ? (totalProfit / data.length) : 0;
    const avgHits = data.length > 0 ? (totalHits / data.length) : 0;

    return {
      ...method,
      totalProfit,
      avgProfit,
      avgHits,
      roundsTracked: data.length
    };
  }).sort((a, b) => b.totalProfit - a.totalProfit);

  const rankBadges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  // Method card component
  const MethodCard = ({ method, rank }) => {
    const profitColor = method.totalProfit > 0 ? '#00b894' : method.totalProfit < 0 ? '#ff7675' : '#dfe6e9';
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #14202b 0%, #1a2833 100%)',
        padding: '12px',
        borderRadius: '8px',
        border: `2px solid ${method.color}30`,
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '20px' }}>
          {rankBadges[rank]}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '16px' }}>{method.emoji}</span>
          <span style={{ color: method.color, fontWeight: 600, fontSize: '11px' }}>{method.name}</span>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: profitColor, marginBottom: '4px' }}>
          {method.totalProfit.toFixed(2)}x
        </div>
        <div style={{ fontSize: '9px', color: '#888' }}>
          Total Profit ({method.roundsTracked} rounds)
        </div>
        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '6px' }}>
          Avg: {method.avgProfit.toFixed(2)}x/round
        </div>
        <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
          Hits: {method.avgHits.toFixed(2)}/round
        </div>
      </div>
    );
  };

  // Draw chart on canvas
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (comparisonData.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', width / 2, height / 2);
      return;
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find max profit for Y axis
    const maxProfit = Math.max(...comparisonData.flatMap(d =>
      [d.frequency.profit, d.cold.profit, d.mixed.profit, d.average.profit, d.momentum.profit, d.auto.profit, d.shapes.profit]
    ));
    const yMax = Math.max(maxProfit + 1, 5);

    // Draw grid
    ctx.strokeStyle = '#2a3f4f';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      // Y axis labels
      const value = yMax - (yMax / 5) * i;
      ctx.fillStyle = '#666';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1), padding.left - 8, y + 3);
    }

    // Draw lines for each method
    methods.forEach(method => {
      ctx.strokeStyle = method.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      comparisonData.forEach((point, i) => {
        const x = padding.left + (chartWidth / (comparisonData.length - 1 || 1)) * i;
        const profit = point[method.key].profit || 0;
        const y = padding.top + chartHeight - (profit / yMax) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      comparisonData.forEach((point, i) => {
        const x = padding.left + (chartWidth / (comparisonData.length - 1 || 1)) * i;
        const profit = point[method.key].profit || 0;
        const y = padding.top + chartHeight - (profit / yMax) * chartHeight;

        ctx.fillStyle = method.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw legend
    let legendX = padding.left;
    methods.forEach(method => {
      ctx.fillStyle = method.color;
      ctx.fillRect(legendX, height - 15, 12, 3);
      ctx.fillStyle = '#aaa';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(method.label, legendX + 16, height - 10);
      legendX += ctx.measureText(method.label).width + 30;
    });
  };

  const top3 = methodStats.slice(0, 3);
  const others = methodStats.slice(3, 5);
  const recent = comparisonData.slice(-10).reverse();

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '500px',
        minWidth: '400px',
        height: '650px',
        minHeight: '400px',
        background: 'linear-gradient(135deg, #0f212e 0%, #1a2c38 100%)',
        border: '2px solid #2a3f4f',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        zIndex: 10002,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
        resize: 'both'
      }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        onMouseDown={handleMouseDown}
        style={{
          background: 'linear-gradient(90deg, #1a2c38 0%, #2a3f4f 100%)',
          padding: '12px 16px',
          cursor: isDragging ? 'grabbing' : 'move',
          borderBottom: '2px solid #3a5f6f',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <span style={{ color: '#74b9ff', fontWeight: 700, fontSize: '14px' }}>Method Comparison</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#aaa', fontSize: '10px' }}>Lookback:</span>
            <input
              type="number"
              min="10"
              max="500"
              value={lookback}
              onChange={handleLookbackChange}
              style={{
                width: '50px',
                background: '#14202b',
                border: '1px solid #444',
                color: '#fff',
                padding: '3px 6px',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '10px'
              }}
            />
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff7675',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              padding: 0
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '16px',
        height: 'calc(100% - 50px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Top 3 methods */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {top3.map((method, index) => (
            <MethodCard key={method.key} method={method} rank={index} />
          ))}
        </div>

        {/* 4th and 5th place */}
        {others.length > 0 && (
          <>
            <div style={{
              display: showOthers ? 'grid' : 'none',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              {others.map((method, index) => (
                <MethodCard key={method.key} method={method} rank={index + 3} />
              ))}
            </div>
            <button
              onClick={() => setShowOthers(!showOthers)}
              style={{
                width: '100%',
                background: '#2a3f4f',
                color: '#74b9ff',
                border: '1px solid #3a5f6f',
                padding: '6px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              {showOthers ? 'Show Less ▲' : 'Show More Methods ▼'}
            </button>
          </>
        )}

        {/* Chart */}
        <div style={{
          flex: 1,
          minHeight: '250px',
          background: '#14202b',
          borderRadius: '8px',
          padding: '12px',
          position: 'relative'
        }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Recent performance */}
        <div style={{ padding: '10px', background: '#14202b', borderRadius: '6px' }}>
          <div style={{ color: '#888', fontSize: '10px', marginBottom: '6px' }}>Recent Performance:</div>
          <div style={{ fontSize: '10px', color: '#aaa', maxHeight: '120px', overflowY: 'auto' }}>
            {recent.length === 0 ? (
              <div>No data yet. Play some rounds to see comparisons.</div>
            ) : (
              recent.map((point, idx) => (
                <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #2a3f4f' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ color: '#666', fontSize: '10px' }}>
                      Round {point.round} <span style={{ color: '#555' }}>({point.difficulty || 'classic'})</span>
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '9px' }}>
                      <span style={{ color: '#e17055' }}>🔥 {point.frequency.profit.toFixed(1)}x</span>
                      <span style={{ color: '#74b9ff' }}>❄️ {point.cold.profit.toFixed(1)}x</span>
                      <span style={{ color: '#a29bfe' }}>🔀 {point.mixed.profit.toFixed(1)}x</span>
                      <span style={{ color: '#55efc4' }}>📊 {point.average.profit.toFixed(1)}x</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap', fontSize: '9px' }}>
                    <span style={{ color: '#fdcb6e' }}>⚡ {point.momentum.profit.toFixed(1)}x</span>
                    <span style={{ color: '#00cec9' }}>🤖 {point.auto.profit.toFixed(1)}x</span>
                    <span style={{ color: '#fd79a8' }}>🔷 {point.shapes.profit.toFixed(1)}x</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
