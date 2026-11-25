import React, { useRef, useEffect } from 'react';

/**
 * SpatialBackground - Lightweight ambient particle & geometric canvas background
 * Features:
 * - Subtle parallax response to pointer movement
 * - Low GPU overhead particle dynamics
 * - Clean requestAnimationFrame loop with cancelAnimationFrame cleanup on unmount
 * - Full prefers-reduced-motion support
 */
export function SpatialBackground({
  'data-testid': testId = 'spatial-background',
  className = '',
  particleCount = 35,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth || 800);
    let height = (canvas.height = window.innerHeight || 600);

    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pointer parallax tracking state
    const pointer = {
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
    };

    // Particles with depth factor for parallax layering
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.8,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.35 + 0.1,
      depth: Math.random() * 0.04 + 0.01,
    }));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth || 800;
      height = canvas.height = window.innerHeight || 600;
    };

    const handlePointerMove = (e) => {
      if (isReduced) return;
      const centerX = width / 2;
      const centerY = height / 2;
      pointer.targetX = (e.clientX - centerX) * 0.08;
      pointer.targetY = (e.clientY - centerY) * 0.08;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth pointer parallax damping
      if (!isReduced) {
        pointer.currentX += (pointer.targetX - pointer.currentX) * 0.06;
        pointer.currentY += (pointer.targetY - pointer.currentY) * 0.06;
      }

      // Draw subtle connecting geometric lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 85) {
            ctx.beginPath();
            ctx.moveTo(p1.x + pointer.currentX * p1.depth, p1.y + pointer.currentY * p1.depth);
            ctx.lineTo(p2.x + pointer.currentX * p2.depth, p2.y + pointer.currentY * p2.depth);
            ctx.stroke();
          }
        }
      }

      // Draw ambient particles
      particles.forEach((p) => {
        if (!isReduced) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        const renderX = p.x + pointer.currentX * p.depth;
        const renderY = p.y + pointer.currentY * p.depth;

        ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!isReduced) {
        animationFrameId = window.requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [particleCount]);

  return (
    <div
      data-testid={testId}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-radial-vignette opacity-80" />
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

export default SpatialBackground;
