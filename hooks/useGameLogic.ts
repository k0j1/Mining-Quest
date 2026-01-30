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
        // 1. Load Equipment
        const { data: equipData, error: equipError } = await supabase
          .from('quest_player_equipment')
          .select('*, quest_equipment(*)')
          .eq('fid', fid);

        if (equipError) {
            console.error("[useGameLogic] Equipment load error:", equipError);
        } else {
            console.log(`[useGameLogic] Equipment raw data count: ${equipData?.length || 0}`);
        }

        const loadedEquipment: Equipment[] = (equipData || []).map((e: any) => {
          // Handle Join: might be array or object depending on Supabase client version/config
          const base = Array.isArray(e.quest_equipment) ? e.quest_equipment[0] : e.quest_equipment;
          if (!base) return null;
          return {
            id: e.player_eid.toString(),
            name: base.name,
            type: base.type,
            bonus: base.bonus,
            rarity: base.rarity
          };
        }).filter((e): e is Equipment => e !== null);

        // 2. Load Heroes
        const { data: heroData, error: heroError } = await supabase
          .from('quest_player_hero')
          .select('*, quest_hero(*)')
          .eq('fid', fid);

        if (heroError) {
            console.error("[useGameLogic] Hero load error:", heroError);
        } else {
            console.log(`[useGameLogic] Hero raw data count: ${heroData?.length || 0}`);
        }
        
        const drMap: Record<string, number> = { C: 2, UC: 5, R: 10, E: 15, L: 20 };

        const loadedHeroes: Hero[] = (heroData || []).map((h: any) => {
          const base = Array.isArray(h.quest_hero) ? h.quest_hero[0] : h.quest_hero;
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

        // 3. Load Party
        const { data: partyData, error: partyError } = await supabase
          .from('quest_player_party')
          .select('*')
          .eq('fid', fid);

        if (partyError) {
             console.error("[useGameLogic] Party load error:", partyError);
        } else {
             console.log(`[useGameLogic] Party raw data count: ${partyData?.length || 0}`);
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

        // 4. Load Active Quests
        const { data: questData, error: questError } = await supabase
          .from('quest_process')
          .select('*, quest_mining(*)')
          .eq('fid', fid)
          .eq('status', 'active');

        if (questError) {
            console.error("[useGameLogic] Quest load error:", questError);
        } else {
             console.log(`[useGameLogic] Active quests count: ${questData?.length || 0}`);
        }

        const loadedQuests: Quest[] = (questData || []).map((q: any) => {
            const base = Array.isArray(q.quest_mining) ? q.quest_mining[0] : q.quest_mining;
            if (!base) return null;

            const startTime = new Date(q.start_time).getTime();
            const endTime = new Date(q.end_time).getTime();
            
            const actualDuration = Math.floor((endTime - startTime) / 1000);
            const duration = base.duration;

            const questPartyId = q.party_id;
            let heroIds: string[] = [];
            
            const matchedParty = partyData?.find((p: any) => p.party_id === questPartyId);
            
            if (matchedParty) {
                heroIds = [
                    matchedParty.hero1_id ? matchedParty.hero1_id.toString() : null,
                    matchedParty.hero2_id ? matchedParty.hero2_id.toString() : null,
                    matchedParty.hero3_id ? matchedParty.hero3_id.toString() : null
                ].filter((id): id is string => !!id);
            } else {
                console.warn("[useGameLogic] Could not find party config for quest", q.quest_pid);
            }

            return {
                id: q.quest_pid.toString(),
                name: base.name,
                rank: base.rank as QuestRank,
                duration: duration,
                actualDuration: actualDuration,
                endTime: endTime,
                reward: Math.floor((base.min_reward + base.max_reward) / 2),
                status: 'active',
                heroIds: heroIds
            };
        }).filter((q): q is Quest => q !== null);

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