
import { useState, useEffect } from 'react';
import { GameState } from '../types';
import { INITIAL_HEROES, INITIAL_EQUIPMENT } from '../constants';

// Sub-hooks
import { useFarcasterAuth } from './useFarcasterAuth';
import { useQuest } from './actions/useQuest';
import { useGacha } from './actions/useGacha';
import { useParty } from './actions/useParty';
import { useItems } from './actions/useItems';

export const useGameLogic = () => {
  // --- Central Game State ---
  const [gameState, setGameState] = useState<GameState>({
    tokens: 50000, 
    heroes: INITIAL_HEROES,
    equipment: INITIAL_EQUIPMENT,
    activeQuests: [],
    activePartyIndex: 0,
    unlockedParties: [true, false, false],
    partyPresets: [
      [INITIAL_HEROES[0].id, INITIAL_HEROES[1].id, INITIAL_HEROES[2].id],
      [null, null, null],
      [null, null, null]
    ]
  });

  // --- UI State ---
  const [returnResult, setReturnResult] = useState<{ results: any[], totalTokens: number } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Helper for notification
  const showNotification = (message: string, type: 'error' | 'success') => {
    setNotification({ message, type });
  };

  // --- 1. Farcaster Integration ---
  const { farcasterUser, onChainBalanceRaw } = useFarcasterAuth(showNotification);

  // Sync On-chain balance to game tokens if available
  useEffect(() => {
    if (onChainBalanceRaw !== null) {
      setGameState(prev => ({ ...prev, tokens: onChainBalanceRaw }));
    }
  }, [onChainBalanceRaw]);

  // --- 2. Action Hooks ---
  
  // Quest Logic
  const { depart, returnFromQuest, debugCompleteQuest } = useQuest({
    gameState, setGameState, showNotification, setReturnResult
  });

  // Gacha Logic
  const { gachaResult, setGachaResult, isGachaRolling, rollGacha, rollGachaTriple } = useGacha({
    gameState, setGameState, showNotification
  });

  // Party Logic
  const { equipItem, switchParty, unlockParty, assignHeroToParty } = useParty({
    gameState, setGameState, showNotification
  });

  // Item Logic
  const { usePotion, useElixir } = useItems({
    gameState, setGameState, showNotification
  });

  // Debug Actions
  const debugAddTokens = () => {
    setGameState(p => ({ ...p, tokens: p.tokens + 10000 }));
    showNotification("デバッグ: 10,000 $CHHを追加しました", 'success');
  };

  return {
    gameState,
    farcasterUser,
    onChainBalanceRaw,
    ui: { 
      gachaResult, setGachaResult, 
      isGachaRolling, 
      returnResult, setReturnResult,
      notification, setNotification 
    },
    actions: { 
      depart, 
      returnFromQuest, 
      rollGacha, 
      rollGachaTriple,
      equipItem, 
      switchParty, 
      unlockParty, 
      assignHeroToParty, 
      usePotion,
      useElixir,
      debugCompleteQuest,
      debugAddTokens
    }
  };
};
