/**
 * HomePage.jsx — Main menu: Create Room or Join Room
 * 
 * Enhanced features:
 * - Animated hero title with RGB split glitch effect
 * - Typing subtitle animation for "SYNCHRONIZER v3.0"
 * - Card hover lift with glow
 * - Real-time clock display + "SYSTEM ONLINE" indicator
 * - Animated entrance for panels
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage({ callsign, setCallsign }) {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const subtitleRef = useRef('SYNCHRONIZER v3.0');
  const subtitleIndexRef = useRef(0);

  // Real-time clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Typing subtitle effect
  useEffect(() => {
    const full = subtitleRef.current;
    if (subtitleIndexRef.current >= full.length) return;

    const timer = setTimeout(() => {
      subtitleIndexRef.current++;
      setSubtitleText(full.slice(0, subtitleIndexRef.current));
    }, 80);

    return () => clearTimeout(timer);
  }, [subtitleText]);

  // Create a new room
  async function createRoom() {
    if (!callsign.trim()) {
      setError('CALLSIGN REQUIRED');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/room/create', { method: 'POST' });
      const data = await res.json();

      if (data.roomId) {
        navigate(`/lobby/${data.roomId}?role=broadcaster`);
      } else {
        setError('UPLINK FAILURE — ROOM CREATION FAILED');
      }
    } catch {
      setError('CEREBRO SERVER UNREACHABLE');
    } finally {
      setLoading(false);
    }
  }

  // Join an existing room
  async function joinRoom(e) {
    e.preventDefault();

    if (!callsign.trim()) {
      setError('CALLSIGN REQUIRED');
      return;
    }

    if (!roomCode.trim()) {
      setError('FREQUENCY CODE REQUIRED');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/room/${roomCode.toUpperCase()}`);

      if (res.status === 404) {
        setError('FREQUENCY NOT FOUND');
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.roomId) {
        navigate(`/lobby/${data.roomId}?role=listener`);
      } else {
        setError('FREQUENCY NOT FOUND');
      }
    } catch {
      setError('CEREBRO SERVER UNREACHABLE');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: '2rem',
        padding: '2rem',
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          fontSize: '0.95rem',
          color: '#555',
          fontFamily: "'Share Tech Mono', monospace",
          letterSpacing: '1px',
          animation: 'entranceSlideUp 0.6s ease-out',
        }}
      >
        <span style={{ color: '#00ff41', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span className="status-dot" style={{ width: '6px', height: '6px' }} /> SYSTEM ONLINE
        </span>
        <span>|</span>
        <span style={{ color: '#666' }}>TIME: {clock}</span>
        <span>|</span>
        <span style={{ color: '#666' }}>SEC CLEARANCE: ████</span>
      </div>

      {/* Title — with RGB split glitch */}
      <div
        style={{
          textAlign: 'center',
          animation: 'entranceSlideUp 0.8s ease-out',
        }}
      >
        <h1
          style={{
            color: '#ff0000',
            fontSize: '3rem',
            letterSpacing: '8px',
            animation: 'rgbSplit 4s infinite',
            lineHeight: 1.2,
            position: 'relative',
          }}
        >
          CEREBRO'S CODE RED
        </h1>
        <h2
          style={{
            color: '#00ff41',
            fontSize: '1.6rem',
            letterSpacing: '6px',
            marginTop: '0.5rem',
            minHeight: '1.8rem',
            fontFamily: "'Share Tech Mono', monospace",
          }}
        >
          {subtitleText}
          <span
            style={{
              animation: 'cursorBlink 0.8s step-end infinite',
              color: '#00ff41',
              marginLeft: '2px',
            }}
          >
            ▌
          </span>
        </h2>
        {/* Decorative line */}
        <div
          style={{
            width: '200px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #ff0000, transparent)',
            margin: '1rem auto 0',
          }}
        />
      </div>

      {/* Callsign input */}
      <div
        className="retro-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          animation: 'entranceSlideLeft 0.6s ease-out',
          animationDelay: '0.2s',
          animationFillMode: 'backwards',
        }}
      >
        <div className="section-header" style={{ fontSize: '1rem' }}>
          [[ AGENT IDENTIFICATION ]]
        </div>
        <input
          type="text"
          className="retro-input"
          value={callsign}
          onChange={(e) => setCallsign(e.target.value.toUpperCase())}
          placeholder="ENTER CALLSIGN"
          maxLength={20}
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      {/* Create Room */}
      <div
        className="retro-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center',
          animation: 'entranceSlideLeft 0.6s ease-out',
          animationDelay: '0.4s',
          animationFillMode: 'backwards',
        }}
      >
        <div className="section-header" style={{ fontSize: '1rem' }}>
          [[ ESTABLISH UPLINK ]]
        </div>
        <p style={{ color: '#555', marginBottom: '1rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem' }}>
          CREATE A NEW BROADCAST FREQUENCY
        </p>
        <button
          className="retro-button"
          onClick={createRoom}
          disabled={loading}
          style={{ width: '100%', fontSize: '1.3rem', padding: '0.7rem' }}
        >
          {loading ? 'TRANSMITTING...' : '⌁ CREATE ROOM'}
        </button>
      </div>

      {/* Join Room */}
      <div
        className="retro-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          animation: 'entranceSlideRight 0.6s ease-out',
          animationDelay: '0.6s',
          animationFillMode: 'backwards',
        }}
      >
        <div className="section-header" style={{ fontSize: '1rem' }}>
          [[ FREQUENCY CODE ]]
        </div>
        <p style={{ color: '#555', marginBottom: '1rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem' }}>
          TUNE INTO EXISTING BROADCAST
        </p>
        <form
          onSubmit={joinRoom}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
        >
          <input
            type="text"
            className="retro-input"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ENTER 6-CHAR ROOM CODE"
            maxLength={6}
            style={{
              textTransform: 'uppercase',
              textAlign: 'center',
              fontSize: '1.8rem',
              letterSpacing: '8px',
              padding: '0.8rem',
            }}
          />
          <button
            type="submit"
            className="retro-button green"
            disabled={loading}
            style={{ width: '100%', fontSize: '1.3rem', padding: '0.7rem' }}
          >
            {loading ? 'SCANNING...' : '📡 JOIN ROOM'}
          </button>
        </form>
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            color: '#ff0000',
            fontSize: '1.3rem',
            animation: 'glitch 0.5s infinite',
            letterSpacing: '3px',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            background: 'rgba(255, 0, 0, 0.05)',
            borderRadius: '2px',
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Footer decorative */}
      <div
        style={{
          color: '#333',
          fontSize: '0.85rem',
          letterSpacing: '2px',
          fontFamily: "'Share Tech Mono', monospace",
          textAlign: 'center',
          animation: 'entranceSlideUp 0.8s ease-out',
          animationDelay: '0.8s',
          animationFillMode: 'backwards',
        }}
      >
        HAWKINS LAB — CLASSIFIED LEVEL 7 — AUTHORIZED PERSONNEL ONLY
      </div>
    </div>
  );
}
