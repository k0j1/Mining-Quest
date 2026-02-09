
import React, { useRef, useLayoutEffect } from 'react';
import { QuestRank } from '../types';
import gsap from 'gsap';

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
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Generate a semi-unique ID for defs to prevent conflicts
  const idBase = `eq-${type}-${rarity}-${Math.random().toString(36).substr(2, 5)}`;

  // GSAP Animation Logic
  useLayoutEffect(() => {
    if (!svgRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Floating Effect REMOVED to fix position shifting

      // 2. Sunburst Rotation (L)
      const sunburstTarget = svgRef.current?.querySelector('.anim-spin');
      if (sunburstTarget) {
        gsap.to(sunburstTarget, {
          rotation: 360,
          transformOrigin: "center", // Fixed: Use center of bounding box
          duration: 20,
          ease: "linear",
          repeat: -1
        });
      }

      // 3. Pulse (E & L)
      const pulseTarget = svgRef.current?.querySelector('.anim-pulse');
      if (pulseTarget) {
        gsap.to(pulseTarget, {
          opacity: 0.2,
          scale: 0.9,
          transformOrigin: "center", // Fixed: Use center of bounding box
          duration: 1.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });
      }

      // 4. Shine (R, E, L) - Moves the rect across
      const shineTarget = svgRef.current?.querySelector('.anim-shine-bar');
      if (shineTarget) {
        gsap.fromTo(shineTarget, 
          { x: '-150%' },
          { 
            x: '150%', 
            duration: 2, 
            ease: "power2.inOut", 
            repeat: -1, 
            repeatDelay: 3 
          }
        );
      }

      // 5. Sparkles (R, E, L) - Added R to sparkles
      const sparkles = svgRef.current?.querySelectorAll('.anim-sparkle');
      if (sparkles && sparkles.length > 0) {
        gsap.to(sparkles, {
          opacity: 1,
          scale: 1.2,
          transformOrigin: "center",
          duration: 0.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          stagger: {
            each: 0.5,
            from: "random"
          }
        });
      }

    }, svgRef);

    return () => ctx.revert();
  }, [rarity, type]); // Re-run if props change

  // Configuration based on Rarity
  const config = {
    C: {
      color1: '#94a3b8', // Slate 400
      color2: '#64748b', // Slate 500
      stroke: '#475569',
      filter: null,
      shine: false
    },
    UC: {
      color1: '#34d399', // Emerald 400
      color2: '#059669', // Emerald 600
      stroke: '#065f46',
      filter: null, // UC is simple
      shine: false
    },
    R: {
      color1: '#60a5fa', // Blue 400
      color2: '#2563eb', // Blue 600
      stroke: '#1e40af',
      filter: null, 
      shine: true // R gets Shine
    },
    E: {
      color1: '#d8b4fe', // Purple 300 (Lighter for glow)
      color2: '#9333ea', // Purple 600
      stroke: '#581c87',
      filter: `url(#glow-heavy-${idBase})`,
      shine: true,
      pulse: true
    },
    L: {
      color1: '#fcd34d', // Amber 300
      color2: '#b45309', // Amber 700
      stroke: '#78350f',
      filter: `url(#glow-intense-${idBase})`,
      shine: true,
      godray: true
    }
  };

  const c = config[rarity as QuestRank] || config.C;
  
  // Determine if sparkles should be shown (R, E, L)
  const showSparkles = ['R', 'E', 'L'].includes(rarity as string);

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
      ref={svgRef}
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
        <>
          <g transform="translate(12, 12)">
             <g opacity="0.6" className="anim-spin">
               {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                  <path key={i} d="M0 0 L2 -12 L0 -16 L-2 -12 Z" fill={c.color1} transform={`rotate(${deg})`} />
               ))}
             </g>
          </g>
          {/* Moved pulse outside translate group to normalize coordinates with Epic */}
          <circle className="anim-pulse" cx="12" cy="12" r="10" fill={`url(#grad-${idBase})`} opacity="0.2" filter={`url(#glow-intense-${idBase})`} />
        </>
      )}

      {/* Epic: Pulsing Aura Ring */}
      {rarity === 'E' && (
        <circle className="anim-pulse" cx="12" cy="12" r="11" fill="none" stroke={c.color1} strokeWidth="1" opacity="0.6" />
      )}

      {/* --- MAIN ICON --- */}
      <g>
        {renderShape(false)}
      </g>

      {/* --- SHINE EFFECT (R+) --- */}
      {c.shine && (
        <rect 
          className="anim-shine-bar"
          x="-50%" y="-50%" width="200%" height="200%" 
          fill={`url(#shine-${idBase})`} 
          mask={`url(#mask-${idBase})`}
          style={{ mixBlendMode: 'plus-lighter', pointerEvents: 'none' }}
        />
      )}

      {/* --- FOREGROUND EFFECTS --- */}

      {/* Sparkles for Legendary & Epic & Rare */}
      {showSparkles && (
        <g>
           {/* Star 1 */}
           <path className="anim-sparkle" d="M4 4 L5 6 L6 4 L5 2 Z" fill="white" opacity="0" style={{ transformBox: 'fill-box' }} />
           {/* Star 2 */}
           <path className="anim-sparkle" d="M20 20 L21 22 L22 20 L21 18 Z" fill="white" opacity="0" style={{ transformBox: 'fill-box' }} />
           {/* Star 3 (Legendary only) */}
           {rarity === 'L' && (
             <path className="anim-sparkle" d="M18 4 L19 7 L20 4 L19 1 Z" fill={c.color1} opacity="0" style={{ transformBox: 'fill-box' }} />
           )}
        </g>
      )}
    </svg>
  );
};

export default EquipmentIcon;
