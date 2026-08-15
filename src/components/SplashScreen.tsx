import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'title-in' | 'hold' | 'open' | 'done'>('title-in');

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('vrg_splash_shown', 'true');
    } catch {}
    setPhase('done');
    onComplete();
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem('vrg_splash_shown') === 'true') {
        onComplete();
        setPhase('done');
        return;
      }
      sessionStorage.setItem('vrg_splash_shown', 'true');
    } catch {}

    // Phase 1: title animates in (0ms → 200ms)
    const t1 = setTimeout(() => setPhase('hold'), 200);
    // Phase 2: hold (200ms → 450ms)
    const t2 = setTimeout(() => setPhase('open'), 450);
    // Phase 3: curtains open smoothly (450ms → 800ms)
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      id="splash-screen"
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        cursor: 'pointer',
        pointerEvents: phase === 'open' ? 'none' : 'all',
      }}
    >
      {/* Left curtain */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: 'linear-gradient(135deg, #0f1a0e 0%, #1a2e1a 40%, #0d2218 100%)',
          transform: phase === 'open' ? 'translateX(-100%)' : 'translateX(0)',
          transition: phase === 'open' ? 'transform 0.4s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
          zIndex: 2,
        }}
      />
      {/* Right curtain */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: 'linear-gradient(225deg, #0f1a0e 0%, #1a2e1a 40%, #0d2218 100%)',
          transform: phase === 'open' ? 'translateX(100%)' : 'translateX(0)',
          transition: phase === 'open' ? 'transform 0.4s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
          zIndex: 2,
        }}
      />

      {/* Center content — sits between curtains, fades out as curtains open */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
          opacity: phase === 'open' ? 0 : 1,
          transition: phase === 'open' ? 'opacity 0.4s ease' : 'none',
        }}
      >
        {/* Rose SVG icon */}
        <div
          style={{
            opacity: phase === 'title-in' ? 0 : 1,
            transform: phase === 'title-in' ? 'scale(0.4) rotate(-30deg)' : 'scale(1) rotate(0deg)',
            transition: 'opacity 1s ease 0.1s, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
            marginBottom: '24px',
            filter: 'drop-shadow(0 0 24px rgba(244,63,94,0.5))',
          }}
        >
          <img src="/logo.png" alt="Veerika Rose Garden" width={80} height={80} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        </div>

        {/* Tamil name */}
        <div
          style={{
            fontFamily: "'Noto Sans Tamil', 'serif'",
            fontSize: 'clamp(13px, 2vw, 18px)',
            color: '#86efac',
            letterSpacing: '0.25em',
            marginBottom: '12px',
            opacity: phase === 'title-in' ? 0 : 1,
            transform: phase === 'title-in' ? 'translateY(20px)' : 'translateY(0)',
            transition: 'opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s',
          }}
        >
          வீரிகா ரோஜா கார்டன்
        </div>

        {/* Main English title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <h1
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(32px, 6vw, 72px)',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              opacity: phase === 'title-in' ? 0 : 1,
              transform: phase === 'title-in' ? 'translateY(40px) scale(0.9)' : 'translateY(0) scale(1)',
              transition: 'opacity 0.9s ease 0.2s, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
              textShadow: '0 0 60px rgba(244,63,94,0.4), 0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            Veerika
          </h1>
          <h1
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(32px, 6vw, 72px)',
              fontWeight: 700,
              background: 'linear-gradient(90deg, #f43f5e, #fb923c, #f43f5e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              opacity: phase === 'title-in' ? 0 : 1,
              transform: phase === 'title-in' ? 'translateY(40px) scale(0.9)' : 'translateY(0) scale(1)',
              transition: 'opacity 0.9s ease 0.35s, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.35s',
            }}
          >
            Rose Garden
          </h1>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: phase === 'title-in' ? 0 : 1,
            transform: phase === 'title-in' ? 'translateY(20px)' : 'translateY(0)',
            transition: 'opacity 0.8s ease 0.7s, transform 0.8s ease 0.7s',
          }}
        >
          <span style={{ width: 40, height: 1, background: 'rgba(248,213,100,0.5)', display: 'block' }} />
          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(11px, 1.5vw, 15px)',
              color: '#f8d564',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            Premier Plant Nursery · Direct Farm
          </span>
          <span style={{ width: 40, height: 1, background: 'rgba(248,213,100,0.5)', display: 'block' }} />
        </div>

        {/* Animated petal particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${6 + (i % 3) * 4}px`,
              height: `${6 + (i % 3) * 4}px`,
              borderRadius: '50% 0 50% 50%',
              background: i % 2 === 0 ? 'rgba(244,63,94,0.3)' : 'rgba(251,146,60,0.3)',
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 4) * 20}%`,
              animation: `floatPetal ${3 + i * 0.5}s ease-in-out ${i * 0.3}s infinite alternate`,
              opacity: phase === 'title-in' ? 0 : 0.6,
              transition: 'opacity 1s ease',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes floatPetal {
          from { transform: translateY(0px) rotate(0deg); }
          to   { transform: translateY(-20px) rotate(25deg); }
        }
      `}</style>
    </div>
  );
};
