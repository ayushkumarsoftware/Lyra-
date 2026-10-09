import React, { useEffect, useState } from 'react';
import { AtmosphereTheme } from '../types';

export interface FeedbackEvent {
  id: string;
  type: 'tool' | 'note' | 'atmosphere';
  color?: string;
}

interface InteractionFeedbackOverlayProps {
  event: FeedbackEvent | null;
  theme: AtmosphereTheme;
}

export const InteractionFeedbackOverlay: React.FC<InteractionFeedbackOverlayProps> = ({
  event,
  theme,
}) => {
  const [activeEvent, setActiveEvent] = useState<FeedbackEvent | null>(null);

  useEffect(() => {
    if (event) {
      setActiveEvent(event);
      const timer = setTimeout(() => {
        setActiveEvent(null);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [event]);

  if (!activeEvent) return null;

  // Gold amber for notes, theme accent for tools/atmosphere
  const glowColor =
    activeEvent.type === 'note'
      ? '#f59e0b'
      : activeEvent.color || theme.accent;

  const innerShadow =
    activeEvent.type === 'note'
      ? 'inset 0 0 45px 12px rgba(245, 158, 11, 0.45), inset 0 0 100px 30px rgba(245, 158, 11, 0.2)'
      : `inset 0 0 50px 14px ${glowColor}77, inset 0 0 120px 35px ${glowColor}33`;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Perimeter Edge-Glow Vignette */}
      <div
        className="absolute inset-0 edge-glow-flash border-2 sm:border-4"
        style={{
          boxShadow: innerShadow,
          borderColor: `${glowColor}88`,
        }}
      />

      {/* Central Expanding Holographic Energy Shockwave */}
      <div
        className="absolute top-1/2 left-1/2 rounded-full shockwave-ring border"
        style={{
          width: '240px',
          height: '240px',
          borderColor: `${glowColor}aa`,
          boxShadow: `0 0 30px ${glowColor}`,
        }}
      />
    </div>
  );
};
