
import React from 'react';

const MiningBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1080 1920" 
        preserveAspectRatio="xMidYMax slice" 
        className="w-full h-full"
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#071022"/>
            <stop offset="0.55" stopColor="#0B1B33"/>
            <stop offset="1" stopColor="#101B24"/>
          </linearGradient>

          {/* Distant haze */}
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.06"/>
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/>
          </linearGradient>

          {/* Fire glow */}
          <radialGradient id="fireGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#FFB000" stopOpacity="0.65"/>
            <stop offset="0.45" stopColor="#FF6A00" stopOpacity="0.22"/>
            <stop offset="1" stopColor="#FF6A00" stopOpacity="0"/>
          </radialGradient>

          {/* Subtle noise dots (lightweight) */}
          <pattern id="dust" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="18" cy="24" r="1.2" fill="#FFFFFF" opacity="0.08"/>
            <circle cx="74" cy="16" r="1.0" fill="#FFFFFF" opacity="0.05"/>
            <circle cx="46" cy="68" r="1.3" fill="#FFFFFF" opacity="0.06"/>
            <circle cx="98" cy="82" r="0.9" fill="#FFFFFF" opacity="0.04"/>
            <circle cx="22" cy="96" r="1.1" fill="#FFFFFF" opacity="0.05"/>
          </pattern>

          {/* Soft vignette */}
          <radialGradient id="vignette" cx="50%" cy="35%" r="85%">
            <stop offset="0" stopColor="#000000" stopOpacity="0"/>
            <stop offset="1" stopColor="#000000" stopOpacity="0.35"/>
          </radialGradient>

          {/* Reusable star */}
          <symbol id="star" viewBox="0 0 10 10">
            <circle cx="5" cy="5" r="1.2" fill="#FFFFFF" opacity="0.9"/>
          </symbol>
        </defs>

        {/* Background sky */}
        <rect width="1080" height="1920" fill="url(#sky)"/>

        {/* Stars (few + scattered to stay light) */}
        <g opacity="0.85">
          <use href="#star" x="120" y="140"/>
          <use href="#star" x="260" y="220" opacity="0.6"/>
          <use href="#star" x="890" y="180" opacity="0.7"/>
          <use href="#star" x="720" y="320" opacity="0.55"/>
          <use href="#star" x="560" y="120" opacity="0.75"/>
          <use href="#star" x="410" y="360" opacity="0.55"/>
          <use href="#star" x="980" y="420" opacity="0.6"/>
          <use href="#star" x="80" y="420" opacity="0.55"/>
        </g>

        {/* Dust / tiny particles */}
        <rect width="1080" height="980" fill="url(#dust)" opacity="1"/>

        {/* Distant mountains (layer 1) */}
        <path d="M0,720
                C130,660 220,640 320,670
                C420,700 520,610 640,640
                C760,670 860,600 980,630
                C1040,645 1060,660 1080,670
                L1080,980 L0,980 Z"
              fill="#0A1326" opacity="0.95"/>

        {/* Distant haze */}
        <rect x="0" y="600" width="1080" height="520" fill="url(#haze)"/>

        {/* Mid mountains (layer 2) */}
        <path d="M0,900
                C150,840 260,870 360,845
                C460,820 560,760 660,810
                C760,860 850,820 960,840
                C1020,852 1055,870 1080,880
                L1080,1180 L0,1180 Z"
              fill="#0D1A2E"/>

        {/* Camp ground base */}
        <path d="M0,1120
                C220,1100 340,1160 520,1140
                C700,1120 820,1085 1080,1115
                L1080,1920 L0,1920 Z"
              fill="#0C0F14"/>

        {/* Mine entrance hill (right) */}
        <path d="M660,1120
                C760,1040 920,1030 1080,1080
                L1080,1520
                C930,1500 820,1460 720,1390
                C650,1340 620,1250 660,1120 Z"
              fill="#0B121C" opacity="0.95"/>

        {/* Mine entrance */}
        <g transform="translate(820,1210)">
          <path d="M0,190 C10,115 65,55 140,40
                  C215,55 270,115 280,190
                  L280,270 L0,270 Z"
                fill="#05070A"/>
          <path d="M22,200 C30,140 75,95 140,85
                  C205,95 250,140 258,200"
                fill="none" stroke="#1C2634" strokeWidth="10" opacity="0.55"/>
          {/* Wooden supports */}
          <g opacity="0.75">
            <rect x="28" y="205" width="18" height="70" fill="#2A2A2A"/>
            <rect x="234" y="205" width="18" height="70" fill="#2A2A2A"/>
            <rect x="40" y="215" width="210" height="12" fill="#2A2A2A"/>
          </g>
        </g>

        {/* Camp: tents + crates + tools (center-left) */}
        <g transform="translate(120,1230)">
          {/* Fire glow behind */}
          <circle cx="260" cy="270" r="190" fill="url(#fireGlow)"/>

          {/* Tent 1 */}
          <path d="M80,420 L220,200 L360,420 Z" fill="#121821"/>
          <path d="M220,200 L220,420" stroke="#222C3A" strokeWidth="10" opacity="0.7"/>
          <path d="M160,420 L220,320 L280,420" fill="#0E1218"/>

          {/* Tent 2 (small) */}
          <path d="M420,430 L520,270 L620,430 Z" fill="#0F141C" opacity="0.95"/>
          <path d="M520,270 L520,430" stroke="#202A37" strokeWidth="8" opacity="0.7"/>

          {/* Crates */}
          <g opacity="0.9">
            <rect x="40" y="470" width="90" height="60" rx="6" fill="#151A22"/>
            <rect x="145" y="465" width="110" height="70" rx="6" fill="#111720"/>
            <path d="M50,500 H120" stroke="#2A3546" strokeWidth="8" opacity="0.5"/>
            <path d="M160,500 H245" stroke="#2A3546" strokeWidth="8" opacity="0.5"/>
          </g>

          {/* Tools: pickaxe + shovel (simple silhouettes) */}
          <g transform="translate(700,360)" opacity="0.9">
            {/* Pickaxe */}
            <rect x="0" y="0" width="16" height="170" rx="8" fill="#0C0F14"/>
            <path d="M-40,40 C-10,15 30,15 60,40" fill="none" stroke="#0C0F14" strokeWidth="18" strokeLinecap="round"/>
            {/* Shovel */}
            <rect x="60" y="10" width="14" height="155" rx="7" fill="#0C0F14" opacity="0.95"/>
            <path d="M48,165 Q67,190 86,165 L86,150 Q67,140 48,150 Z" fill="#0C0F14"/>
          </g>

          {/* Campfire */}
          <g transform="translate(240,320)">
            <circle cx="0" cy="120" r="36" fill="#0A0C10" opacity="0.9"/>
            <path d="M-36,120 Q0,80 36,120" fill="none" stroke="#202A37" strokeWidth="10" opacity="0.7"/>
            <path d="M-18,120 Q0,95 18,120" fill="none" stroke="#202A37" strokeWidth="8" opacity="0.7"/>

            <path d="M0,40
                    C-18,58 -12,86 0,96
                    C12,86 18,58 0,40 Z"
                  fill="#FFB000" opacity="0.95"/>
            <path d="M0,58
                    C-10,70 -6,86 0,92
                    C6,86 10,70 0,58 Z"
                  fill="#FF6A00" opacity="0.9"/>
          </g>

          {/* Miners silhouettes (3) */}
          <g transform="translate(420,520)" fill="#0A0C10" opacity="0.95">
            {/* Miner 1 */}
            <g transform="translate(0,0)">
              <circle cx="0" cy="-55" r="18"/>
              <rect x="-12" y="-40" width="24" height="58" rx="10"/>
              <rect x="-26" y="-20" width="14" height="44" rx="7"/>
              <rect x="12" y="-20" width="14" height="44" rx="7"/>
              <rect x="-20" y="14" width="16" height="46" rx="8"/>
              <rect x="4" y="14" width="16" height="46" rx="8"/>
              {/* Helmet lamp */}
              <circle cx="10" cy="-60" r="6" fill="#FFB000" opacity="0.75"/>
            </g>
            {/* Miner 2 (with pickaxe) */}
            <g transform="translate(90,10)">
              <circle cx="0" cy="-55" r="18"/>
              <rect x="-12" y="-40" width="24" height="58" rx="10"/>
              <rect x="-26" y="-18" width="14" height="42" rx="7"/>
              <rect x="12" y="-18" width="14" height="42" rx="7"/>
              <rect x="-20" y="14" width="16" height="46" rx="8"/>
              <rect x="4" y="14" width="16" height="46" rx="8"/>
              <path d="M32,-50 L80,-90" stroke="#0A0C10" strokeWidth="12" strokeLinecap="round"/>
              <path d="M68,-100 C58,-112 72,-112 84,-100" fill="none" stroke="#0A0C10" strokeWidth="12" strokeLinecap="round"/>
            </g>
            {/* Miner 3 */}
            <g transform="translate(175,0)" opacity="0.9">
              <circle cx="0" cy="-55" r="18"/>
              <rect x="-12" y="-40" width="24" height="58" rx="10"/>
              <rect x="-26" y="-18" width="14" height="42" rx="7"/>
              <rect x="12" y="-18" width="14" height="42" rx="7"/>
              <rect x="-20" y="14" width="16" height="46" rx="8"/>
              <rect x="4" y="14" width="16" height="46" rx="8"/>
              <circle cx="-8" cy="-62" r="6" fill="#FFB000" opacity="0.7"/>
            </g>
          </g>
        </g>

        {/* Foreground ridge to anchor bottom */}
        <path d="M0,1540
                C200,1500 360,1600 560,1560
                C760,1520 900,1460 1080,1500
                L1080,1920 L0,1920 Z"
              fill="#07090D" opacity="0.98"/>

        {/* Vignette */}
        <rect width="1080" height="1920" fill="url(#vignette)"/>
      </svg>
    </div>
  );
};

export default MiningBackground;
