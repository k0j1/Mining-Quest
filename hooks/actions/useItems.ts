
import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../../types';
import { playConfirm, playError } from '../../utils/sound';

interface UseItemsProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
}

export const useItems = ({ gameState, setGameState, showNotification }: UseItemsProps) => {

  const usePotion = (heroId: string) => {
    const cost = 200;
    if (gameState.tokens < cost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`, 'error');
      return;
    }
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero || hero.hp >= hero.maxHp) return;

    playConfirm();
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - cost,
      heroes: prev.heroes.map(h => h.id === heroId ? { ...h, hp: Math.min(h.maxHp, h.hp + 10) } : h)
    }));
    showNotification(`${hero.name}を回復しました (+10HP)`, 'success');
  };

  const useElixir = (heroId: string) => {
    const cost = 1200;
    if (gameState.tokens < cost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`, 'error');
      return;
    }
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero || hero.hp >= hero.maxHp) return;

    playConfirm();
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - cost,
      heroes: prev.heroes.map(h => h.id === heroId ? { ...h, hp: h.maxHp } : h)
    }));
    showNotification(`${hero.name}を全回復しました`, 'success');
  };

  return { usePotion, useElixir };
};
