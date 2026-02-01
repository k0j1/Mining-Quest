
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
    if (name.length > 16) return 'text-lg tracking-tight';
    if (name.length > 12) return 'text-xl tracking-normal';
    return 'text-2xl tracking-wide';
  };
  const nameSizeClass = getNameStyles(hero.name);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm relative flex flex-col max-h-[90vh]">
        
        {/* Card Container */}
        <div className={`bg-slate-900 rounded-[2rem] border-2 overflow-hidden shadow-2xl relative ${rarityColors[hero.rarity].split(' ')[1]} ${rarityGlow[hero.rarity]}`}>
            
            <button 
                onClick={() => { playClick(); onClose(); }}
                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/80 text-white border border-slate-700 hover:bg-slate-800"
            >
                ✕
            </button>

            {/* Hero Image Area */}
            <div className="relative aspect-[4/5] w-full bg-slate-950">
                <img 
                    src={hero.imageUrl.replace('_s.png', '.png').replace('/s/', '/l/')} 
                    onError={(e) => {
                        e.currentTarget.src = hero.imageUrl;
                    }}
                    alt={hero.name} 
                    className="w-full h-full object-contain"
                />
                
                {/* Subtle gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-90"></div>
                
                {/* Name Overlay - Centered at bottom to fit text box frame */}
                <div className="absolute bottom-[12%] left-2 right-2 flex flex-col items-center justify-end z-10 pointer-events-none">
                    <h2 className={`${nameSizeClass} font-black text-white font-orbitron drop-shadow-[0_2px_3px_rgba(0,0,0,1)] text-center w-full leading-none`}>
                        {hero.name}
                    </h2>
                </div>

                {/* Species Badge - Bottom Right */}
                <div className="absolute bottom-3 right-3 z-10">
                    <span className="text-[9px] font-bold text-slate-300/80 uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded border border-white/10 backdrop-blur-[2px]">
                        {hero.species}
                    </span>
                </div>
            </div>

            {/* Details Section */}
            <div className="p-6 pt-2 space-y-5 bg-slate-900">
                
                {/* Status Row */}
                <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm">❤️</span>
                            <span className={`text-base font-black ${hero.hp < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                HP {hero.hp}/{hero.maxHp}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Skill */}
                <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                        Skill
                    </h3>
                    <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-xl">
                        <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                            {hero.trait || "No special skill."}
                        </p>
                    </div>
                </div>

                {/* Equipment Status */}
                <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                        Equipment
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {/* Pickaxe */}
                        <div className={`p-2 rounded-xl border flex flex-col items-center text-center ${pickaxe ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-800 border-dashed'}`}>
                            <span className="text-xl mb-1">⛏️</span>
                            {pickaxe ? (
                                <>
                                    <span className="text-[9px] text-white font-bold truncate w-full">{pickaxe.name}</span>
                                    <span className="text-[8px] text-amber-400 font-bold">+{pickaxe.bonus}%</span>
                                </>
                            ) : <span className="text-[9px] text-slate-600">None</span>}
                        </div>

                        {/* Helmet */}
                        <div className={`p-2 rounded-xl border flex flex-col items-center text-center ${helmet ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-800 border-dashed'}`}>
                            <span className="text-xl mb-1">🪖</span>
                            {helmet ? (
                                <>
                                    <span className="text-[9px] text-white font-bold truncate w-full">{helmet.name}</span>
                                    <span className="text-[8px] text-emerald-400 font-bold">-{helmet.bonus}%</span>
                                </>
                            ) : <span className="text-[9px] text-slate-600">None</span>}
                        </div>

                        {/* Boots */}
                        <div className={`p-2 rounded-xl border flex flex-col items-center text-center ${boots ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-800 border-dashed'}`}>
                            <span className="text-xl mb-1">👢</span>
                            {boots ? (
                                <>
                                    <span className="text-[9px] text-white font-bold truncate w-full">{boots.name}</span>
                                    <span className="text-[8px] text-blue-400 font-bold">+{boots.bonus}%</span>
                                </>
                            ) : <span className="text-[9px] text-slate-600">None</span>}
                        </div>
                    </div>
                </div>

            </div>
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
