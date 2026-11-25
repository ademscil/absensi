import React, { useRef, useEffect } from 'react';

/**
 * 3D Polyhedra Generators (Cube, Octahedron, Icosahedron, Ring)
 * Mathematical 3D wireframe models following the video-112 specification
 */
function createCube(s) {
  const v = [];
  for (let i = 0; i < 8; i++) {
    v.push([
      ((i & 1) ? 1 : -1) * s,
      ((i >> 1 & 1) ? 1 : -1) * s,
      ((i >> 2 & 1) ? 1 : -1) * s,
    ]);
  }
  const e = [];
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const d = i ^ j;
      if (d === 1 || d === 2 || d === 4) e.push([i, j]);
    }
  }
  return { v, e };
}

function createOcta(s) {
  const v = [
    [s, 0, 0], [-s, 0, 0],
    [0, s, 0], [0, -s, 0],
    [0, 0, s], [0, 0, -s],
  ];
  const e = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [4, 3], [3, 5], [5, 2],
  ];
  return { v, e };
}

function createIcos(s) {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const v = raw.map((p) => {
    const l = Math.hypot(...p);
    return [(p[0] / l) * s, (p[1] / l) * s, (p[2] / l) * s];
  });
  const e = [
    [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
    [1, 5], [1, 7], [1, 8], [1, 9],
    [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
    [3, 4], [3, 6], [3, 8], [3, 9],
    [4, 5], [4, 9], [4, 11],
    [5, 9], [5, 11],
    [6, 7], [6, 8], [6, 10],
    [7, 8], [7, 10],
    [8, 9],
    [10, 11],
  ];
  return { v, e };
}

function createRing(s) {
  const v = [];
  const e = [];
  const N = 26;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    v.push([Math.cos(a) * s, Math.sin(a) * s, 0]);
    v.push([Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.6, 0]);
  }
  for (let i = 0; i < N; i++) {
    const n = (i + 1) % N;
    e.push([i * 2, n * 2], [i * 2 + 1, n * 2 + 1], [i * 2, i * 2 + 1]);
  }
  return { v, e };
}

/**
 * SpatialBackground - Interactive 3D Canvas Space Engine
 * Features:
 * - 3D Saturn-like planet with luminous atmospheric banding, front/back ring occlusion, and orbiting moons
 * - 3D neon wireframe polyhedra (cubes, octahedra, icosahedra, rings) tumbling in space
 * - Interactive mouse parallax: "MOVE YOUR CURSOR — THE PLANET FOLLOWS"
 * - Multi-tenant transparent backdrop blending seamlessly with Astra corporate blue gradients
 */
export function SpatialBackground({
  'data-testid': testId = 'spatial-background',
  className = '',
  particleCount = 50,
  showPlanet = true,
  planetXRatio = 0.5,
  planetYRatio = 0.5,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Defensive polyfills for test environments (jsdom / headless)
    if (!ctx.clip) ctx.clip = () => {};
    if (!ctx.save) ctx.save = () => {};
    if (!ctx.restore) ctx.restore = () => {};
    if (!ctx.translate) ctx.translate = () => {};
    if (!ctx.rotate) ctx.rotate = () => {};
    if (!ctx.scale) ctx.scale = () => {};
    if (!ctx.createRadialGradient) ctx.createRadialGradient = () => ({ addColorStop: () => {} });
    if (!ctx.createLinearGradient) ctx.createLinearGradient = () => ({ addColorStop: () => {} });

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight || 600);

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

    // Color palette for 3D wireframe polyhedra
    const palette = ['#7c5cff', '#00e0ff', '#ff5ca8', '#5cffb1', '#ffd166'];

    // Starfield particles
    const starColors = [
      'rgba(255, 255, 255, ',
      'rgba(147, 197, 253, ',
      'rgba(56, 189, 248, ',
      'rgba(192, 132, 252, ',
    ];

    const stars = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * width * 1.6,
      y: (Math.random() - 0.5) * height * 1.6,
      z: Math.random() * 800 - 200,
      radius: Math.random() * 1.2 + 0.6,
      color: starColors[Math.floor(Math.random() * starColors.length)],
      alpha: Math.random() * 0.5 + 0.35,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    // Floating 3D wireframe shapes
    const shapeConstructors = [
      () => ({ model: createCube(15), color: palette[0] }),
      () => ({ model: createOcta(16), color: palette[1] }),
      () => ({ model: createIcos(18), color: palette[2] }),
      () => ({ model: createRing(20), color: palette[3] }),
      () => ({ model: createCube(13), color: palette[4] }),
    ];

    const floatingShapes = shapeConstructors.map((fn, idx) => {
      const { model, color } = fn();
      return {
        model,
        color,
        x: (idx % 2 === 0 ? 0.32 : -0.32) * width + (Math.random() - 0.5) * 60,
        y: ((idx - 2) / 2.5) * height * 0.4 + (Math.random() - 0.5) * 50,
        z: Math.random() * 250 - 50,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        drx: (Math.random() - 0.5) * 0.02,
        dry: (Math.random() - 0.5) * 0.02,
        drz: (Math.random() - 0.5) * 0.02,
        floatPhase: Math.random() * Math.PI * 2,
      };
    });

    // Orbiting moons for the planet
    const moons = [
      { dist: 1.55, speed: 0.012, size: 6.5, angle: 0.4, color: '#e0e7ff', glow: 'rgba(224, 231, 255, 0.5)' },
      { dist: 2.15, speed: 0.008, size: 4.5, angle: 2.8, color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)' },
    ];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth || 800;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight || 600;
    };

    const handlePointerMove = (e) => {
      if (isReduced) return;
      const centerX = width / 2;
      const centerY = height / 2;
      pointer.targetX = (e.clientX - centerX) * 0.06;
      pointer.targetY = (e.clientY - centerY) * 0.06;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      const centerX = width * planetXRatio;
      const centerY = height * planetYRatio;

      // Pointer damping
      if (!isReduced) {
        pointer.currentX += (pointer.targetX - pointer.currentX) * 0.05;
        pointer.currentY += (pointer.targetY - pointer.currentY) * 0.05;
      }

      // 1. Render Starfield
      const fov = 500;
      stars.forEach((s) => {
        const safeZ = s.z + 300;
        const scale = fov / (fov + safeZ);
        const x = width / 2 + (s.x + pointer.currentX * 5) * scale;
        const y = height / 2 + (s.y + pointer.currentY * 5) * scale;
        const radius = Math.max(0.5, s.radius * scale);
        const twinkle = Math.sin(s.phase + time * s.twinkleSpeed) * 0.3 + 0.7;
        const alpha = Math.min(1, Math.max(0.05, s.alpha * twinkle * scale));

        ctx.fillStyle = `${s.color}${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Render 3D Planet & Rings
      if (showPlanet) {
        const planetX = centerX + pointer.currentX * 0.3;
        const planetY = centerY + pointer.currentY * 0.3;
        const R = Math.min(width * 0.22, height * 0.24, 150);

        const ringTilt = -0.32 + pointer.currentY * 0.001;
        const ringScaleY = 0.28 + pointer.currentX * 0.0005;

        // A. Draw Outer Atmosphere Halo (Behind Planet)
        const haloGrad = ctx.createRadialGradient(planetX, planetY, R * 0.85, planetX, planetY, R * 1.55);
        haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        haloGrad.addColorStop(0.35, 'rgba(124, 92, 255, 0.25)');
        haloGrad.addColorStop(0.7, 'rgba(244, 114, 182, 0.12)');
        haloGrad.addColorStop(1, 'rgba(124, 92, 255, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(planetX, planetY, R * 1.55, 0, Math.PI * 2);
        ctx.fill();

        // Helper to draw concentric rings
        const drawRings = (clipTopHalf) => {
          if (ctx.save) ctx.save();
          if (ctx.translate) ctx.translate(planetX, planetY);
          if (ctx.rotate) ctx.rotate(ringTilt);
          if (ctx.scale) ctx.scale(1, ringScaleY);

          ctx.beginPath();
          if (clipTopHalf) {
            ctx.rect(-R * 3.5, -R * 3.5, R * 7, R * 3.5); // Back half
          } else {
            ctx.rect(-R * 3.5, 0, R * 7, R * 3.5); // Front half
          }
          if (ctx.clip) ctx.clip();

          // Concentric ring bands
          const ringInner = R * 1.35;
          const ringOuter = R * 2.45;

          const ringGrad = ctx.createRadialGradient(0, 0, ringInner, 0, 0, ringOuter);
          ringGrad.addColorStop(0, 'rgba(124, 92, 255, 0)');
          ringGrad.addColorStop(0.06, 'rgba(255, 255, 255, 0.95)');
          ringGrad.addColorStop(0.22, 'rgba(56, 189, 248, 0.85)');
          ringGrad.addColorStop(0.45, 'rgba(15, 23, 42, 0.15)'); // Cassini division
          ringGrad.addColorStop(0.62, 'rgba(244, 114, 182, 0.8)');
          ringGrad.addColorStop(0.82, 'rgba(192, 132, 252, 0.7)');
          ringGrad.addColorStop(0.95, 'rgba(224, 231, 255, 0.65)');
          ringGrad.addColorStop(1, 'rgba(124, 92, 255, 0)');

          ctx.fillStyle = ringGrad;
          ctx.beginPath();
          ctx.arc(0, 0, ringOuter, 0, Math.PI * 2);
          ctx.arc(0, 0, ringInner, 0, Math.PI * 2, true);
          ctx.fill();

          if (ctx.restore) ctx.restore();
        };

        // B. Draw BACK HALF of Ring (Behind Planet)
        drawRings(true);

        // C. Draw Moons (Behind Planet if z < 0)
        moons.forEach((m) => {
          m.angle += m.speed;
          const orbitR = R * m.dist;
          const mx = planetX + Math.cos(m.angle) * orbitR;
          const my = planetY + Math.sin(m.angle) * orbitR * 0.35;
          const isBehind = Math.sin(m.angle) < 0;

          if (isBehind) {
            ctx.fillStyle = m.glow;
            ctx.beginPath();
            ctx.arc(mx, my, m.size * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(mx, my, m.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // D. Draw PLANET Sphere with Atmospheric Gas Bands & 3D Lighting
        if (ctx.save) ctx.save();
        ctx.beginPath();
        ctx.arc(planetX, planetY, R, 0, Math.PI * 2);
        if (ctx.clip) ctx.clip();

        // 1. Gas Giant Atmospheric Bands
        const bandGrad = ctx.createLinearGradient(
          planetX - R * 0.35, planetY - R,
          planetX + R * 0.35, planetY + R
        );
        bandGrad.addColorStop(0.00, '#38bdf8');
        bandGrad.addColorStop(0.12, '#bae6fd');
        bandGrad.addColorStop(0.24, '#c084fc');
        bandGrad.addColorStop(0.38, '#f472b6');
        bandGrad.addColorStop(0.48, '#ffffff');
        bandGrad.addColorStop(0.58, '#f43f5e');
        bandGrad.addColorStop(0.70, '#818cf8');
        bandGrad.addColorStop(0.85, '#6366f1');
        bandGrad.addColorStop(1.00, '#312e81');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(planetX - R, planetY - R, R * 2, R * 2);

        // 2. 3D Spherical Volume Lighting
        const lightGrad = ctx.createRadialGradient(
          planetX + R * 0.38, planetY - R * 0.3, R * 0.05,
          planetX - R * 0.1, planetY + R * 0.15, R * 1.15
        );
        lightGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)');
        lightGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.15)');
        lightGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
        lightGrad.addColorStop(0.80, 'rgba(5, 10, 28, 0.35)');
        lightGrad.addColorStop(1.00, 'rgba(3, 7, 20, 0.75)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(planetX - R, planetY - R, R * 2, R * 2);

        // 3. Planet Ring Shadow
        if (ctx.save) ctx.save();
        if (ctx.translate) ctx.translate(planetX, planetY);
        if (ctx.rotate) ctx.rotate(ringTilt);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(-R, -R * 0.08, R * 2, R * 0.16);
        if (ctx.restore) ctx.restore();

        // 4. Inner Atmospheric Fresnel Rim Glow
        const rimGrad = ctx.createRadialGradient(planetX, planetY, R * 0.8, planetX, planetY, R);
        rimGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        rimGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.45)');
        rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
        ctx.fillStyle = rimGrad;
        ctx.fillRect(planetX - R, planetY - R, R * 2, R * 2);

        if (ctx.restore) ctx.restore();

        // E. Draw FRONT HALF of Ring (In Front of Planet)
        drawRings(false);

        // F. Draw Moons (In Front of Planet if z >= 0)
        moons.forEach((m) => {
          const orbitR = R * m.dist;
          const mx = planetX + Math.cos(m.angle) * orbitR;
          const my = planetY + Math.sin(m.angle) * orbitR * 0.35;
          const isBehind = Math.sin(m.angle) < 0;

          if (!isBehind) {
            ctx.fillStyle = m.glow;
            ctx.beginPath();
            ctx.arc(mx, my, m.size * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(mx, my, m.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 3. Render Floating 3D Neon Wireframe Polyhedra
      floatingShapes.forEach((shape) => {
        if (!isReduced) {
          shape.rx += shape.drx;
          shape.ry += shape.dry;
          shape.rz += shape.drz;
        }

        const floatY = Math.sin(time * 0.02 + shape.floatPhase) * 10;
        const originX = centerX + shape.x + pointer.currentX * 0.2;
        const originY = centerY + shape.y + floatY + pointer.currentY * 0.2;

        const { rx, ry, rz } = shape;
        const cosX = Math.cos(rx), sinX = Math.sin(rx);
        const cosY = Math.cos(ry), sinY = Math.sin(ry);
        const cosZ = Math.cos(rz), sinZ = Math.sin(rz);

        const projected = shape.model.v.map(([x, y, z]) => {
          let y1 = cosX * y - sinX * z;
          let z1 = sinX * y + cosX * z;
          let x2 = cosY * x + sinY * z1;
          let z2 = -sinY * x + cosY * z1;
          let x3 = cosZ * x2 - sinZ * y1;
          let y3 = sinZ * x2 + cosZ * y1;

          const shapeScale = fov / (fov + shape.z + z2 + 300);
          return {
            x: originX + x3 * shapeScale,
            y: originY + y3 * shapeScale,
          };
        });

        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        shape.model.e.forEach(([i1, i2]) => {
          const p1 = projected[i1];
          const p2 = projected[i2];
          if (p1 && p2) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        });
        ctx.stroke();
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
  }, [particleCount, showPlanet, planetXRatio, planetYRatio]);

  return (
    <div
      data-testid={testId}
      className={`pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

export default SpatialBackground;
