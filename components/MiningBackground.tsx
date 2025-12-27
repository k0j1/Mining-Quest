
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
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#4f46e5" strokeWidth="0.5" opacity="0.15"/>
          </pattern>
          <linearGradient id="deepGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#020617"/>
            <stop offset="1" stopColor="#0f172a"/>
          </linearGradient>
          <radialGradient id="highlightGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#4338ca" stopOpacity="0.15"/>
            <stop offset="1" stopColor="#020617" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Base Dark Background */}
        <rect width="1080" height="1920" fill="url(#deepGrad)"/>

        {/* Technical Grid Overlay */}
        <rect width="1080" height="1920" fill="url(#grid)"/>

        {/* Center Atmospheric Glow */}
        <circle cx="540" cy="800" r="900" fill="url(#highlightGlow)"/>

        {/* Floating Cybernetic Elements */}
        <g opacity="0.1">
           <circle cx="950" cy="300" r="250" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="10 20"/>
           <rect x="50" y="1600" width="300" height="1" fill="#6366f1"/>
           <rect x="50" y="1610" width="150" height="1" fill="#6366f1"/>
           <path d="M1000,1000 L1080,1000 M1000,1010 L1040,1010" stroke="#6366f1" strokeWidth="1"/>
        </g>
      </svg>
    </div>
  );
};

export default MiningBackground;
