
import React from 'react';
import { Hero, Equipment } from '../types';
import HeroCard from './HeroCard';

interface PartySlotGridProps {
  heroIds: (string | null)[];
  heroes: Hero[];
  activeQuestHeroIds?: string[];
  selectedIndex?: number | null;
  isPartyLocked?: boolean;
  readOnly?: boolean;
  showSlotLabels?: boolean;
  onSlotClick?: (index: number) => void;
  onRemoveClick?: (index: number) => void;
  onEquipClick?: (heroId: string, slotIndex: number) => void;
  onLongPress?: (heroId: string) => void; // New Prop
  className?: string;
  compactEmpty?: boolean;
  equipment?: Equipment[];
}

const PartySlotGrid: React.FC<PartySlotGridProps> = ({
  heroIds,
  heroes,
  activeQuestHeroIds = [],
  selectedIndex,
  isPartyLocked = false,
  readOnly = false,
  showSlotLabels = true,
  onSlotClick,
  onRemoveClick,
  onEquipClick,
  onLongPress,
  className = "grid grid-cols-3 gap-4",
  compactEmpty = false,
  equipment
}) => {
  return (
    <div className={className}>
      {[0, 1, 2].map(slotIdx => {
        const heroId = heroIds[slotIdx];
        const hero = heroId ? heroes.find(h => h.id === heroId) : null;
        
        const isLocked = isPartyLocked || (hero ? activeQuestHeroIds.includes(hero.id) : false);
        const isSelected = selectedIndex === slotIdx;

        return (
          // Added 'party-slot-active' class if hero exists for GSAP targeting
          <div key={slotIdx} className={`relative group ${hero ? 'party-slot-active' : ''}`}>
            {showSlotLabels && (
              <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap transition-all ${
                  isSelected 
                    ? 'bg-indigo-600 text-white border-indigo-500' 
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  SLOT {slotIdx + 1}
                </span>
              </div>
            )}

            {hero ? (
              <div className="relative">
                <HeroCard 
                  hero={hero} 
                  index={slotIdx}
                  isSelected={isSelected}
                  isLocked={isLocked} 
                  onClick={() => !readOnly && onSlotClick?.(slotIdx)}
                  onLongPress={() => onLongPress?.(hero.id)} // Pass long press
                  onEquipClick={!readOnly ? onEquipClick : undefined}
                  isMainSlot
                  equipment={equipment}
                />
                {!readOnly && !isLocked && onRemoveClick && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveClick(slotIdx);
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] border border-slate-800 shadow-sm z-30 hover:bg-rose-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              readOnly ? (
                <div className={`w-full ${compactEmpty ? 'aspect-square rounded-xl' : 'aspect-[4/5.5] rounded-2xl'} bg-slate-900/50 border border-dashed border-slate-700 flex flex-col items-center justify-center`}>
                  <span className={`text-slate-600 font-bold uppercase ${compactEmpty ? 'text-[8px]' : 'text-[9px]'}`}>Empty</span>
                </div>
              ) : (
                <button 
                  onClick={() => onSlotClick?.(slotIdx)}
                  className={`w-full aspect-[4/5.5] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-900/10' 
                        : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                    <span className="text-2xl mb-1 text-slate-600">＋</span>
                    <span className="text-[9px] font-bold text-slate-600 tracking-tighter uppercase">Vacant</span>
                </button>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PartySlotGrid;
