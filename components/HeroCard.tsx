
import React from 'react';
import { Hero } from '../types';

interface HeroCardProps {
  hero: Hero;
  index: number;
  compact?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onEquipClick?: (heroId: string, slotIndex: number) => void;
  isMainSlot?: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({ 
  hero, 
  index, 
  compact, 
  isSelected,
  onClick,
  onEquipClick,
  isMainSlot
}) => {
  const rarityColors = {
    Common: 'bg-slate-500',
    Rare: 'bg-blue-600',
    Epic: 'bg-purple-600',
    Legendary: 'bg-amber-500'
  };

  const rarityBorders = {
    Common: 'border-slate-500/50',
    Rare: 'border-blue-500/50',
    Epic: 'border-purple-500/50',
    Legendary: 'border-amber-500/50'
  };

  const slots = [0, 1, 2];

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center space-x-2 p-2 glass-panel rounded-lg transition-all cursor-pointer ${
          isSelected 
            ? 'border-indigo-400 bg-indigo-500/20 ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
            : 'border-slate-800'
        } active:scale-95`}
      >
        <div className="relative flex-shrink-0">
          <img src={hero.imageUrl} className="w-10 h-10 rounded-lg border border-indigo-400/30 object-cover" alt={hero.name} />
          <div className={`absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${rarityColors[hero.rarity]}`}></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <p className="font-bold text-[9px] truncate text-slate-200">{hero.name}</p>
            <div className="flex space-x-0.5">
               {slots.map(i => (
                 <div key={i} className={`w-1.5 h-1.5 rounded-full ${hero.equipmentIds[i] ? 'bg-indigo-400' : 'bg-slate-700'}`}></div>
               ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-slate-300">HP:{hero.hp}</span>
            <div className="flex-1 bg-slate-800 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`relative group transition-all duration-300 cursor-pointer ${
        isSelected ? 'scale-105 z-30' : 'scale-100 z-10'
      } active:scale-95`}
    >
      {/* Selection Glow */}
      {isSelected && (
        <div className="absolute -inset-1.5 bg-indigo-500/50 blur-xl animate-pulse rounded-3xl" />
      )}

      {/* Square Main Card Container */}
      <div className={`relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
        isSelected 
          ? 'border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.8)]' 
          : `${rarityBorders[hero.rarity]} glass-panel`
      }`}>
        <img src={hero.imageUrl} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110' : 'scale-100'}`} alt={hero.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90"></div>

        <div className="absolute top-1 left-1 flex flex-col gap-0.5 items-start z-20">
          <span className={`text-[6px] font-black px-1 py-0.5 rounded shadow-lg text-white uppercase tracking-tighter ${rarityColors[hero.rarity]}`}>
            {hero.rarity.substring(0, 1)}
          </span>
          <span className="bg-slate-900/80 backdrop-blur-md px-1 py-0.5 rounded text-[6px] font-bold font-orbitron text-indigo-300 border border-indigo-500/30">
            L.{hero.level}
          </span>
        </div>

        <div className="absolute bottom-1.5 left-1.5 right-1.5 z-20">
          <h3 className="text-[7px] sm:text-[9px] font-orbitron font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate mb-0.5">
            {hero.name}
          </h3>
          <div className="flex justify-between items-center space-x-1">
            <span className="text-[6px] sm:text-[8px] font-mono font-black text-white/80 shrink-0">
              {hero.hp}
            </span>
            <div className="flex-1 bg-slate-900/60 h-0.5 sm:h-1 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-red-500 to-green-500 h-full"
                style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Slots - Scaled down for 3-col */}
      <div className="absolute -bottom-1 -right-1 flex gap-0.5 z-40">
        {slots.map(i => (
          <button 
            key={i} 
            onClick={(e) => {
              e.stopPropagation();
              if (onEquipClick) onEquipClick(hero.id, i);
            }}
            className={`w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border flex items-center justify-center shadow-lg transition-all duration-300 ${
              hero.equipmentIds[i] 
                ? 'bg-indigo-600 border-indigo-300 text-[8px] sm:text-xs' 
                : 'bg-slate-900/90 border-slate-700/50 border-dashed text-[8px] sm:text-xs text-slate-500 backdrop-blur-sm'
            } active:scale-90`}
          >
            {hero.equipmentIds[i] ? '⚒️' : '+'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroCard;
