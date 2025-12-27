
import React from 'react';
import { Hero } from '../types';

interface HeroCardProps {
  hero: Hero;
  index: number;
  compact?: boolean;
  isSelected?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
  onEquipClick?: (heroId: string, slotIndex: number) => void;
  isMainSlot?: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({ 
  hero, 
  index, 
  compact, 
  isSelected,
  isLocked,
  onClick,
  onEquipClick,
  isMainSlot
}) => {
  const rarityColors: Record<string, string> = {
    C: 'bg-zinc-500',
    UC: 'bg-emerald-500',
    R: 'bg-indigo-500',
    E: 'bg-fuchsia-600',
    L: 'bg-amber-500'
  };

  const rarityBorders: Record<string, string> = {
    C: 'border-zinc-500/30',
    UC: 'border-emerald-500/40',
    R: 'border-indigo-500/50',
    E: 'border-fuchsia-500/60',
    L: 'border-amber-400/70'
  };

  const rarityGlows: Record<string, string> = {
    C: 'shadow-[0_0_10px_rgba(113,113,122,0.2)]',
    UC: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    R: 'shadow-[0_0_20px_rgba(99,102,241,0.4)]',
    E: 'shadow-[0_0_25px_rgba(192,38,211,0.5)]',
    L: 'shadow-[0_0_35px_rgba(251,191,36,0.6)]'
  };

  const speciesIcon = {
    Dog: '🐕',
    Cat: '🐈',
    Bird: '🦅',
    Other: '🐾'
  };

  const slotIcons = ['⛏️', '🪖', '👢'];

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center space-x-3 p-3 glass-panel rounded-xl transition-all duration-300 relative overflow-hidden ${
          isLocked ? 'opacity-60 grayscale-[0.4] cursor-not-allowed' : 'cursor-pointer active:scale-95'
        } ${
          isSelected 
            ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' 
            : 'border-white/5'
        }`}
      >
        <div className="relative flex-shrink-0">
          <div className={`absolute -inset-1 rounded-lg opacity-40 blur-sm ${rarityColors[hero.rarity]}`}></div>
          <img src={hero.imageUrl} className="w-12 h-12 rounded-lg border border-white/20 object-cover relative z-10" alt={hero.name} />
          <div className="absolute -top-1 -left-1 w-4 h-4 flex items-center justify-center rounded-full bg-black/80 border border-white/20 text-[10px] z-20">
            {speciesIcon[hero.species]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="font-orbitron font-bold text-[10px] truncate text-white tracking-wide">{hero.name}</p>
            <span className={`text-[8px] font-black px-1 rounded ${rarityColors[hero.rarity]} text-white`}>{hero.rarity}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-mono font-bold text-slate-400">HP {hero.hp}</span>
            <div className="flex-1 bg-black/40 h-1 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-500 ${hero.hp < 30 ? 'bg-red-500' : 'bg-amber-500'}`} 
                style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[1px]">
            <span className="text-[9px] font-black text-amber-400 border border-amber-400/50 px-2 py-0.5 rounded bg-black/80">QUESTING</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`relative transition-all duration-500 ${
        isLocked ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
      } ${
        isSelected ? 'scale-105 z-30' : 'scale-100 z-10'
      }`}
    >
      <div className={`relative w-full aspect-[4/5] rounded-[1.5rem] overflow-hidden border-2 transition-all duration-500 shadow-2xl ${
        isSelected 
          ? 'border-amber-400 ring-2 ring-amber-400/30' 
          : `${rarityBorders[hero.rarity]} ${rarityGlows[hero.rarity]} glass-panel`
      }`}>
        <img src={hero.imageUrl} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ${isSelected ? 'scale-110' : 'scale-100'}`} alt={hero.name} />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 via-transparent to-amber-500/10"></div>

        {/* Hero Meta */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-20">
          <div className={`px-2 py-0.5 rounded border border-white/20 text-[8px] font-black text-white shadow-xl ${rarityColors[hero.rarity]}`}>
            {hero.rarity}
          </div>
          <div className="bg-black/60 backdrop-blur-md w-6 h-6 rounded flex items-center justify-center border border-white/10 text-xs shadow-lg">
            {speciesIcon[hero.species]}
          </div>
        </div>

        {/* Trait & Level */}
        <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
          <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-amber-400 border border-amber-400/20 shadow-lg">
            LV.{hero.level}
          </div>
          {hero.damageReduction > 0 && (
            <div className="bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[7px] font-black text-emerald-300 border border-emerald-500/30 shadow-lg">
              DEF +{hero.damageReduction}%
            </div>
          )}
        </div>

        {/* Hero Name & HP */}
        <div className="absolute bottom-12 left-3 right-3 z-20">
          <h3 className="text-sm font-orbitron font-black text-white mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] truncate">
            {hero.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/10 p-[1px]">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${hero.hp < 30 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`}
                style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-black text-white/90 drop-shadow-md">{hero.hp}</span>
          </div>
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="bg-amber-500 text-black font-black text-xs px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.5)] transform -rotate-3 animate-pulse">
              ON MISSION
            </div>
          </div>
        )}
      </div>

      {/* Equipment Slots - Moved to bottom-right as per request */}
      <div className="absolute -bottom-2 -right-1 flex gap-0.5 z-40 bg-black/90 backdrop-blur-xl p-0.5 rounded-lg border border-white/10 shadow-2xl">
        {[0, 1, 2].map(i => (
          <button 
            key={i} 
            onClick={(e) => {
              e.stopPropagation();
              onEquipClick && onEquipClick(hero.id, i);
            }}
            disabled={isLocked}
            className={`w-7 h-7 rounded border flex items-center justify-center transition-all duration-300 ${
              hero.equipmentIds[i] 
                ? 'bg-amber-500 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.4)] text-black' 
                : 'bg-white/5 border-white/10 border-dashed text-slate-500'
            } ${isLocked ? 'opacity-30' : 'hover:scale-110 active:scale-90'}`}
          >
            <span className={`text-[12px] ${hero.equipmentIds[i] ? 'opacity-100 scale-110' : 'opacity-30 grayscale'}`}>
               {slotIcons[i]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroCard;
