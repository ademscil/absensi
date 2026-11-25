import React, { useRef, useState, useEffect } from 'react';
import { clampTiltAngle } from '../../utils/animations.js';

/**
 * SpatialLayer component for multi-layer translateZ depth stacking inside SpatialCard.
 */
export function SpatialLayer({
  children,
  depth = 20,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      className={`spatial-layer ${className}`}
      style={{
        ...style,
        transform: `translateZ(${depth}px)`,
        transformStyle: 'preserve-3d',
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * SpatialCard - ThreeUI inspired 3D perspective tilt card
 * Features:
 * - Pointer-following 3D perspective tilt (perspective(1000px) rotateX(...) rotateY(...) scale3d(1.02, 1.02, 1.02))
 * - Dynamic specular light glare reflection overlay with position-based opacity
 * - Multi-layer translateZ depth stacking support for internal children
 * - Graceful fallback for touch/mobile devices and reduced motion
 */
export function SpatialCard({
  children,
  className = '',
  maxTilt = 15,
  perspective = 1000,
  glare = true,
  'data-testid': testId = 'spatial-card',
  style = {},
  ...props
}) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState(
    `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`
  );
  const [glareStyle, setGlareStyle] = useState({ opacity: 0, x: 50, y: 50 });
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia) {
        const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const motionListener = (e) => setReducedMotion(e.matches);
        if (mqMotion.addEventListener) {
          mqMotion.addEventListener('change', motionListener);
        }

        const mqTouch = window.matchMedia('(hover: none) and (pointer: coarse)');
        const touchListener = (e) => setIsTouchDevice(e.matches);
        if (mqTouch.addEventListener) {
          mqTouch.addEventListener('change', touchListener);
        }

        return () => {
          if (mqMotion.removeEventListener) {
            mqMotion.removeEventListener('change', motionListener);
          }
          if (mqTouch.removeEventListener) {
            mqTouch.removeEventListener('change', touchListener);
          }
        };
      }
    }
  }, []);

  const handlePointerMove = (e) => {
    // Graceful fallback for touch devices & reduced motion
    if (reducedMotion || isTouchDevice || e.pointerType === 'touch' || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 300;
    const left = rect.left || 0;
    const top = rect.top || 0;

    const x = e.clientX - left;
    const y = e.clientY - top;

    // Normalised [-1, 1] relative to center
    const normX = (x / width) * 2 - 1;
    const normY = (y / height) * 2 - 1;

    // Spatial tilt: moving down tilts forward (-rotateX), moving right tilts right (+rotateY)
    const rotX = clampTiltAngle(-normY * maxTilt, -maxTilt, maxTilt);
    const rotY = clampTiltAngle(normX * maxTilt, -maxTilt, maxTilt);

    setTransformStyle(
      `perspective(${perspective}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    );

    if (glare) {
      const glareX = Math.max(0, Math.min(100, (x / width) * 100));
      const glareY = Math.max(0, Math.min(100, (y / height) * 100));
      const distanceFromCenter = Math.sqrt(normX * normX + normY * normY);
      const dynamicOpacity = Math.max(0.12, Math.min(0.38, 0.18 + distanceFromCenter * 0.15));

      setGlareStyle({
        opacity: dynamicOpacity,
        x: glareX,
        y: glareY,
      });
    }
  };

  const handlePointerLeave = () => {
    // Reset to neutral perspective orientation
    setTransformStyle(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`);
    if (glare) {
      setGlareStyle({ opacity: 0, x: 50, y: 50 });
    }
  };

  return (
    <div
      ref={cardRef}
      data-testid={testId}
      className={`spatial-card glass-panel relative overflow-hidden transition-all duration-200 ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        ...style,
        transform: reducedMotion ? 'none' : transformStyle,
        transformStyle: 'preserve-3d',
      }}
      {...props}
    >
      {glare && !reducedMotion && (
        <div
          data-testid="card-glare"
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
          style={{
            opacity: glareStyle.opacity,
            background: `radial-gradient(circle at ${glareStyle.x}% ${glareStyle.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0) 70%)`,
          }}
        />
      )}
      <div
        className="relative z-0 spatial-card-content h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  );
}

export default SpatialCard;
