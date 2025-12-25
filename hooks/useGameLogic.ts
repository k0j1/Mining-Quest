import { useState } from 'react';
import { Hero, Equipment, Quest, GameState, QuestRank } from '../types';
import { INITIAL_HEROES, INITIAL_EQUIPMENT, QUEST_CONFIG } from '../constants';
import { generateGachaItem } from '../services/geminiService';
import { playClick, playConfirm, playDepart, playError } from '../utils/sound';

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    tokens: 50000, 
    heroes: INITIAL_HEROES,
    equipment: INITIAL_EQUIPMENT,
    activeQuests: [],
    activePartyIndex: 0,
    unlockedParties: [true, false, false],
    // Initial Party 1 has first 3 heroes. Party 2/3 are empty.
    partyPresets: [
      [INITIAL_HEROES[0].id, INITIAL_HEROES[1].id, INITIAL_HEROES[2].id],
      [null, null, null],
      [null, null, null]
    ]
  });

  const [gachaResult, setGachaResult] = useState<{ type: 'Hero' | 'Equipment'; data: any } | null>(null);
  const [isGachaRolling, setIsGachaRolling] = useState(false);
  const [returnResult, setReturnResult] = useState<{ results: any[], totalTokens: number } | null>(null);

  // Helper to get actual hero objects for the current active party
  const getActivePartyHeroes = (): Hero[] => {
    const currentPreset = gameState.partyPresets[gameState.activePartyIndex];
    return currentPreset
      .map(id => gameState.heroes.find(h => h.id === id))
      .filter((h): h is Hero => !!h);
  };

  const getEquipmentEffect = (hero: Hero, type: 'Pickaxe' | 'Helmet' | 'Boots'): number => {
    let slotIndex = -1;
    if (type === 'Pickaxe') slotIndex = 0;
    if (type === 'Helmet') slotIndex = 1;
    if (type === 'Boots') slotIndex = 2;

    const equipId = hero.equipmentIds[slotIndex];
    if (!equipId) return 0;
    
    const equip = gameState.equipment.find(e => e.id === equipId);
    return equip ? equip.bonus : 0;
  };

  const depart = (rank: QuestRank) => {
    playClick();
    const config = QUEST_CONFIG[rank];
    const partyHeroes = getActivePartyHeroes();

    if (partyHeroes.length === 0) {
      playError();
      alert("パーティにヒーローがいません！編成してください。");
      return false;
    }

    if (gameState.tokens < config.burnCost) {
      playError();
      alert(`トークンが足りません！ (必要: ${config.burnCost} $CHH)`);
      return false;
    }

    if (partyHeroes.some(h => h.hp <= 0)) {
      playError();
      alert("HPが0のヒーローが編成に含まれています。回復してください。");
      return false;
    }

    if (rank === 'E' && config.minHpReq) {
      if (partyHeroes.some(h => h.hp < config.minHpReq!)) {
        playError();
        alert(`ランクEのクエストに出発するには、編成全員のHPが${config.minHpReq}以上必要です。`);
        return false;
      }
    }

    const totalBootsBonus = partyHeroes.reduce((acc, hero) => acc + getEquipmentEffect(hero, 'Boots'), 0);
    const reductionMultiplier = Math.max(0.1, 1 - (totalBootsBonus / 100));
    const actualDuration = Math.floor(config.duration * reductionMultiplier);

    const newQuest: Quest = {
      id: Math.random().toString(),
      name: config.name,
      rank: rank,
      duration: config.duration,
      actualDuration: actualDuration,
      endTime: Date.now() + actualDuration * 1000,
      reward: Math.floor((config.minReward + config.maxReward) / 2),
      status: 'active',
      heroIds: partyHeroes.map(h => h.id)
    };

    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - config.burnCost,
      activeQuests: [...prev.activeQuests, newQuest]
    }));

    playDepart();
    const durationMsg = reductionMultiplier < 1 
      ? `(装備効果で ${(config.duration/60).toFixed(0)}分 → ${(actualDuration/60).toFixed(1)}分 に短縮！)` 
      : ``;
    alert(`${config.name}へ出発しました！\n所要時間: ${(actualDuration/60).toFixed(1)}分 ${durationMsg}`);
    return true;
  };

  const returnFromQuest = () => {
    const now = Date.now();
    const completed = gameState.activeQuests.filter(q => q.endTime <= now);
    
    if (completed.length === 0) {
      playError();
      alert("まだ完了したクエストはありません。タイマーの終了をお待ちください。");
      return false;
    }

    let totalReward = 0;
    const resultList: any[] = [];
    let deadHeroes: string[] = [];
    const newHeroes = [...gameState.heroes];

    completed.forEach(quest => {
      const config = QUEST_CONFIG[quest.rank];
      const logs: string[] = [];
      
      // Calculate bonus based on the heroes who actually went
      const questHeroes = quest.heroIds
        .map(id => newHeroes.find(h => h.id === id))
        .filter((h): h is Hero => !!h);

      const partyPickaxeBonus = questHeroes.reduce((acc, h) => {
         return acc + getEquipmentEffect(h, 'Pickaxe');
      }, 0);

      const baseReward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
      const bonusReward = Math.floor(baseReward * (partyPickaxeBonus / 100));
      const finalReward = baseReward + bonusReward;
      
      totalReward += finalReward;

      questHeroes.forEach(hero => {
        // Find current index in the main hero array
        const idx = newHeroes.findIndex(h => h.id === hero.id);
        if (idx === -1) return;
        if (deadHeroes.includes(hero.id)) return;

        if (config.deathChance > 0 && Math.random() < config.deathChance) {
           deadHeroes.push(hero.id);
           logs.push(`💀 悲報: ${hero.name} は帰らぬ犬となりました...`);
        } else {
           const rawDmg = Math.floor(Math.random() * (config.maxDmg - config.minDmg + 1)) + config.minDmg;
           const helmetBonus = getEquipmentEffect(hero, 'Helmet');
           const totalReduction = hero.damageReduction + helmetBonus;
           
           let finalDmg = rawDmg;
           let reductionMsg = "";
           
           if (totalReduction > 0) {
             const reduceAmount = Math.ceil(rawDmg * (totalReduction / 100));
             finalDmg = Math.max(0, rawDmg - reduceAmount);
             reductionMsg = `(軽減 -${reduceAmount})`;
           }

           const currentHp = hero.hp;
           const newHp = Math.max(0, currentHp - finalDmg);
           newHeroes[idx] = { ...hero, hp: newHp };
           logs.push(`💥 ${hero.name}: -${finalDmg} HP ${reductionMsg} (残: ${newHp})`);
        }
      });
      
      resultList.push({
        questName: quest.name,
        rank: quest.rank,
        totalReward: finalReward,
        baseReward: baseReward,
        bonusReward: bonusReward,
        logs: logs
      });
    });

    // Remove dead heroes from everything
    const survivors = newHeroes.filter(h => !deadHeroes.includes(h.id));
    
    // Clean up presets to remove dead heroes
    const newPresets = gameState.partyPresets.map(preset => 
      preset.map(id => (id && deadHeroes.includes(id)) ? null : id)
    );

    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens + totalReward,
      heroes: survivors,
      activeQuests: prev.activeQuests.filter(q => q.endTime > now),
      partyPresets: newPresets
    }));

    setReturnResult({
      results: resultList,
      totalTokens: totalReward
    });
    return true;
  };

  const usePotion = (heroId: string) => {
    const COST = 200;
    const RECOVER_AMOUNT = 10;
    
    if (gameState.tokens < COST) {
      playError();
      alert("トークンが足りません！");
      return;
    }

    playConfirm();
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - COST,
      heroes: prev.heroes.map(h => {
        if (h.id === heroId) {
          const newHp = Math.min(h.maxHp, h.hp + RECOVER_AMOUNT);
          return { ...h, hp: newHp };
        }
        return h;
      })
    }));
  };

  const useElixir = (heroId: string) => {
    const COST = 1200;
    
    if (gameState.tokens < COST) {
      playError();
      alert("トークンが足りません！");
      return;
    }

    playConfirm();
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - COST,
      heroes: prev.heroes.map(h => {
        if (h.id === heroId) {
          return { ...h, hp: h.maxHp };
        }
        return h;
      })
    }));
  };

  const rollGacha = async (tab: 'Hero' | 'Equipment') => {
    const cost = tab === 'Hero' ? 10000 : 6000;
    if (gameState.tokens < cost) {
      playError();
      alert(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`);
      return;
    }

    playConfirm();
    setIsGachaRolling(true);
    try {
      const result = await generateGachaItem(tab);
      if (result) {
        setGachaResult({ type: tab, data: result });
        
        setGameState(prev => {
          const nextState = { ...prev, tokens: prev.tokens - cost };
          if (tab === 'Hero') {
            const newHero: Hero = {
              id: Math.random().toString(),
              name: result.name || "謎の動物",
              species: result.species || "Other",
              rarity: result.rarity || 'C',
              trait: result.trait || "なし",
              damageReduction: result.damageReduction || 0,
              level: 1,
              hp: 100,
              maxHp: 100,
              imageUrl: `https://picsum.photos/seed/${Math.random()}/300/400`,
              equipmentIds: ['', '', '']
            };
            nextState.heroes = [...prev.heroes, newHero];
          } else {
            const newEquip: Equipment = {
              id: Math.random().toString(),
              name: result.name || "謎の装備",
              type: result.type || 'Pickaxe',
              bonus: result.bonus || 0,
              rarity: result.rarity || 'C'
            };
            nextState.equipment = [...prev.equipment, newEquip];
          }
          return nextState;
        });
      }
    } finally {
      setIsGachaRolling(false);
    }
  };

  // --- Party Management Actions ---

  const switchParty = (index: number) => {
    if (index < 0 || index > 2) return;
    if (!gameState.unlockedParties[index]) {
       playError();
       return;
    }
    playClick();
    setGameState(prev => ({ ...prev, activePartyIndex: index }));
  };

  const unlockParty = (index: number) => {
    const COST = 10000;
    if (gameState.tokens < COST) {
      playError();
      alert(`トークンが足りません (必要: ${COST.toLocaleString()} $CHH)`);
      return;
    }
    playConfirm();
    setGameState(prev => {
      const newUnlocked = [...prev.unlockedParties];
      newUnlocked[index] = true;
      return {
        ...prev,
        tokens: prev.tokens - COST,
        unlockedParties: newUnlocked,
        activePartyIndex: index // Auto switch to new party
      };
    });
  };

  const assignHeroToParty = (slotIndex: number, heroId: string | null) => {
    const currentPreset = [...gameState.partyPresets];
    const activeParty = [...currentPreset[gameState.activePartyIndex]];
    
    // Check if hero is already in another slot of this party, if so, remove them from there
    if (heroId) {
      const existingIndex = activeParty.indexOf(heroId);
      if (existingIndex !== -1 && existingIndex !== slotIndex) {
        activeParty[existingIndex] = null;
      }
    }

    activeParty[slotIndex] = heroId;
    currentPreset[gameState.activePartyIndex] = activeParty;

    playConfirm();
    setGameState(prev => ({
      ...prev,
      partyPresets: currentPreset
    }));
  };

  const equipItem = (heroId: string, slotIndex: number, equipmentId: string | null) => {
    // Check logic guard in view mostly, but here we just update state
    playConfirm();
    setGameState(prev => ({
      ...prev,
      heroes: prev.heroes.map(hero => {
        if (hero.id !== heroId) return hero;
        const newEquipIds = [...hero.equipmentIds];
        if (equipmentId === null) {
          newEquipIds[slotIndex] = '';
        } else {
          newEquipIds[slotIndex] = equipmentId;
        }
        return { ...hero, equipmentIds: newEquipIds };
      })
    }));
  };

  const debugAddTokens = () => {
    setGameState(prev => ({ ...prev, tokens: prev.tokens + 10000 }));
    playConfirm();
  };

  return {
    gameState,
    ui: {
      gachaResult,
      setGachaResult,
      isGachaRolling,
      returnResult,
      setReturnResult
    },
    actions: {
      depart,
      returnFromQuest,
      usePotion,
      useElixir,
      rollGacha,
      equipItem,
      switchParty,
      unlockParty,
      assignHeroToParty,
      debugAddTokens
    }
  };
};