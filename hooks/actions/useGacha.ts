
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
  refetchBalance?: () => Promise<void>;
}

export const useGacha = ({ gameState, setGameState, showNotification, farcasterUser, refetchBalance }: UseGachaProps) => {
  const [gachaResult, setGachaResult] = useState<{ type: 'Hero' | 'Equipment'; data: any[] } | null>(null);
  const [isGachaRolling, setIsGachaRolling] = useState(false);

  // Helper to save to DB
  const persistGachaResults = async (tab: 'Hero' | 'Equipment', items: any[]) => {
    if (!farcasterUser?.fid) return items; // Return as is if no user (local mode)

    const fid = farcasterUser.fid;
    const persistedItems = [...items];

    if (tab === 'Hero') {
      for (let i = 0; i < persistedItems.length; i++) {
        const item = persistedItems[i];
        
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
      
      // Update stats
      const { error: statError } = await supabase.rpc('increment_player_stat', { 
          player_fid: fid, 
          column_name: 'gacha_hero_count', 
          amount: items.length 
      });

      if (statError) {
          // Fallback if RPC missing (manual update)
          const { data } = await supabase.from('quest_player_stats').select('gacha_hero_count').eq('fid', fid).single();
          if (data) {
              await supabase.from('quest_player_stats').update({ gacha_hero_count: (data.gacha_hero_count || 0) + items.length }).eq('fid', fid);
          }
      }

    } else {
      for (let i = 0; i < persistedItems.length; i++) {
        const item = persistedItems[i];
        const { data: masterData } = await supabase.from('quest_equipment').select('id').eq('name', item.name).single();
        if (masterData) {
            const { data: inserted, error } = await supabase.from('quest_player_equipment').insert({
                fid: fid,
                equipment_id: masterData.id
            }).select('player_eid').single();

            if (!error && inserted) {
                persistedItems[i].id = inserted.player_eid.toString();
            }
        }
      }

      // Update stats
      const { error: statError } = await supabase.rpc('increment_player_stat', { 
          player_fid: fid, 
          column_name: 'gacha_equipment_count', 
          amount: items.length 
      });

      if (statError) {
          const { data } = await supabase.from('quest_player_stats').select('gacha_equipment_count').eq('fid', fid).single();
          if (data) {
              await supabase.from('quest_player_stats').update({ gacha_equipment_count: (data.gacha_equipment_count || 0) + items.length }).eq('fid', fid);
          }
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
           // ID is already updated to DB ID if persisted, or random string if local
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
            equipmentIds: ['', '', '']
          };
        });
        next.heroes = [...prev.heroes, ...newHeroes];
      } else {
        const newEquipment = items.map(result => ({
            id: result.id || Math.random().toString(),
            name: result.name,
            type: result.type,
            bonus: result.bonus,
            rarity: result.rarity
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
      const result = await rollGachaItem(tab);
      
      // Persist to DB
      const persisted = await persistGachaResults(tab, [result]);
      
      setGachaResult({ type: tab, data: persisted });
      setGameState(prev => ({ ...prev, tokens: prev.tokens - cost }));
      processGachaItems(tab, persisted);
      
      // Refetch Balance after cost deduction
      if (refetchBalance) refetchBalance();

    } catch (e) {
      console.error(e);
      showNotification("ガチャ処理中にエラーが発生しました", 'error');
    } finally {
      setIsGachaRolling(false);
    }
  };

  const rollGachaTriple = async (tab: 'Hero' | 'Equipment') => {
    const baseCost = tab === 'Hero' ? 10000 : 6000;
    // Reverted: Cost is 5x base (50,000 or 30,000) despite being 3 pulls, as per original design/user request.
    const cost = baseCost * 5; 

    if (gameState.tokens < cost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`, 'error');
      return;
    }
    playConfirm();
    setIsGachaRolling(true);

    try {
      const results = await Promise.all([
        rollGachaItem(tab, undefined),
        rollGachaItem(tab, undefined),
        rollGachaItem(tab, 'R')
      ]);

      const persisted = await persistGachaResults(tab, results);

      setGachaResult({ type: tab, data: persisted });
      setGameState(prev => ({ ...prev, tokens: prev.tokens - cost }));
      processGachaItems(tab, persisted);
      
      // Refetch Balance
      if (refetchBalance) refetchBalance();

    } catch (e) {
      console.error(e);
      showNotification("ガチャ処理中にエラーが発生しました", 'error');
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
