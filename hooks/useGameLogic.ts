
import { useState, useEffect, useCallback } from 'react';
import { GameState, QuestConfig, QuestRank, Hero, Equipment, Quest, Species, QuestResult } from '../types';
import { INITIAL_HEROES, INITIAL_EQUIPMENT } from '../constants';
import { supabase } from '../lib/supabase';
import { getHeroImageUrl } from '../utils/heroUtils';

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
  const [returnResult, setReturnResult] = useState<{ results: QuestResult[], totalTokens: number } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  // Helper for notification
  // Memoized to prevent re-triggering effects in child hooks (like useFarcasterAuth)
  const showNotification = useCallback((message: string, type: 'error' | 'success') => {
    setNotification({ message, type });
  }, []);

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
            id: d.id, // Store Master ID (Required for Foreign Key)
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
  // Expose refetchBalance to pass to action hooks
  const { farcasterUser, onChainBalanceRaw, refetchBalance, isFrameAdded, addFrame } = useFarcasterAuth(showNotification);

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
        // --- 0. Check Block List ---
        const { data: blockData } = await supabase
          .from('blocked_users')
          .select('fid')
          .eq('fid', fid)
          .single();

        if (blockData) {
          console.warn(`[useGameLogic] User ${fid} is blocked.`);
          setIsBlocked(true);
          return; // Stop loading data
        }

        // --- 1. Load Equipment (Join) ---
        // Fetch Player Equipment with Inner Join to Master Data
        const { data: equipData, error: equipError } = await supabase
          .from('quest_player_equipment')
          .select('*, quest_equipment!inner(*)')
          .eq('fid', fid);

        if (equipError) {
            console.error("[useGameLogic] Equipment load error:", equipError);
        } else {
            console.log(`[useGameLogic] Equipment raw data count: ${equipData?.length || 0}`);
        }

        const loadedEquipment = ((equipData || []) as any[]).reduce<Equipment[]>((acc, e: any) => {
          // Handle Join: quest_equipment is usually an object here due to FK
          const base = Array.isArray(e.quest_equipment) ? e.quest_equipment[0] : e.quest_equipment;
          if (!base) return acc;
          
          acc.push({
            id: e.player_eid.toString(),
            name: base.name,
            type: base.type,
            // Calculate bonus based on level: +10% per level (plus * 0.1)
            bonus: Math.floor(base.bonus * (1 + (e.level || 0) * 0.1)),
            rarity: base.rarity,
            level: e.level || 0
          });
          return acc;
        }, []);

        // --- 2. Load Heroes (Join) ---
        // Fetch Player Heroes with Inner Join to Master Data
        const { data: heroData, error: heroError } = await supabase
          .from('quest_player_hero')
          .select('*, quest_hero!inner(*)')
          .eq('fid', fid);

        if (heroError) {
            console.error("[useGameLogic] Hero load error:", heroError);
        } else {
            console.log(`[useGameLogic] Hero raw data count: ${heroData?.length || 0}`);
        }
        
        const drMap: Record<string, number> = { C: 2, UC: 5, R: 10, E: 15, L: 20 };

        const loadedHeroes = ((heroData || []) as any[]).reduce<Hero[]>((acc, h: any) => {
          const base = Array.isArray(h.quest_hero) ? h.quest_hero[0] : h.quest_hero;
          if (!base) return acc;

          acc.push({
            id: h.player_hid.toString(),
            name: base.name,
            species: base.species as Species,
            rarity: base.rarity as QuestRank,
            trait: base.ability,
            damageReduction: drMap[base.rarity] || 0,
            level: 1,
            hp: h.hp,
            maxHp: base.hp,
            imageUrl: getHeroImageUrl(base.name, 's'),
            equipmentIds: [
              h.pickaxe_player_eid ? h.pickaxe_player_eid.toString() : '',
              h.helmet_player_eid ? h.helmet_player_eid.toString() : '',
              h.boots_player_eid ? h.boots_player_eid.toString() : ''
            ],
            // Map New Skill Columns
            skillQuest: base.skill_quest || 0,
            skillDamage: base.skill_damage || 0,
            skillTime: base.skill_time || 0,
            skillType: base.skill_type || 0
          });
          return acc;
        }, []);

        // --- 3. Load Party ---
        const { data: partyData, error: partyError } = await supabase
          .from('quest_player_party')
          .select('*')
          .eq('fid', fid);

        if (partyError) {
             console.error("[useGameLogic] Party load error:", partyError);
        } else {
             console.log(`[useGameLogic] Party raw data count: ${partyData?.length || 0}`);
        }

        const newPartyPresets: (string | null)[][]= [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];
        
        const newUnlockedParties = [true, false, false];

        partyData?.forEach((p: any) => {
            const idx = p.party_no - 1; // 1-based in DB
            if (idx >= 0 && idx < 3) {
                // CHANGED: Using herox_hid columns now
                newPartyPresets[idx] = [
                    p.hero1_hid ? p.hero1_hid.toString() : null,
                    p.hero2_hid ? p.hero2_hid.toString() : null,
                    p.hero3_hid ? p.hero3_hid.toString() : null
                ];
                newUnlockedParties[idx] = true; 
            }
        });

        // --- 4. Load Active Quests (Join) ---
        const { data: questData, error: questError } = await supabase
          .from('quest_process')
          .select('*, quest_mining!inner(*)')
          .eq('fid', fid)
          .eq('status', 'active');

        if (questError) {
            console.error("[useGameLogic] Quest load error:", questError);
        } else {
             console.log(`[useGameLogic] Active quests count: ${questData?.length || 0}`);
        }

        const loadedQuests = ((questData || []) as any[]).reduce<Quest[]>((acc, q: any) => {
            const base = Array.isArray(q.quest_mining) ? q.quest_mining[0] : q.quest_mining;
            if (!base) return acc;

            const startTime = new Date(q.start_time).getTime();
            const endTime = new Date(q.end_time).getTime();
            
            const actualDuration = Math.floor((endTime - startTime) / 1000);
            const duration = base.duration;

            const questPartyId = q.party_id;
            let heroIds: string[] = [];
            
            const matchedParty = partyData?.find((p: any) => p.party_id === questPartyId);
            
            if (matchedParty) {
                heroIds = [
                    matchedParty.hero1_hid ? matchedParty.hero1_hid.toString() : null,
                    matchedParty.hero2_hid ? matchedParty.hero2_hid.toString() : null,
                    matchedParty.hero3_hid ? matchedParty.hero3_hid.toString() : null
                ].filter((id): id is string => !!id);
            } else {
                console.warn("[useGameLogic] Could not find party config for quest", q.quest_pid);
            }

            // Map Pre-calculated Results
            const damages: Record<string, number> = {};
            if (heroIds[0]) damages[heroIds[0]] = q.hero1_damage || 0;
            if (heroIds[1]) damages[heroIds[1]] = q.hero2_damage || 0;
            if (heroIds[2]) damages[heroIds[2]] = q.hero3_damage || 0;

            acc.push({
                id: q.quest_pid.toString(),
                name: base.name,
                rank: base.rank as QuestRank,
                duration: duration,
                actualDuration: actualDuration,
                endTime: endTime,
                reward: Math.floor((base.min_reward + base.max_reward) / 2),
                status: 'active',
                heroIds: heroIds,
                results: {
                    baseReward: q.base_reward || 0,
                    addHeroReward: q.add_hero_reward || 0,
                    addEquipmentReward: q.add_equipment_reward || 0,
                    heroDamages: damages,
                    // FIX: Ensure ID is mapped from the process row (which points to mining table)
                    questMasterId: q.quest_id 
                }
            });
            return acc;
        }, []);

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
  

  // --- 2. Action Hooks (Pass refetchBalance to all hooks that consume tokens) ---
  
  // Quest Logic
  const { depart, returnFromQuest, debugCompleteQuest, getQuestPrediction, confirmQuestReturn } = useQuest({
    gameState, setGameState, showNotification, setReturnResult, farcasterUser, refetchBalance
  });

  // Gacha Logic
  const { gachaResult, setGachaResult, isGachaRolling, rollGacha, rollGachaTriple } = useGacha({
    gameState, setGameState, showNotification, farcasterUser, refetchBalance
  });

  // Party Logic
  const { equipItem, switchParty, unlockParty, assignHeroToParty, swapPartyPositions } = useParty({
    gameState, setGameState, showNotification, farcasterUser, refetchBalance
  });

  // Item Logic
  const { usePotion, useElixir, mergeEquipment } = useItems({
    gameState, setGameState, showNotification, farcasterUser, refetchBalance
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
    isBlocked, // Export Blocked State
    isFrameAdded, // Export Add Frame Status
    addFrame, // Export Add Frame Action
    ui: { 
      gachaResult, setGachaResult, 
      isGachaRolling, 
      returnResult, setReturnResult,
      notification, setNotification 
    },
    actions: { 
      depart, 
      returnFromQuest,
      confirmQuestReturn, // Export Confirm Action
      rollGacha, 
      rollGachaTriple, 
      equipItem, 
      switchParty, 
      unlockParty, 
      assignHeroToParty, 
      swapPartyPositions, 
      usePotion, 
      useElixir,
      mergeEquipment,
      debugCompleteQuest,
      debugAddTokens,
      getQuestPrediction
    }
  };
};
