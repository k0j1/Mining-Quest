
import React from 'react';
import { Equipment, Hero } from '../types';

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

  // Check if an item is equipped by ANY hero
  const getEquippedBy = (id: string) => {
    return allHeroes.find(h => h.equipmentIds.includes(id));
  };

  const rarityColors = {
    Common: 'text-slate-400',
    Rare: 'text-blue-400',
    Epic: 'text-purple-400',
    Legendary: 'text-amber-400'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass-panel rounded-[2rem] border-2 border-indigo-500/30 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-orbitron font-bold text-white">装備を選択</h2>
            <p className="text-xs text-slate-400">{hero.name} - Slot {slotIndex + 1}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Unequip Option */}
          <button 
            onClick={() => onSelect(null)}
            className="w-full p-4 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 text-red-400 font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center space-x-2"
          >
            <span>🗑️</span>
            <span>装備を外す</span>
          </button>

          {equipmentList.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">
              所持している装備がありません
            </div>
          )}

          {equipmentList.map(item => {
            const equippedBy = getEquippedBy(item.id);
            const isEquippedByThisHeroSlot = currentEquippedId === item.id;
            const isEquippedElsewhere = equippedBy && !isEquippedByThisHeroSlot;

            return (
              <button
                key={item.id}
                onClick={() => !isEquippedElsewhere && onSelect(item.id)}
                disabled={isEquippedElsewhere}
                className={`w-full p-4 rounded-xl border transition-all flex items-center space-x-4 text-left group
                  ${isEquippedByThisHeroSlot ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'}
                  ${isEquippedElsewhere ? 'opacity-50 grayscale' : ''}
                `}
              >
                <div className="text-2xl">⚒️</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className={`font-bold text-sm ${rarityColors[item.rarity]}`}>{item.name}</p>
                    <span className="text-[10px] text-slate-500 uppercase font-black">{item.rarity}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Bonus: +{item.bonus} ({item.type})</p>
                </div>
                {isEquippedElsewhere && (
                  <div className="text-[8px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-bold">
                    装着中: {equippedBy.name}
                  </div>
                )}
                {isEquippedByThisHeroSlot && (
                  <div className="text-indigo-400 font-bold text-xs">選択中</div>
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
