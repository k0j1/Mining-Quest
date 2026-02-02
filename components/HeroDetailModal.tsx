
import React from 'react';
import { Hero, Equipment } from '../types';
import { playClick } from '../utils/sound';

interface HeroDetailModalProps {
  hero: Hero;
  equipment: Equipment[];
  onClose: () => void;
}

const HeroDetailModal: React.FC<HeroDetailModalProps> = ({ hero, equipment, onClose }) => {
  
  // Find equipped items
  const pickaxe = hero.equipmentIds[0] ? equipment.find(e => e.id === hero.equipmentIds[0]) : null;
  const helmet = hero.equipmentIds[1] ? equipment.find(e => e.id === hero.equipmentIds[1]) : null;
  const boots = hero.equipmentIds[2] ? equipment.find(e => e.id === hero.equipmentIds[2]) : null;

  const rarityColors: Record<string, string> = {
    C: 'text-slate-400 border-slate-600 bg-slate-800',
    UC: 'text-emerald-400 border-emerald-600 bg-emerald-900/40',
    R: 'text-indigo-400 border-indigo-600 bg-indigo-900/40',
    E: 'text-fuchsia-400 border-fuchsia-600 bg-fuchsia-900/40',
    L: 'text-amber-400 border-amber-600 bg-amber-900/40'
  };

  const rarityGlow: Record<string, string> = {
    C: 'shadow-slate-500/20',
    UC: 'shadow-emerald-500/40',
    R: 'shadow-indigo-500/40',
    E: 'shadow-fuchsia-500/50',
    L: 'shadow-amber-500/60'
  };

  // Dynamic Font Size logic for Modal
  const getNameStyles = (name: string) => {
    if (name.length > 16) return 'text-base tracking-tight';
    if (name.length > 12) return 'text-lg tracking-normal';
    return 'text-xl tracking-wide';
  };
  const nameSizeClass = getNameStyles(hero.name);

  return (
    // pb-28 added to lift the modal above the bottom navigation bar
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 pb-28 animate-fade-in">
      
      {/* Card Container - Reduced width (max-w-[320px]) and constraint height */}
      <div className={`w-full max-w-[320px] relative flex flex-col max-h-[65vh] bg-slate-900 rounded-[2rem] border-2 overflow-hidden shadow-2xl ${rarityColors[hero.rarity].split(' ')[1]} ${rarityGlow[hero.rarity]}`}>
            
            <button 
                onClick={() => { playClick(); onClose(); }}
                className="absolute top-3 right-3 z-30 w-7 h-7 flex items-center justify-center rounded-full bg-slate-900/80 text-white border border-slate-700 hover:bg-slate-800"
            >
                ✕
            </button>

            {/* Hero Image Area - Fixed Height (h-40 = 160px) for compact view */}
            <div className="relative h-40 w-full bg-slate-950 shrink-0 border-b border-white/5">
                <img 
                    src={hero.imageUrl.replace('_s.png', '.png').replace('/s/', '/l/')} 
                    onError={(e) => {
                        e.currentTarget.src = hero.imageUrl;
                    }}
                    alt={hero.name} 
                    className="w-full h-full object-contain mt-2"
                />
                
                {/* Gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none opacity-90"></div>
                
                {/* Name Overlay - Positioned at bottom */}
                <div className="absolute bottom-2 left-2 right-2 flex flex-col items-center justify-end z-10 pointer-events-none">
                    <h2 className={`${nameSizeClass} font-black text-white font-orbitron drop-shadow-[0_2px_3px_rgba(0,0,0,1)] text-center w-full leading-none`}>
                        {hero.name}
                    </h2>
                </div>

                {/* Species Badge - Moved to Top Left to avoid name overlap */}
                <div className="absolute top-3 left-3 z-10">
                    <span className="text-[9px] font-bold text-slate-300/80 uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded border border-white/10 backdrop-blur-[2px]">
                        {hero.species}
                    </span>
                </div>
            </div>

            {/* Details Section - Compact padding */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900 custom-scrollbar">
                
                {/* Status Row */}
                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm">❤️</span>
                            <span className={`text-sm font-black ${hero.hp < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                HP {hero.hp}/{hero.maxHp}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Skill */}
                <div>
                    <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center">
                        <span className="w-1 h-1 bg-indigo-500 rounded-full mr-2"></span>
                        Skill
                    </h3>
                    <div className="bg-indigo-900/20 border border-indigo-500/30 p-2.5 rounded-xl">
                        <p className="text-[10px] text-indigo-100 leading-relaxed font-medium">
                            {hero.trait || "No special skill."}
                        </p>
                    </div>
                </div>

                {/* Equipment Status */}
                <div>
                    <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center">
                        <span className="w-1 h-1 bg-amber-500 rounded-full mr-2"></span>
                        Equipment
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5">
                        {/* Pickaxe */}
                        <div className={`p-1.5 rounded-lg border flex flex-col items-center text-center ${pickaxe ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-800 border-dashed'}`}>
                            <span className="text-base mb-0.5">⛏️</span>
                            {pickaxe ? (
                                <>
                                    <span className="text-[8px] text-white font-bold truncate w-full">{pickaxe.name}</span>
                                    <span className="text-[7px] text-amber-400 font-bold">+{pickaxe.bonus}%</span>
                                </>
                            ) : <span className="text-[8px] text-slate-600">None</span>}
                        </div>

                        {/* Helmet */}
                        <div className={`p-1.5 rounded-lg border flex flex-col items-center text-center ${helmet ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-800 border-dashed'}`}>
                            <span className="text-base mb-0.5">🪖</span>
                            {helmet ? (
                                <>
                                    <span className="text-[8px] text-white font-bold truncate w-full">{helmet.name}</span>
                                    <span className="text-[7px] text-emerald-400 font-bold">-{helmet.bonus}%</span>
                                </>
                            ) : <span className="text-[8px] text-slate-600">None</span>}
                        </div>

                        {/* Boots */}
                        <div className={`p-1.5 rounded-lg border flex flex-col items-center text-center ${boots ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-800 border-dashed'}`}>
                            <span className="text-base mb-0.5">👢</span>
                            {boots ? (
                                <>
                                    <span className="text-[8px] text-white font-bold truncate w-full">{boots.name}</span>
                                    <span className="text-[7px] text-blue-400 font-bold">+{boots.bonus}%</span>
                                </>
                            ) : <span className="text-[8px] text-slate-600">None</span>}
                        </div>
                    </div>
                </div>
                
                {/* Bottom spacer for safe scrolling */}
                <div className="h-1"></div>
            </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default HeroDetailModal;
