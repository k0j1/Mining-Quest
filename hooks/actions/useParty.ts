
import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../../types';
import { playClick, playConfirm, playError } from '../../utils/sound';

interface UsePartyProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
}

export const useParty = ({ gameState, setGameState, showNotification }: UsePartyProps) => {

  const equipItem = (heroId: string, slotIndex: number, equipmentId: string | null) => {
    playConfirm();
    setGameState(prev => ({
      ...prev,
      heroes: prev.heroes.map(h => h.id === heroId ? {
        ...h,
        equipmentIds: h.equipmentIds.map((eid, idx) => idx === slotIndex ? (equipmentId || '') : eid)
      } : h)
    }));
  };

  const switchParty = (index: number) => {
    playClick();
    setGameState(prev => ({ ...prev, activePartyIndex: index }));
  };

  const unlockParty = (index: number) => {
    const cost = 10000;
    if (gameState.tokens < cost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`, 'error');
      return;
    }
    playConfirm();
    setGameState(prev => {
      const newUnlocked = [...prev.unlockedParties];
      newUnlocked[index] = true;
      return { ...prev, tokens: prev.tokens - cost, unlockedParties: newUnlocked, activePartyIndex: index };
    });
  };

  const assignHeroToParty = (slotIndex: number, heroId: string | null) => {
    playConfirm();
    setGameState(prev => {
      const newPresets = [...prev.partyPresets];
      const activeParty = [...newPresets[prev.activePartyIndex]];
      if (heroId) {
        const existingIdx = activeParty.indexOf(heroId);
        if (existingIdx !== -1) activeParty[existingIdx] = null;
      }
      activeParty[slotIndex] = heroId;
      newPresets[prev.activePartyIndex] = activeParty;
      return { ...prev, partyPresets: newPresets };
    });
  };

  return { equipItem, switchParty, unlockParty, assignHeroToParty };
};
