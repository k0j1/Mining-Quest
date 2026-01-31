
import React, { useState, useEffect } from 'react';
import { Hero, Equipment } from '../types';

interface HeroCardProps {
  hero: Hero;
  index: number;
  compact?: boolean;
  isSelected?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
  onEquipClick?: (heroId: string, slotIndex: number) => void;
  isMainSlot?: boolean;
  equipment?: Equipment[];
}

const HeroCard: React.FC<HeroCardProps> = ({ 
  hero, 
  index, 
  compact, 
  isSelected,
  isLocked,
  onClick,
  onEquipClick,
  isMainSlot,
  equipment
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when hero changes
  useEffect(() => {
    setHasError(false);
  }, [hero.imageUrl]);

  const handleImageError = () => {
    setHasError(true);
  };

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

  // Calculate Total Damage Reduction (Skill + Helmet)
  // ヒーロー自身の基礎値(damageReduction)は0として扱い、特性(スキル)と装備品のみで計算
  const helmetId = hero.equipmentIds[1];
  const helmetBonus = (helmetId && equipment) 
    ? (equipment.find(e => e.id === helmetId)?.bonus || 0) 
    : 0;
  const skillBonus = hero.skillDamage || 0;
  const totalDamageReduction = skillBonus + helmetBonus;

  // Error Placeholder Component
  const ErrorPlaceholder = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-500 z-20">
      <span className="text-2xl mb-1 opacity-50">⚠️</span>
      <span className="text-[8px] font-bold opacity-70">NO IMAGE</span>
    </div>
  );

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center space-x-3 p-3 bg-slate-800 rounded-xl border transition-all duration-200 relative ${
          isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-750'
        } ${
          isSelected 
            ? 'border-amber-500 ring-1 ring-amber-500' 
            : 'border-slate-700'
        }`}
      >
        <div className="relative flex-shrink-0 w-12 h-12">
          {/* Badge */}
          <div className={`absolute -top-1.5 -left-1.5 w-6 h-6 flex items-center justify-center rounded-lg border-2 border-slate-900 text-[9px] font-black z-30 shadow-sm transform -rotate-6 ${rarityColors[hero.rarity]}`}>
            {hero.rarity}
          </div>
          
          <div className="w-full h-full rounded-lg bg-slate-900 border border-slate-700 overflow-hidden relative z-10">
            {hasError ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <span className="text-xs">⚠️</span>
                </div>
            ) : (
                <img 
                src={hero.imageUrl} 
                className="w-full h-full object-cover" 
                alt={hero.name} 
                onError={handleImageError}
                />
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="font-bold text-xs truncate text-slate-200">{hero.name}</p>
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
          <div className="absolute inset-0 bg-slate-900/60 rounded-xl flex items-center justify-center z-50">
            <span className="text-[10px] font-bold text-white bg-slate-800 px-2 py-1 rounded border border-slate-600">QUESTING</span>
          </div>
        )}
      </div>
    );
  }

  // Standard Card Layout (Modified for separated equipment slots)
  return (
    <div 
      onClick={onClick}
      className={`relative transition-all duration-300 group ${
        isLocked ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
      } ${
        isSelected ? 'scale-105 z-30' : 'scale-100 z-10'
      }`}
    >
      {/* Container with Border - Aspect Ratio changed to accommodate equipment slots below image */}
      <div className={`relative w-full aspect-[4/5.5] flex flex-col rounded-2xl overflow-hidden border-2 bg-slate-900 transition-all ${
        isSelected 
          ? 'border-amber-400 shadow-lg shadow-amber-900/20' 
          : `${rarityBorders[hero.rarity]} border-opacity-60`
      }`}>
        
        {/* Top: Image Area (Flex grow) */}
        <div className="relative flex-1 w-full overflow-hidden bg-slate-800">
           {/* Rarity Badge Removed Here */}

           {hasError ? (
             <ErrorPlaceholder />
           ) : (
             <img 
               src={hero.imageUrl} 
               className="w-full h-full object-cover" 
               alt={hero.name} 
               onError={handleImageError}
             />
           )}
           
           {/* Gradient for Text Visibility */}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 z-10 pointer-events-none"></div>

           {/* Name & HP Overlay at bottom of Image Area */}
           <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none">
              <div className="flex items-center justify-between gap-1 mb-1">
                 {/* Name: Truncate with min-w-0 to force shrinking */}
                 <span className="text-[9px] font-bold text-white bg-slate-900/60 px-1.5 py-0.5 rounded truncate min-w-0 flex-1 backdrop-blur-sm border border-white/10">
                   {hero.name}
                 </span>
                 
                 {/* Right Side Info: Flex row for DR and HP, shrink-0 to prevent wrapping/shrinking */}
                 <div className="flex items-center gap-1 shrink-0">
                    {/* Damage Reduction Badge */}
                    {totalDamageReduction > 0 && (
                        <span className="text-[8px] font-bold text-indigo-300 bg-indigo-900/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-indigo-500/30">
                            🛡️-{totalDamageReduction}%
                        </span>
                    )}
                    {/* HP Badge */}
                    <span className={`text-[8px] font-black bg-slate-900/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10 whitespace-nowrap ${hero.hp < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    HP {hero.hp}
                    </span>
                 </div>
              </div>
              {/* HP Bar */}
              <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-white/10 shadow-sm">
                <div 
                  className={`h-full rounded-full ${hero.hp < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
                />
              </div>
           </div>

           {/* Locked Overlay (Image Area Only) */}
           {isLocked && (
             <div className="absolute inset-0 bg-slate-900/70 z-30 flex flex-col items-center justify-center backdrop-blur-[1px]">
               <div className="bg-amber-500 text-white font-bold text-[9px] px-3 py-1 rounded-full shadow-lg tracking-wider border border-white/20 transform -rotate-3">
                 ON MISSION
               </div>
             </div>
           )}
        </div>

        {/* Bottom: Equipment Slots (Fixed Height, Separated) */}
        <div className="h-12 bg-slate-950 border-t border-slate-800 p-1.5 flex gap-1.5 justify-between items-center relative z-20">
          {[0, 1, 2].map(i => (
            <button 
              key={i} 
              onClick={(e) => {
                e.stopPropagation();
                onEquipClick && onEquipClick(hero.id, i);
              }}
              disabled={isLocked}
              className={`flex-1 h-full rounded-lg flex items-center justify-center transition-all relative group/slot ${
                hero.equipmentIds[i] 
                  ? 'bg-slate-800 border border-slate-600 shadow-inner' 
                  : 'bg-slate-900/40 border border-slate-800 border-dashed hover:bg-slate-800 hover:border-slate-600'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`text-sm transition-transform ${hero.equipmentIds[i] ? 'opacity-100 scale-110 drop-shadow' : 'opacity-20 grayscale scale-90'}`}>
                 {slotIcons[i]}
              </span>
              
              {/* Equipped Indicator Dot */}
              {hero.equipmentIds[i] && (
                 <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_4px_#10b981]"></div>
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default HeroCard;
