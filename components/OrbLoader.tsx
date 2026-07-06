
import React, { useEffect, useState } from 'react';

const PHRASES = [
  'Sincronizando proyectos...',
  'Cargando estrategias...',
  'Preparando tu universo...',
  'Conectando con la nube...',
  'Casi listo...',
];

interface OrbLoaderProps {
  visible: boolean;
}

const OrbLoader: React.FC<OrbLoaderProps> = ({ visible }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fadePhrase, setFadePhrase] = useState(true);
  const [hiding, setHiding] = useState(false);

  // Cycle through phrases
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setFadePhrase(false);
      setTimeout(() => {
        setPhraseIndex(i => (i + 1) % PHRASES.length);
        setFadePhrase(true);
      }, 400);
    }, 1800);
    return () => clearInterval(interval);
  }, [visible]);

  // Trigger hide animation
  useEffect(() => {
    if (!visible) {
      setHiding(true);
    } else {
      setHiding(false);
    }
  }, [visible]);

  if (!visible && hiding) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(90,20,160,0.35) 0%, rgba(5,4,8,0.96) 65%)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)',
        opacity: hiding ? 0 : 1,
        pointerEvents: hiding ? 'none' : 'all',
      }}
    >
      {/* Subtle background orbital lines */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }}
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="none" stroke="#8c2bee" strokeWidth="0.8">
          <ellipse cx="400" cy="400" rx="160" ry="300" transform="rotate(-20 400 400)" />
          <ellipse cx="400" cy="400" rx="280" ry="480" transform="rotate(-20 400 400)" />
          <ellipse cx="400" cy="400" rx="380" ry="650" transform="rotate(-20 400 400)" />
        </g>
      </svg>

      {/* Center stack */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

        {/* Orb wrapper */}
        <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* Outer halo glow (pulsing) */}
          <div style={{
            position: 'absolute',
            inset: -28,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(140,43,238,0.22) 0%, transparent 70%)',
            animation: 'orbPulse 2.4s ease-in-out infinite',
          }} />

          {/* Rotating halo ring */}
          <svg
            style={{
              position: 'absolute',
              inset: -22,
              width: 'calc(100% + 44px)',
              height: 'calc(100% + 44px)',
              animation: 'orbRingRotate 3s linear infinite',
            }}
            viewBox="0 0 224 224"
          >
            <defs>
              <linearGradient id="haloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0" />
                <stop offset="40%" stopColor="#a855f7" stopOpacity="1" />
                <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="112" cy="112" r="104"
              fill="none"
              stroke="url(#haloGrad)"
              strokeWidth="2.5"
              strokeDasharray="200 460"
              strokeLinecap="round"
            />
          </svg>

          {/* Counter-rotating inner ring */}
          <svg
            style={{
              position: 'absolute',
              inset: -10,
              width: 'calc(100% + 20px)',
              height: 'calc(100% + 20px)',
              animation: 'orbRingRotateReverse 5s linear infinite',
            }}
            viewBox="0 0 200 200"
          >
            <circle
              cx="100" cy="100" r="92"
              fill="none"
              stroke="rgba(167,139,250,0.35)"
              strokeWidth="1"
              strokeDasharray="60 520"
              strokeLinecap="round"
            />
          </svg>

          {/* Orbiting dot */}
          <div style={{
            position: 'absolute',
            inset: -14,
            borderRadius: '50%',
            animation: 'orbDotRotate 2s linear infinite',
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#c084fc',
              boxShadow: '0 0 12px 4px rgba(192,132,252,0.8)',
              transform: 'translateY(-50%)',
            }} />
          </div>

          {/* Second orbiting dot (offset) */}
          <div style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            animation: 'orbDotRotate 3.5s linear infinite reverse',
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              right: 0,
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#7c3aed',
              boxShadow: '0 0 8px 3px rgba(124,58,237,0.7)',
              transform: 'translateY(-50%)',
            }} />
          </div>

          {/* Main orb sphere */}
          <div style={{
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: `
              radial-gradient(circle at 38% 35%, rgba(192,132,252,0.55) 0%, transparent 55%),
              radial-gradient(circle at 68% 72%, rgba(109,40,217,0.4) 0%, transparent 45%),
              radial-gradient(circle at 50% 50%, rgba(88,28,220,0.9) 0%, rgba(55,10,140,0.95) 100%)
            `,
            boxShadow: `
              0 0 60px 20px rgba(140,43,238,0.4),
              0 0 120px 40px rgba(124,58,237,0.2),
              inset 0 0 40px rgba(192,132,252,0.15),
              inset 0 -20px 60px rgba(55,10,140,0.5)
            `,
            border: '1px solid rgba(192,132,252,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: 'orbFloat 4s ease-in-out infinite',
          }}>
            {/* Specular highlight */}
            <div style={{
              position: 'absolute',
              top: '15%',
              left: '20%',
              width: '45%',
              height: '30%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 100%)',
              filter: 'blur(6px)',
            }} />

            {/* Inner wave animation */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              overflow: 'hidden',
              opacity: 0.3,
            }}>
              <div style={{
                position: 'absolute',
                bottom: '-20%',
                left: '-20%',
                width: '140%',
                height: '140%',
                borderRadius: '40%',
                background: 'rgba(167,139,250,0.4)',
                animation: 'orbWave 3s ease-in-out infinite',
              }} />
            </div>

            {/* Animated video clipped to circle */}
            <video
              src="/ROSTRO ANIMADO.mp4"
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
                zIndex: 1,
              }}
            />
          </div>
        </div>

        {/* Brand name */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: 'rgba(255,255,255,0.95)',
            letterSpacing: '-0.5px',
            textShadow: '0 0 30px rgba(140,43,238,0.5)',
            marginBottom: 6,
          }}>
            Visual Oscart
          </div>

          {/* Rotating phrase */}
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(192,132,252,0.8)',
            letterSpacing: '0.05em',
            height: 18,
            transition: 'opacity 0.4s ease',
            opacity: fadePhrase ? 1 : 0,
          }}>
            {PHRASES[phraseIndex]}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: 160,
          height: 2,
          borderRadius: 4,
          background: 'rgba(140,43,238,0.15)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            borderRadius: 4,
            background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
            animation: 'orbProgress 5s ease-in-out forwards',
            boxShadow: '0 0 8px rgba(192,132,252,0.8)',
          }} />
        </div>
      </div>

      {/* Keyframe styles injected */}
      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes orbRingRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbRingRotateReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes orbDotRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes orbWave {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(15deg) translateY(-10px); }
        }
        @keyframes orbProgress {
          0% { width: 0%; }
          30% { width: 45%; }
          70% { width: 75%; }
          90% { width: 90%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default OrbLoader;
