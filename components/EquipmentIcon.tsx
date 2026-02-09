
import React from 'react';
import { QuestRank } from '../types';

interface EquipmentIconProps {
  type: 'Pickaxe' | 'Helmet' | 'Boots';
  rarity?: QuestRank | string;
  size?: number | string;
  className?: string;
}

const EquipmentIcon: React.FC<EquipmentIconProps> = ({ 
  type, 
  rarity = 'C', 
  size = '1em',
  className = '' 
}) => {
  // Generate a semi-unique ID for defs
  const idBase = `eq-${type}-${rarity}-${Math.random().toString(36).substr(2, 5)}`;

  // Configuration based on Rarity
  const config = {
    C: {
      color1: '#94a3b8',
      color2: '#64748b',
      stroke: '#475569',
      filter: null,
      shine: false
    },
    UC: {
      color1: '#34d399',
      color2: '#059669',
      stroke: '#065f46',
      filter: null,
      shine: false
    },
    R: {
      color1: '#60a5fa',
      color2: '#2563eb',
      stroke: '#1e40af',
      filter: null, 
      shine: true
    },
    E: {
      color1: '#d8b4fe',
      color2: '#9333ea',
      stroke: '#581c87',
      filter: `url(#glow-heavy-${idBase})`,
      shine: true,
      pulse: true
    },
    L: {
      color1: '#fcd34d',
      color2: '#b45309',
      stroke: '#78350f',
      filter: `url(#glow-intense-${idBase})`,
      shine: true,
      godray: true
    }
  };

  const c = config[rarity as QuestRank] || config.C;
  const showSparkles = ['R', 'E', 'L'].includes(rarity as string);

  const renderShape = (isMask: boolean) => {
    const fill = isMask ? 'white' : `url(#grad-${idBase})`;
    const stroke = isMask ? 'white' : c.stroke;
    const filter = !isMask ? (c.filter || undefined) : undefined;
    
    const commonProps = {
        fill: fill,
        stroke: stroke,
        strokeWidth: isMask ? "2" : "1.5",
        filter: filter
    };

    switch (type) {
      case 'Pickaxe':
        return (
          <g transform="rotate(-45 12 12)">
            <path d="M11 8 L11 21 A1 1 0 0 0 13 21 L13 8 Z" fill={isMask ? 'white' : "#78350f"} stroke={stroke} strokeWidth="1" />
            <path d="M4 8 Q12 2 20 8 L22 10 Q12 4 2 10 Z" {...commonProps} strokeWidth="1" />
            {!isMask && <path d="M5 8 Q12 3 19 8" stroke="white" strokeWidth="0.5" opacity="0.4" fill="none" />}
          </g>
        );
      case 'Helmet':
        return (
          <g transform="translate(0, 1)">
            <path d="M12 2 L12 6" stroke={isMask ? 'white' : c.color2} strokeWidth="2" strokeLinecap="round" />
            <path d="M5 12 A7 7 0 0 1 19 12 V16 L19 18 A2 2 0 0 1 17 20 H7 A2 2 0 0 1 5 18 V12 Z" {...commonProps} />
            <path d="M9 14 H15" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
            <path d="M12 14 V18" stroke={stroke} strokeWidth="1" />
            {!isMask && <path d="M7 10 A 5 5 0 0 1 12 8" stroke="white" strokeWidth="1" opacity="0.3" fill="none" strokeLinecap="round"/>}
          </g>
        );
      case 'Boots':
        return (
          <g transform="translate(0, 1)">
             <path d="M8 3 L8 13 Q8 18 13 18 H15 Q19 18 19 15 V14 L15 11 L14 3 Z" {...commonProps} strokeLinejoin="round" />
             {!isMask && <path d="M8 12 H13" stroke={stroke} strokeWidth="1" opacity="0.5" />}
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes eq-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes eq-pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.9); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes eq-shine {
          0% { transform: translateX(-150%); }
          40% { transform: translateX(150%); }
          100% { transform: translateX(150%); }
        }
        @keyframes eq-twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .anim-spin-css { animation: eq-spin 12s linear infinite; transform-box: fill-box; transform-origin: center; }
        .anim-pulse-css { animation: eq-pulse 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .anim-shine-css { animation: eq-shine 3s ease-in-out infinite; }
        .anim-twinkle-css { animation: eq-twinkle 2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      `}</style>
      
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        className={`${className} overflow-visible`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-${idBase}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c.color1} />
            <stop offset="100%" stopColor={c.color2} />
          </linearGradient>

          {c.shine && (
            <linearGradient id={`shine-${idBase}`} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(-45)">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="45%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.8" />
              <stop offset="55%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          )}

          {c.shine && (
            <mask id={`mask-${idBase}`}>
              <rect width="100%" height="100%" fill="black" />
              {renderShape(true)}
            </mask>
          )}

          <filter id={`glow-heavy-${idBase}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.0" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`glow-intense-${idBase}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur1" />
            <feComposite in="SourceGraphic" in2="blur1" operator="over" />
          </filter>
        </defs>

        {/* --- BACKGROUND EFFECTS --- */}
        {rarity === 'L' && (
          <>
            <g transform="translate(12, 12)">
               <g opacity="0.6" className="anim-spin-css">
                 {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                    <path key={i} d="M0 0 L2 -12 L0 -16 L-2 -12 Z" fill={c.color1} transform={`rotate(${deg})`} />
                 ))}
               </g>
            </g>
            <circle className="anim-pulse-css" cx="12" cy="12" r="10" fill={`url(#grad-${idBase})`} opacity="0.2" filter={`url(#glow-intense-${idBase})`} />
          </>
        )}

        {rarity === 'E' && (
          <circle className="anim-pulse-css" cx="12" cy="12" r="11" fill="none" stroke={c.color1} strokeWidth="1" opacity="0.6" />
        )}

        {/* --- MAIN ICON --- */}
        <g>
          {renderShape(false)}
        </g>

        {/* --- SHINE EFFECT (R+) --- */}
        {c.shine && (
          <rect 
            className="anim-shine-css"
            x="-50%" y="-50%" width="200%" height="200%" 
            fill={`url(#shine-${idBase})`} 
            mask={`url(#mask-${idBase})`}
            style={{ mixBlendMode: 'plus-lighter', pointerEvents: 'none' }}
          />
        )}

        {/* --- FOREGROUND EFFECTS (Simplified Sparkles) --- */}
        {showSparkles && (
          <g>
             <path className="anim-twinkle-css" style={{ animationDelay: '0s' }} d="M4 4 L5 6 L6 4 L5 2 Z" fill="white" />
             <path className="anim-twinkle-css" style={{ animationDelay: '1s' }} d="M20 20 L21 22 L22 20 L21 18 Z" fill="white" />
             {rarity === 'L' && (
               <path className="anim-twinkle-css" style={{ animationDelay: '0.5s' }} d="M18 4 L19 7 L20 4 L19 1 Z" fill={c.color1} />
             )}
          </g>
        )}
      </svg>
    </>
  );
};

export default EquipmentIcon;
