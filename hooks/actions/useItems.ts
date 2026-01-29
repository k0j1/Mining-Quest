
import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../../types';
import { playConfirm, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';

interface UseItemsProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  farcasterUser?: any;
}

export const useItems = ({ gameState, setGameState, showNotification, farcasterUser }: UseItemsProps) => {

  const updateHeroHpDB = async (heroId: string, newHp: number) => {
    if (!farcasterUser?.fid) return;
    
    // Get current recovery count
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
    showNotification(`${hero.name}を全回復しました`, 'success');
  };

  return { usePotion, useElixir };
};
