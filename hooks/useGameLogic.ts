
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
      console.log("Loading player data for FID:", fid);

      try {
        // 1. Load Equipment
        const { data: equipData, error: equipError } = await supabase
          .from('quest_player_equipment')
          .select('*, quest_equipment(*)')
          .eq('fid', fid);

        if (equipError) throw equipError;

        const loadedEquipment: Equipment[] = (equipData || []).map((e: any) => ({
          id: e.player_eid.toString(),
          name: e.quest_equipment.name,
          type: e.quest_equipment.type,
          bonus: e.quest_equipment.bonus,
          rarity: e.quest_equipment.rarity
        }));

        // 2. Load Heroes
        const { data: heroData, error: heroError } = await supabase
          .from('quest_player_hero')
          .select('*, quest_hero(*)')
          .eq('fid', fid);

        if (heroError) throw heroError;
        
        // Helper to get ability/dr map
        const drMap: Record<string, number> = { C: 2, UC: 5, R: 10, E: 15, L: 20 };

        const loadedHeroes: Hero[] = (heroData || []).map((h: any) => ({
          id: h.player_hid.toString(),
          name: h.quest_hero.name,
          species: h.quest_hero.species,
          rarity: h.quest_hero.rarity,
          trait: h.quest_hero.ability,
          damageReduction: drMap[h.quest_hero.rarity] || 0,
          level: 1,
          hp: h.hp,
          maxHp: h.quest_hero.hp, // Or handle if player maxHp scales
          imageUrl: `https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/s/${h.quest_hero.name}_s.png`,
          equipmentIds: [
            h.pickaxe_player_eid ? h.pickaxe_player_eid.toString() : '',
            h.helmet_player_eid ? h.helmet_player_eid.toString() : '',
            h.boots_player_eid ? h.boots_player_eid.toString() : ''
          ]
        }));

        // 3. Load Party
        const { data: partyData, error: partyError } = await supabase
          .from('quest_player_party')
          .select('*')
          .eq('fid', fid);

        if (partyError) throw partyError;

        const newPartyPresets: (string | null)[][] = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];
        
        // Logic: If user has row for party 2, it is unlocked.
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

        if (questError) throw questError;

        const loadedQuests: Quest[] = (questData || []).map((q: any) => {
            // Reconstruct duration/end time
            const startTime = new Date(q.start_time).getTime();
            const endTime = new Date(q.end_time).getTime();
            
            // Calculate actual duration from DB time
            const actualDuration = Math.floor((endTime - startTime) / 1000);
            const duration = q.quest_mining.duration;

            // Resolve Hero IDs for this quest from the party snapshot logic
            const questPartyId = q.party_id;
            let heroIds: string[] = [];
            
            // Find the party configuration that matches this quest's party_id
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
                name: q.quest_mining.name,
                rank: q.quest_mining.rank as QuestRank,
                duration: duration,
                actualDuration: actualDuration,
                endTime: endTime,
                reward: Math.floor((q.quest_mining.min_reward + q.quest_mining.max_reward) / 2),
                status: 'active',
                heroIds: heroIds
            };
        });

        setGameState(prev => ({
            ...prev,
            heroes: loadedHeroes,
            equipment: loadedEquipment,
            partyPresets: newPartyPresets,
            unlockedParties: newUnlockedParties,
            activeQuests: loadedQuests
        }));

      } catch (e) {
        console.error("Failed to load player data from DB:", e);
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
