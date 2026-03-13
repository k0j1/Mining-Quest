import React from 'react';
import { Equipment } from '../types';
import EquipmentDisplay from './EquipmentDisplay';
import { calculateEquipmentBaseBonus } from '../utils/mechanics';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
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
    <div className="relative shrink-0">
      <EquipmentDisplay 
          equipment={item} 
          type={item.type}
          size={layout === 'grid' ? "2.5rem" : "3rem"} 
          className="border-slate-800"
      />
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
      <div className={`${layout === 'grid' ? 'text-[9px]' : 'text-[10px]'} text-slate-400 flex items-center gap-1 flex-wrap`}>
        <span className="truncate">
          {item.type === 'Pickaxe' ? `Rew ${effectiveBonus >= 0 ? '+' : ''}${effectiveBonus.toFixed(1)}%` : 
           item.type === 'Helmet' ? `Def ${effectiveBonus >= 0 ? '+' : ''}${effectiveBonus.toFixed(1)}%` : 
           `Spd ${effectiveBonus >= 0 ? '+' : ''}${effectiveBonus.toFixed(1)}%`}
        </span>
         
        {level > 0 && layout === 'grid' && (
          <span className="text-amber-500 font-bold shrink-0">
             ({baseBonus.toFixed(1)})
          </span>
        )}

        <span className={`shrink-0 ml-1 ${item.durability <= 0 ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
          Dur: {item.durability}
        </span>

        {equippedBy && (
          <span className="text-[8px] bg-indigo-600 text-white px-1 rounded-sm border border-indigo-500 font-bold shadow-sm shrink-0 ml-auto">
              E
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
      
      {isEquippedByCurrentSlot && (
        <div className="text-indigo-400 font-bold text-xs bg-indigo-900/50 px-2 py-1 rounded border border-indigo-500/30">
            {t('equip.selected')}
        </div>
      )}
    </button>
  );
};

export default EquipmentListItem;
