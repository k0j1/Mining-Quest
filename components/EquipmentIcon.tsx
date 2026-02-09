
import React from 'react';
import { QuestRank } from '../types';

interface EquipmentIconProps {
  type: 'Pickaxe' | 'Helmet' | 'Boots';
  rarity?: QuestRank | string; // Allow string for flexibility
  size?: number | string;
  className?: string;
}

const EquipmentIcon: React.FC<EquipmentIconProps> = ({ 
  type, 
  rarity = 'C', 
  size = '1em',
  className = '' 
}) => {
  // Generate a semi-unique ID for defs to prevent conflicts
  const idBase = `eq-${type}-${rarity}-${Math.random().toString(36).substr(2, 5)}`;

  // Configuration based on Rarity
  const config = {
    C: {
      color1: '#94a3b8', // Slate 400
      color2: '#64748b', // Slate 500
      stroke: '#475569',
      filter: null,
      floating: false,
      shine: false
    },
    UC: {
      color1: '#34d399', // Emerald 400
      color2: '#059669', // Emerald 600
      stroke: '#065f46',
      filter: null, // UC is simple
      floating: false,
      shine: false
    },
    R: {
      color1: '#60a5fa', // Blue 400
      color2: '#2563eb', // Blue 600
      stroke: '#1e40af',
      filter: null, // Remove global glow to focus on the shine
      floating: false, // Remove floating
      shine: true // Enable partial shine
    },
    E: {
      color1: '#d8b4fe', // Purple 300 (Lighter for glow)
      color2: '#9333ea', // Purple 600
      stroke: '#581c87',
      filter: `url(#glow-heavy-${idBase})`,
      floating: true,
      shine: true,
      pulse: true
    },
    L: {
      color1: '#fcd34d', // Amber 300
      color2: '#b45309', // Amber 700
      stroke: '#78350f',
      filter: `url(#glow-intense-${idBase})`,
      floating: true,
      shine: true,
      godray: true
    }
  };

  const c = config[rarity as QuestRank] || config.C;

  // Render shapes
  // isMask=true: Renders white silhouette for masking.
  const renderShape = (isMask: boolean) => {
    const fill = isMask ? 'white' : `url(#grad-${idBase})`;
    const stroke = isMask ? 'white' : c.stroke;
    const filter = !isMask ? (c.filter || undefined) : undefined;
    
    // Props for internal parts that shouldn't have filters/gradients when masking
    const commonProps = {
        fill: fill,
        stroke: stroke,
        strokeWidth: isMask ? "2" : "1.5", // Slightly thicker mask to cover edges
        filter: filter
    };

    switch (type) {
      case 'Pickaxe':
        return (
          <g transform="rotate(-45 12 12)">
            {/* Handle */}
            <path d="M11 8 L11 21 A1 1 0 0 0 13 21 L13 8 Z" fill={isMask ? 'white' : "#78350f"} stroke={stroke} strokeWidth="1" />
            {/* Head - Sharp and heavy */}
            <path 
              d="M4 8 Q12 2 20 8 L22 10 Q12 4 2 10 Z" 
              {...commonProps}
              strokeWidth="1"
            />
            {/* Metallic shine line - visual only */}
            {!isMask && <path d="M5 8 Q12 3 19 8" stroke="white" strokeWidth="0.5" opacity="0.4" fill="none" />}
          </g>
        );
      case 'Helmet':
        return (
          <g transform="translate(0, 1)">
            {/* Crest/Top */}
            <path 
              d="M12 2 L12 6" 
              stroke={isMask ? 'white' : c.color2} 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
            {/* Dome */}
            <path 
              d="M5 12 A7 7 0 0 1 19 12 V16 L19 18 A2 2 0 0 1 17 20 H7 A2 2 0 0 1 5 18 V12 Z" 
              {...commonProps}
            />
            {/* Visor slit */}
            <path d="M9 14 H15" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
            <path d="M12 14 V18" stroke={stroke} strokeWidth="1" />
            {/* Highlight */}
            {!isMask && <path d="M7 10 A 5 5 0 0 1 12 8" stroke="white" strokeWidth="1" opacity="0.3" fill="none" strokeLinecap="round"/>}
          </g>
        );
      case 'Boots':
        return (
          <g transform="translate(0, 1)">
             {/* Boot Body - Clearer, Sturdier Shape, No Wings */}
             <path 
               d="M8 3 L8 13 Q8 18 13 18 H15 Q19 18 19 15 V14 L15 11 L14 3 Z" 
               {...commonProps}
               strokeLinejoin="round"
             />
             
             {/* Detail Lines */}
             {!isMask && <path d="M8 12 H13" stroke={stroke} strokeWidth="1" opacity="0.5" />}
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={`${className} overflow-visible`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Main Gradient */}
        <linearGradient id={`grad-${idBase}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.color1} />
          <stop offset="100%" stopColor={c.color2} />
        </linearGradient>

        {/* Shine Gradient - Narrow band of light */}
        {c.shine && (
          <linearGradient id={`shine-${idBase}`} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(-45)">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="45%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.8" />
            <stop offset="55%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        )}

        {/* Mask for Shine */}
        {c.shine && (
          <mask id={`mask-${idBase}`}>
            <rect width="100%" height="100%" fill="black" />
            {renderShape(true)}
          </mask>
        )}

        {/* Heavy Glow (E) */}
        <filter id={`glow-heavy-${idBase}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Intense Holy Glow (L) */}
        <filter id={`glow-intense-${idBase}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.5" result="blur1" />
          <feGaussianBlur stdDeviation="1.5" result="blur2" />
          <feComposite in="SourceGraphic" in2="blur1" operator="over" result="comp1" />
          <feComposite in="comp1" in2="blur2" operator="over" />
        </filter>
      </defs>

      {/* --- BACKGROUND EFFECTS --- */}

      {/* Legendary: Rotating Sunburst */}
      {rarity === 'L' && (
        <g transform="translate(12, 12)">
           <g opacity="0.6">
             <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" />
             {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                <path key={i} d="M0 0 L2 -12 L0 -16 L-2 -12 Z" fill={c.color1} transform={`rotate(${deg})`} />
             ))}
           </g>
           <circle r="10" fill={`url(#grad-${idBase})`} opacity="0.2" filter={`url(#glow-intense-${idBase})`}>
              <animate attributeName="r" values="8;11;8" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" />
           </circle>
        </g>
      )}

      {/* Epic: Pulsing Aura Ring */}
      {rarity === 'E' && (
        <circle cx="12" cy="12" r="11" fill="none" stroke={c.color1} strokeWidth="1" opacity="0.6">
           <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
           <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
           <animate attributeName="stroke-width" values="0.5;2;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* --- MAIN ICON --- */}
      <g>
        {c.floating && (
          <animateTransform 
            attributeName="transform" 
            type="translate" 
            values="0 0; 0 -1.5; 0 0" 
            dur="3s" 
            repeatCount="indefinite" 
            additive="sum"
          />
        )}
        {renderShape(false)}
      </g>

      {/* --- SHINE EFFECT (R+) --- */}
      {c.shine && (
        <rect 
          x="-50%" y="-50%" width="200%" height="200%" 
          fill={`url(#shine-${idBase})`} 
          mask={`url(#mask-${idBase})`}
          style={{ mixBlendMode: 'plus-lighter', pointerEvents: 'none' }}
        >
           {/* Shine moves across */}
           <animate 
             attributeName="x" 
             values="-100%; 100%; 100%" 
             keyTimes="0; 0.4; 1"
             dur="3.5s" 
             repeatCount="indefinite" 
           />
        </rect>
      )}

      {/* --- FOREGROUND EFFECTS --- */}

      {/* Sparkles for Legendary & Epic */}
      {(rarity === 'L' || rarity === 'E') && (
        <g>
           {/* Star 1 */}
           <path d="M4 4 L5 6 L6 4 L5 2 Z" fill="white">
             <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
             <animateTransform attributeName="transform" type="scale" values="0;1;0" dur="2s" repeatCount="indefinite" additive="sum" />
           </path>
           {/* Star 2 */}
           <path d="M20 20 L21 22 L22 20 L21 18 Z" fill="white">
             <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.7s" repeatCount="indefinite" />
             <animateTransform attributeName="transform" type="scale" values="0;1.2;0" dur="1.5s" begin="0.7s" repeatCount="indefinite" additive="sum" />
           </path>
           {/* Star 3 (Legendary only) */}
           {rarity === 'L' && (
             <path d="M18 4 L19 7 L20 4 L19 1 Z" fill={c.color1}>
                <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.3s" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="rotate" values="0 19 4; 90 19 4" dur="1s" repeatCount="indefinite" />
             </path>
           )}
        </g>
      )}
    </svg>
  );
};

export default EquipmentIcon;
