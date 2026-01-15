
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

  const [gachaResult, setGachaResult] = useState<{ type: 'Hero' | 'Equipment'; data: any[] } | null>(null);
  const [isGachaRolling, setIsGachaRolling] = useState(false);
  const [returnResult, setReturnResult] = useState<{ results: any[], totalTokens: number } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  
  // Farcaster State
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [onChainBalanceRaw, setOnChainBalanceRaw] = useState<number | null>(null);

  useEffect(() => {
    const initFarcasterContext = async () => {
      try {
        // sdk.contextはPromiseとして定義されているため、awaitで待機
        if (sdk && sdk.context) {
            const context = await sdk.context;
            console.log("SDK Context Loaded:", context);
            
            // ユーザー情報が含まれているか確認
            if (context?.user) {
              const u = context.user as any;
              console.log("Raw User Data:", JSON.stringify(u));

              const pfpUrl = u.pfpUrl || u.pfp_url || "";
              
              // アドレス取得ロジックの改善
              let ethAddress: string | null = null;
              
              // 1. Verified Addresses (通常は文字列の配列)
              if (Array.isArray(u.verifiedAddresses) && u.verifiedAddresses.length > 0) {
                ethAddress = u.verifiedAddresses[0];
              } 
              // 2. Custody Address (カストディアドレス)
              else if (u.custodyAddress) {
                ethAddress = u.custodyAddress;
              }
              // 3. Fallback: 古い形式や直接のaddressプロパティ
              else if (u.address) {
                ethAddress = u.address;
              }

              // アドレス形式の正規化 (0x付与)
              if (ethAddress && !ethAddress.startsWith('0x')) {
                ethAddress = `0x${ethAddress}`;
              }

              console.log("Resolved ETH Address:", ethAddress);

              // ユーザーオブジェクトを正規化して保存
              // addressプロパティに決定したアドレスをセットする
              const user = {
                ...u,
                pfpUrl,
                address: ethAddress,
                username: u.username || 'Unknown Miner'
              };
              
              setFarcasterUser(user);

              if (ethAddress) {
                // Fetch balance non-blocking
                fetchBalance(ethAddress).catch(e => {
                  console.warn("Balance fetch failed in catch:", e);
                  setOnChainBalanceRaw(0); // Error fallback
                });
              } else {
                 console.warn("No ETH address found for user");
                 setOnChainBalanceRaw(0);
              }
            } else {
              console.log("No user in Farcaster context");
            }
        } else {
          console.log("SDK context is null (Browser preview?)");
        }
      } catch (e: any) {
        console.warn("Farcaster Context initialization warning:", e);
        // 開発用にエラーが見えるようにする
        setNotification({ message: `FC Login Error: ${e.message}`, type: 'error' });
      }
    };
    initFarcasterContext();
  }, []);

  // オンチェーン残高が取得できた場合、ゲーム内トークンもその値に同期する
  useEffect(() => {
    if (onChainBalanceRaw !== null) {
      setGameState(prev => ({ ...prev, tokens: onChainBalanceRaw }));
    }
  }, [onChainBalanceRaw]);

  const fetchBalance = async (address: string) => {
    try {
      if (!address.startsWith('0x')) {
         console.warn("Invalid address format for balance fetch:", address);
         setOnChainBalanceRaw(0);
         return;
      }

      console.log(`Fetching balance for: ${address}`);

      const response = await fetch(BASE_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: CHH_CONTRACT_ADDRESS,
            data: '0x70a08231' + address.replace('0x', '').toLowerCase().padStart(64, '0')
          }, 'latest']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
         throw new Error(`RPC Error: ${result.error.message}`);
      }

      if (result.result && result.result !== '0x') {
        const balanceBigInt = BigInt(result.result);
        const numericBalance = Number(balanceBigInt) / 1e18;
        console.log(`Balance Fetched: ${numericBalance} CHH`);
        setOnChainBalanceRaw(numericBalance);
      } else {
        console.log("Balance result is 0x or empty, setting to 0");
        setOnChainBalanceRaw(0);
      }
    } catch (e: any) {
      console.error("Balance fetch error:", e);
      // RPCエラー等の場合は0を表示して、UIがローディング状態のままになるのを防ぐ
      setOnChainBalanceRaw(0);
    }
  };

  const showNotification = (message: string, type: 'error' | 'success') => {
    setNotification({ message, type });
  };

  const depart = (rank: QuestRank) => {
    playClick();
    const config = QUEST_CONFIG[rank];
    const currentPreset = gameState.partyPresets[gameState.activePartyIndex];
    const partyHeroes = currentPreset
      .map(id => gameState.heroes.find(h => h.id === id))
      .filter((h): h is Hero => !!h);

    if (partyHeroes.length < 3) {
      playError();
      showNotification("パーティは3人揃える必要があります！編成してください。", 'error');
      return false;
    }

    if (partyHeroes.some(h => h.hp <= 0)) {
      playError();
      showNotification("HPが0のヒーローがいます。回復してください。", 'error');
      return false;
    }

    if (gameState.tokens < config.burnCost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${config.burnCost.toLocaleString()} $CHH)`, 'error');
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
      showNotification("完了したクエストはありません。", 'error');
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
      let finalReward = baseReward + bonusReward;

      let survivors = 0;

      questHeroes.forEach(hero => {
        const idx = newHeroes.findIndex(h => h.id === hero.id);
        if (idx === -1) return;

        let isDead = false;

        if (config.deathChance > 0 && Math.random() < config.deathChance) {
          deadHeroIds.push(hero.id);
          logs.push(`💀 悲報: ${hero.name} は帰らぬ犬となりました...`);
          isDead = true;
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
          
          if (newHp === 0) {
            deadHeroIds.push(hero.id);
            logs.push(`💀 ${hero.name} は力尽きた... (HP 0)`);
            isDead = true;
          } else {
            logs.push(`💥 ${hero.name}: -${finalDmg} HP (残: ${newHp})`);
          }
        }

        if (!isDead) {
          survivors++;
        }
      });

      if (survivors === 0 && questHeroes.length > 0) {
        finalReward = 0;
        logs.push(`❌ パーティ全滅！クエスト失敗。報酬は得られません。`);
      } else {
        totalReward += finalReward;
      }

      resultList.push({
        questName: quest.name,
        rank: quest.rank,
        totalReward: finalReward,
        baseReward: finalReward === 0 ? 0 : baseReward,
        bonusReward: finalReward === 0 ? 0 : bonusReward,
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

  const processGachaItems = (tab: 'Hero' | 'Equipment', items: any[]) => {
    setGameState(prev => {
      const next = { ...prev };
      
      if (tab === 'Hero') {
        const newHeroes = items.map(result => {
           const rarityMaxHp: Record<string, number> = {
            C: 50, UC: 60, R: 70, E: 80, L: 100
          };
          const maxHp = rarityMaxHp[result.rarity as string] || 50;
          return {
            id: Math.random().toString(),
            name: result.name,
            species: result.species,
            rarity: result.rarity,
            trait: result.trait,
            damageReduction: result.damageReduction,
            level: 1, hp: maxHp, maxHp: maxHp,
            imageUrl: `https://picsum.photos/seed/${Math.random()}/300/400`,
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

  const debugCompleteQuest = (questId: string) => {
    setGameState(prev => ({
      ...prev,
      activeQuests: prev.activeQuests.map(q => 
        q.id === questId ? { ...q, endTime: Date.now() - 1000 } : q
      )
    }));
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
      debugAddTokens: () => {
        setGameState(p => ({ ...p, tokens: p.tokens + 10000 }));
        showNotification("デバッグ: 10,000 $CHHを追加しました", 'success');
      }
    }
  };
};
