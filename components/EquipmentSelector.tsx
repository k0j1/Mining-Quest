
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

  // Map slot index to required type
  const requiredType = slotIndex === 0 ? 'Pickaxe' : slotIndex === 1 ? 'Helmet' : 'Boots';
  const typeIcon = slotIndex === 0 ? '⛏️' : slotIndex === 1 ? '🪖' : '👢';

  // Check if an item is equipped by ANY hero
  const getEquippedBy = (id: string) => {
    return allHeroes.find(h => h.equipmentIds.includes(id));
  };

  const rarityColors: Record<string, string> = {
    C: 'text-slate-400',
    UC: 'text-green-400', // Changed to match theme: green/emerald
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
          <div>
            <h2 className="text-xl font-orbitron font-bold text-white">装備を選択</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              {hero.name} - Slot {slotIndex + 1} <span className="text-lg">{typeIcon}</span> ({requiredType})
            </p>
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
                className={`w-full p-4 rounded-xl border transition-all flex items-center space-x-4 text-left group shrink-0
                  ${isEquippedByThisHeroSlot ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'}
                  ${isEquippedElsewhere ? 'opacity-50 grayscale' : ''}
                `}
              >
                <div className="text-2xl">{typeIcon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className={`font-bold text-sm ${rarityColors[item.rarity] || rarityColors.C}`}>{item.name}</p>
                    <span className="text-[10px] text-slate-500 uppercase font-black">{item.rarity}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {item.type === 'Pickaxe' ? `報酬 +${item.bonus}%` : 
                     item.type === 'Helmet' ? `被ダメ -${item.bonus}%` : 
                     `時間 -${item.bonus}%`}
                  </p>
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
