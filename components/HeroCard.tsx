
import React, { useState, useEffect } from 'react';
import { Hero, Equipment } from '../types';
import { useLongPress } from '../hooks/useLongPress';
import { calculateHeroDamageReduction } from '../utils/mechanics';
import EquipmentIcon from './EquipmentIcon';

interface HeroCardProps {
  hero: Hero;
  index: number;
  compact?: boolean;
  isSelected?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
  onLongPress?: () => void; // New Prop
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
  onLongPress,
  onEquipClick,
  isMainSlot,
  equipment
}) => {
  const [hasError, setHasError] = useState(false);

  // Use long press hook to handle clicks vs long presses
  const longPressProps = useLongPress(
    (e) => {
      // Trigger long press callback if provided
      if (onLongPress) onLongPress();
    },
    () => {
      // Trigger normal click
      if (onClick) onClick();
    },
    { shouldPreventDefault: true, delay: 500 }
  );

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

  const slotTypes = ['Pickaxe', 'Helmet', 'Boots'] as const;

  // Calculate Total Damage Reduction (Skill + Helmet)
  const totalDamageReduction = calculateHeroDamageReduction(hero, equipment || [], 0);

  // Determine font size and padding based on name length more aggressively
  const getNameStyles = (name: string) => {
    if (name.length > 16) return 'text-[6px] leading-[8px] px-1 tracking-tighter';
    if (name.length > 12) return 'text-[7px] leading-[9px] px-1 tracking-tight';
    if (name.length > 10) return 'text-[8px] leading-[10px] px-1.5';
    return 'text-[9px] leading-[11px] px-2';
  };

  const nameStyles = getNameStyles(hero.name);

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
        {...longPressProps}
        className={`flex items-center space-x-3 p-2 bg-slate-800 rounded-xl border transition-all duration-200 relative overflow-hidden ${
          isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-750'
        } ${
          isSelected 
            ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-900/10' 
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 mr-2">
              <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                  className={`h-full ${hero.hp < 30 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                  style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
                />
              </div>
              <span className={`text-[8px] font-bold ${hero.hp < 30 ? 'text-rose-400' : 'text-slate-500'}`}>HP {hero.hp}</span>
            </div>
            
            {/* Equipment Indicators (Icons) */}
            <div className="flex gap-1 shrink-0">
               {[0, 1, 2].map(slotIdx => {
                 const equipId = hero.equipmentIds[slotIdx];
                 const item = equipId && equipment ? equipment.find(e => e.id === equipId) : null;
                 const type = slotTypes[slotIdx];
                 
                 // Icons for compact view
                 const Icon = () => {
                    if (type === 'Pickaxe') return <span className="text-[10px] leading-none">⛏️</span>;
                    if (type === 'Helmet') return <span className="text-[10px] leading-none">🪖</span>;
                    return <span className="text-[10px] leading-none">👢</span>;
                 };

                 return (
                   <div 
                     key={slotIdx}
                     className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                       item 
                         ? 'bg-slate-700 border-slate-600 text-white shadow-sm' 
                         : 'bg-slate-900 border-slate-800 text-slate-700 opacity-50'
                     }`}
                     title={item ? item.name : 'Empty'}
                   >
                      <Icon />
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
        
        {isLocked && (
          <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center z-50 backdrop-blur-[1px]">
            <span className="text-[8px] font-black text-amber-500 border border-amber-500/50 bg-amber-950/80 px-2 py-1 rounded uppercase tracking-wider shadow-lg transform -rotate-3">
               ON MISSION
            </span>
          </div>
        )}
      </div>
    );
  }

  // Standard Card Layout (Unchanged)
  return (
    <div 
      {...longPressProps}
      className={`relative transition-all duration-300 group ${
        isLocked ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
      } ${
        isSelected ? 'scale-105 z-30' : 'scale-100 z-10'
      }`}
    >
      {/* Container with Border */}
      <div className={`relative w-full aspect-[4/5.5] flex flex-col rounded-2xl overflow-hidden border-2 bg-slate-900 transition-all ${
        isSelected 
          ? 'border-amber-400 shadow-lg shadow-amber-900/20' 
          : `${rarityBorders[hero.rarity]} border-opacity-60`
      }`}>
        
        {/* Top: Image Area */}
        <div className="relative flex-1 w-full overflow-hidden bg-slate-800">
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
           
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 z-10 pointer-events-none"></div>

           {/* Stats & Name Overlay */}
           <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none">
              
              <div className="flex items-center justify-between mb-1 gap-1">
                 {/* HP Display with Background */}
                 <span className={`text-[8px] font-black drop-shadow-md px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 whitespace-nowrap ${hero.hp < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    HP {hero.hp}
                 </span>

                 {totalDamageReduction > 0 ? (
                    <span className="text-[7px] font-bold text-indigo-200 bg-indigo-900/80 px-1 py-0.5 rounded backdrop-blur-sm border border-indigo-500/30 whitespace-nowrap flex items-center">
                        <span className="mr-0.5">🛡️</span>+{totalDamageReduction.toFixed(1)}%
                    </span>
                 ) : <span></span>}
              </div>

              <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-white/10 shadow-sm mb-1.5">
                <div 
                  className={`h-full rounded-full ${hero.hp < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
                />
              </div>

              <div className="flex justify-center w-full">
                 <span className={`${nameStyles} font-bold text-white bg-slate-900/70 py-0.5 rounded-full backdrop-blur-sm border border-white/10 shadow-sm text-center max-w-full truncate`}>
                   {hero.name}
                 </span>
              </div>

           </div>

           {isLocked && (
             <div className="absolute inset-0 bg-slate-900/70 z-30 flex flex-col items-center justify-center backdrop-blur-[1px]">
               <div className="bg-amber-500 text-white font-bold text-[9px] px-3 py-1 rounded-full shadow-lg tracking-wider border border-white/20 transform -rotate-3">
                 ON MISSION
               </div>
             </div>
           )}
        </div>

        {/* Bottom: Equipment Slots */}
        <div 
          className="h-12 bg-slate-950 border-t border-slate-800 p-1.5 flex gap-1.5 justify-between items-center relative z-20"
          // Stop propagation of all interaction events to prevent parent Card's longPress/click handlers
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {[0, 1, 2].map(i => {
            const equipId = hero.equipmentIds[i];
            const equippedItem = equipment?.find(e => e.id === equipId);
            const rarity = equippedItem ? equippedItem.rarity : 'C';

            return (
            <button 
              key={i} 
              onClick={(e) => {
                e.stopPropagation();
                // We use standard onClick for equipment
                onEquipClick && onEquipClick(hero.id, i);
              }}
              disabled={isLocked}
              className={`flex-1 h-full rounded-lg flex items-center justify-center transition-all relative group/slot ${
                equipId 
                  ? 'bg-slate-800/80 border border-slate-600 shadow-inner' 
                  : 'bg-slate-900/40 border border-slate-800 border-dashed hover:bg-slate-800 hover:border-slate-600'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`transform transition-transform ${equipId ? 'scale-110 drop-shadow-lg' : 'opacity-20 grayscale scale-75'}`}>
                 <EquipmentIcon 
                    type={slotTypes[i]} 
                    rarity={equipId ? rarity : 'C'} 
                    size="1.4em" 
                 />
              </div>
              
              {equippedItem && (equippedItem.level || 0) > 0 ? (
                 <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-slate-900 shadow-sm z-10">
                    +{equippedItem.level}
                 </div>
              ) : equipId && (
                 <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_4px_#10b981]"></div>
              )}
            </button>
          )})}
        </div>

      </div>
    </div>
  );
};

export default HeroCard;
