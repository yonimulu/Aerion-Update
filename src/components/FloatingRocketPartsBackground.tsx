import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PartData {
  id: string;
  name: string;
  code: string;
  category: string;
  type: 'nozzle' | 'gridfin' | 'turbopump' | 'rcs' | 'copv' | 'imu' | 'interstage' | 'piston';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  size: number;
  impulseTime: number; // timestamp when last hit with impulse
}

interface Shockwave {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

const PART_DEFINITIONS: Omit<PartData, 'x' | 'y' | 'vx' | 'vy' | 'rot' | 'vRot' | 'impulseTime'>[] = [
  { id: 'p1', name: 'De Laval Gimbal Nozzle', code: 'ENG-NOZ-01', category: 'Propulsion', type: 'nozzle', size: 84 },
  { id: 'p2', name: 'Lattice Grid Fin', code: 'FIN-AERO-04', category: 'Guidance & Aero', type: 'gridfin', size: 76 },
  { id: 'p3', name: 'Turbopump Impeller', code: 'PUMP-VOL-02', category: 'Turbomachinery', type: 'turbopump', size: 80 },
  { id: 'p4', name: 'RCS Quad Manifold', code: 'RCS-ATT-08', category: 'Attitude Control', type: 'rcs', size: 74 },
  { id: 'p5', name: 'COPV Helium Vessel', code: 'TANK-COPV-03', category: 'Cryogenics', type: 'copv', size: 70 },
  { id: 'p6', name: 'Avionics IMU Sensor', code: 'AV-IMU-09', category: 'Avionics', type: 'imu', size: 74 },
  { id: 'p7', name: 'Separation Ring', code: 'STG-ISO-05', category: 'Structures', type: 'interstage', size: 88 },
  { id: 'p8', name: 'Piston Actuator', code: 'SEP-PNEU-07', category: 'Stage Separation', type: 'piston', size: 68 },
  { id: 'p9', name: 'Secondary Nozzle Bell', code: 'ENG-VAC-02', category: 'Propulsion', type: 'nozzle', size: 78 },
  { id: 'p10', name: 'Centrifugal Volute', code: 'VOL-IMP-06', category: 'Turbomachinery', type: 'turbopump', size: 72 },
  { id: 'p11', name: 'Descent Grid Fin', code: 'FIN-GRID-02', category: 'Guidance', type: 'gridfin', size: 80 },
  { id: 'p12', name: 'Hypergolic RCS Pod', code: 'THR-RCS-12', category: 'Attitude Control', type: 'rcs', size: 70 },
];

/**
 * Technical Aerospace Vector Icons
 */
const renderPartIcon = (type: PartData['type']) => {
  switch (type) {
    case 'nozzle':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
          <path d="M42 12 Q50 8 58 12 L58 22 C58 26 55 30 54 32 C52 36 52 38 53 40 L68 84 C69 87 66 90 62 90 L38 90 C34 90 31 87 32 84 L47 40 C48 38 48 36 46 32 C45 30 42 26 42 22 Z" />
          <path d="M35 75 Q50 78 65 75" strokeDasharray="2 2" />
          <path d="M39 60 Q50 63 61 60" strokeDasharray="2 2" />
          <path d="M43 48 Q50 50 57 48" strokeDasharray="2 2" />
          <line x1="36" y1="20" x2="44" y2="34" />
          <line x1="64" y1="20" x2="56" y2="34" />
          <circle cx="50" cy="14" r="3" />
        </svg>
      );
    case 'gridfin':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
          <rect x="42" y="80" width="16" height="12" rx="2" />
          <circle cx="50" cy="86" r="2.5" />
          <rect x="20" y="16" width="60" height="64" rx="4" />
          <line x1="32" y1="16" x2="32" y2="80" />
          <line x1="44" y1="16" x2="44" y2="80" />
          <line x1="56" y1="16" x2="56" y2="80" />
          <line x1="68" y1="16" x2="68" y2="80" />
          <line x1="20" y1="28" x2="80" y2="28" />
          <line x1="20" y1="41" x2="80" y2="41" />
          <line x1="20" y1="55" x2="80" y2="55" />
          <line x1="20" y1="68" x2="80" y2="68" />
        </svg>
      );
    case 'turbopump':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
          <circle cx="50" cy="50" r="32" />
          <path d="M50 18 C68 18 82 32 82 50 L82 72 C82 76 78 80 74 80 L62 80" />
          <circle cx="50" cy="50" r="10" />
          <circle cx="50" cy="50" r="3" />
          <path d="M50 40 Q58 35 60 26" />
          <path d="M60 50 Q65 58 74 60" />
          <path d="M50 60 Q42 65 40 74" />
          <path d="M40 50 Q35 42 26 40" />
          <path d="M57 43 Q67 44 71 37" />
          <path d="M57 57 Q56 67 63 71" />
          <path d="M43 57 Q33 56 29 63" />
          <path d="M43 43 Q44 33 37 29" />
        </svg>
      );
    case 'rcs':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
          <rect x="38" y="38" width="24" height="24" rx="3" />
          <circle cx="50" cy="50" r="4" />
          <path d="M44 38 L38 20 L62 20 L56 38 Z" />
          <path d="M44 62 L38 80 L62 80 L56 62 Z" />
          <path d="M62 44 L80 38 L80 62 L62 56 Z" />
          <path d="M38 44 L20 38 L20 62 L38 56 Z" />
        </svg>
      );
    case 'copv':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
          <circle cx="50" cy="50" r="34" />
          <ellipse cx="50" cy="50" rx="34" ry="18" strokeDasharray="3 3" />
          <ellipse cx="50" cy="50" rx="18" ry="34" strokeDasharray="3 3" />
          <rect x="45" y="10" width="10" height="7" rx="1.5" />
          <rect x="45" y="83" width="10" height="7" rx="1.5" />
          <line x1="50" y1="6" x2="50" y2="10" />
          <line x1="50" y1="90" x2="50" y2="94" />
        </svg>
      );
    case 'imu':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
          <rect x="22" y="22" width="56" height="56" rx="6" />
          <circle cx="36" cy="38" r="6" />
          <circle cx="36" cy="38" r="2" />
          <circle cx="64" cy="38" r="6" />
          <circle cx="64" cy="38" r="2" />
          <line x1="50" y1="62" x2="50" y2="48" />
          <line x1="50" y1="62" x2="62" y2="68" />
          <line x1="50" y1="62" x2="38" y2="68" />
          <circle cx="50" cy="47" r="1.5" />
          <circle cx="63" cy="69" r="1.5" />
          <circle cx="37" cy="69" r="1.5" />
          <line x1="30" y1="18" x2="70" y2="18" />
          <line x1="34" y1="14" x2="66" y2="14" />
        </svg>
      );
    case 'interstage':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
          <ellipse cx="50" cy="28" rx="36" ry="12" />
          <path d="M14 28 L14 72 C14 80 86 80 86 72 L86 28" />
          <path d="M22 36 L30 68 L38 36 L46 68 L54 36 L62 68 L70 36 L78 68" strokeDasharray="2 2" />
          <line x1="14" y1="50" x2="86" y2="50" strokeDasharray="4 2" />
        </svg>
      );
    case 'piston':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
          <rect x="42" y="35" width="16" height="48" rx="2" />
          <rect x="47" y="14" width="6" height="24" rx="1" />
          <circle cx="50" cy="11" r="3" />
          <circle cx="50" cy="88" r="4" />
          <line x1="38" y1="44" x2="42" y2="44" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
};

export const FloatingRocketPartsBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);


  // Shockwaves array
  const shockwavesRef = useRef<Shockwave[]>([]);

  // Physics state stored in ref for 60fps RAF loop without React rerenders
  const partsRef = useRef<PartData[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean; lastMoved: number }>({
    x: -9999,
    y: -9999,
    active: false,
    lastMoved: 0
  });

  // Initialize random positions and slow drift velocities
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    partsRef.current = PART_DEFINITIONS.map((def, i) => {
      // Evenly distribute across grid columns with random jitter
      const col = i % 4;
      const row = Math.floor(i / 4);
      const baseX = (width / 4) * col + (width / 8) + (Math.random() - 0.5) * (width / 6);
      const baseY = (height / 3) * row + (height / 6) + (Math.random() - 0.5) * (height / 6);

      // Slow, peaceful microgravity drift velocity (-0.35 to +0.35 px/frame)
      const speed = 0.2 + Math.random() * 0.25;
      const angle = Math.random() * Math.PI * 2;

      return {
        ...def,
        x: Math.max(40, Math.min(width - 120, baseX)),
        y: Math.max(40, Math.min(height - 120, baseY)),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 0.2, // slow rotation
        impulseTime: 0
      };
    });
  }, []);

  // Handle pointer move anywhere on window
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
      mouseRef.current.lastMoved = performance.now();
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  // Trigger orbital micro-thruster impulse on click
  const triggerImpulse = useCallback((clickX: number, clickY: number) => {
    const now = performance.now();

    // 1. Spawn expanding visual blueprint shockwave
    shockwavesRef.current.push({
      id: Math.random(),
      x: clickX,
      y: clickY,
      radius: 8,
      maxRadius: 240,
      alpha: 0.7
    });

    // 2. Apply radial microgravity impulse to floating parts
    let closestPart: PartData | null = null;
    let closestDist = Infinity;

    partsRef.current.forEach((part) => {
      const centerX = part.x + part.size / 2;
      const centerY = part.y + part.size / 2;
      const dx = centerX - clickX;
      const dy = centerY - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist) {
        closestDist = dist;
        closestPart = part;
      }

      // If within 380px radius of click, push away with distance-scaled impulse
      if (dist < 380) {
        const factor = Math.max(0.15, (1 - dist / 380));
        const impulseStrength = 2.4 * factor;
        const normX = dist > 0 ? dx / dist : (Math.random() - 0.5);
        const normY = dist > 0 ? dy / dist : (Math.random() - 0.5);

        part.vx += normX * impulseStrength;
        part.vy += normY * impulseStrength;
        part.vRot += (Math.random() - 0.5) * 3.5 * factor;
        part.impulseTime = now;
      }
    });
  }, []);

  // Listen to pointerdown on window (passive, zero blocking of regular clicks)
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      triggerImpulse(e.clientX, e.clientY);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [triggerImpulse]);

  // Main 60fps Physics & Canvas Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const updateDimensions = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    const loop = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mouse = mouseRef.current;
      const now = performance.now();

      // Clear canvas for shockwave ripples
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render shockwave ripple rings
        for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
          const sw = shockwavesRef.current[i];
          sw.radius += 5.5;
          sw.alpha *= 0.94;

          if (sw.radius >= sw.maxRadius || sw.alpha < 0.02) {
            shockwavesRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${sw.alpha * 0.45})`; // Sky blue cyan
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();

          // Inner shockwave ping
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius * 0.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(14, 165, 233, ${sw.alpha * 0.25})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Update Rocket Parts Microgravity Physics
      partsRef.current.forEach((p, idx) => {
        const el = elementsRef.current[idx];

        // 1. Natural drift
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;

        // 2. Soft damping back towards gentle cruising speed
        p.vx *= 0.988;
        p.vy *= 0.988;
        p.vRot *= 0.985;

        // Ensure minimum serene drift speed so they never freeze
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed < 0.15) {
          const randAngle = Math.random() * Math.PI * 2;
          p.vx += Math.cos(randAngle) * 0.04;
          p.vy += Math.sin(randAngle) * 0.04;
        }

        // 3. Mouse repulsion (solar wind / electromagnetic shield effect)
        if (mouse.active && (now - mouse.lastMoved < 4000)) {
          const centerX = p.x + p.size / 2;
          const centerY = p.y + p.size / 2;
          const dx = centerX - mouse.x;
          const dy = centerY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const repelRadius = 180;
          if (dist < repelRadius && dist > 0) {
            const force = (1 - dist / repelRadius) * 0.35;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
            p.vRot += (dx > 0 ? 0.08 : -0.08);
          }
        }

        // 4. Smooth boundary bounce / wrap with margin
        const margin = 20;
        if (p.x < -margin) {
          p.x = width - p.size;
        } else if (p.x > width - p.size + margin) {
          p.x = 0;
        }

        if (p.y < -margin) {
          p.y = height - p.size;
        } else if (p.y > height - p.size + margin) {
          p.y = 0;
        }

        // 5. Update DOM element directly via transform (60fps hardware accelerated)
        if (el) {
          const isImpulsed = (now - p.impulseTime) < 1200;
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rot}deg)`;
          
          if (isImpulsed) {
            el.style.filter = 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))';
            el.style.color = 'rgb(56, 189, 248)';
          } else {
            el.style.filter = 'none';
            el.style.color = '';
          }
        }
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Canvas for Blueprint Impulse Shockwaves */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none w-full h-full"
      />

      {/* Subtle Aerospace Technical Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#a1a1aa_0.75px,transparent_0.75px)] dark:bg-[radial-gradient(#27272a_0.75px,transparent_0.75px)] bg-[size:32px_32px] opacity-25 dark:opacity-30" />

      {/* Interactive Free-Floating Rocket Parts */}
      {PART_DEFINITIONS.map((def, idx) => (
        <div
          key={def.id}
          ref={(el) => { elementsRef.current[idx] = el; }}
          className="absolute top-0 left-0 text-zinc-400 dark:text-zinc-600 opacity-[0.24] dark:opacity-[0.32] transition-colors duration-300 will-change-transform cursor-pointer"
          style={{
            width: `${def.size}px`,
            height: `${def.size}px`,
          }}
          title={`${def.name} (${def.category}) - Click to send thruster impulse`}
        >
          {renderPartIcon(def.type)}

          {/* Micro telemetry label below part */}
          <div 
            ref={(el) => { labelRefs.current[idx] = el; }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap opacity-60 hidden sm:block pointer-events-none"
          >
            {def.code}
          </div>
        </div>
      ))}

    </div>
  );
};
