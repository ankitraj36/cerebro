/**
 * App.jsx — Root application with routing
 * 
 * Enhanced features:
 * - Shimmer hover on header title
 * - Smooth transition for Upside Down mode
 * - Audio toggle button for global mute
 * - Improved header with gradient border
 */

import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import BootSequence from './pages/BootSequence';
import HomePage from './pages/HomePage';
import Lobby from './pages/Lobby';
import BroadcasterView from './pages/BroadcasterView';
import ListenerView from './pages/ListenerView';
import ParticleBackground from './components/ParticleBackground';
import ChristmasLights from './components/ChristmasLights';

export default function App() {
  const [upsideDown, setUpsideDown] = useState(false);
  const [callsign, setCallsign] = useState('');
  const [muted, setMuted] = useState(false);

  return (
    <div
      className={`app-root ${upsideDown ? 'upside-down' : ''}`}
      style={{ minHeight: '100vh', position: 'relative' }}
    >
      <ParticleBackground />
      <ChristmasLights />

      {/* Header */}
      <header className="app-header">
        <span className="header-title">⌁ CEREBRO v3.0</span>

        {/* Mobile field agent label */}
        <span className="field-agent-label">[ FIELD AGENT MODE ]</span>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Audio toggle */}
          <button
            className="retro-button"
            onClick={() => setMuted((prev) => !prev)}
            style={{
              fontSize: '0.85rem',
              padding: '0.25rem 0.6rem',
              opacity: 0.7,
            }}
            title={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? '🔇' : '🔊'}
          </button>

          {/* Upside Down toggle */}
          <button
            className="retro-button upside-down-toggle"
            onClick={() => setUpsideDown((prev) => !prev)}
          >
            {upsideDown ? 'EXIT UPSIDE DOWN' : '⌁ UPSIDE DOWN'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<BootSequence />} />
          <Route
            path="/home"
            element={<HomePage callsign={callsign} setCallsign={setCallsign} />}
          />
          <Route
            path="/lobby/:roomId"
            element={<Lobby callsign={callsign} setCallsign={setCallsign} />}
          />
          <Route
            path="/broadcast/:roomId"
            element={<BroadcasterView callsign={callsign} />}
          />
          <Route
            path="/watch/:roomId"
            element={<ListenerView callsign={callsign} />}
          />
        </Routes>
      </main>
    </div>
  );
}
