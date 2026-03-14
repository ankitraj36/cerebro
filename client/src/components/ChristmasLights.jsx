/**
 * ChristmasLights.jsx — Stranger Things alphabet wall lights
 * 
 * Enhanced features:
 * - Drooping SVG wire that sags between lights
 * - Larger teardrop-shaped bulbs with gradient fills
 * - Brighter, more realistic glow halos
 * - Sequential chase animation pattern
 */

import { useMemo } from 'react';

const LIGHT_COUNT = 24;
const COLORS = ['#ff0000', '#00ff41', '#4466ff', '#ffee00', '#ff6600', '#ffffff', '#ff44ff', '#00ccff'];

export default function ChristmasLights() {
  const lights = useMemo(() => {
    return Array.from({ length: LIGHT_COUNT }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      delay: (i * 120) + Math.random() * 400, // Sequential chase + randomness
      duration: Math.random() * 1200 + 800,
    }));
  }, []);

  // Generate SVG drooping wire path
  const wirePoints = useMemo(() => {
    const segmentWidth = 100 / LIGHT_COUNT;
    let path = `M 0,12`;
    for (let i = 0; i < LIGHT_COUNT; i++) {
      const x = (i + 0.5) * segmentWidth;
      const nextX = (i + 1) * segmentWidth;
      // Sag between each light
      const sagY = 12 + Math.sin((i / LIGHT_COUNT) * Math.PI) * 3 + 4;
      const controlY = sagY + 5;

      if (i < LIGHT_COUNT - 1) {
        path += ` Q ${x},${controlY} ${nextX},${sagY - 2}`;
      } else {
        path += ` L 100,12`;
      }
    }
    return path;
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 50,
        background: 'rgba(5, 5, 8, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '0 0 6px 0',
        overflow: 'hidden',
      }}
    >
      {/* SVG drooping wire */}
      <svg
        viewBox="0 0 100 35"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <path
          d={wirePoints}
          fill="none"
          stroke="#444"
          strokeWidth="0.3"
          strokeLinecap="round"
        />
      </svg>

      {/* Light bulbs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          padding: '8px 2% 0',
          position: 'relative',
        }}
      >
        {lights.map((light, i) => (
          <div
            key={light.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0',
            }}
          >
            {/* Wire stub from top */}
            <div
              style={{
                width: '1px',
                height: `${6 + Math.sin((i / LIGHT_COUNT) * Math.PI) * 4}px`,
                background: '#444',
              }}
            />
            {/* Bulb with glow */}
            <div
              style={{
                width: '8px',
                height: '10px',
                borderRadius: '40% 40% 50% 50%',
                background: `radial-gradient(ellipse at 40% 30%, ${light.color}ee, ${light.color}88)`,
                boxShadow: `0 0 8px ${light.color}, 0 0 16px ${light.color}88, 0 0 28px ${light.color}44, 0 2px 8px ${light.color}66`,
                animation: `lightGlow ${light.duration}ms ease-in-out infinite`,
                animationDelay: `${light.delay}ms`,
                position: 'relative',
              }}
            >
              {/* Cap / socket */}
              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '6px',
                  height: '3px',
                  background: '#555',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
