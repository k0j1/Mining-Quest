
import { Dispatch, SetStateAction } from 'react';
import { GameState, Quest, Hero, QuestRank, QuestConfig } from '../../types';
import { playClick, playDepart, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';
import { calculatePartyStats, calculateHeroDamageReduction } from '../../utils/mechanics';

interface UseQuestProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  setReturnResult: (result: { results: any[], totalTokens: number } | null) => void;
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
      let minReward = Math.floor(config.minReward * (1 + totalRewardBonus / 100));
      let maxReward = Math.floor(config.maxReward * (1 + totalRewardBonus / 100));

      // Cap Prediction at Max Reward (to match actual logic limit)
      if (maxReward > config.maxReward) maxReward = config.maxReward;
      if (minReward > config.maxReward) minReward = config.maxReward;

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

    // --- CAP LOGIC: Ensure total does not exceed maxReward ---
    const currentTotal = baseReward + totalBonusAmount;
    
    if (currentTotal > config.maxReward) {
        const allowedTotal = config.maxReward;
        const allowedBonus = Math.max(0, allowedTotal - baseReward);

        // Adjust bonuses proportionally if possible
        if (totalBonusAmount > 0) {
            const ratio = allowedBonus / totalBonusAmount;
            addEquipmentRewardOnly = Math.floor(addEquipmentRewardOnly * ratio);
            addHeroSkillRewardOnly = Math.floor(addHeroSkillRewardOnly * ratio);
            
            // Fix rounding errors to ensure we exactly hit maxReward or below
            // If sum is less than allowed due to floor, add remainder to one bucket (e.g. hero skill)
            const newTotalBonus = addEquipmentRewardOnly + addHeroSkillRewardOnly;
            const remainder = allowedBonus - newTotalBonus;
            if (remainder > 0) {
                addHeroSkillRewardOnly += remainder;
            }
        } else {
            // Should not happen if baseReward <= maxReward, but safe fallback
            addEquipmentRewardOnly = 0;
            addHeroSkillRewardOnly = 0;
            if (baseReward > config.maxReward) baseReward = config.maxReward;
        }
    }
    // ---------------------------------------------------------

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

  const returnFromQuest = async () => {
    const now = Date.now();
    const completed = gameState.activeQuests.filter(q => q.endTime <= now);
    
    if (completed.length === 0) {
      playError();
      showNotification("完了したクエストはありません。", 'error');
      return false;
    }

    let accumulatedTotalReward = 0;
    const resultList: any[] = [];
    // We clone heroes array to update HP locally
    const newHeroes = [...gameState.heroes];
    let deadHeroIds: string[] = [];
    const processedQuestIds: string[] = []; // Track IDs that are successfully processed in DB

    // Process sequentially for async DB
    for (const quest of completed) {
      const config = gameState.questConfigs.find(q => q.rank === quest.rank);
      if (!config) continue;

      const logs: string[] = [];
      const questHeroes = quest.heroIds
        .map(id => newHeroes.find(h => h.id === id))
        .filter((h): h is Hero => !!h);

      // Retrieve Pre-calculated Results
      let { baseReward, addHeroReward, addEquipmentReward, heroDamages, questMasterId } = quest.results || { 
          baseReward: 0, addHeroReward: 0, addEquipmentReward: 0, heroDamages: {}, questMasterId: config.id
      };

      if (!baseReward || baseReward === 0) {
          // Fallback Recalculation (if state lost)
          console.log(`[useQuest] Results missing or zero for quest ${quest.id}. Recalculating...`);
          const calculated = calculateQuestResults(config, questHeroes);
          baseReward = calculated.baseReward;
          addHeroReward = calculated.addHeroReward;
          addEquipmentReward = calculated.addEquipmentReward;
          heroDamages = calculated.heroDamages;
      }
      
      // Calculate final reward
      const bonusReward = addEquipmentReward + addHeroReward;
      let finalReward = baseReward + bonusReward;
      
      let survivors = 0;

      questHeroes.forEach(hero => {
        const idx = newHeroes.findIndex(h => h.id === hero.id);
        if (idx === -1) return;

        let isDead = false;
        
        // Use pre-calculated damage
        const damageTaken = heroDamages[hero.id] || 0;

        // Check death condition
        const currentHp = hero.hp;
        let newHp = Math.max(0, currentHp - damageTaken);

        if (damageTaken >= 9999) {
             newHp = 0;
             if (!deadHeroIds.includes(hero.id)) deadHeroIds.push(hero.id);
             logs.push(`💀 悲報: ${hero.name} は帰らぬ犬となりました...`);
             isDead = true;
        } else {
             newHeroes[idx] = { ...hero, hp: newHp };
             
             if (newHp === 0) {
               if (!deadHeroIds.includes(hero.id)) deadHeroIds.push(hero.id);
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

        if (!isDead) {
          survivors++;
        }
      });

      if (survivors === 0 && questHeroes.length > 0) {
        finalReward = 0;
        logs.push(`❌ パーティ全滅！クエスト失敗。報酬は得られません。`);
      }

      // --- CRITICAL: DB Synchronization ---
      let dbSuccess = true;

      if (farcasterUser?.fid) {
          const questPid = parseInt(quest.id);
          const { data: questData } = await supabase.from('quest_process').select('party_id, quest_id').eq('quest_pid', questPid).single();
          
          if (!questData) {
              console.error(`Quest ${questPid} not found in DB`);
              dbSuccess = false; 
          } else {
              // Ensure questMasterId is correct from DB
              questMasterId = questData.quest_id;

              try {
                  // 1. Archive to history
                  const { error: insertError } = await supabase
                    .from('quest_process_complete')
                    .insert({
                        fid: farcasterUser.fid,
                        quest_id: questData.quest_id,
                        reward: finalReward,
                        // created_at removed to rely on DB default
                    });

                  if (insertError) throw insertError;

                  // 2. Delete from active
                  const { error: deleteError } = await supabase
                    .from('quest_process')
                    .delete()
                    .eq('quest_pid', questPid);

                  if (deleteError) throw deleteError;

                  // 3. Update Hero HP in DB
                  for (const hero of questHeroes) {
                      const updatedHero = newHeroes.find(h => h.id === hero.id);
                      if (updatedHero) {
                          if (updatedHero.hp <= 0 && !heroDamages[hero.id] || heroDamages[hero.id] < 9999) {
                              await supabase.from('quest_player_hero')
                                .update({ hp: updatedHero.hp })
                                .eq('player_hid', parseInt(hero.id));
                          }
                      }
                  }
                  
                  // 4. Handle Permanent Death (Lost) in DB
                  for (const deadId of deadHeroIds) {
                      if (quest.heroIds.includes(deadId)) {
                          const { data: heroRow } = await supabase.from('quest_player_hero').select('*').eq('player_hid', parseInt(deadId)).single();
                          if (heroRow) {
                              await supabase.from('quest_player_hero_lost').insert({
                                  fid: farcasterUser.fid,
                                  hero_id: heroRow.hero_id,
                                  quest_id: questMasterId, // Add Quest ID relation
                                  lost_at: new Date().toISOString()
                              });
                              await supabase.from('quest_player_hero').delete().eq('player_hid', parseInt(deadId));
                          }
                      }
                  }

              } catch (e: any) {
                  console.error(`Error syncing quest completion for ${quest.id}:`, e);
                  dbSuccess = false;
                  showNotification(`クエスト同期エラー (ID: ${quest.id}): ${e.message || 'Unknown Error'}`, 'error');
              }
          }
      }

      // Only proceed if DB sync was successful (or we are in local mode)
      if (dbSuccess) {
          processedQuestIds.push(quest.id);
          accumulatedTotalReward += finalReward;
          
          resultList.push({
            questName: quest.name,
            rank: quest.rank,
            questMasterId: questMasterId, // Pass Master ID for contract
            totalReward: finalReward,
            baseReward: baseReward, // Pass original baseReward
            bonusReward: finalReward === 0 ? 0 : bonusReward,
            heroBonus: finalReward === 0 ? 0 : addHeroReward,
            equipmentBonus: finalReward === 0 ? 0 : addEquipmentReward,
            logs: logs,
            questId: quest.id // Needed for contract interaction (quest_pid)
          });
      }
    }

    if (processedQuestIds.length === 0) {
        return false;
    }

    // Update Stats
    if (farcasterUser?.fid) {
        const processedCount = processedQuestIds.length;

        // 1. Update Quest Count
        const { error: countError } = await supabase.rpc('increment_player_stat', { 
            player_fid: farcasterUser.fid, 
            column_name: 'quest_count', 
            amount: processedCount 
        });
        
        if (countError) {
             const { data } = await supabase.from('quest_player_stats').select('quest_count').eq('fid', farcasterUser.fid).single();
             if (data) {
                await supabase.from('quest_player_stats').update({ quest_count: (data.quest_count || 0) + processedCount }).eq('fid', farcasterUser.fid);
             }
        }

        // 2. Update Total Reward Stats for valid reward
        if (accumulatedTotalReward > 0) {
            const { error: rewardError } = await supabase.rpc('increment_player_stat', { 
                player_fid: farcasterUser.fid, 
                column_name: 'total_reward', 
                amount: accumulatedTotalReward 
            });
            
            if (rewardError) {
                 const { data } = await supabase.from('quest_player_stats').select('total_reward').eq('fid', farcasterUser.fid).single();
                 if (data) {
                    await supabase.from('quest_player_stats').update({ total_reward: (data.total_reward || 0) + accumulatedTotalReward }).eq('fid', farcasterUser.fid);
                 }
            }
        }
    }

    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens + accumulatedTotalReward,
      heroes: newHeroes.filter(h => !deadHeroIds.includes(h.id)),
      // Only remove quests that were successfully processed in DB
      activeQuests: prev.activeQuests.filter(q => !processedQuestIds.includes(q.id)),
      partyPresets: prev.partyPresets.map(p => p.map(id => (id && deadHeroIds.includes(id)) ? null : id))
    }));
    
    if (resultList.length > 0) {
        setReturnResult({ results: resultList, totalTokens: accumulatedTotalReward });
    }
    
    return true;
  };

  const debugCompleteQuest = (questId: string) => {
    setGameState(prev => ({
      ...prev,
      activeQuests: prev.activeQuests.map(q => 
        q.id === questId ? { ...q, endTime: Date.now() - 1000 } : q
      )
    }));
  };

  return { depart, returnFromQuest, debugCompleteQuest, getQuestPrediction };
};
