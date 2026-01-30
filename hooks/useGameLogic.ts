
import { useState, useEffect } from 'react';
import { GameState, QuestConfig, QuestRank, Hero, Equipment, Quest } from '../types';
import { INITIAL_HEROES, INITIAL_EQUIPMENT } from '../constants';
import { supabase } from '../lib/supabase';

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
    questConfigs: [], // Will be populated from DB
    activePartyIndex: 0,
    unlockedParties: [true, false, false],
    partyPresets: [
      [null, null, null],
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

  // --- Fetch Quest Configs from DB ---
  useEffect(() => {
    const fetchQuestConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from('quest_mining')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          console.error("Error fetching quest configs:", error);
          return;
        }

        if (data) {
          const configs: QuestConfig[] = data.map((d: any) => ({
            rank: d.rank as QuestRank,
            name: d.name,
            duration: d.duration,
            minReward: d.min_reward,
            maxReward: d.max_reward,
            burnCost: d.burn_cost,
            minDmg: d.min_dmg,
            maxDmg: d.max_dmg,
            deathChance: d.death_chance,
            minHpReq: d.min_hp_req
          }));
          setGameState(prev => ({ ...prev, questConfigs: configs }));
        }
      } catch (err) {
        console.error("Failed to load quest configs", err);
      }
    };

    fetchQuestConfigs();
  }, []);

  // --- 1. Farcaster Integration ---
  const { farcasterUser, onChainBalanceRaw } = useFarcasterAuth(showNotification);

  // Sync On-chain balance to game tokens if available
  useEffect(() => {
    if (onChainBalanceRaw !== null) {
      setGameState(prev => ({ ...prev, tokens: onChainBalanceRaw }));
    }
  }, [onChainBalanceRaw]);

  // --- 1.5 Load Player Data from DB ---
  useEffect(() => {
    const loadPlayerState = async () => {
      if (!farcasterUser?.fid) return;

      const fid = farcasterUser.fid;
      console.log(`[useGameLogic] Starting DB fetch for FID: ${fid}`);

      try {
        // --- 1. Load Equipment (Manual Join) ---
        // Fetch Player Equipment
        const { data: playerEquips, error: peError } = await supabase
          .from('quest_player_equipment')
          .select('*')
          .eq('fid', fid);

        if (peError) {
             console.error("[useGameLogic] Player Equipment load error:", peError);
             throw peError;
        }
        
        // Fetch Master Equipment Data
        let loadedEquipment: Equipment[] = [];
        if (playerEquips && playerEquips.length > 0) {
            const equipIds = playerEquips.map((e: any) => e.equipment_id);
            // Deduplicate for query
            const uniqueEquipIds = [...new Set(equipIds)];
            
            const { data: masterEquips, error: meError } = await supabase
                .from('quest_equipment')
                .select('*')
                .in('id', uniqueEquipIds);
                
            if (meError) console.error("Master Equipment load error:", meError);
            
            // Map Map for fast lookup
            const masterMap = new Map<any, any>(masterEquips?.map((m: any) => [m.id, m]) || []);

            loadedEquipment = playerEquips.map((pe: any) => {
                const base = masterMap.get(pe.equipment_id);
                if (!base) return null;
                return {
                    id: pe.player_eid.toString(),
                    name: base.name,
                    type: base.type,
                    bonus: base.bonus,
                    rarity: base.rarity
                };
            }).filter((e): e is Equipment => e !== null);
        }

        // --- 2. Load Heroes (Manual Join) ---
        // Fetch Player Heroes
        const { data: playerHeroes, error: phError } = await supabase
          .from('quest_player_hero')
          .select('*')
          .eq('fid', fid);

        if (phError) {
             console.error("[useGameLogic] Player Hero load error:", phError);
             throw phError;
        }

        let loadedHeroes: Hero[] = [];
        if (playerHeroes && playerHeroes.length > 0) {
             const heroIds = playerHeroes.map((h: any) => h.hero_id);
             const uniqueHeroIds = [...new Set(heroIds)];

             const { data: masterHeroes, error: mhError } = await supabase
                 .from('quest_hero')
                 .select('*')
                 .in('id', uniqueHeroIds);

             if (mhError) console.error("Master Hero load error:", mhError);

             const masterHeroMap = new Map<any, any>(masterHeroes?.map((m: any) => [m.id, m]) || []);
             const drMap: Record<string, number> = { C: 2, UC: 5, R: 10, E: 15, L: 20 };

             loadedHeroes = playerHeroes.map((h: any) => {
                 const base = masterHeroMap.get(h.hero_id);
                 if (!base) return null;

                 return {
                    id: h.player_hid.toString(),
                    name: base.name,
                    species: base.species,
                    rarity: base.rarity,
                    trait: base.ability,
                    damageReduction: drMap[base.rarity] || 0,
                    level: 1,
                    hp: h.hp,
                    maxHp: base.hp,
                    imageUrl: `https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/s/${base.name}_s.png`,
                    equipmentIds: [
                      h.pickaxe_player_eid ? h.pickaxe_player_eid.toString() : '',
                      h.helmet_player_eid ? h.helmet_player_eid.toString() : '',
                      h.boots_player_eid ? h.boots_player_eid.toString() : ''
                    ]
                 };
             }).filter((h): h is Hero => h !== null);
        }

        // --- 3. Load Party ---
        const { data: partyData, error: partyError } = await supabase
          .from('quest_player_party')
          .select('*')
          .eq('fid', fid);

        if (partyError) {
             console.error("[useGameLogic] Party load error:", partyError);
        }

        const newPartyPresets: (string | null)[][] = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];
        const newUnlockedParties = [true, false, false];

        partyData?.forEach((p: any) => {
            const idx = p.party_no - 1; // 1-based in DB
            if (idx >= 0 && idx < 3) {
                newPartyPresets[idx] = [
                    p.hero1_id ? p.hero1_id.toString() : null,
                    p.hero2_id ? p.hero2_id.toString() : null,
                    p.hero3_id ? p.hero3_id.toString() : null
                ];
                newUnlockedParties[idx] = true; 
            }
        });

        // --- 4. Load Active Quests (Manual Join) ---
        const { data: questProcess, error: qpError } = await supabase
          .from('quest_process')
          .select('*')
          .eq('fid', fid)
          .eq('status', 'active');

        if (qpError) {
             console.error("[useGameLogic] Quest Process load error:", qpError);
        }
        
        let loadedQuests: Quest[] = [];
        if (questProcess && questProcess.length > 0) {
             const questIds = questProcess.map((q: any) => q.quest_id);
             const uniqueQuestIds = [...new Set(questIds)];

             const { data: masterQuests, error: mqError } = await supabase
                 .from('quest_mining')
                 .select('*')
                 .in('id', uniqueQuestIds);
                 
             if (mqError) console.error("Master Quest load error:", mqError);
             const masterQuestMap = new Map<any, any>(masterQuests?.map((m: any) => [m.id, m]) || []);

             loadedQuests = questProcess.map((q: any) => {
                 const base = masterQuestMap.get(q.quest_id);
                 if (!base) return null;

                 const startTime = new Date(q.start_time).getTime();
                 const endTime = new Date(q.end_time).getTime();
                 const actualDuration = Math.floor((endTime - startTime) / 1000);

                 // Identify Heroes in Party
                 const questPartyId = q.party_id;
                 let heroIds: string[] = [];
                 const matchedParty = partyData?.find((p: any) => p.party_id === questPartyId);

                 if (matchedParty) {
                    heroIds = [
                        matchedParty.hero1_id ? matchedParty.hero1_id.toString() : null,
                        matchedParty.hero2_id ? matchedParty.hero2_id.toString() : null,
                        matchedParty.hero3_id ? matchedParty.hero3_id.toString() : null
                    ].filter((id): id is string => !!id);
                 }

                 return {
                    id: q.quest_pid.toString(),
                    name: base.name,
                    rank: base.rank as QuestRank,
                    duration: base.duration,
                    actualDuration: actualDuration,
                    endTime: endTime,
                    reward: Math.floor((base.min_reward + base.max_reward) / 2),
                    status: 'active',
                    heroIds: heroIds
                 };
             }).filter((q): q is Quest => q !== null);
        }

        setGameState(prev => ({
            ...prev,
            heroes: loadedHeroes,
            equipment: loadedEquipment,
            partyPresets: newPartyPresets,
            unlockedParties: newUnlockedParties,
            activeQuests: loadedQuests
        }));
        
        console.log(`[useGameLogic] Data Loaded: ${loadedHeroes.length} Heroes, ${loadedEquipment.length} Equipment, ${loadedQuests.length} Quests`);

      } catch (e) {
        console.error("[useGameLogic] Failed to load player data from DB:", e);
      }
    };

    loadPlayerState();
  }, [farcasterUser?.fid]);
  

  // --- 2. Action Hooks ---
  
  // Quest Logic
  const { depart, returnFromQuest, debugCompleteQuest } = useQuest({
    gameState, setGameState, showNotification, setReturnResult, farcasterUser
  });

  // Gacha Logic
  const { gachaResult, setGachaResult, isGachaRolling, rollGacha, rollGachaTriple } = useGacha({
    gameState, setGameState, showNotification, farcasterUser
  });

  // Party Logic
  const { equipItem, switchParty, unlockParty, assignHeroToParty, swapPartyPositions } = useParty({
    gameState, setGameState, showNotification, farcasterUser
  });

  // Item Logic
  const { usePotion, useElixir } = useItems({
    gameState, setGameState, showNotification, farcasterUser
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
      swapPartyPositions,
      usePotion,
      useElixir,
      debugCompleteQuest,
      debugAddTokens
    }
  };
};
