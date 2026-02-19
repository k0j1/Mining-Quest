
import { Dispatch, SetStateAction, useState } from 'react';
import { GameState } from '../../types';
import { rollGachaItem } from '../../services/gachaService';
import { playConfirm, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';
import { getHeroImageUrl } from '../../utils/heroUtils';

interface UseGachaProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  farcasterUser?: any;
  refetchBalance: () => Promise<void>;
}

export const useGacha = ({ gameState, setGameState, showNotification, farcasterUser, refetchBalance }: UseGachaProps) => {
  const [gachaResult, setGachaResult] = useState<{ type: 'Hero' | 'Equipment'; data: any[] } | null>(null);
  const [isGachaRolling, setIsGachaRolling] = useState(false);

  // Helper to save to DB (Only used for Equipment or Local Fallback)
  const persistGachaResults = async (tab: 'Hero' | 'Equipment', items: any[]) => {
    if (!farcasterUser?.fid) return items; // Return as is if no user (local mode)

    const fid = farcasterUser.fid;
    const persistedItems = [...items];

    if (tab === 'Hero') {
      // NOTE: This block is now mostly for fallback if RPC wasn't used
      for (let i = 0; i < persistedItems.length; i++) {
        const item = persistedItems[i];
        if (item.isPersisted) continue; // Skip if already saved via RPC

        // 1. Get Master ID
        const { data: masterData } = await supabase.from('quest_hero').select('id').eq('name', item.name).single();
        if (masterData) {
            const { data: inserted, error } = await supabase.from('quest_player_hero').insert({
                fid: fid,
                hero_id: masterData.id,
                hp: item.hp,
                recovery_count: 0
            }).select('player_hid').single();

            if (!error && inserted) {
                // Update the ID to the DB ID
                persistedItems[i].id = inserted.player_hid.toString();
            }
        }
      }
      
      // Update stats only if we did manual inserts (RPC does it internally)
      const manualInserts = persistedItems.filter(i => !i.isPersisted).length;
      if (manualInserts > 0) {
          const { error: statError } = await supabase.rpc('increment_player_stat', { 
              player_fid: fid, 
              column_name: 'gacha_hero_count', 
              amount: manualInserts 
          });
          if (statError) console.error("Stat update error:", statError);
      }

    } else {
      // Equipment Logic
      let manualInsertsCount = 0;

      for (let i = 0; i < persistedItems.length; i++) {
        const item = persistedItems[i];
        if (item.isPersisted) continue; // FIX: Skip if already saved via RPC to prevent duplicates

        const { data: masterData } = await supabase.from('quest_equipment').select('id').eq('name', item.name).single();
        if (masterData) {
            const { data: inserted, error } = await supabase.from('quest_player_equipment').insert({
                fid: fid,
                equipment_id: masterData.id
            }).select('player_eid').single();

            if (!error && inserted) {
                persistedItems[i].id = inserted.player_eid.toString();
                manualInsertsCount++;
            }
        }
      }

      // Update stats only for manual inserts
      if (manualInsertsCount > 0) {
        const { error: statError } = await supabase.rpc('increment_player_stat', { 
            player_fid: fid, 
            column_name: 'gacha_equipment_count', 
            amount: manualInsertsCount 
        });
        if (statError) console.error("Stat update error:", statError);
      }
    }

    return persistedItems;
  };

  const processGachaItems = (tab: 'Hero' | 'Equipment', items: any[]) => {
    setGameState(prev => {
      const next = { ...prev };
      
      if (tab === 'Hero') {
        const newHeroes = items.map(result => {
           const maxHp = result.hp || 50;
           return {
            id: result.id || Math.random().toString(),
            name: result.name,
            species: result.species,
            rarity: result.rarity,
            trait: result.trait,
            damageReduction: result.damageReduction,
            level: 1, 
            hp: maxHp, 
            maxHp: maxHp,
            imageUrl: result.imageUrl || getHeroImageUrl(result.name, 's'),
            equipmentIds: ['', '', ''],
            // Map skills
            skillQuest: result.skillQuest,
            skillDamage: result.skillDamage,
            skillTime: result.skillTime,
            skillType: result.skillType
          };
        });
        next.heroes = [...prev.heroes, ...newHeroes];
      } else {
        const newEquipment = items.map(result => ({
            id: result.id || Math.random().toString(),
            name: result.name,
            type: result.type,
            bonus: result.bonus,
            rarity: result.rarity,
            level: 0
        }));
        next.equipment = [...prev.equipment, ...newEquipment];
      }
      return next;
    });
  };

  const rollGacha = async (tab: 'Hero' | 'Equipment') => {
    const cost = tab === 'Hero' ? 10000 : 6000;
    if (gameState.tokens < cost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`, 'error');
      return;
    }
    playConfirm();
    setIsGachaRolling(true);
    try {
      // Pass FID to enable DB-side logic
      const result = await rollGachaItem(tab, undefined, farcasterUser?.fid);
      
      // Handle Persistence (Skip if RPC handled it)
      const persisted = await persistGachaResults(tab, [result]);
      
      setGachaResult({ type: tab, data: persisted });
      setGameState(prev => ({ ...prev, tokens: prev.tokens - cost }));
      processGachaItems(tab, persisted);
      
      refetchBalance();

    } catch (e: any) {
      console.error(e);
      showNotification(`ガチャエラー: ${e.message}`, 'error');
    } finally {
      setIsGachaRolling(false);
    }
  };

  const rollGachaTriple = async (tab: 'Hero' | 'Equipment') => {
    const baseCost = tab === 'Hero' ? 10000 : 6000;
    const cost = baseCost * 5; 

    if (gameState.tokens < cost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`, 'error');
      return;
    }
    playConfirm();
    setIsGachaRolling(true);

    try {
      // Parallel execution is tricky if we want guaranteed sequence, but Promise.all is fine for independent rolls.
      // NOTE: For Hero Triple, each call is an independent DB Transaction.
      // This is acceptable, though a 'bulk_roll' RPC would be more efficient in future.
      const results = await Promise.all([
        rollGachaItem(tab, undefined, farcasterUser?.fid),
        rollGachaItem(tab, undefined, farcasterUser?.fid),
        rollGachaItem(tab, 'R', farcasterUser?.fid) // Guaranteed Slot
      ]);

      const persisted = await persistGachaResults(tab, results);

      setGachaResult({ type: tab, data: persisted });
      setGameState(prev => ({ ...prev, tokens: prev.tokens - cost }));
      processGachaItems(tab, persisted);
      
      refetchBalance();

    } catch (e: any) {
      console.error(e);
      showNotification(`ガチャエラー: ${e.message}`, 'error');
    } finally {
      setIsGachaRolling(false);
    }
  };

  return { 
    gachaResult, 
    setGachaResult, 
    isGachaRolling, 
    rollGacha, 
    rollGachaTriple 
  };
};
