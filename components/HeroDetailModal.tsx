
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
            <div className="relative aspect-[4/5] w-full bg-slate-800">
                <img 
                    src={hero.imageUrl.replace('_s.png', '.png').replace('/s/', '/l/')} // Try to use L size if available logic exists, else fallback works due to CSS
                    onError={(e) => {
                        // Fallback to small image if large fails or logic is complex
                        e.currentTarget.src = hero.imageUrl;
                    }}
                    alt={hero.name} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
                
                {/* Name & Basic Stats Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pt-12">
                    <h2 className="text-2xl font-black text-white font-orbitron drop-shadow-md leading-none mb-2">{hero.name}</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 backdrop-blur-sm">
                            <span className="text-xs">❤️</span>
                            <span className={`text-sm font-bold ${hero.hp < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                HP {hero.hp}/{hero.maxHp}
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{hero.species}</span>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="p-6 pt-2 space-y-5 bg-slate-900">
                
                {/* Trait / Ability */}
                <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                        Unique Trait
                    </h3>
                    <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-xl">
                        <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                            {hero.trait || "No special trait."}
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
