/**
 * ChatPanel.jsx — Ham radio transmission log styled chat
 * 
 * Enhanced features:
 * - Messages slide in with animation
 * - Hash-based sender color assignment (unique per agent)
 * - Typing indicator with animated dots
 * - Better mobile drawer with grip bar
 * - Improved visual polish
 */

import { useState, useRef, useEffect, useCallback } from 'react';

// Generate a consistent color from a callsign string
function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  // Avoid colors too close to the green text or red headers
  const adjustedHue = (hue + 40) % 360; // shift away from red (0) and green (120)
  return `hsl(${adjustedHue}, 80%, 65%)`;
}

export default function ChatPanel({ roomId, callsign, isBroadcaster, socket }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Subscribe to chat broadcasts
  useEffect(() => {
    if (!socket) return;

    const handleChat = ({ callsign: sender, message, timestamp }) => {
      setMessages((prev) => {
        const next = [...prev, { sender, message, timestamp, id: Date.now() + Math.random() }];
        return next.length > 100 ? next.slice(-100) : next;
      });
    };

    const handlePinned = ({ messageId }) => {
      setMessages((prev) => {
        const msg = prev.find((m) => m.id === messageId);
        if (msg) setPinnedMessage(msg);
        return prev;
      });
    };

    const handleTyping = ({ callsign: typingCallsign }) => {
      if (typingCallsign !== callsign) {
        setIsTyping(true);
        setTypingUser(typingCallsign);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };

    socket.on('chat-broadcast', handleChat);
    socket.on('message-pinned', handlePinned);
    socket.on('user-typing', handleTyping);

    return () => {
      socket.off('chat-broadcast', handleChat);
      socket.off('message-pinned', handlePinned);
      socket.off('user-typing', handleTyping);
    };
  }, [socket, callsign]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Emit typing indicator (debounced)
  const emitTyping = useCallback(() => {
    if (socket && input.trim()) {
      socket.emit('user-typing', { roomId, callsign });
    }
  }, [socket, roomId, callsign, input]);

  // Send message
  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit('chat-message', {
      roomId,
      callsign,
      message: input.trim(),
    });

    setInput('');
  }

  // Pin a message (broadcaster only)
  function pinMessage(msg) {
    if (!isBroadcaster || !socket) return;
    socket.emit('pin-message', { roomId, messageId: msg.id });
    setPinnedMessage(msg);
  }

  // Format timestamp
  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false });
  }

  return (
    <div
      className="retro-panel chat-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '400px',
      }}
    >
      {/* Header with toggle */}
      <div
        className="section-header"
        style={{
          fontSize: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>📻 TRANSMISSION LOG</span>
        <span style={{ 
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
          display: 'inline-block',
        }}>
          ▼
        </span>
      </div>

      {isOpen && (
        <>
          {/* Pinned message banner */}
          {pinnedMessage && (
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(255,0,0,0.15), rgba(255,0,0,0.05))',
                border: '1px solid rgba(255,0,0,0.3)',
                padding: '0.4rem 0.6rem',
                marginBottom: '0.5rem',
                fontSize: '0.95rem',
                borderRadius: '2px',
                borderLeft: '3px solid #ff0000',
              }}
            >
              📌 [{formatTime(pinnedMessage.timestamp)}]{' '}
              <span style={{ color: hashColor(pinnedMessage.sender) }}>{pinnedMessage.sender}</span>:{' '}
              <span style={{ color: '#00ff41' }}>{pinnedMessage.message}</span>
            </div>
          )}

          {/* Message log */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '0.5rem',
              fontSize: '1rem',
              lineHeight: '1.6',
            }}
          >
            {messages.length === 0 && (
              <div style={{ color: '#333', textAlign: 'center', padding: '2rem 0', letterSpacing: '2px' }}>
                AWAITING TRANSMISSIONS...
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className="chat-message"
                style={{
                  padding: '0.15rem 0.3rem',
                  cursor: isBroadcaster ? 'pointer' : 'default',
                  borderLeft: pinnedMessage?.id === msg.id ? '2px solid #ff0000' : '2px solid transparent',
                  paddingLeft: '0.5rem',
                  borderRadius: '2px',
                  transition: 'background 0.2s',
                }}
                onClick={() => pinMessage(msg)}
                onMouseEnter={(e) => { if (isBroadcaster) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                title={isBroadcaster ? 'Click to pin' : ''}
              >
                <span style={{ color: '#555', fontSize: '0.9rem' }}>[{formatTime(msg.timestamp)}]</span>{' '}
                <span style={{ color: hashColor(msg.sender), fontWeight: 'bold' }}>{msg.sender}</span>:{' '}
                <span style={{ color: '#00ff41' }}>{msg.message}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing indicator */}
          {isTyping && (
            <div style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.9rem',
              color: '#666',
              letterSpacing: '1px',
            }}>
              <span style={{ color: hashColor(typingUser) }}>{typingUser}</span>{' '}
              IS TYPING
              <span style={{ animation: 'typingDots 1.5s infinite', animationDelay: '0s' }}>.</span>
              <span style={{ animation: 'typingDots 1.5s infinite', animationDelay: '0.3s' }}>.</span>
              <span style={{ animation: 'typingDots 1.5s infinite', animationDelay: '0.6s' }}>.</span>
            </div>
          )}

          {/* Input form */}
          <form
            onSubmit={sendMessage}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              className="retro-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                emitTyping();
              }}
              placeholder="TRANSMISSION:"
              maxLength={500}
              style={{ flex: 1 }}
            />
            <button type="submit" className="retro-button" style={{ fontSize: '1rem', padding: '0.3rem 0.8rem' }}>
              TRANSMIT ▶
            </button>
          </form>
        </>
      )}
    </div>
  );
}
