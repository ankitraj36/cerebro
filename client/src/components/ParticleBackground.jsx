/**
 * ParticleBackground.jsx — Full-screen ambient particle canvas
 * 
 * Enhanced features:
 * - Lines connecting nearby particles (< 120px)
 * - Mouse interaction: particles gently repel from cursor
 * - Color variety: red, orange, purple, cyan
 * - Depth layers: larger/closer particles move faster (parallax)
 */

import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 70;

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    // Track mouse position
    function onMouseMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener('mousemove', onMouseMove);

    // Size canvas to window
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Initialize particles with depth layers
    function initParticles() {
      particles = [];
      const colors = [
        { h: 0, s: 100, l: 50 },     // red
        { h: 20, s: 100, l: 50 },     // orange
        { h: 280, s: 80, l: 60 },     // purple
        { h: 175, s: 80, l: 50 },     // cyan
        { h: 10, s: 90, l: 55 },      // red-orange
      ];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const depth = Math.random() * 0.8 + 0.2; // 0.2 = far, 1.0 = close
        const colorChoice = colors[Math.floor(Math.random() * colors.length)];

        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          baseX: 0, // for mouse repulsion
          baseY: 0,
          size: (Math.random() * 2 + 0.5) * depth,
          speed: (Math.random() * 0.4 + 0.15) * depth, // closer = faster
          driftFreq: Math.random() * 0.02 + 0.005,
          driftAmp: (Math.random() * 25 + 8) * depth,
          phase: Math.random() * Math.PI * 2,
          color: colorChoice,
          alpha: (Math.random() * 0.25 + 0.1) * depth,
          depth,
        });
      }
    }

    const CONNECTION_DIST = 120;
    const MOUSE_RADIUS = 150;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update and draw particles
      for (const p of particles) {
        // Drift upward
        p.y -= p.speed;
        p.phase += p.driftFreq;

        // Horizontal sine wave drift
        const xOffset = Math.sin(p.phase) * p.driftAmp;

        // Reset to bottom when reaching top
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        // Calculate render positions
        let rx = p.x + xOffset;
        let ry = p.y;

        // Mouse repulsion
        const dx = rx - mx;
        const dy = ry - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * 30 * p.depth;
          rx += (dx / dist) * force;
          ry += (dy / dist) * force;
        }

        // Store render position for connection lines
        p.rx = rx;
        p.ry = ry;

        // Draw particle
        ctx.beginPath();
        ctx.arc(rx, ry, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.color.h}, ${p.color.s}%, ${p.color.l}%, ${p.alpha})`;
        ctx.fill();
      }

      // Draw connections between nearby particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.rx - b.rx;
          const dy = a.ry - b.ry;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.12 * Math.min(a.depth, b.depth);
            ctx.beginPath();
            ctx.moveTo(a.rx, a.ry);
            ctx.lineTo(b.rx, b.ry);
            ctx.strokeStyle = `rgba(255, 60, 30, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    }

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
