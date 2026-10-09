import React, { useEffect, useRef } from 'react';
import { AssistantState, AtmosphereTheme, WaveformStyle, AnimationIntensity } from '../types';

interface WaveformVisualizerProps {
  analyserNode: AnalyserNode | null;
  state: AssistantState;
  theme: AtmosphereTheme;
  waveformStyle?: WaveformStyle;
  intensity?: AnimationIntensity;
  height?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  analyserNode,
  state,
  theme,
  waveformStyle = 'fluid_spline',
  intensity = 'balanced',
  height = 90,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const isLive = state === 'speaking' || state === 'listening';

    let dataArray: Uint8Array<ArrayBuffer> | null = null;
    if (analyserNode) {
      dataArray = new Uint8Array(new ArrayBuffer(analyserNode.frequencyBinCount));
    }

    let phase = 0;

    const intensityMultiplier =
      intensity === 'subtle' ? 0.65 : intensity === 'energetic' ? 1.45 : 1.0;

    const render = () => {
      const width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || 300);
      const canvasHeight = (canvas.height = height * window.devicePixelRatio || 90);
      ctx.clearRect(0, 0, width, canvasHeight);

      phase += 0.04 * intensityMultiplier;

      if (analyserNode && isLive && dataArray) {
        analyserNode.getByteFrequencyData(dataArray);
      }

      // STYLE 1: Cyber Equalizer Bars
      if (waveformStyle === 'cyber_bars') {
        const numBars = 36;
        const barWidth = Math.max(3, (width / numBars) * 0.55);
        const gap = (width - numBars * barWidth) / (numBars + 1);

        for (let i = 0; i < numBars; i++) {
          let value = 0;
          if (analyserNode && isLive && dataArray) {
            const sampleIndex = Math.floor((i / numBars) * (dataArray.length * 0.7));
            value = (dataArray[sampleIndex] / 255) * intensityMultiplier;
          } else if (state === 'connecting') {
            value = (Math.sin(phase * 2 + i * 0.3) + 1) * 0.25;
          } else if (state === 'disconnected') {
            value = 0.03 * Math.sin(phase + i * 0.2);
          } else {
            value = 0.02;
          }

          const midWeight = Math.sin((i / numBars) * Math.PI);
          const barHeight = Math.max(
            4,
            value * (canvasHeight * 0.75) * (0.35 + midWeight * 0.9)
          );

          const x = gap + i * (barWidth + gap);
          const y = (canvasHeight - barHeight) / 2;

          const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          barGrad.addColorStop(0, theme.orbColorTertiary);
          barGrad.addColorStop(0.5, theme.accent);
          barGrad.addColorStop(1, theme.orbColorPrimary);

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
          ctx.fill();

          if (value > 0.3) {
            ctx.shadowColor = theme.accent;
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + barWidth / 2, y, barWidth / 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
      // STYLE 2: Fluid Multi-Wave Spline Ribbon
      else if (waveformStyle === 'fluid_spline') {
        const waveCount = 3;
        const steps = 60;

        for (let w = 0; w < waveCount; w++) {
          const wPhase = phase + w * 0.8;
          ctx.beginPath();
          ctx.lineWidth = w === 0 ? 2.5 : 1.5;

          const alpha = w === 0 ? 0.9 : 0.45 / (w + 0.5);
          ctx.strokeStyle = `${theme.accent}${Math.floor(alpha * 255)
            .toString(16)
            .padStart(2, '0')}`;

          for (let s = 0; s <= steps; s++) {
            const x = (s / steps) * width;
            let sampleVal = 0.05;

            if (analyserNode && isLive && dataArray) {
              const sampleIndex = Math.floor((s / steps) * (dataArray.length * 0.5));
              sampleVal = (dataArray[sampleIndex] / 255) * intensityMultiplier;
            } else if (state === 'connecting') {
              sampleVal = 0.25;
            }

            const envelope = Math.sin((s / steps) * Math.PI);
            const amp = isLive ? canvasHeight * 0.38 * sampleVal : 4;
            const y =
              canvasHeight / 2 +
              Math.sin((s / steps) * Math.PI * (4 + w) + wPhase) * amp * envelope;

            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      // STYLE 3: Radial Halo / Starburst Array
      else if (waveformStyle === 'radial_halo') {
        const centerX = width / 2;
        const centerY = canvasHeight / 2;
        const rayCount = 48;
        const baseRadius = 24;

        for (let r = 0; r < rayCount; r++) {
          const angle = (r / rayCount) * Math.PI * 2 + phase * 0.5;
          let val = 0.05;

          if (analyserNode && isLive && dataArray) {
            const sampleIdx = Math.floor((r / rayCount) * (dataArray.length * 0.6));
            val = (dataArray[sampleIdx] / 255) * intensityMultiplier;
          } else if (state === 'connecting') {
            val = (Math.sin(phase * 3 + r * 0.4) + 1) * 0.2;
          }

          const rayLen = Math.max(4, val * (canvasHeight * 0.45));
          const x1 = centerX + Math.cos(angle) * baseRadius;
          const y1 = centerY + Math.sin(angle) * baseRadius;
          const x2 = centerX + Math.cos(angle) * (baseRadius + rayLen);
          const y2 = centerY + Math.sin(angle) * (baseRadius + rayLen);

          ctx.strokeStyle = val > 0.3 ? theme.orbColorTertiary : theme.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
      // STYLE 4: Quantum Nodes / Particle Spectrum
      else if (waveformStyle === 'quantum_dots') {
        const dotCount = 28;
        const spacing = width / (dotCount + 1);

        for (let d = 0; d < dotCount; d++) {
          const x = spacing * (d + 1);
          let val = 0.05;

          if (analyserNode && isLive && dataArray) {
            const idx = Math.floor((d / dotCount) * (dataArray.length * 0.7));
            val = (dataArray[idx] / 255) * intensityMultiplier;
          } else if (state === 'connecting') {
            val = (Math.sin(phase * 2 + d * 0.4) + 1) * 0.25;
          }

          const offset = Math.sin(phase + d * 0.5) * 8;
          const y = canvasHeight / 2 + offset;
          const radius = Math.max(2, val * 12 + 2);

          ctx.fillStyle = val > 0.4 ? theme.orbColorTertiary : theme.accent;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();

          // Vertical glowing connection thread
          ctx.strokeStyle = `${theme.accent}33`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y - val * 25);
          ctx.lineTo(x, y + val * 25);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyserNode, state, theme, waveformStyle, intensity, height]);

  return (
    <div className="w-full max-w-md sm:max-w-lg px-4 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{ height: `${height}px` }}
        className="w-full pointer-events-none drop-shadow-md"
      />
    </div>
  );
};
