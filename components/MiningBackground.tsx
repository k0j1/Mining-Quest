
import React from 'react';

const MiningBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none -z-10">
      <div className="absolute inset-0 bg-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 opacity-80"></div>
    </div>
  );
};

export default MiningBackground;
