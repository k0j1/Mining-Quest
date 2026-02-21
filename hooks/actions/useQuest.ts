
import { Dispatch, SetStateAction } from 'react';
import { GameState, Quest, Hero, QuestRank, QuestConfig, QuestResult } from '../../types';
import { playClick, playDepart, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';
import { calculatePartyStats, calculateHeroDamageReduction } from '../../utils/mechanics';

interface UseQuestProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  setReturnResult: (result: { results: QuestResult[], totalTokens: number } | null) => void;
  farcasterUser?: any;
  refetchBalance: () => Promise<void>;
}

export const useQuest = ({ gameState, setGameState, showNotification, setReturnResult, farcasterUser, refetchBalance }: UseQuestProps) => {
  
  // Exposed Helper: Calculate Prediction for UI
  const getQuestPrediction = (config: QuestConfig, partyHeroes: Hero[]) => {
      const stats = calculatePartyStats(partyHeroes, gameState.equipment);
      
      const { 
          totalRewardBonus, totalSpeedBonus, teamDamageReduction,
          breakdown
      } = stats;

      // 1. Reward Range
      // Base range is config.minReward to config.maxReward
      // Apply bonus multiplier directly without capping at maxReward
      let minReward = Math.floor(config.minReward * (1 + totalRewardBonus / 100));
      let maxReward = Math.floor(config.maxReward * (1 + totalRewardBonus / 100));

      // 2. Duration (Speed Calculation)
      const speedMultiplier = 1 + (totalSpeedBonus / 100);
      const estimatedDuration = Math.floor(config.duration / speedMultiplier);

      // 3. Damage Range (Per Hero Estimate)
      const heroDamageReductions = partyHeroes.map(h => {
          const totalReduction = calculateHeroDamageReduction(h, gameState.equipment, teamDamageReduction);
          return {
              id: h.id,
              name: h.name,
              totalReduction: totalReduction
          };
      });

      // Calculate Average for general display
      const avgTotalRed = heroDamageReductions.reduce((acc, curr) => acc + curr.totalReduction, 0) / (partyHeroes.length || 1);
      
      const minDmgRaw = config.minDmg;
      const maxDmgRaw = config.maxDmg;
      
      const predictDmg = (raw: number) => {
          if (avgTotalRed <= 0) return raw;
          return Math.max(0, raw - Math.ceil(raw * (avgTotalRed / 100)));
      };

      return {
          minReward,
          maxReward,
          rawMinReward: config.minReward, // Added: Raw values
          rawMaxReward: config.maxReward, // Added: Raw values
          estimatedDuration,
          rawDuration: config.duration,   // Added: Raw values
          rawMinDmg: minDmgRaw,
          rawMaxDmg: maxDmgRaw,
          minDmg: predictDmg(minDmgRaw),
          maxDmg: predictDmg(maxDmgRaw),
          bonusPercent: totalRewardBonus,
          speedBonusPercent: totalSpeedBonus,
          avgDamageReduction: Math.floor(avgTotalRed),
          breakdown: breakdown,
          heroDamageReductions // Include individual stats
      };
  };

  // Helper: Calculate Rewards & Damages (Actual Logic)
  const calculateQuestResults = (config: QuestConfig, partyHeroes: Hero[]) => {
    const stats = calculatePartyStats(partyHeroes, gameState.equipment);
    const { totalRewardBonus, totalSpeedBonus, teamDamageReduction } = stats;

    // 1. Calculate Rewards
    let baseReward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
    
    // Recalculate component parts for DB log
    const pickaxeBonus = stats.breakdown.reward.equip;
    
    // Temporary variables for calculation
    const totalBonusMultiplier = totalRewardBonus / 100;
    const equipBonusMultiplier = pickaxeBonus / 100;

    // Initial Bonus Calculation
    let totalBonusAmount = Math.floor(baseReward * totalBonusMultiplier);
    let addEquipmentRewardOnly = Math.floor(baseReward * equipBonusMultiplier);
    let addHeroSkillRewardOnly = totalBonusAmount - addEquipmentRewardOnly;

    // Note: Cap logic removed. Total reward can exceed config.maxReward via bonuses.
    // Base reward is naturally constrained by the random generation logic above.

    // 2. Calculate Damage
    const heroDamages: Record<string, number> = {};
    
    partyHeroes.forEach((hero) => {
        let finalDmg = 0;
        
        // Instant Death Logic check
        if (config.deathChance > 0 && Math.random() < config.deathChance) {
            finalDmg = 9999; // Fatal damage signal
        } else {
            const rawDmg = Math.floor(Math.random() * (config.maxDmg - config.minDmg + 1)) + config.minDmg;
            
            // Centralized Damage Reduction Logic
            const totalReduction = calculateHeroDamageReduction(hero, gameState.equipment, teamDamageReduction);
            
            finalDmg = rawDmg;
            if (totalReduction > 0) {
              finalDmg = Math.max(0, rawDmg - Math.ceil(rawDmg * (totalReduction / 100)));
            }
        }
        heroDamages[hero.id] = finalDmg;
    });

    // 3. Calculate Actual Duration (Speed Based)
    const speedMultiplier = 1 + (totalSpeedBonus / 100);
    const durationMultiplier = 1 / speedMultiplier;

    return {
        baseReward,
        addEquipmentReward: addEquipmentRewardOnly,
        addHeroReward: addHeroSkillRewardOnly,
        heroDamages,
        actualDurationMultiplier: durationMultiplier
    };
  };

  const depart = async (rank: QuestRank) => {
    playClick();

    // Find Config from State (Loaded from DB)
    const config = gameState.questConfigs.find(q => q.rank === rank);
    if (!config) {
        playError();
        showNotification("クエストデータの読み込みに失敗しました。", 'error');
        return false;
    }

    const currentPreset = gameState.partyPresets[gameState.activePartyIndex];
    
    // Check if this party is already busy
    const isPartyBusy = currentPreset.some(id => 
        id && gameState.activeQuests.some(q => q.heroIds.includes(id))
    );

    if (isPartyBusy) {
        playError();
        showNotification("このパーティは既に任務中です。別のパーティを選択してください。", 'error');
        return false;
    }

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

    // --- Calculate Results ---
    const { baseReward, addEquipmentReward, addHeroReward, heroDamages, actualDurationMultiplier } = calculateQuestResults(config, partyHeroes);

    const actualDuration = Math.floor(config.duration * actualDurationMultiplier);
    const startTime = Date.now();
    const endTime = startTime + actualDuration * 1000;

    // Create Local Quest Object with Results
    const newQuest: Quest = {
      id: Math.random().toString(), // Temp ID, will be updated if DB succeeds
      name: config.name,
      rank: rank,
      duration: config.duration,
      actualDuration: actualDuration,
      endTime: endTime,
      reward: Math.floor((config.minReward + config.maxReward) / 2),
      status: 'active',
      heroIds: partyHeroes.map(h => h.id),
      results: {
          baseReward,
          addHeroReward,
          addEquipmentReward,
          heroDamages,
          questMasterId: config.id // Store Master ID for contract interaction
      }
    };

    // DB Insert
    if (farcasterUser?.fid) {
        const { data: questMaster } = await supabase.from('quest_mining').select('id').eq('rank', rank).single();
        const { data: partyRow } = await supabase.from('quest_player_party')
           .select('party_id')
           .eq('fid', farcasterUser.fid)
           .eq('party_no', gameState.activePartyIndex + 1)
           .single();

        if (questMaster && partyRow) {
            // Update local quest with correct master ID
            if (newQuest.results) newQuest.results.questMasterId = questMaster.id;

            const { data: inserted, error } = await supabase.from('quest_process').insert({
                fid: farcasterUser.fid,
                quest_id: questMaster.id,
                party_id: partyRow.party_id,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                status: 'active',
                // New Columns
                base_reward: baseReward,
                add_hero_reward: addHeroReward,
                add_equipment_reward: addEquipmentReward,
                hero1_damage: heroDamages[partyHeroes[0]?.id] || 0,
                hero2_damage: heroDamages[partyHeroes[1]?.id] || 0,
                hero3_damage: heroDamages[partyHeroes[2]?.id] || 0
            }).select('quest_pid').single();

            if (!error && inserted) {
                newQuest.id = inserted.quest_pid.toString(); // Update ID to DB ID
            } else {
                console.error("Quest Start DB Error:", error);
            }
        }
    }

    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - config.burnCost,
      activeQuests: [...prev.activeQuests, newQuest]
    }));
    
    // Refetch balance once after spending tokens
    refetchBalance();

    playDepart();
    
    return true;
  };

  /**
   * Calculates results for completed quests and opens the result modal.
   * DOES NOT commit changes to DB or State yet.
   */
  const previewQuestReturn = async () => {
    const now = Date.now();
    const completed = gameState.activeQuests.filter(q => q.endTime <= now);
    
    if (completed.length === 0) {
      playError();
      showNotification("完了したクエストはありません。", 'error');
      return false;
    }

    let totalPendingReward = 0;
    const resultList: QuestResult[] = [];

    for (const quest of completed) {
      const config = gameState.questConfigs.find(q => q.rank === quest.rank);
      if (!config) {
          console.warn(`[useQuest] Config not found for rank ${quest.rank}. Waiting for data...`);
          playError();
          showNotification("クエストデータの読み込み中です。しばらく待ってから再試行してください。", 'error');
          return false;
      }

      const logs: string[] = [];
      const questHeroes = quest.heroIds
        .map(id => gameState.heroes.find(h => h.id === id))
        .filter((h): h is Hero => !!h);

      // Retrieve Pre-calculated Results
      let { baseReward, addHeroReward, addEquipmentReward, heroDamages, questMasterId } = quest.results || { 
          baseReward: 0, addHeroReward: 0, addEquipmentReward: 0, heroDamages: {}, questMasterId: config.id
      };

      // Safeguard: If questMasterId is missing from results (e.g. legacy data or load issue), recover from config
      // This is crucial to prevent Foreign Key Violation on 'quest_process_complete'
      if (!questMasterId && config.id) {
          questMasterId = config.id;
      }

      if (!baseReward || baseReward === 0) {
          // Fallback Recalculation (if state lost, though unlikely with pre-calc)
          console.log(`[useQuest] Results missing or zero for quest ${quest.id}. Recalculating...`);
          const calculated = calculateQuestResults(config, questHeroes);
          baseReward = calculated.baseReward;
          addHeroReward = calculated.addHeroReward;
          addEquipmentReward = calculated.addEquipmentReward;
          heroDamages = calculated.heroDamages;
      }
      
      const bonusReward = addEquipmentReward + addHeroReward;
      let finalReward = baseReward + bonusReward;
      
      let survivors = 0;
      const heroUpdates: { id: string, hp: number, isDead: boolean, damage: number }[] = [];
      const deadHeroIds: string[] = [];

      questHeroes.forEach(hero => {
        let isDead = false;
        const damageTaken = heroDamages[hero.id] || 0;
        const currentHp = hero.hp;
        let newHp = Math.max(0, currentHp - damageTaken);

        if (damageTaken >= 9999) {
             newHp = 0;
             deadHeroIds.push(hero.id);
             logs.push(`💀 悲報: ${hero.name} は帰らぬ犬となりました...`);
             isDead = true;
        } else {
             if (newHp === 0) {
               deadHeroIds.push(hero.id);
               logs.push(`💀 ${hero.name} は力尽きた... (HP 0)`);
               isDead = true;
             } else {
               if (damageTaken > 0) {
                  logs.push(`💥 ${hero.name}: -${damageTaken} HP (残: ${newHp})`);
               } else {
                  logs.push(`🛡️ ${hero.name}: 無傷で生還！`);
               }
             }
        }

        if (!isDead) survivors++;
        
        heroUpdates.push({
            id: hero.id,
            hp: newHp,
            isDead: isDead,
            damage: damageTaken
        });
      });

      if (survivors === 0 && questHeroes.length > 0) {
        finalReward = 0;
        logs.push(`❌ パーティ全滅！クエスト失敗。報酬は得られません。`);
      }

      totalPendingReward += finalReward;

      // Prepare Result Object
      resultList.push({
        questName: quest.name,
        rank: quest.rank,
        questMasterId: questMasterId,
        questId: quest.id, // pid
        totalReward: finalReward,
        baseReward: baseReward,
        bonusReward: finalReward === 0 ? 0 : bonusReward,
        heroBonus: finalReward === 0 ? 0 : addHeroReward,
        equipmentBonus: finalReward === 0 ? 0 : addEquipmentReward,
        logs: logs,
        // Data for Commit
        pendingUpdates: {
            questPid: parseInt(quest.id),
            questMasterId: questMasterId || 0,
            finalReward: finalReward,
            heroUpdates: heroUpdates,
            deadHeroIds: deadHeroIds
        }
      });
    }

    setReturnResult({ results: resultList, totalTokens: totalPendingReward });
    return true;
  };

  /**
   * Commits the pending quest results to DB and updates local state.
   */
  const confirmQuestReturn = async (results: QuestResult[], closeModal: boolean = true, skipRewardUpdate: boolean = false) => {
    let dbSuccess = true;
    const processedQuestPids: string[] = [];
    const allDeadHeroIds: string[] = [];
    let accumulatedTotalReward = 0;

    // We modify a clone of heroes to update state later
    let newHeroes = [...gameState.heroes];

    if (farcasterUser?.fid) {
        for (const res of results) {
            const { questPid, questMasterId, finalReward, heroUpdates, deadHeroIds } = res.pendingUpdates;
            
            try {
                // 1. Archive to history
                // Need valid quest_id. questMasterId comes from previewQuestReturn which ensures logic.
                const { error: insertError } = await supabase
                  .from('quest_process_complete')
                  .insert({
                      fid: farcasterUser.fid,
                      quest_id: questMasterId, // This must be the master ID
                      reward: finalReward,
                  });

                if (insertError) throw insertError;

                // 2. Delete from active
                const { error: deleteError } = await supabase
                  .from('quest_process')
                  .delete()
                  .eq('quest_pid', questPid);

                if (deleteError) throw deleteError;

                // 3. Update Hero HP in DB
                for (const update of heroUpdates) {
                    // Update Local State logic (accumulate for later)
                    const heroIdx = newHeroes.findIndex(h => h.id === update.id);
                    if (heroIdx !== -1) {
                        newHeroes[heroIdx] = { ...newHeroes[heroIdx], hp: update.hp };
                    }

                    // DB Update (Only if alive or standard death, Lost handled below)
                    // If damageTaken was >= 9999 (Instant Death), we assume logic below handles Lost.
                    // But we still need to update HP to 0 if it was normal damage death.
                    if (!update.isDead || update.damage < 9999) {
                         await supabase.from('quest_player_hero')
                            .update({ hp: update.hp })
                            .eq('player_hid', parseInt(update.id));
                    }
                }

                // 4. Handle Permanent Death (Lost) in DB
                for (const deadId of deadHeroIds) {
                    const { data: heroRow } = await supabase.from('quest_player_hero').select('*').eq('player_hid', parseInt(deadId)).single();
                    if (heroRow) {
                        await supabase.from('quest_player_hero_lost').insert({
                            fid: farcasterUser.fid,
                            hero_id: heroRow.hero_id,
                            quest_id: questMasterId,
                            lost_at: new Date().toISOString()
                        });
                        await supabase.from('quest_player_hero').delete().eq('player_hid', parseInt(deadId));
                    }
                }

                processedQuestPids.push(questPid.toString());
                allDeadHeroIds.push(...deadHeroIds);
                accumulatedTotalReward += finalReward;

            } catch (e: any) {
                console.error(`Error syncing quest completion for PID ${questPid}:`, e);
                dbSuccess = false;
                showNotification(`クエスト同期エラー (ID: ${questPid}): ${e.message || 'Unknown Error'}`, 'error');
            }
        }

        // Update Stats
        if (processedQuestPids.length > 0) {
            const processedCount = processedQuestPids.length;
            await supabase.rpc('increment_player_stat', { 
                player_fid: farcasterUser.fid, 
                column_name: 'quest_count', 
                amount: processedCount 
            });

            if (accumulatedTotalReward > 0 && !skipRewardUpdate) {
                await supabase.rpc('increment_player_stat', { 
                    player_fid: farcasterUser.fid, 
                    column_name: 'total_reward', 
                    amount: accumulatedTotalReward 
                });
            }
        }
    } else {
        // Local Mode Fallback
        results.forEach(res => {
            const { questPid, finalReward, heroUpdates, deadHeroIds } = res.pendingUpdates;
            processedQuestPids.push(questPid.toString());
            allDeadHeroIds.push(...deadHeroIds);
            accumulatedTotalReward += finalReward;
            
            heroUpdates.forEach(u => {
                const idx = newHeroes.findIndex(h => h.id === u.id);
                if (idx !== -1) newHeroes[idx] = { ...newHeroes[idx], hp: u.hp };
            });
        });
    }

    // Commit to State
    if (processedQuestPids.length > 0) {
        setGameState(prev => ({
          ...prev,
          tokens: prev.tokens + accumulatedTotalReward,
          heroes: newHeroes.filter(h => !allDeadHeroIds.includes(h.id)),
          activeQuests: prev.activeQuests.filter(q => !processedQuestPids.includes(q.id)),
          partyPresets: prev.partyPresets.map(p => p.map(id => (id && allDeadHeroIds.includes(id)) ? null : id))
        }));
    }

    if (closeModal) {
        setReturnResult(null);
    }
  };

  const debugCompleteQuest = (questId: string) => {
    setGameState(prev => ({
      ...prev,
      activeQuests: prev.activeQuests.map(q => 
        q.id === questId ? { ...q, endTime: Date.now() - 1000 } : q
      )
    }));
  };

  return { depart, returnFromQuest: previewQuestReturn, confirmQuestReturn, debugCompleteQuest, getQuestPrediction };
};
