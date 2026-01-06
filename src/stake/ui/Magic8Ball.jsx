/**
 * Magic 8-Ball utility
 * Ask a yes/no question and get mystical answers
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from '@/shared/components/Modal';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING } from '@/shared/constants/styles.js';

// Classic Magic 8-Ball responses (20 responses in 3 categories)
const RESPONSES = {
  positive: [
    'It is certain',
    'It is decidedly so',
    'Without a doubt',
    'Yes definitely',
    'You may rely on it',
    'As I see it, yes',
    'Most likely',
    'Outlook good',
    'Yes',
    'Signs point to yes',
  ],
  neutral: [
    'Reply hazy, try again',
    'Ask again later',
    'Better not tell you now',
    'Cannot predict now',
    'Concentrate and ask again',
  ],
  negative: [
    "Don't count on it",
    'My reply is no',
    'My sources say no',
    'Outlook not so good',
    'Very doubtful',
  ],
};

const ALL_RESPONSES = [
  ...RESPONSES.positive,
  ...RESPONSES.neutral,
  ...RESPONSES.negative,
];

export function Magic8Ball({ onClose }) {
  const [isShaking, setIsShaking] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Load history from storage
    const storageApi = typeof browser !== 'undefined' ? browser : chrome;
    storageApi.storage.local.get('magic8BallHistory').then((data) => {
      if (data.magic8BallHistory) {
        setHistory(data.magic8BallHistory || []);
      }
    });
  }, []);

  const saveHistory = (newHistory) => {
    const storageApi = typeof browser !== 'undefined' ? browser : chrome;
    storageApi.storage.local.set({
      magic8BallHistory: newHistory,
    });
  };

  const shake = () => {
    if (isShaking || !question.trim()) return;

    setIsShaking(true);
    setAnswer(null);

    // Shake animation duration
    setTimeout(() => {
      // Pick random response
      const randomResponse =
        ALL_RESPONSES[Math.floor(Math.random() * ALL_RESPONSES.length)];
      setAnswer(randomResponse);
      setIsShaking(false);

      // Add to history (keep last 15)
      const newEntry = {
        question: question.trim(),
        answer: randomResponse,
        timestamp: Date.now(),
      };
      const newHistory = [newEntry, ...history].slice(0, 15);
      setHistory(newHistory);
      saveHistory(newHistory);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isShaking && question.trim()) {
      shake();
    }
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const getAnswerColor = (answer) => {
    if (RESPONSES.positive.includes(answer)) return COLORS.accent.green;
    if (RESPONSES.negative.includes(answer)) return COLORS.accent.red;
    return COLORS.text.primary;
  };

  return (
    <Modal
      title="🎱 Magic 8-Ball"
      onClose={onClose}
      defaultWidth={420}
      defaultHeight={600}
      defaultX={window.innerWidth / 2 - 210}
      defaultY={window.innerHeight / 2 - 300}
    >
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
        }}
      >
        {/* Magic 8-Ball visual */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: SPACING.md,
          }}
        >
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.bg.darkest} 0%, #000 100%)`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: `0 8px 24px rgba(0,0,0,0.6), inset 0 -4px 12px rgba(255,255,255,0.1)`,
              border: `2px solid ${COLORS.border.default}`,
              position: 'relative',
              animation: isShaking ? 'shake 0.3s infinite' : 'none',
            }}
          >
            {/* Triangle window */}
            <div
              style={{
                width: '80px',
                height: '80px',
                background: COLORS.accent.blue,
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {answer ? '8' : '?'}
            </div>
          </div>
        </div>

        {/* Answer display */}
        {answer && (
          <div
            style={{
              padding: SPACING.md,
              background: COLORS.bg.darker,
              borderRadius: '8px',
              border: `1px solid ${COLORS.border.default}`,
              textAlign: 'center',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: '500',
                color: getAnswerColor(answer),
                lineHeight: '1.4',
              }}
            >
              {answer}
            </div>
          </div>
        )}

        {/* Question input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          <label
            style={{
              fontSize: '14px',
              color: COLORS.text.secondary,
              fontWeight: '500',
            }}
          >
            Ask a yes/no question:
          </label>
          <input
            type="text"
            value={question}
            onInput={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Will I win my next bet?"
            disabled={isShaking}
            style={{
              width: '100%',
              padding: `${SPACING.sm} ${SPACING.md}`,
              background: COLORS.bg.darker,
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: '6px',
              color: COLORS.text.primary,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {/* Shake button */}
        <button
          onClick={shake}
          disabled={isShaking || !question.trim()}
          style={{
            padding: `${SPACING.md} ${SPACING.lg}`,
            background: isShaking || !question.trim()
              ? COLORS.bg.darker
              : COLORS.accent.purple,
            color: isShaking || !question.trim()
              ? COLORS.text.disabled
              : '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isShaking || !question.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {isShaking ? '🔮 Consulting the spirits...' : '🎱 Shake the 8-Ball'}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: COLORS.text.secondary,
                  fontWeight: '600',
                }}
              >
                Recent Questions ({history.length})
              </h3>
              <button
                onClick={clearHistory}
                style={{
                  padding: `${SPACING.xs} ${SPACING.sm}`,
                  background: 'transparent',
                  color: COLORS.text.secondary,
                  border: `1px solid ${COLORS.border.default}`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Clear
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.sm,
              }}
            >
              {history.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    padding: SPACING.sm,
                    background: COLORS.bg.darker,
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border.default}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      color: COLORS.text.primary,
                      marginBottom: SPACING.xs,
                      fontWeight: '500',
                    }}
                  >
                    Q: {entry.question}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: getAnswerColor(entry.answer),
                      fontStyle: 'italic',
                    }}
                  >
                    A: {entry.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-5px) rotate(-2deg); }
          20% { transform: translateX(5px) rotate(2deg); }
          30% { transform: translateX(-5px) rotate(-1deg); }
          40% { transform: translateX(5px) rotate(1deg); }
          50% { transform: translateX(-3px) rotate(-0.5deg); }
          60% { transform: translateX(3px) rotate(0.5deg); }
          70% { transform: translateX(-2px) rotate(-0.3deg); }
          80% { transform: translateX(2px) rotate(0.3deg); }
          90% { transform: translateX(-1px) rotate(-0.1deg); }
        }
      `}</style>
    </Modal>
  );
}
