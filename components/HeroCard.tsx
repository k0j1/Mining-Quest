
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
    C: 'bg-slate-600 text-slate-100',
    UC: 'bg-emerald-600 text-emerald-50',
    R: 'bg-indigo-600 text-indigo-50',
    E: 'bg-fuchsia-600 text-fuchsia-50',
    L: 'bg-amber-600 text-amber-50'
  };

  const rarityBorders: Record<string, string> = {
    C: 'border-slate-600',
    UC: 'border-emerald-600',
    R: 'border-indigo-600',
    E: 'border-fuchsia-600',
    L: 'border-amber-600'
  };

  const slotIcons = ['⛏️', '🪖', '👢'];

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center space-x-3 p-3 bg-slate-800 rounded-xl border transition-all duration-200 relative overflow-hidden ${
          isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-750'
        } ${
          isSelected 
            ? 'border-amber-500 ring-1 ring-amber-500' 
            : 'border-slate-700'
        }`}
      >
        <div className="relative flex-shrink-0">
          <img src={hero.imageUrl} className="w-12 h-12 rounded-lg object-cover relative z-10" alt={hero.name} />
          {/* Rarity Badge (replaced Species Icon) */}
          <div className={`absolute -top-1.5 -left-1.5 w-6 h-6 flex items-center justify-center rounded-lg border-2 border-slate-900 text-[9px] font-black z-20 shadow-sm transform -rotate-6 ${rarityColors[hero.rarity]}`}>
            {hero.rarity}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="font-bold text-xs truncate text-slate-200">{hero.name}</p>
            {/* Redundant rarity badge removed */}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500">HP {hero.hp}</span>
            <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full ${hero.hp < 30 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>
        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-50">
            <span className="text-[10px] font-bold text-white bg-slate-800 px-2 py-1 rounded border border-slate-600">QUESTING</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`relative transition-all duration-300 ${
        isLocked ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
      } ${
        isSelected ? 'scale-105 z-30' : 'scale-100 z-10'
      }`}
    >
      {/* Rarity Badge - Top Left Overlapping Border */}
      <div className={`absolute -top-2 -left-2 z-40 w-8 h-8 flex items-center justify-center rounded-lg border-2 border-slate-900 shadow-lg ${rarityColors[hero.rarity]} transform -rotate-6`}>
         <span className="text-xs font-black">{hero.rarity}</span>
      </div>

      <div className={`relative w-full aspect-[4/5] rounded-2xl overflow-hidden border-2 bg-slate-800 transition-all ${
        isSelected 
          ? 'border-amber-400 shadow-lg shadow-amber-900/20' 
          : `${rarityBorders[hero.rarity]} border-opacity-50`
      }`}>
        <img src={hero.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt={hero.name} />
        
        {/* Simple Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>

        {/* Hero Name & HP - Positioned to fit above equipment slots */}
        <div className="absolute bottom-8 left-2 right-2 z-20">
          <div className="flex flex-col gap-1">
            {/* HP Bar */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className={`h-full rounded-full ${hero.hp < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-white/90 drop-shadow-md">{hero.hp}</span>
            </div>

            {/* Name */}
            <div className="bg-slate-900/40 rounded px-1.5 py-0.5 backdrop-blur-[1px] inline-block max-w-full">
              <p className="text-[8px] font-bold text-white truncate tracking-tight text-center">
                {hero.name}
              </p>
            </div>
          </div>
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/70 z-30 flex flex-col items-center justify-center">
            <div className="bg-amber-500 text-white font-bold text-[10px] px-4 py-1.5 rounded-full transform -rotate-3 shadow-md tracking-wider">
              ON MISSION
            </div>
          </div>
        )}
      </div>

      {/* Equipment Slots */}
      <div className="absolute -bottom-2 -right-1 flex gap-1 z-40 bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-md">
        {[0, 1, 2].map(i => (
          <button 
            key={i} 
            onClick={(e) => {
              e.stopPropagation();
              onEquipClick && onEquipClick(hero.id, i);
            }}
            disabled={isLocked}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
              hero.equipmentIds[i] 
                ? 'bg-amber-100 border border-amber-300' 
                : 'bg-slate-700/50 border border-slate-600 border-dashed'
            }`}
          >
            <span className={`text-[10px] ${hero.equipmentIds[i] ? 'opacity-100' : 'opacity-30 grayscale'}`}>
               {slotIcons[i]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroCard;
