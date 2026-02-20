import React from 'react';
import { Equipment } from '../types';
import EquipmentIcon from './EquipmentIcon';
import { calculateEquipmentBaseBonus } from '../utils/mechanics';

interface EquipmentListItemProps {
  item: Equipment;
  equippedBy?: { name: string };
  isEquippedByCurrentSlot?: boolean;
  isBase?: boolean;
  isMaterial?: boolean;
  isMergeMode?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  layout?: 'grid' | 'list';
  className?: string;
}

const EquipmentListItem: React.FC<EquipmentListItemProps> = ({
  item,
  equippedBy,
  isEquippedByCurrentSlot,
  isBase,
  isMaterial,
  isMergeMode,
  onClick,
  disabled,
  layout = 'grid',
  className = ''
}) => {
  const rarityColors: Record<string, string> = {
    C: 'text-slate-400',
    UC: 'text-emerald-400',
    R: 'text-blue-400',
    E: 'text-purple-400',
    L: 'text-amber-400',
  };

  const level = item.level || 0;
  
  // If the item object already has the calculated bonus (which it should from useGameLogic), use it.
  // Otherwise we might need to calculate it, but assuming 'item.bonus' is the effective bonus.
  const effectiveBonus = item.bonus;
  const baseBonus = calculateEquipmentBaseBonus(effectiveBonus, level);

  // Common Icon Component
  const IconSection = () => (
    <div className={`${layout === 'grid' ? 'w-10 h-10' : 'w-12 h-12'} bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 shrink-0 relative`}>
      <EquipmentIcon type={item.type} rarity={item.rarity} size={layout === 'grid' ? "1.8em" : "2em"} />
      {level > 0 && (
        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-slate-900 shadow-sm z-10">
          +{level}
        </div>
      )}
    </div>
  );

  // Common Info Section
  const InfoSection = () => (
    <div className="min-w-0 flex-1">
      <div className={`flex justify-between items-center ${layout === 'grid' ? 'mb-0.5' : 'mb-1'}`}>
        <span className={`${layout === 'grid' ? 'text-[10px]' : 'text-sm'} font-bold truncate ${rarityColors[item.rarity]}`}>{item.name}</span>
        <span className={`${layout === 'grid' ? 'text-[8px]' : 'text-[10px] ml-2'} text-slate-500 font-black uppercase`}>{item.rarity}</span>
      </div>
      <div className={`${layout === 'grid' ? 'text-[9px]' : 'text-[10px]'} text-slate-400`}>
        {item.type === 'Pickaxe' ? `Rew +${effectiveBonus.toFixed(1)}%` : 
         item.type === 'Helmet' ? `Def +${effectiveBonus.toFixed(1)}%` : 
         `Spd +${effectiveBonus.toFixed(1)}%`}
         
         {level > 0 && layout === 'grid' && (
            <span className="text-amber-500 ml-1 font-bold">
               (Base: {baseBonus.toFixed(1)})
            </span>
         )}
      </div>
    </div>
  );

  const containerClasses = `
    relative rounded-xl border transition-all text-left flex items-center 
    ${layout === 'grid' ? 'p-3 gap-3' : 'p-3 space-x-4 w-full'}
    ${isBase ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500' : ''}
    ${isMaterial ? 'bg-slate-700/50 border-slate-500 ring-1 ring-slate-500' : ''}
    ${!isBase && !isMaterial && isEquippedByCurrentSlot ? 'bg-indigo-500/10 border-indigo-500' : ''}
    ${!isBase && !isMaterial && !isEquippedByCurrentSlot ? 'bg-slate-800/40 border-slate-800' : ''}
    ${(isMergeMode && !isBase && !isMaterial) || (!isMergeMode && !disabled && onClick) ? 'hover:border-slate-600 cursor-pointer' : ''}
    ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}
    ${className}
  `;

  if (!onClick) {
      return (
          <div className={containerClasses}>
              <IconSection />
              <InfoSection />
              {equippedBy && (
                <div className="absolute top-1 right-1">
                    <span className="text-[8px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">
                        {equippedBy.name.slice(0, 3)}..
                    </span>
                </div>
              )}
          </div>
      )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={containerClasses}
    >
      <IconSection />
      <InfoSection />

      {equippedBy && (
        <div className={`absolute ${layout === 'grid' ? 'top-1 right-1' : 'top-2 right-2'} text-[8px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600`}>
            {layout === 'grid' ? equippedBy.name.slice(0, 3) + '..' : equippedBy.name}
        </div>
      )}
      
      {isEquippedByCurrentSlot && (
        <div className="text-indigo-400 font-bold text-xs bg-indigo-900/50 px-2 py-1 rounded border border-indigo-500/30">
            選択中
        </div>
      )}
    </button>
  );
};

export default EquipmentListItem;
