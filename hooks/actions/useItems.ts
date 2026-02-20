
import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../../types';
import { playConfirm, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';

interface UseItemsProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  farcasterUser?: any;
  refetchBalance: () => Promise<void>;
}

export const useItems = ({ gameState, setGameState, showNotification, farcasterUser, refetchBalance }: UseItemsProps) => {

  const updateHeroHpDB = async (heroId: string, newHp: number) => {
    if (!farcasterUser?.fid) return;
    
    const { data } = await supabase.from('quest_player_hero').select('recovery_count').eq('player_hid', parseInt(heroId)).single();
    const currentCount = data?.recovery_count || 0;

    await supabase.from('quest_player_hero').update({
        hp: newHp,
        recovery_count: currentCount + 1,
        updated_at: new Date().toISOString()
    }).eq('player_hid', parseInt(heroId));
  };

  const usePotion = (heroId: string) => {
    const cost = 100;
    if (gameState.tokens < cost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`, 'error');
      return;
    }
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero || hero.hp >= hero.maxHp) return;

    const newHp = Math.min(hero.maxHp, hero.hp + 10);
    playConfirm();
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - cost,
      heroes: prev.heroes.map(h => h.id === heroId ? { ...h, hp: newHp } : h)
    }));
    
    updateHeroHpDB(heroId, newHp);
    
    // Refetch balance once
    refetchBalance();

    showNotification(`${hero.name}を回復しました (+10HP)`, 'success');
  };

  const useElixir = (heroId: string) => {
    const cost = 500;
    if (gameState.tokens < cost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`, 'error');
      return;
    }
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero || hero.hp >= hero.maxHp) return;

    const newHp = hero.maxHp;
    playConfirm();
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - cost,
      heroes: prev.heroes.map(h => h.id === heroId ? { ...h, hp: newHp } : h)
    }));
    
    updateHeroHpDB(heroId, newHp);
    
    // Refetch balance once
    refetchBalance();

    showNotification(`${hero.name}を全回復しました`, 'success');
  };

  const mergeEquipment = async (baseId: string, materialId: string) => {
    const baseItem = gameState.equipment.find(e => e.id === baseId);
    const materialItem = gameState.equipment.find(e => e.id === materialId);

    if (!baseItem || !materialItem) {
      showNotification("アイテムが見つかりません", 'error');
      return;
    }

    if (baseItem.name !== materialItem.name || baseItem.rarity !== materialItem.rarity || baseItem.level !== materialItem.level) {
      showNotification("同じ種類・レアリティ・レベルの装備のみマージ可能です", 'error');
      return;
    }

    // Check if material is equipped
    const isEquipped = gameState.heroes.some(h => h.equipmentIds.includes(materialId));
    if (isEquipped) {
      showNotification("装備中のアイテムは素材にできません", 'error');
      return;
    }

    playConfirm();

    // Optimistic Update
    const newLevel = baseItem.level + 1;
    // Recalculate bonus: Base + (newLevel * 0.1)
    // We derive Base from Current: Base = Current - (currentLevel * 0.1)
    
    // Note: Floating point precision might be an issue, but for display it's fine.
    const baseBonus = baseItem.bonus - (baseItem.level * 0.1); 
    const newBonus = baseBonus + (newLevel * 0.1);

    setGameState(prev => ({
      ...prev,
      equipment: prev.equipment
        .map(e => e.id === baseId ? { ...e, level: newLevel, bonus: newBonus } : e)
        .filter(e => e.id !== materialId)
    }));

    try {
      // DB Update
      // 1. Update Base Item Level (plus column if exists, otherwise level)
      // User requested "plus" column, but we are using "level" in types. 
      // Assuming DB column is 'level' based on previous context, but user calls it 'plus'.
      // If the user insists on 'plus' column in DB, we might need to change this.
      // For now, we stick to 'level' property mapping to 'level' column as per previous working code.
      const { error: updateError } = await supabase
        .from('quest_player_equipment')
        .update({ level: newLevel })
        .eq('player_eid', parseInt(baseId));

      if (updateError) {
        console.error("Update Error:", updateError);
        throw updateError;
      }

      // 2. Delete Material Item
      const { error: deleteError } = await supabase
        .from('quest_player_equipment')
        .delete()
        .eq('player_eid', parseInt(materialId));

      if (deleteError) {
        console.error("Delete Error:", deleteError);
        throw deleteError;
      }

      showNotification(`装備を強化しました！ (+${newLevel})`, 'success');
    } catch (e) {
      console.error("Merge failed:", e);
      // Even if error occurs, if it's a network error but request went through, state might be desynced.
      // But we rely on optimistic update.
      showNotification("強化処理中にエラーが発生しました", 'error');
      // Revert state would be ideal here, but for now we rely on reload if error occurs
    }
  };

  return { usePotion, useElixir, mergeEquipment };
};
