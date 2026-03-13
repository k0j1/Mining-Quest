import React from 'react';
import { Equipment } from '../types';
import EquipmentIcon from './EquipmentIcon';

interface EquipmentDisplayProps {
  equipment?: Equipment | null;
  type: 'Pickaxe' | 'Helmet' | 'Boots';
  size?: string;
  className?: string;
  showRarityText?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const EquipmentDisplay: React.FC<EquipmentDisplayProps> = ({ 
  equipment, 
  type,
  size = '2em', 
  className = '', 
  showRarityText = false,
  onClick,
  disabled
}) => {
  const rarity = equipment?.rarity || 'C';
  const rarityBgColors: Record<string, string> = {
    C: 'bg-slate-800 border-slate-600',
    UC: 'bg-emerald-900/40 border-emerald-700/50',
    R: 'bg-indigo-900/40 border-indigo-700/50',
    E: 'bg-fuchsia-900/40 border-fuchsia-700/50',
    L: 'bg-amber-900/40 border-amber-700/50'
  };

  const textColors: Record<string, string> = {
    C: 'text-slate-500',
    UC: 'text-emerald-500',
    R: 'text-indigo-500',
    E: 'text-fuchsia-500',
    L: 'text-amber-500'
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component 
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center justify-center rounded-lg border ${equipment ? rarityBgColors[rarity] || rarityBgColors['C'] : 'bg-slate-900/40 border-slate-800 border-dashed'} ${className}`} 
      style={{ width: size, height: size }}
    >
      {equipment && showRarityText && (
         <div className={`absolute inset-0 flex items-center justify-center opacity-20 font-black text-2xl -rotate-12 select-none ${textColors[rarity] || textColors['C']}`}>
            {rarity}
         </div>
      )}
      <div className={`${equipment ? '' : 'opacity-20 grayscale scale-75'}`}>
        <EquipmentIcon type={type} rarity={rarity} size="80%" />
      </div>
    </Component>
  );
};

export default EquipmentDisplay;
