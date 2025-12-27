
import { useState, useEffect } from 'react';
import { Hero, Equipment, Quest, GameState, QuestRank } from '../types';
import { INITIAL_HEROES, INITIAL_EQUIPMENT, QUEST_CONFIG } from '../constants';
import { generateGachaItem } from '../services/geminiService';
import { playClick, playConfirm, playDepart, playError } from '../utils/sound';
import { sdk } from '@farcaster/frame-sdk';

const CHH_CONTRACT_ADDRESS = '0xb0525542E3D818460546332e76E511562dFf9B07';
const BASE_RPC_URL = 'https://mainnet.base.org';

export const useGameLogic = () => {
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

  const [gachaResult, setGachaResult] = useState<{ type: 'Hero' | 'Equipment'; data: any } | null>(null);
  const [isGachaRolling, setIsGachaRolling] = useState(false);
  const [returnResult, setReturnResult] = useState<{ results: any[], totalTokens: number } | null>(null);
  
  // Farcaster State
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [onChainBalanceRaw, setOnChainBalanceRaw] = useState<number | null>(null);

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        // 先にreadyを呼び出し、完了を待つ
        await sdk.actions.ready();
        
        // ready後にコンテキストを取得
        const context = await sdk.context;
        console.log("Farcaster Context Raw:", context);

        if (context?.user) {
          const u = context.user as any;
          
          // PFPのURL取得
          const pfpUrl = u.pfpUrl || u.pfp_url || "";
          
          // ウォレットアドレス取得の優先順位: 
          // 1. 検証済みアドレス配列の1番目 
          // 2. カストディアドレス (Hub等)
          // 3. トップレベルのaddressプロパティ (一部SDKバージョン)
          const ethAddress = 
            u.verifiedAddresses?.ethAddresses?.[0] || 
            u.custodyAddress || 
            u.address;

          console.log("Farcaster User Found:", u.username);
          console.log("Extracted ETH Address:", ethAddress);

          const user = {
            ...u,
            pfpUrl,
            address: ethAddress
          };
          
          setFarcasterUser(user);
          
          if (ethAddress) {
            fetchBalance(ethAddress);
          } else {
            console.warn("No valid ETH address found for user:", u.username);
          }
        }
      } catch (e) {
        console.error("Farcaster SDK Initialization Error:", e);
      }
    };
    initFarcaster();
  }, []);

  const fetchBalance = async (address: string) => {
    console.log("Fetching balance for address:", address);
    try {
      const response = await fetch(BASE_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: CHH_CONTRACT_ADDRESS,
            // standard balanceOf(address) selector: 0x70a08231
            data: '0x70a08231' + address.replace('0x', '').toLowerCase().padStart(64, '0')
          }, 'latest']
        })
      });
      const result = await response.json();
      if (result.result && result.result !== '0x') {
        const balanceBigInt = BigInt(result.result);
        const numericBalance = Number(balanceBigInt) / 1e18;
        console.log("CHH Balance Found:", numericBalance);
        setOnChainBalanceRaw(numericBalance);
      } else {
        console.log("CHH Balance is 0 or result empty");
        setOnChainBalanceRaw(0);
      }
    } catch (e) {
      console.error("Balance fetch error:", e);
    }
  };

  const depart = (rank: QuestRank) => {
    playClick();
    const config = QUEST_CONFIG[rank];
    const currentPreset = gameState.partyPresets[gameState.activePartyIndex];
    const partyHeroes = currentPreset
      .map(id => gameState.heroes.find(h => h.id === id))
      .filter((h): h is Hero => !!h);

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

    const totalBootsBonus = partyHeroes.reduce((acc, hero) => {
      const equipId = hero.equipmentIds[2];
      const equip = gameState.equipment.find(e => e.id === equipId);
      return acc + (equip ? equip.bonus : 0);
    }, 0);
    
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
    return true;
  };

  const returnFromQuest = () => {
    const now = Date.now();
    const completed = gameState.activeQuests.filter(q => q.endTime <= now);
    
    if (completed.length === 0) {
      playError();
      alert("まだ完了したクエストはありません。");
      return false;
    }

    let totalReward = 0;
    const resultList: any[] = [];
    const newHeroes = [...gameState.heroes];
    let deadHeroIds: string[] = [];

    completed.forEach(quest => {
      const config = QUEST_CONFIG[quest.rank];
      const logs: string[] = [];
      const questHeroes = quest.heroIds
        .map(id => newHeroes.find(h => h.id === id))
        .filter((h): h is Hero => !!h);

      const partyPickaxeBonus = questHeroes.reduce((acc, h) => {
        const equip = gameState.equipment.find(e => e.id === h.equipmentIds[0]);
        return acc + (equip ? equip.bonus : 0);
      }, 0);

      const baseReward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
      const bonusReward = Math.floor(baseReward * (partyPickaxeBonus / 100));
      const finalReward = baseReward + bonusReward;
      totalReward += finalReward;

      questHeroes.forEach(hero => {
        const idx = newHeroes.findIndex(h => h.id === hero.id);
        if (idx === -1) return;

        if (config.deathChance > 0 && Math.random() < config.deathChance) {
          deadHeroIds.push(hero.id);
          logs.push(`💀 悲報: ${hero.name} は帰らぬ犬となりました...`);
        } else {
          const rawDmg = Math.floor(Math.random() * (config.maxDmg - config.minDmg + 1)) + config.minDmg;
          const helmetEquip = gameState.equipment.find(e => e.id === hero.equipmentIds[1]);
          const helmetBonus = helmetEquip ? helmetEquip.bonus : 0;
          const totalReduction = hero.damageReduction + helmetBonus;
          
          let finalDmg = rawDmg;
          if (totalReduction > 0) {
            finalDmg = Math.max(0, rawDmg - Math.ceil(rawDmg * (totalReduction / 100)));
          }

          const newHp = Math.max(0, hero.hp - finalDmg);
          newHeroes[idx] = { ...hero, hp: newHp };
          logs.push(`💥 ${hero.name}: -${finalDmg} HP (残: ${newHp})`);
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

    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens + totalReward,
      heroes: newHeroes.filter(h => !deadHeroIds.includes(h.id)),
      activeQuests: prev.activeQuests.filter(q => q.endTime > now),
      partyPresets: prev.partyPresets.map(p => p.map(id => (id && deadHeroIds.includes(id)) ? null : id))
    }));

    setReturnResult({ results: resultList, totalTokens: totalReward });
    return true;
  };

  const rollGacha = async (tab: 'Hero' | 'Equipment') => {
    const cost = tab === 'Hero' ? 10000 : 6000;
    if (gameState.tokens < cost) {
      playError();
      return;
    }
    playConfirm();
    setIsGachaRolling(true);
    try {
      const result = await generateGachaItem(tab);
      setGachaResult({ type: tab, data: result });
      setGameState(prev => {
        const next = { ...prev, tokens: prev.tokens - cost };
        if (tab === 'Hero') {
          next.heroes = [...prev.heroes, {
            id: Math.random().toString(),
            name: result.name,
            species: result.species,
            rarity: result.rarity,
            trait: result.trait,
            damageReduction: result.damageReduction,
            level: 1, hp: 100, maxHp: 100,
            imageUrl: `https://picsum.photos/seed/${Math.random()}/300/400`,
            equipmentIds: ['', '', '']
          }];
        } else {
          next.equipment = [...prev.equipment, {
            id: Math.random().toString(),
            name: result.name,
            type: result.type,
            bonus: result.bonus,
            rarity: result.rarity
          }];
        }
        return next;
      });
    } finally {
      setIsGachaRolling(false);
    }
  };

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
    if (gameState.tokens < cost) return;
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

  // Recover 10 HP for 200 tokens
  const usePotion = (heroId: string) => {
    const cost = 200;
    if (gameState.tokens < cost) {
      playError();
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
  };

  // Recover to Max HP for 1200 tokens
  const useElixir = (heroId: string) => {
    const cost = 1200;
    if (gameState.tokens < cost) {
      playError();
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
  };

  return {
    gameState,
    farcasterUser,
    onChainBalanceRaw,
    ui: { gachaResult, setGachaResult, isGachaRolling, returnResult, setReturnResult },
    actions: { 
      depart, 
      returnFromQuest, 
      rollGacha, 
      equipItem, 
      switchParty, 
      unlockParty, 
      assignHeroToParty, 
      usePotion,
      useElixir,
      debugAddTokens: () => setGameState(p => ({ ...p, tokens: p.tokens + 10000 })) 
    }
  };
};
