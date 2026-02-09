
import React from 'react';
import { Equipment, Hero } from '../types';
import EquipmentIcon from './EquipmentIcon';

interface EquipmentSelectorProps {
  hero: Hero;
  slotIndex: number;
  equipmentList: Equipment[];
  onSelect: (equipmentId: string | null) => void;
  onClose: () => void;
  allHeroes: Hero[];
}

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ 
  hero, 
  slotIndex, 
  equipmentList, 
  onSelect, 
  onClose,
  allHeroes
}) => {
  const currentEquippedId = hero.equipmentIds[slotIndex];

  // Map slot index to required type
  const requiredType = slotIndex === 0 ? 'Pickaxe' : slotIndex === 1 ? 'Helmet' : 'Boots';
  
  // Check if an item is equipped by ANY hero
  const getEquippedBy = (id: string) => {
    return allHeroes.find(h => h.equipmentIds.includes(id));
  };

  const rarityColors: Record<string, string> = {
    C: 'text-slate-400',
    UC: 'text-emerald-400', 
    R: 'text-blue-400',
    E: 'text-purple-400',
    L: 'text-amber-400',
  };

  // Filter equipment by type
  const filteredList = equipmentList.filter(e => e.type === requiredType);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass-panel rounded-[2rem] border-2 border-indigo-500/30 overflow-hidden flex flex-col max-h-[70vh] shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
               <EquipmentIcon type={requiredType} rarity="R" size="1.8em" />
            </div>
            <div>
                <h2 className="text-xl font-orbitron font-bold text-white">装備を選択</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                {hero.name} - Slot {slotIndex + 1} ({requiredType})
                </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {/* Unequip Option */}
          <button 
            onClick={() => onSelect(null)}
            className="w-full p-4 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 text-red-400 font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center space-x-2 shrink-0"
          >
            <span>🗑️</span>
            <span>装備を外す</span>
          </button>

          {filteredList.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">
              {requiredType}を持っていません
            </div>
          )}

          {filteredList.map(item => {
            const equippedBy = getEquippedBy(item.id);
            const isEquippedByThisHeroSlot = currentEquippedId === item.id;
            const isEquippedElsewhere = equippedBy && !isEquippedByThisHeroSlot;

            return (
              <button
                key={item.id}
                onClick={() => !isEquippedElsewhere && onSelect(item.id)}
                disabled={isEquippedElsewhere}
                className={`w-full p-3 rounded-xl border transition-all flex items-center space-x-4 text-left group shrink-0 relative overflow-hidden
                  ${isEquippedByThisHeroSlot ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'}
                  ${isEquippedElsewhere ? 'opacity-50 grayscale' : ''}
                `}
              >
                <div className="w-12 h-12 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 shrink-0">
                    <EquipmentIcon type={item.type} rarity={item.rarity} size="2em" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className={`font-bold text-sm truncate ${rarityColors[item.rarity] || rarityColors.C}`}>{item.name}</p>
                    <span className="text-[10px] text-slate-500 uppercase font-black ml-2">{item.rarity}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {item.type === 'Pickaxe' ? `報酬 +${item.bonus}%` : 
                     item.type === 'Helmet' ? `被ダメ -${item.bonus}%` : 
                     `速度 +${item.bonus}%`}
                  </p>
                </div>
                {isEquippedElsewhere && (
                  <div className="absolute top-2 right-2 text-[8px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-bold border border-slate-700">
                    装着中: {equippedBy.name}
                  </div>
                )}
                {isEquippedByThisHeroSlot && (
                  <div className="text-indigo-400 font-bold text-xs bg-indigo-900/50 px-2 py-1 rounded border border-indigo-500/30">選択中</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EquipmentSelector;
