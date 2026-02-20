
import React, { useState, useMemo } from 'react';
import { Equipment, Hero, QuestRank } from '../types';
import EquipmentIcon from './EquipmentIcon';
import EquipmentListItem from './EquipmentListItem';
import { playClick, playConfirm, playError } from '../utils/sound';

interface EquipmentListProps {
  equipment: Equipment[];
  heroes: Hero[];
  onMerge: (baseId: string, materialId: string) => void;
}

const EquipmentList: React.FC<EquipmentListProps> = ({ equipment, heroes, onMerge }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'Pickaxe' | 'Helmet' | 'Boots'>('ALL');
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [mergeBaseId, setMergeBaseId] = useState<string | null>(null);
  const [mergeMaterialId, setMergeMaterialId] = useState<string | null>(null);

  // Helper to check if equipped
  const getEquippedBy = (id: string) => {
    return heroes.find(h => h.equipmentIds.includes(id));
  };

  const rarityColors: Record<string, string> = {
    C: 'text-slate-400',
    UC: 'text-emerald-400', 
    R: 'text-blue-400',
    E: 'text-purple-400',
    L: 'text-amber-400',
  };

  // Filter Logic
  const filteredList = useMemo(() => {
    let list = equipment;

    // Type Filter
    if (filterType !== 'ALL') {
      list = list.filter(e => e.type === filterType);
    }

    // Merge Mode Filter
    if (isMergeMode) {
      if (mergeBaseId) {
        const baseItem = equipment.find(e => e.id === mergeBaseId);
        if (baseItem) {
          // Show only valid materials
          // Same Name, Same Rarity, Same Level, Not Equipped, Not Base Itself
          list = list.filter(e => 
            e.id !== mergeBaseId &&
            e.name === baseItem.name &&
            e.rarity === baseItem.rarity &&
            (e.level || 0) === (baseItem.level || 0) &&
            !getEquippedBy(e.id)
          );
        }
      } else {
        // Base Selection: Show all items? Or filter out max level?
        // For now show all.
      }
    }

    // Sort: Level Desc, Rarity Desc, Type
    return list.sort((a, b) => {
      const levelDiff = (b.level || 0) - (a.level || 0);
      if (levelDiff !== 0) return levelDiff;

      const rarityOrder = { L: 5, E: 4, R: 3, UC: 2, C: 1 };
      const rDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
      if (rDiff !== 0) return rDiff;

      return a.type.localeCompare(b.type);
    });
  }, [equipment, filterType, isMergeMode, mergeBaseId, heroes]);

  const handleItemClick = (item: Equipment) => {
    if (!isMergeMode) return; // View only in normal mode

    if (!mergeBaseId) {
      // Select Base
      setMergeBaseId(item.id);
      playClick();
    } else {
      // Select Material
      if (item.id === mergeBaseId) {
        // Deselect Base
        setMergeBaseId(null);
        setMergeMaterialId(null);
        playClick();
      } else {
        setMergeMaterialId(item.id);
        playClick();
      }
    }
  };

  const executeMerge = () => {
    if (mergeBaseId && mergeMaterialId) {
      onMerge(mergeBaseId, mergeMaterialId);
      setMergeBaseId(null);
      setMergeMaterialId(null);
      // Keep merge mode open? Or close? User might want to merge more. Keep open.
    }
  };

  const toggleMergeMode = () => {
    playClick();
    if (isMergeMode) {
      setIsMergeMode(false);
      setMergeBaseId(null);
      setMergeMaterialId(null);
    } else {
      setIsMergeMode(true);
    }
  };

  const baseItem = mergeBaseId ? equipment.find(e => e.id === mergeBaseId) : null;
  const materialItem = mergeMaterialId ? equipment.find(e => e.id === mergeMaterialId) : null;

  return (
    <div className="mt-8 mb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 pt-2 pb-3 backdrop-blur-sm z-30 border-b border-slate-800/50 mb-4">
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
              <span className={`w-1 h-3 mr-2 rounded-full ${isMergeMode ? 'bg-amber-500' : 'bg-slate-600'}`}></span>
              {isMergeMode ? 'Equipment Synthesis' : 'Armory (Equipment)'}
            </h2>
        </div>

        {/* Filter Tabs & Action Button */}
        <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar flex-1">
                {(['ALL', 'Pickaxe', 'Helmet', 'Boots'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => { playClick(); setFilterType(type); setMergeBaseId(null); setMergeMaterialId(null); }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-colors whitespace-nowrap ${
                            filterType === type 
                            ? 'bg-slate-200 text-slate-900 border-white shadow-sm' 
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-750'
                        }`}
                    >
                        {type === 'Pickaxe' ? '⛏️ Pickaxe' : type === 'Helmet' ? '🛡️ Helmet' : type === 'Boots' ? '👢 Boots' : 'ALL'}
                    </button>
                ))}
            </div>

            {!isMergeMode ? (
              <button 
                onClick={toggleMergeMode}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95"
              >
                <span className="text-xs">⚒️</span>
                <span>合成</span>
              </button>
            ) : (
              <button 
                onClick={toggleMergeMode}
                className="shrink-0 text-[10px] font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                キャンセル
              </button>
            )}
        </div>
      </div>

      {/* Merge Slots Area (Only in Merge Mode) */}
      {isMergeMode && (
        <div className="mb-6 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://miningquest.k0j1.v2002.coreserver.jp/images/pattern_dot.png')] opacity-5 pointer-events-none"></div>
           
           <div className="flex items-center justify-center gap-4 relative z-10">
              {/* Base Slot */}
              <div 
                onClick={() => { if(baseItem) { setMergeBaseId(null); setMergeMaterialId(null); playClick(); } }}
                className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  baseItem 
                    ? 'bg-slate-900 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                    : 'bg-slate-900/50 border-dashed border-slate-600 hover:border-slate-500'
                }`}
              >
                 {baseItem ? (
                   <>
                     <div className="relative">
                       <EquipmentIcon type={baseItem.type} rarity={baseItem.rarity} size="2.5em" />
                       <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[9px] font-black px-1.5 rounded-full border border-white">+{baseItem.level || 0}</div>
                     </div>
                     <div className="mt-1 text-[8px] text-amber-200 font-bold truncate max-w-[90%]">{baseItem.name}</div>
                   </>
                 ) : (
                   <>
                     <div className="flex gap-0.5 opacity-30 grayscale mb-1">
                        <EquipmentIcon type="Pickaxe" rarity="C" size="1em" />
                        <EquipmentIcon type="Helmet" rarity="C" size="1em" />
                        <EquipmentIcon type="Boots" rarity="C" size="1em" />
                     </div>
                     <span className="text-[9px] text-slate-500 font-bold">BASE</span>
                   </>
                 )}
              </div>

              <div className="text-slate-600 font-black text-xl">+</div>

              {/* Material Slot */}
              <div 
                onClick={() => { if(materialItem) { setMergeMaterialId(null); playClick(); } }}
                className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                  materialItem 
                    ? 'bg-slate-900 border-amber-500/50' 
                    : baseItem 
                      ? 'bg-slate-900/50 border-dashed border-slate-600 cursor-pointer hover:border-slate-500 animate-pulse'
                      : 'bg-slate-900/30 border-dashed border-slate-800 opacity-50 cursor-not-allowed'
                }`}
              >
                 {materialItem ? (
                   <>
                     <div className="relative grayscale opacity-80">
                       <EquipmentIcon type={materialItem.type} rarity={materialItem.rarity} size="2.5em" />
                       <div className="absolute -top-2 -right-2 bg-slate-600 text-white text-[9px] font-black px-1.5 rounded-full">+{materialItem.level || 0}</div>
                     </div>
                     <div className="mt-1 text-[8px] text-slate-400 font-bold truncate max-w-[90%]">{materialItem.name}</div>
                   </>
                 ) : (
                   <>
                     <div className="flex gap-0.5 opacity-30 grayscale mb-1">
                        <EquipmentIcon type="Pickaxe" rarity="C" size="1em" />
                        <EquipmentIcon type="Helmet" rarity="C" size="1em" />
                        <EquipmentIcon type="Boots" rarity="C" size="1em" />
                     </div>
                     <span className="text-[9px] text-slate-500 font-bold">MAT</span>
                   </>
                 )}
              </div>
           </div>

           {/* Action Button */}
           <div className="mt-4">
             <button
               onClick={executeMerge}
               disabled={!baseItem || !materialItem}
               className={`w-full py-3 rounded-xl font-bold text-sm tracking-widest transition-all ${
                 baseItem && materialItem
                   ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:brightness-110 active:scale-95'
                   : 'bg-slate-800 text-slate-600 cursor-not-allowed'
               }`}
             >
               {baseItem && materialItem ? '合成実行 (MERGE +1)' : '装備を選択してください'}
             </button>
           </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredList.map(item => {
            const equippedBy = getEquippedBy(item.id);
            const isBase = mergeBaseId === item.id;
            const isMaterial = mergeMaterialId === item.id;
            
            return (
                <EquipmentListItem
                    key={item.id}
                    item={item}
                    equippedBy={equippedBy}
                    isBase={isBase}
                    isMaterial={isMaterial}
                    isMergeMode={isMergeMode}
                    onClick={isMergeMode ? () => handleItemClick(item) : undefined}
                    disabled={isMergeMode && !!equippedBy && !mergeBaseId}
                    layout="grid"
                />
            );
        })}
      </div>

      {filteredList.length === 0 && (
        <div className="py-12 text-center text-slate-600 text-xs font-bold border border-dashed border-slate-800 rounded-xl">
            {isMergeMode && mergeBaseId ? "合成可能な素材がありません" : "装備品がありません"}
        </div>
      )}
    </div>
  );
};

export default EquipmentList;
