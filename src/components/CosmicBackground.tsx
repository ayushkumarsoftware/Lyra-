import React, { useEffect, useRef } from 'react';
import { AtmosphereTheme, AssistantState } from '../types';

interface CosmicBackgroundProps {
  theme: AtmosphereTheme;
  state: AssistantState;
  audioLevel: number;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  theme,
  state,
  audioLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle field
    const particleCount = 45;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulseSpeed: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3 - 0.1,
        opacity: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Subtle cyber grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw floating cosmic particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dynamicOpacity =
          p.opacity * (0.8 + 0.2 * Math.sin(time * p.pulseSpeed * 60));
        ctx.fillStyle = `${theme.accent}${Math.floor(dynamicOpacity * 255)
          .toString(16)
          .padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Central atmospheric radial aura responding to audio
      const pulseMultiplier = state === 'speaking' || state === 'listening' ? 1 + audioLevel * 0.8 : 1;
      const baseRadius = Math.min(width, height) * 0.45 * pulseMultiplier;
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        20,
        width / 2,
        height / 2,
        baseRadius
      );

      const glowAlpha = state === 'speaking' ? 0.22 : state === 'listening' ? 0.18 : 0.08;
      gradient.addColorStop(0, `${theme.accent}${Math.floor(glowAlpha * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.5, `${theme.orbColorPrimary}10`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, state, audioLevel]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#04060d]">
      {/* Dynamic ambient color blur blobs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25 transition-all duration-1000"
        style={{
          backgroundColor: theme.accent,
          transform: `translate(-50%, -50%) scale(${1 + audioLevel * 0.3})`,
        }}
      />
      <div
        className="absolute bottom-10 left-1/3 w-[450px] h-[450px] rounded-full blur-[120px] opacity-15 transition-all duration-1000"
        style={{ backgroundColor: theme.orbColorPrimary }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
