
import { Dispatch, SetStateAction, useState } from 'react';
import { GameState } from '../../types';
import { generateGachaItem } from '../../services/geminiService';
import { playConfirm, playError } from '../../utils/sound';

interface UseGachaProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
}

export const useGacha = ({ gameState, setGameState, showNotification }: UseGachaProps) => {
  const [gachaResult, setGachaResult] = useState<{ type: 'Hero' | 'Equipment'; data: any[] } | null>(null);
  const [isGachaRolling, setIsGachaRolling] = useState(false);

  const processGachaItems = (tab: 'Hero' | 'Equipment', items: any[]) => {
    setGameState(prev => {
      const next = { ...prev };
      
      if (tab === 'Hero') {
        const newHeroes = items.map(result => {
           // Use HP from result if available (from hero_data), otherwise fallback
           const maxHp = result.hp || 50;
           
           return {
            id: Math.random().toString(),
            name: result.name,
            species: result.species,
            rarity: result.rarity,
            trait: result.trait,
            damageReduction: result.damageReduction,
            level: 1, 
            hp: maxHp, 
            maxHp: maxHp,
            imageUrl: result.imageUrl || `https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/${result.name}.png`,
            equipmentIds: ['', '', '']
          };
        });
        next.heroes = [...prev.heroes, ...newHeroes];
      } else {
        const newEquipment = items.map(result => ({
            id: Math.random().toString(),
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
      const result = await generateGachaItem(tab);
      setGachaResult({ type: tab, data: [result] });
      
      setGameState(prev => ({ ...prev, tokens: prev.tokens - cost }));
      processGachaItems(tab, [result]);

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
      const results = await Promise.all([
        generateGachaItem(tab, undefined),
        generateGachaItem(tab, undefined),
        generateGachaItem(tab, 'R')
      ]);

      setGachaResult({ type: tab, data: results });
      setGameState(prev => ({ ...prev, tokens: prev.tokens - cost }));
      processGachaItems(tab, results);

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
