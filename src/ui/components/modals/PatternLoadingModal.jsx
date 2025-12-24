import { h } from 'preact';

/**
 * Loading modal displayed while computing patterns
 */
export function PatternLoadingModal() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000001,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div
        style={{
          background: '#1a2c38',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}
      >
        <div
          style={{
            display: 'inline-block',
            width: '50px',
            height: '50px',
            border: '4px solid #333',
            borderTopColor: '#74b9ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <div
          style={{
            marginTop: '20px',
            color: '#74b9ff',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Analyzing Patterns...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
