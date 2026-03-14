/**
 * BootSequence.jsx — Terminal boot animation (shows once per session)
 * 
 * Enhanced features:
 * - ASCII art CEREBRO logo banner
 * - Visual loading progress bar
 * - Sound wave visualization bars
 * - Staggered slide entrance for each boot line
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ASCII_LOGO = [
  '  ██████╗███████╗██████╗ ███████╗██████╗ ██████╗ ',
  ' ██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗██╔══██╗',
  ' ██║     █████╗  ██████╔╝█████╗  ██████╔╝██║  ██║',
  ' ██║     ██╔══╝  ██╔══██╗██╔══╝  ██╔══██╗██║  ██║',
  ' ╚██████╗███████╗██║  ██║███████╗██████╔╝██████╔╝',
  '  ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚═════╝ ',
];

const BOOT_LINES = [
  '> CEREBRO UPLINK SYSTEM v3.0 ... INITIALIZING',
  '> HAWKINS LAB — CLASSIFIED ACCESS ONLY',
  '> SCANNING FOR UPSIDE DOWN INTERFERENCE...',
  '> NEURAL LINK CALIBRATING... ████████ 87%',
  '> SECURING ENCRYPTED CHANNEL...',
  '> CONNECTION ESTABLISHED ██████████ 100%',
  '> WELCOME, AGENT.',
];

const CHAR_DELAY = 35;

export default function BootSequence() {
  const navigate = useNavigate();
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [displayedLines, setDisplayedLines] = useState([]);
  const [fadeOut, setFadeOut] = useState(false);
  const [done, setDone] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  // Check if already booted this session
  useEffect(() => {
    if (sessionStorage.getItem('cerebro-booted')) {
      navigate('/home', { replace: true });
    } else {
      // Show ASCII logo first
      setTimeout(() => setShowLogo(true), 200);
    }
  }, [navigate]);

  // Typewriter effect
  useEffect(() => {
    if (done) return;
    if (!showLogo) return;

    if (currentLine >= BOOT_LINES.length) {
      finishBoot();
      return;
    }

    const line = BOOT_LINES[currentLine];

    if (currentChar <= line.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedLines((prev) => {
          const next = [...prev];
          next[currentLine] = line.slice(0, currentChar);
          return next;
        });
        setCurrentChar((c) => c + 1);
        // Update progress
        const totalChars = BOOT_LINES.reduce((sum, l) => sum + l.length, 0);
        const doneChars = BOOT_LINES.slice(0, currentLine).reduce((sum, l) => sum + l.length, 0) + currentChar;
        setProgress(Math.min((doneChars / totalChars) * 100, 100));
      }, CHAR_DELAY);
    } else {
      timerRef.current = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
        setDisplayedLines((prev) => [...prev, '']);
      }, 150);
    }

    return () => clearTimeout(timerRef.current);
  }, [currentLine, currentChar, done, showLogo]);

  function finishBoot() {
    setDone(true);
    setProgress(100);
    setFadeOut(true);
    sessionStorage.setItem('cerebro-booted', 'true');
    setTimeout(() => navigate('/home', { replace: true }), 800);
  }

  function skipBoot() {
    clearTimeout(timerRef.current);
    finishBoot();
  }

  // Generate sound wave bars
  const soundBars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    maxHeight: Math.random() * 16 + 6,
    delay: i * 80,
  }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050508',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '2rem 3rem',
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
      }}
    >
      {/* ASCII Logo */}
      {showLogo && (
        <div
          style={{
            marginBottom: '1.5rem',
            animation: 'entranceSlideUp 0.5s ease-out',
          }}
        >
          {ASCII_LOGO.map((line, i) => (
            <div
              key={i}
              style={{
                color: '#ff0000',
                fontSize: '0.65rem',
                lineHeight: 1.1,
                letterSpacing: '0.5px',
                whiteSpace: 'pre',
                textShadow: '0 0 10px rgba(255,0,0,0.4)',
                fontFamily: "'VT323', monospace",
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Sound wave visualization */}
      {!done && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3px',
            height: '24px',
            marginBottom: '1rem',
            opacity: 0.5,
          }}
        >
          {soundBars.map((bar) => (
            <div
              key={bar.id}
              style={{
                width: '3px',
                background: '#00ff41',
                borderRadius: '1px',
                animation: `barWave 0.6s ease-in-out infinite alternate`,
                animationDelay: `${bar.delay}ms`,
                '--max-height': `${bar.maxHeight}px`,
                height: '4px',
              }}
            />
          ))}
        </div>
      )}

      {/* Boot lines */}
      <div style={{ maxWidth: '700px' }}>
        {displayedLines.map((line, i) => (
          <div
            key={i}
            style={{
              color: i === displayedLines.length - 1 && !done ? '#00ff41' : '#00cc33',
              fontSize: '1.3rem',
              lineHeight: '2',
              letterSpacing: '1px',
              textShadow: '0 0 8px rgba(0,255,65,0.4)',
              animation: i === displayedLines.length - 1 ? 'none' : 'entranceSlideLeft 0.3s ease-out',
            }}
          >
            {line}
            {/* Blinking cursor on current line */}
            {i === displayedLines.length - 1 && !done && (
              <span
                style={{
                  animation: 'cursorBlink 0.6s step-end infinite',
                  color: '#00ff41',
                }}
              >
                ▌
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'fixed',
          bottom: '4rem',
          left: '3rem',
          right: '3rem',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ff0000, #00ff41)',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 8px rgba(0, 255, 65, 0.4)',
          }}
        />
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: '4.5rem',
          right: '3rem',
          color: '#555',
          fontSize: '0.85rem',
          fontFamily: "'Share Tech Mono', monospace",
          letterSpacing: '1px',
        }}
      >
        {Math.floor(progress)}%
      </div>

      {/* Skip button */}
      {!done && (
        <button
          onClick={skipBoot}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '2rem',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#444',
            fontFamily: "'VT323', monospace",
            fontSize: '1rem',
            padding: '0.3rem 1rem',
            cursor: 'pointer',
            letterSpacing: '2px',
            transition: 'all 0.2s',
            borderRadius: '2px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#444';
          }}
        >
          [ SKIP ]
        </button>
      )}
    </div>
  );
}
