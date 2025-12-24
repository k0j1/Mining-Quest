
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
    C: 'bg-slate-500',
    UC: 'bg-emerald-500',
    R: 'bg-blue-600',
    E: 'bg-purple-600',
    L: 'bg-amber-500'
  };

  const rarityBorders: Record<string, string> = {
    C: 'border-slate-500/50',
    UC: 'border-emerald-500/50',
    R: 'border-blue-500/50',
    E: 'border-purple-500/50',
    L: 'border-amber-500/50'
  };

  const speciesIcon = {
    Dog: '🐕',
    Cat: '🐈',
    Bird: '🦅',
    Other: '🐾'
  };

  // Fixed slot types: 0=Pickaxe, 1=Helmet, 2=Boots
  const slotIcons = ['⛏️', '🪖', '👢'];

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) return;
    if (onClick) onClick();
  };

  const handleEquipClick = (heroId: string, i: number) => {
    if (isLocked) return;
    if (onEquipClick) onEquipClick(heroId, i);
  };

  if (compact) {
    return (
      <div 
        onClick={handleClick}
        className={`flex items-center space-x-2 p-2 glass-panel rounded-lg transition-all ${
          isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer active:scale-95'
        } ${
          isSelected 
            ? 'border-indigo-400 bg-indigo-500/20 ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
            : 'border-slate-800'
        }`}
      >
        <div className="relative flex-shrink-0">
          <img src={hero.imageUrl} className="w-10 h-10 rounded-lg border border-indigo-400/30 object-cover" alt={hero.name} />
          <div className={`absolute -top-1 -left-1 w-3 h-3 flex items-center justify-center rounded-full bg-slate-900 border border-white shadow-sm text-[8px]`}>
            {speciesIcon[hero.species] || '🐾'}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${rarityColors[hero.rarity] || rarityColors.C}`}></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <p className="font-bold text-[9px] truncate text-slate-200">{hero.name}</p>
            <div className="flex space-x-0.5">
               {[0, 1, 2].map(i => (
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
          {hero.damageReduction > 0 && (
             <p className="text-[8px] text-green-400 mt-0.5">🛡️{hero.trait} (-{hero.damageReduction}%)</p>
          )}
        </div>
        {isLocked && (
          <div className="absolute inset-0 bg-slate-950/60 rounded-lg flex items-center justify-center z-50">
            <span className="text-[8px] font-black text-white bg-slate-800 px-1 py-0.5 rounded border border-slate-600">DEPLOYED</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className={`relative group transition-all duration-300 ${
        isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-95'
      } ${
        isSelected ? 'scale-105 z-30' : 'scale-100 z-10'
      }`}
    >
      {/* Selection Glow */}
      {isSelected && (
        <div className="absolute -inset-1.5 bg-indigo-500/50 blur-xl animate-pulse rounded-3xl" />
      )}

      {/* Square Main Card Container */}
      <div className={`relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
        isSelected 
          ? 'border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.8)]' 
          : `${rarityBorders[hero.rarity] || rarityBorders.C} glass-panel`
      }`}>
        <img src={hero.imageUrl} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${isSelected && !isLocked ? 'scale-110' : 'scale-100'} ${isLocked ? 'grayscale-[0.5]' : ''}`} alt={hero.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90"></div>

        <div className="absolute top-1 left-1 flex flex-col gap-0.5 items-start z-20">
          <span className={`text-[6px] font-black px-1 py-0.5 rounded shadow-lg text-white uppercase tracking-tighter ${rarityColors[hero.rarity] || rarityColors.C}`}>
            {hero.rarity}
          </span>
          <span className="bg-slate-900/80 backdrop-blur-md px-1 py-0.5 rounded text-[8px] font-bold border border-white/20">
            {speciesIcon[hero.species] || '🐾'}
          </span>
        </div>

        {/* Trait Badge */}
        {hero.damageReduction > 0 && (
          <div className="absolute top-1 right-1 z-20">
            <span className="bg-green-900/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[6px] font-bold text-green-300 border border-green-500/30 flex items-center shadow-lg">
              🛡️ -{hero.damageReduction}%
            </span>
          </div>
        )}

        {/* Hero Info - Moved UP to avoid overlap with large equipment slots */}
        <div className="absolute bottom-11 left-1.5 right-1.5 z-20 bg-slate-950/30 p-1 rounded-lg backdrop-blur-[2px]">
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

        {/* LOCKED Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/50 z-30 flex flex-col items-center justify-center backdrop-blur-[1px]">
            <div className="bg-yellow-500/90 text-slate-900 font-black text-[10px] sm:text-xs px-2 py-1 rounded border-2 border-slate-900 shadow-xl transform -rotate-12 animate-pulse">
              DEPLOYED
            </div>
          </div>
        )}
      </div>

      {/* Equipment Slots */}
      <div className="absolute -bottom-2 -right-1 flex gap-0.5 z-40">
        {[0, 1, 2].map(i => (
          <button 
            key={i} 
            onClick={(e) => {
              e.stopPropagation();
              handleEquipClick(hero.id, i);
            }}
            disabled={isLocked}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center shadow-lg transition-all duration-300 ${
              hero.equipmentIds[i] 
                ? 'bg-indigo-600 border-indigo-300 text-sm sm:text-base' 
                : 'bg-slate-900/90 border-slate-700/50 border-dashed text-xs sm:text-sm text-slate-500 backdrop-blur-sm'
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
          >
            {/* Show Equipment Type Icon always, opaque if empty, bright if equipped */}
            <span className={hero.equipmentIds[i] ? 'opacity-100' : 'opacity-40 grayscale'}>
               {slotIcons[i]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroCard;
