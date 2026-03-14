/**
 * ListenerView.jsx — Synced viewer experience
 * 
 * Enhanced features:
 * - Smoother CSS transitions for sync badges
 * - Pulsing glow on RESYNC button when drift is high
 * - Signal strength indicator bars
 * - Better status bar with animated elements
 * - Entrance animations
 */

import { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import useLatency from '../hooks/useLatency';
import useAudioFX from '../hooks/useAudioFX';
import useSyncEngine from '../hooks/useSyncEngine';
import CRTFrame from '../components/CRTFrame';
import VideoPlayer from '../components/VideoPlayer';
import ChatPanel from '../components/ChatPanel';
import ReactionBar from '../components/ReactionBar';
import SyncDebugPanel from '../components/SyncDebugPanel';

export default function ListenerView({ callsign }) {
  const { roomId } = useParams();
  const { socket, connected, reconnectAttempt } = useSocket();
  const { latency } = useLatency(socket);
  const { playBeep, playAlert } = useAudioFX();
  const videoRef = useRef(null);

  const { syncStatus, drift, autoCorrectFlash, resync } = useSyncEngine(
    videoRef,
    socket,
    'listener',
    latency
  );

  const [videoUrl, setVideoUrl] = useState('');
  const [broadcasterLeft, setBroadcasterLeft] = useState(false);
  const [users, setUsers] = useState([]);

  // Subscribe to events FIRST (before join-room) to avoid race conditions
  useEffect(() => {
    if (!socket) return;

    const handleVideoUrl = ({ videoUrl: url }) => {
      setVideoUrl(url);
    };

    const handleBroadcasterLeft = () => {
      setBroadcasterLeft(true);
    };

    const handleBroadcasterPromoted = () => {
      setBroadcasterLeft(false);
    };

    const handleUsers = ({ userList }) => {
      setUsers(userList);
    };

    socket.on('video-url-update', handleVideoUrl);
    socket.on('broadcaster-left', handleBroadcasterLeft);
    socket.on('broadcaster-promoted', handleBroadcasterPromoted);
    socket.on('user-connected', handleUsers);
    socket.on('user-disconnected', handleUsers);

    return () => {
      socket.off('video-url-update', handleVideoUrl);
      socket.off('broadcaster-left', handleBroadcasterLeft);
      socket.off('broadcaster-promoted', handleBroadcasterPromoted);
      socket.off('user-connected', handleUsers);
      socket.off('user-disconnected', handleUsers);
    };
  }, [socket]);

  // Join room AFTER event listeners are registered
  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit('join-room', { roomId, role: 'listener', callsign });
    socket.emit('request-state', { roomId });
    playBeep();
  }, [socket, connected, roomId, callsign, playBeep]);

  // Alert sound on high drift
  useEffect(() => {
    if (drift > 1) {
      playAlert();
    }
  }, [drift > 1, playAlert]);

  // Signal strength based on latency
  const signalBars = [
    { height: '4px', active: latency < 500 },
    { height: '7px', active: latency < 300 },
    { height: '10px', active: latency < 200 },
    { height: '14px', active: latency < 100 },
  ];

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        animation: 'entranceSlideUp 0.5s ease-out',
      }}
    >
      {/* Connection error overlay */}
      {!connected && (
        <div className="overlay" style={{ position: 'fixed' }}>
          <div className="overlay-text" style={{ textAlign: 'center' }}>
            REESTABLISHING UPLINK...
            {reconnectAttempt > 0 && (
              <div style={{ fontSize: '1.2rem', marginTop: '0.5rem', color: '#ffaa00' }}>
                ATTEMPT {reconnectAttempt}/5
              </div>
            )}
            {reconnectAttempt === -1 && (
              <div style={{ fontSize: '1rem', marginTop: '1rem', color: '#ff4444' }}>
                CONNECTION LOST — PLEASE REFRESH
              </div>
            )}
            {/* Reconnection progress */}
            {reconnectAttempt > 0 && (
              <div style={{
                width: '200px',
                height: '3px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
                margin: '1rem auto 0',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(reconnectAttempt / 5) * 100}%`,
                  background: '#ffaa00',
                  borderRadius: '2px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* CRT Video */}
      <div style={{ position: 'relative' }}>
        <CRTFrame isLive={!broadcasterLeft && syncStatus === 'synced'} showStatic={broadcasterLeft}>
          <VideoPlayer
            ref={videoRef}
            src={videoUrl}
            isController={false}
          />

          {/* Broadcaster left overlay */}
          {broadcasterLeft && (
            <div
              className="overlay"
              style={{
                position: 'absolute',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div className="overlay-text">SIGNAL LOST</div>
              <div style={{ color: '#ffaa00', fontSize: '1rem', letterSpacing: '2px' }}>
                AWAITING BROADCASTER...
              </div>
            </div>
          )}

          {/* Auto-correcting flash */}
          {autoCorrectFlash && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(255,0,0,0.15), transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 30,
                animation: 'flashOverlay 1.5s ease-out forwards',
              }}
            >
              <span style={{
                color: '#ffaa00',
                fontSize: '1.5rem',
                letterSpacing: '4px',
                textShadow: '0 0 15px rgba(255,170,0,0.5)',
              }}>
                AUTO-CORRECTING...
              </span>
            </div>
          )}
        </CRTFrame>

        {/* Sync status badge — floating top-left */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 20,
          transition: 'all 0.4s ease',
        }}>
          {syncStatus === 'synced' && (
            <span className="sync-badge synced">◉ SYNCED</span>
          )}
          {syncStatus === 'drifting' && (
            <span className="sync-badge drifting">◎ DRIFTING {drift.toFixed(1)}s</span>
          )}
          {syncStatus === 'lost' && (
            <span className="sync-badge lost">✕ LOST</span>
          )}
        </div>

        {/* RESYNC button — pulsing glow when drift > 2s */}
        {drift > 2 && !broadcasterLeft && (
          <button
            className="retro-button"
            onClick={resync}
            style={{
              position: 'absolute',
              bottom: '60px',
              right: '16px',
              zIndex: 20,
              fontSize: '1rem',
              animation: 'glowBreathe 1s ease-in-out infinite',
              boxShadow: '0 0 20px rgba(255,0,0,0.6), 0 0 40px rgba(255,0,0,0.3)',
            }}
          >
            ⟲ RESYNC
          </button>
        )}
      </div>

      {/* Status bar below video */}
      <div
        className="retro-panel"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 1rem',
          marginTop: '0.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem' }}>
          TIMECODE: <span style={{ color: '#00ff41' }}>{videoRef.current?.currentTime?.toFixed(2) || '0.00'}s</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem' }}>
          LATENCY:{' '}
          <span style={{ color: latency < 100 ? '#00ff41' : latency < 300 ? '#ffaa00' : '#ff0000' }}>
            {latency}ms
          </span>
          <div className="signal-bars">
            {signalBars.map((bar, i) => (
              <div
                key={i}
                className="signal-bar"
                style={{
                  height: bar.height,
                  background: bar.active
                    ? (latency < 100 ? '#00ff41' : latency < 300 ? '#ffaa00' : '#ff0000')
                    : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className={`status-dot ${connected ? '' : 'red'}`} style={{ width: '8px', height: '8px' }} />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem' }}>
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </span>
      </div>

      {/* Reactions + Chat */}
      <div style={{ marginTop: '1rem' }}>
        <ReactionBar socket={socket} roomId={roomId} />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <ChatPanel
          roomId={roomId}
          callsign={callsign}
          isBroadcaster={false}
          socket={socket}
        />
      </div>

      {/* Debug panel */}
      <SyncDebugPanel
        socket={socket}
        roomId={roomId}
        role="listener"
        latency={latency}
        videoRef={videoRef}
        users={users}
      />
    </div>
  );
}
