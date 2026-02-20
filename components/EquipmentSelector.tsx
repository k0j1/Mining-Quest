
import React, { useState, useMemo } from 'react';
import { Equipment, Hero } from '../types';
import EquipmentIcon from './EquipmentIcon';
import EquipmentListItem from './EquipmentListItem';
import { playClick, playConfirm, playError } from '../utils/sound';

interface EquipmentSelectorProps {
  hero: Hero;
  slotIndex: number;
  equipmentList: Equipment[];
  onSelect: (equipmentId: string | null) => void;
  onClose: () => void;
  allHeroes: Hero[];
  onMerge?: (baseId: string, materialId: string) => void;
}

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ 
  hero, 
  slotIndex, 
  equipmentList, 
  onSelect, 
  onClose,
  allHeroes,
  onMerge
}) => {
  const [mode, setMode] = useState<'equip' | 'merge'>('equip');
  const [mergeBaseId, setMergeBaseId] = useState<string | null>(null);
  const [mergeMaterialId, setMergeMaterialId] = useState<string | null>(null);

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
  const filteredList = useMemo(() => {
    let list = equipmentList.filter(e => e.type === requiredType);
    
    if (mode === 'merge' && mergeBaseId) {
      const baseItem = equipmentList.find(e => e.id === mergeBaseId);
      if (baseItem) {
        // Filter for valid materials: Same Name, Same Rarity, Same Level, Not Equipped, Not Base Itself
        list = list.filter(e => 
          e.id !== mergeBaseId &&
          e.name === baseItem.name &&
          e.rarity === baseItem.rarity &&
          (e.level || 0) === (baseItem.level || 0) &&
          !getEquippedBy(e.id)
        );
      }
    }
    
    // Sort: Level Desc, Rarity Desc
    return list.sort((a, b) => {
      const levelDiff = (b.level || 0) - (a.level || 0);
      if (levelDiff !== 0) return levelDiff;
      // Rarity sort logic if needed
      return 0;
    });
  }, [equipmentList, requiredType, mode, mergeBaseId, allHeroes]);

  const handleItemClick = (item: Equipment) => {
    if (mode === 'equip') {
      const equippedBy = getEquippedBy(item.id);
      const isEquippedByThisHeroSlot = currentEquippedId === item.id;
      const isEquippedElsewhere = equippedBy && !isEquippedByThisHeroSlot;
      
      if (!isEquippedElsewhere) {
        onSelect(item.id);
      }
    } else {
      // Merge Mode
      if (!mergeBaseId) {
        // Select Base
        setMergeBaseId(item.id);
        playClick();
      } else {
        // Select Material
        setMergeMaterialId(item.id);
        playClick();
      }
    }
  };

  const executeMerge = () => {
    if (mergeBaseId && mergeMaterialId && onMerge) {
      onMerge(mergeBaseId, mergeMaterialId);
      setMergeBaseId(null);
      setMergeMaterialId(null);
    }
  };

  const baseItem = mergeBaseId ? equipmentList.find(e => e.id === mergeBaseId) : null;
  const materialItem = mergeMaterialId ? equipmentList.find(e => e.id === mergeMaterialId) : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass-panel rounded-[2rem] border-2 border-indigo-500/30 overflow-hidden flex flex-col max-h-[80vh] shadow-2xl relative">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                 <EquipmentIcon type={requiredType} rarity="R" size="1.5em" />
              </div>
              <div>
                  <h2 className="text-lg font-orbitron font-bold text-white">
                    {mode === 'equip' ? '装備を選択' : '装備強化'}
                  </h2>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  {hero.name} - Slot {slotIndex + 1} ({requiredType})
                  </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
              ✕
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => { setMode('equip'); setMergeBaseId(null); setMergeMaterialId(null); playClick(); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'equip' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              装備変更
            </button>
            <button 
              onClick={() => { setMode('merge'); setMergeBaseId(null); setMergeMaterialId(null); playClick(); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'merge' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              強化 (Merge)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
          
          {/* Merge Instruction / Status */}
          {mode === 'merge' && (
            <div className="mb-4 bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 text-center">
              {!mergeBaseId ? (
                <p className="text-xs text-amber-200">強化するベース装備を選択してください</p>
              ) : !mergeMaterialId ? (
                <div className="flex items-center justify-between px-2">
                   <button onClick={() => setMergeBaseId(null)} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">戻る</button>
                   <p className="text-xs text-amber-200 font-bold">素材を選択してください</p>
                   <div className="w-8"></div>
                </div>
              ) : (
                <p className="text-xs text-amber-200">強化を実行しますか？</p>
              )}
            </div>
          )}

          {/* Unequip Option (Only in Equip Mode) */}
          {mode === 'equip' && (
            <button 
              onClick={() => onSelect(null)}
              className="w-full p-4 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 text-red-400 font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center space-x-2 shrink-0 mb-2"
            >
              <span>🗑️</span>
              <span>装備を外す</span>
            </button>
          )}

          {filteredList.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">
              {mode === 'merge' && mergeBaseId 
                ? "強化に使用できる素材がありません\n(同名・同レア・同レベル・未装備)" 
                : `${requiredType}を持っていません`}
            </div>
          )}

          {filteredList.map(item => {
            const equippedBy = getEquippedBy(item.id);
            const isEquippedByThisHeroSlot = currentEquippedId === item.id;
            const isEquippedElsewhere = equippedBy && !isEquippedByThisHeroSlot;
            
            // Merge Mode Logic
            const isBase = mergeBaseId === item.id;
            const isMaterial = mergeMaterialId === item.id;
            const isDisabled = mode === 'equip' ? isEquippedElsewhere : (mode === 'merge' && !mergeBaseId && false); // Base selection: allow all?

            return (
              <EquipmentListItem
                key={item.id}
                item={item}
                equippedBy={equippedBy}
                isEquippedByCurrentSlot={isEquippedByThisHeroSlot && mode === 'equip'}
                isBase={isBase}
                isMaterial={isMaterial}
                isMergeMode={mode === 'merge'}
                onClick={() => handleItemClick(item)}
                disabled={isDisabled}
                layout="list"
              />
            );
          })}
        </div>

        {/* Merge Confirmation Overlay */}
        {mergeBaseId && mergeMaterialId && baseItem && materialItem && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-amber-500/30 p-4 z-20 animate-slide-up">
            <div className="flex items-center justify-between mb-4 px-4">
               {/* Base */}
               <div className="text-center">
                 <div className="w-12 h-12 bg-slate-950 rounded-lg border border-amber-500/50 flex items-center justify-center mx-auto mb-1 relative">
                    <EquipmentIcon type={baseItem.type} rarity={baseItem.rarity} size="1.8em" />
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">+{baseItem.level || 0}</div>
                 </div>
                 <div className="text-[10px] text-slate-400 font-mono">Lv.{baseItem.level || 0}</div>
               </div>
               
               <div className="text-amber-500 font-black text-xl">➜</div>

               {/* Result */}
               <div className="text-center">
                 <div className="w-12 h-12 bg-slate-950 rounded-lg border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center mx-auto mb-1 relative">
                    <EquipmentIcon type={baseItem.type} rarity={baseItem.rarity} size="1.8em" />
                    <div className="absolute -top-2 -right-2 bg-white text-amber-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">+{ (baseItem.level || 0) + 1 }</div>
                 </div>
                 <div className="text-[10px] text-amber-400 font-bold font-mono">Lv.{(baseItem.level || 0) + 1}</div>
               </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setMergeMaterialId(null)}
                className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold text-xs"
              >
                キャンセル
              </button>
              <button 
                onClick={executeMerge}
                className="flex-[2] py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                強化実行 (+10% Bonus)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentSelector;
