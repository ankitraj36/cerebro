/**
 * Lobby.jsx — Pre-broadcast waiting room
 * 
 * Enhanced features:
 * - Agent cards with avatar initials and latency bars
 * - Animated alphabet wall that lights up callsign letters
 * - Better responsive layout (stacks on mobile)
 * - Countdown with shockwave ring animation
 * - Large room code with animated copy feedback
 * - Entrance animations for panels
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import useLatency from '../hooks/useLatency';
import useAudioFX from '../hooks/useAudioFX';
import RadarSweep from '../components/RadarSweep';

export default function Lobby({ callsign, setCallsign }) {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'listener';
  const navigate = useNavigate();

  const { socket, connected } = useSocket();
  const { latency } = useLatency(socket);
  const { playBeep, playPing } = useAudioFX();

  const [users, setUsers] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeLetters, setActiveLetters] = useState(new Set());

  // Prompt for callsign if not set
  useEffect(() => {
    if (!callsign) {
      const name = prompt('ENTER YOUR CALLSIGN, AGENT:') || 'UNKNOWN';
      setCallsign(name.toUpperCase());
    }
  }, [callsign, setCallsign]);

  // Join room on socket connect
  useEffect(() => {
    if (!socket || !connected || !callsign) return;

    socket.emit('join-room', { roomId, role, callsign });
    playBeep();
  }, [socket, connected, roomId, role, callsign, playBeep]);

  // Listen for user list updates
  useEffect(() => {
    if (!socket) return;

    const handleUserConnected = ({ userList }) => {
      setUsers(userList);
      playPing();

      // Light up letters for new agent's callsign
      if (userList.length > 0) {
        const latestUser = userList[userList.length - 1];
        const letters = new Set(latestUser.callsign.toUpperCase().split(''));
        setActiveLetters(letters);
        setTimeout(() => setActiveLetters(new Set()), 2000);
      }
    };

    const handleUserDisconnected = ({ userList }) => {
      setUsers(userList);
    };

    const handleCountdown = ({ seconds }) => {
      setCountdown(seconds);

      let remaining = seconds;
      const interval = setInterval(() => {
        remaining--;
        setCountdown(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          if (role === 'broadcaster') {
            navigate(`/broadcast/${roomId}`);
          } else {
            navigate(`/watch/${roomId}`);
          }
        }
      }, 1000);
    };

    const handleBroadcastActive = () => {
      if (role === 'broadcaster') {
        navigate(`/broadcast/${roomId}`);
      } else {
        navigate(`/watch/${roomId}`);
      }
    };

    socket.on('user-connected', handleUserConnected);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('countdown-start', handleCountdown);
    socket.on('broadcast-active', handleBroadcastActive);

    return () => {
      socket.off('user-connected', handleUserConnected);
      socket.off('user-disconnected', handleUserDisconnected);
      socket.off('countdown-start', handleCountdown);
      socket.off('broadcast-active', handleBroadcastActive);
    };
  }, [socket, role, roomId, navigate, playPing]);

  // Begin broadcast (broadcaster only)
  const beginBroadcast = useCallback(() => {
    if (socket) {
      socket.emit('countdown-start', { roomId, seconds: 5 });
    }
  }, [socket, roomId]);

  // Copy room ID to clipboard
  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Countdown overlay with shockwave
  if (countdown !== null) {
    return (
      <div className="countdown-overlay">
        <div style={{ position: 'relative' }}>
          <div className="countdown-number">
            {countdown > 0 ? countdown : 'GO'}
          </div>
          {/* Shockwave ring */}
          <div
            key={countdown}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100px',
              height: '100px',
              border: '3px solid rgba(255, 0, 0, 0.6)',
              borderRadius: '50%',
              animation: 'shockwave 1s ease-out forwards',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        padding: '1rem',
        minHeight: '70vh',
      }}
    >
      {/* Left Panel — Radar + Status */}
      <div
        className="retro-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          animation: 'entranceSlideLeft 0.6s ease-out',
        }}
      >
        <div className="section-header" style={{ width: '100%', textAlign: 'center' }}>
          ⌁ FREQUENCY: {roomId}
        </div>

        <RadarSweep agents={users} />

        <div
          style={{
            color: '#ff0000',
            fontSize: '1.3rem',
            letterSpacing: '3px',
            animation: 'blink 1.5s infinite',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(255, 0, 0, 0.4)',
          }}
        >
          AWAITING TRANSMISSION
        </div>

        {/* Room ID with copy — large and prominent */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            background: 'rgba(0, 255, 65, 0.03)',
            borderRadius: '4px',
            border: '1px solid rgba(0, 255, 65, 0.1)',
            width: '100%',
          }}
        >
          <span style={{ color: '#555', fontSize: '0.9rem', letterSpacing: '2px', fontFamily: "'Share Tech Mono', monospace" }}>
            ROOM CODE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span
              style={{
                color: '#00ff41',
                fontSize: '2.2rem',
                letterSpacing: '8px',
                textShadow: '0 0 15px rgba(0,255,65,0.5)',
                fontWeight: 'bold',
              }}
            >
              {roomId}
            </span>
            <button
              className="copy-button"
              onClick={copyRoomId}
              style={{
                fontSize: '1rem',
                padding: '0.3rem 0.6rem',
                transition: 'all 0.3s',
                background: copied ? 'rgba(0, 255, 65, 0.15)' : 'transparent',
              }}
            >
              {copied ? '✓ COPIED' : '⎘ COPY'}
            </button>
          </div>
        </div>

        {/* Alphabet wall — letters light up on agent connect */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            justifyContent: 'center',
            padding: '0.5rem',
          }}
        >
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
            const isActive = activeLetters.has(letter);
            return (
              <span
                key={letter}
                style={{
                  color: isActive ? '#ff0000' : '#222',
                  fontSize: '1.2rem',
                  width: '24px',
                  textAlign: 'center',
                  transition: 'all 0.3s',
                  textShadow: isActive ? '0 0 15px #ff0000, 0 0 30px rgba(255,0,0,0.5)' : 'none',
                  animation: isActive ? 'letterFlash 2s ease-out forwards' : 'none',
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>
      </div>

      {/* Right Panel — User List + Actions */}
      <div
        className="retro-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          animation: 'entranceSlideRight 0.6s ease-out',
        }}
      >
        <div className="section-header">👤 CONNECTED AGENTS</div>

        {/* Agent list with cards */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {users.length === 0 && (
            <div style={{ color: '#333', textAlign: 'center', padding: '2rem 0', letterSpacing: '2px' }}>
              NO AGENTS DETECTED...
            </div>
          )}

          {users.map((user) => (
            <div key={user.socketId} className="agent-card">
              {/* Avatar with initials */}
              <div className={`agent-avatar ${user.role}`}>
                {user.callsign.slice(0, 2)}
              </div>
              {/* Name and role */}
              <div style={{ flex: 1 }}>
                <span style={{ color: '#00ff41', display: 'block' }}>{user.callsign}</span>
                <span className={`badge ${user.role}`} style={{ fontSize: '0.75rem' }}>
                  {user.role.toUpperCase()}
                </span>
              </div>
              {/* Latency */}
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  color: (user.latency || latency) < 100 ? '#00ff41' : (user.latency || latency) < 300 ? '#ffaa00' : '#ff0000',
                  fontSize: '1rem',
                }}>
                  {user.latency || latency}ms
                </span>
                {/* Mini latency bar */}
                <div style={{
                  width: '50px',
                  height: '3px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginTop: '4px',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((user.latency || latency) / 5, 100)}%`,
                    background: (user.latency || latency) < 100 ? '#00ff41' : (user.latency || latency) < 300 ? '#ffaa00' : '#ff0000',
                    borderRadius: '2px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Connection status */}
        <div style={{
          color: '#666',
          fontSize: '0.9rem',
          textAlign: 'center',
          padding: '0.5rem',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '3px',
        }}>
          {connected ? (
            <span style={{ color: '#00ff41', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <span className="status-dot" style={{ width: '8px', height: '8px' }} /> UPLINK ACTIVE — {latency}ms
            </span>
          ) : (
            <span style={{ color: '#ff0000', animation: 'blink 1s infinite' }}>
              ⬤ REESTABLISHING UPLINK...
            </span>
          )}
        </div>

        {/* Action buttons */}
        {role === 'broadcaster' ? (
          <button
            className="retro-button"
            onClick={beginBroadcast}
            style={{
              fontSize: '1.5rem',
              padding: '1rem',
              boxShadow: '0 0 25px rgba(255,0,0,0.4), 0 0 50px rgba(255,0,0,0.15)',
            }}
          >
            ⌁ BEGIN BROADCAST
          </button>
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: '#ffaa00',
              fontSize: '1.3rem',
              letterSpacing: '3px',
              animation: 'blink 2s infinite',
              padding: '1rem',
              background: 'rgba(255, 170, 0, 0.05)',
              border: '1px solid rgba(255, 170, 0, 0.15)',
              borderRadius: '3px',
            }}
          >
            STANDING BY...
          </div>
        )}
      </div>
    </div>
  );
}
