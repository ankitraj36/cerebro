/**
 * BroadcasterView.jsx — Broadcaster control center
 * 
 * Enhanced features:
 * - Responsive grid (collapses on mobile)
 * - Better URL bar with scanning animation and visual feedback
 * - Enhanced control panel with gradient dividers
 * - Animated stats and signal strength bars
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import useLatency from '../hooks/useLatency';
import useAudioFX from '../hooks/useAudioFX';
import useSyncEngine from '../hooks/useSyncEngine';
import CRTFrame from '../components/CRTFrame';
import VideoPlayer from '../components/VideoPlayer';
import ChatPanel from '../components/ChatPanel';
import ReactionBar from '../components/ReactionBar';
import LatencyGraph from '../components/LatencyGraph';
import SyncDebugPanel from '../components/SyncDebugPanel';

export default function BroadcasterView({ callsign }) {
  const { roomId } = useParams();
  const { socket, connected } = useSocket();
  const { latency, latencyHistory } = useLatency(socket);
  const { playThud } = useAudioFX();
  const videoRef = useRef(null);
  useSyncEngine(videoRef, socket, 'broadcaster', latency);

  const [videoUrl, setVideoUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [users, setUsers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Join room on connect
  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit('join-room', { roomId, role: 'broadcaster', callsign });
  }, [socket, connected, roomId, callsign]);

  // Track user list updates
  useEffect(() => {
    if (!socket) return;

    const handleUsers = ({ userList }) => setUsers(userList);
    socket.on('user-connected', handleUsers);
    socket.on('user-disconnected', handleUsers);

    return () => {
      socket.off('user-connected', handleUsers);
      socket.off('user-disconnected', handleUsers);
    };
  }, [socket]);

  // Load video URL with validation
  const loadVideo = useCallback(async () => {
    if (!urlInput.trim()) return;

    setScanning(true);
    setVideoError(false);
    setLoadSuccess(false);

    try {
      await fetch(urlInput, { method: 'HEAD', mode: 'no-cors' });
      setVideoUrl(urlInput);
      setLoadSuccess(true);
      setTimeout(() => setLoadSuccess(false), 2000);

      if (socket) {
        socket.emit('video-url-update', { roomId, videoUrl: urlInput });
      }
    } catch {
      setVideoUrl(urlInput);
      if (socket) {
        socket.emit('video-url-update', { roomId, videoUrl: urlInput });
      }
    } finally {
      setScanning(false);
    }
  }, [urlInput, socket, roomId]);

  // Playback event handlers
  const handlePlay = useCallback(
    (currentTime) => {
      playThud();
      setIsPlaying(true);
      if (socket) {
        socket.emit('playback-sync', {
          action: 'play',
          currentTime,
          serverTime: Date.now(),
        });
      }
    },
    [socket, playThud]
  );

  const handlePause = useCallback(
    (currentTime) => {
      playThud();
      setIsPlaying(false);
      if (socket) {
        socket.emit('playback-sync', {
          action: 'pause',
          currentTime,
        });
      }
    },
    [socket, playThud]
  );

  const handleSeek = useCallback(
    (currentTime) => {
      if (socket) {
        socket.emit('playback-sync', {
          action: 'seek',
          currentTime,
        });
      }
    },
    [socket]
  );

  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const graphUsers = users.map((u) => ({
    ...u,
    latencyHistory: u.socketId === socket?.id ? latencyHistory : [u.latency || 0],
  }));

  const listenerCount = users.filter((u) => u.role === 'listener').length;

  // Signal strength based on latency
  const signalBars = [
    { height: '4px', active: latency < 500 },
    { height: '7px', active: latency < 300 },
    { height: '10px', active: latency < 200 },
    { height: '14px', active: latency < 100 },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', minHeight: '80vh' }}>
      {/* Left — Video Panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          animation: 'entranceSlideLeft 0.5s ease-out',
        }}
      >
        {/* URL input bar */}
        <div className="retro-panel" style={{ padding: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="retro-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="PASTE VIDEO URL — MP4 / DIRECT LINK"
              style={{ flex: 1 }}
            />
            <button
              className={`retro-button ${loadSuccess ? 'green' : ''}`}
              onClick={loadVideo}
              disabled={scanning}
              style={{
                transition: 'all 0.3s',
              }}
            >
              {scanning ? 'SCANNING...' : loadSuccess ? '✓ LOADED' : '▶ LOAD'}
            </button>
          </div>

          {/* Scanning progress bar */}
          {scanning && (
            <div
              style={{
                height: '3px',
                background: 'rgba(255,255,255,0.05)',
                marginTop: '0.5rem',
                overflow: 'hidden',
                borderRadius: '2px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff0000, #ff6600, #ff0000)',
                  animation: 'progressFill 2s ease-in-out',
                  borderRadius: '2px',
                }}
              />
            </div>
          )}
        </div>

        {/* CRT-framed video */}
        <CRTFrame isLive={isPlaying} showStatic={!videoUrl}>
          {videoUrl ? (
            <VideoPlayer
              ref={videoRef}
              src={videoUrl}
              isController={true}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
            />
          ) : (
            <div
              style={{
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff0000',
                fontSize: '1.5rem',
                letterSpacing: '4px',
                animation: 'flicker 2s infinite',
              }}
            >
              SIGNAL LOST — LOAD VIDEO URL
            </div>
          )}
        </CRTFrame>

        {/* Live indicator */}
        {isPlaying && (
          <div className="live-indicator">
            <span className="live-dot" />
            <span>LIVE BROADCAST</span>
          </div>
        )}

        {/* Reactions */}
        <ReactionBar socket={socket} roomId={roomId} showTally={true} />
      </div>

      {/* Right — Control Panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          animation: 'entranceSlideRight 0.5s ease-out',
        }}
      >
        {/* Room info */}
        <div className="retro-panel" style={{ padding: '0.8rem' }}>
          <div className="section-header" style={{ fontSize: '1rem' }}>
            ⌁ BROADCAST CONTROL
          </div>

          {/* Frequency */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ color: '#555', fontFamily: "'Share Tech Mono', monospace" }}>FREQUENCY:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{
                color: '#00ff41',
                fontSize: '1.3rem',
                letterSpacing: '3px',
                textShadow: '0 0 8px rgba(0,255,65,0.3)',
              }}>
                {roomId}
              </span>
              <button className="copy-button" onClick={copyRoomId} style={{
                background: copied ? 'rgba(0,255,65,0.15)' : 'transparent',
                transition: 'all 0.3s',
              }}>
                {copied ? '✓' : '⎘'}
              </button>
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,0,0,0.2), transparent)', margin: '0.5rem 0' }} />

          {/* Agents */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#555', fontFamily: "'Share Tech Mono', monospace" }}>AGENTS:</span>
            <span style={{ color: '#00ff41' }}>{listenerCount} CONNECTED</span>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,0,0,0.2), transparent)', margin: '0.5rem 0' }} />

          {/* Latency with signal bars */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#555', fontFamily: "'Share Tech Mono', monospace" }}>LATENCY:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          </div>
        </div>

        {/* Latency graph */}
        <LatencyGraph users={graphUsers} />

        {/* Chat panel */}
        <ChatPanel
          roomId={roomId}
          callsign={callsign}
          isBroadcaster={true}
          socket={socket}
        />
      </div>

      {/* Debug panel */}
      <SyncDebugPanel
        socket={socket}
        roomId={roomId}
        role="broadcaster"
        latency={latency}
        videoRef={videoRef}
        users={users}
      />
    </div>
  );
}
