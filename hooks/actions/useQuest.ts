
import { Dispatch, SetStateAction } from 'react';
import { GameState, Quest, Hero, QuestRank, QuestConfig } from '../../types';
import { playClick, playDepart, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';

interface UseQuestProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  setReturnResult: (result: { results: any[], totalTokens: number } | null) => void;
  farcasterUser?: any;
}

export const useQuest = ({ gameState, setGameState, showNotification, setReturnResult, farcasterUser }: UseQuestProps) => {
  
  // Helper: Check if a skill is active based on skillType
  // skillType definition:
  // 1st digit (ones): 1 = Team Effect Damage Reduction (Otherwise individual)
  // 2nd digit (tens): X * 10 = HP Threshold %
  // 3rd digit (hundreds): 1 = HP >= Threshold, 2 = HP <= Threshold
  const isSkillActive = (hero: Hero): boolean => {
      const type = hero.skillType || 0;
      if (type === 0) return true; // Default always active if no special logic defined

      const conditionMode = Math.floor(type / 100); // Hundreds digit
      const thresholdVal = Math.floor((type % 100) / 10) * 10; // Tens digit * 10

      // If conditionMode is 0 (e.g. type 0XX), assume no condition (always active)
      if (conditionMode === 0) return true;

      const hpPercent = (hero.hp / hero.maxHp) * 100;

      if (conditionMode === 1) {
         // Condition: HP >= Threshold
         return hpPercent >= thresholdVal;
      }
      if (conditionMode === 2) {
         // Condition: HP <= Threshold
         return hpPercent <= thresholdVal;
      }
      
      return true;
  };

  // Helper: Get Bonuses for Prediction
  const getBonuses = (partyHeroes: Hero[]) => {
    // Reward Bonus
    const pickaxeBonus = partyHeroes.reduce((acc, h) => {
        const equip = gameState.equipment.find(e => e.id === h.equipmentIds[0]);
        return acc + (equip ? equip.bonus : 0);
    }, 0);

    const skillRewardBonus = partyHeroes.reduce((acc, h) => {
        let bonus = 0;
        if (h.skillQuest && h.skillQuest > 0) {
            if (isSkillActive(h)) bonus = h.skillQuest;
        } else {
            const match = h.trait?.match(/クエスト報酬\s*\+(\d+)%/);
            bonus = match ? parseInt(match[1]) : 0;
        }
        return acc + bonus;
    }, 0);

    const totalRewardBonus = pickaxeBonus + skillRewardBonus;

    // Time Bonus
    const bootsBonus = partyHeroes.reduce((acc, hero) => {
      const equipId = hero.equipmentIds[2];
      const equip = gameState.equipment.find(e => e.id === equipId);
      return acc + (equip ? equip.bonus : 0);
    }, 0);

    const skillTimeBonus = partyHeroes.reduce((acc, hero) => {
        return acc + (isSkillActive(hero) ? (hero.skillTime || 0) : 0);
    }, 0);

    const totalTimeBonus = bootsBonus + skillTimeBonus;

    // Damage Reduction (Team)
    let teamDamageReduction = 0;
    partyHeroes.forEach(h => {
        if (isSkillActive(h) && (h.skillType || 0) % 10 === 1) {
            teamDamageReduction += (h.skillDamage || 0);
        }
    });

    return { totalRewardBonus, totalTimeBonus, teamDamageReduction };
  };

  // Exposed Helper: Calculate Prediction for UI
  const getQuestPrediction = (config: QuestConfig, partyHeroes: Hero[]) => {
      const { totalRewardBonus, totalTimeBonus, teamDamageReduction } = getBonuses(partyHeroes);

      // 1. Reward Range
      const minReward = Math.floor(config.minReward * (1 + totalRewardBonus / 100));
      const maxReward = Math.floor(config.maxReward * (1 + totalRewardBonus / 100));

      // 2. Duration
      const reductionMultiplier = Math.max(0.1, 1 - (totalTimeBonus / 100));
      const estimatedDuration = Math.floor(config.duration * reductionMultiplier);

      // 3. Damage Range (Per Hero Estimate - Average case for display)
      // Since damage is per-hero, we calculate a range representing the "Typical" reduction for the party leader (slot 0) or average
      // For display simplicity, let's show the range applied to a hypothetical hero with average personal reduction (e.g. 0) + team reduction + helmet average
      
      // Calculate Average Helmet Bonus
      const avgHelmet = partyHeroes.reduce((acc, h) => {
          const e = gameState.equipment.find(eq => eq.id === h.equipmentIds[1]);
          return acc + (e ? e.bonus : 0);
      }, 0) / (partyHeroes.length || 1);

      // Calculate Average Self Reduction
      const avgSelfRed = partyHeroes.reduce((acc, h) => {
          let selfBuff = 0;
          if (isSkillActive(h) && (h.skillType || 0) % 10 !== 1) {
              selfBuff = (h.skillDamage || 0);
          }
          return acc + h.damageReduction + selfBuff;
      }, 0) / (partyHeroes.length || 1);

      const avgTotalRed = avgHelmet + avgSelfRed + teamDamageReduction;
      
      const minDmgRaw = config.minDmg;
      const maxDmgRaw = config.maxDmg;
      
      const predictDmg = (raw: number) => {
          if (avgTotalRed <= 0) return raw;
          return Math.max(0, raw - Math.ceil(raw * (avgTotalRed / 100)));
      };

      return {
          minReward,
          maxReward,
          estimatedDuration,
          minDmg: predictDmg(minDmgRaw),
          maxDmg: predictDmg(maxDmgRaw),
          bonusPercent: totalRewardBonus,
          timeReductionPercent: totalTimeBonus,
          avgDamageReduction: Math.floor(avgTotalRed)
      };
  };

  // Helper: Calculate Rewards & Damages (Actual Logic)
  const calculateQuestResults = (config: QuestConfig, partyHeroes: Hero[]) => {
    const { totalRewardBonus, totalTimeBonus, teamDamageReduction } = getBonuses(partyHeroes);

    // 1. Calculate Rewards
    const baseReward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
    
    // Split bonus for recording (Approximation for DB columns if needed, but we use total)
    // We can just apply the total percentage to the base.
    const addHeroReward = Math.floor(baseReward * (totalRewardBonus / 100));
    // NOTE: Splitting equipment/hero bonus in DB strictly might require re-parsing, 
    // but for now we aggregate them in calculation. 
    // If strict separation is needed for logs:
    const pickaxeBonus = partyHeroes.reduce((acc, h) => {
        const equip = gameState.equipment.find(e => e.id === h.equipmentIds[0]);
        return acc + (equip ? equip.bonus : 0);
    }, 0);
    const addEquipmentRewardOnly = Math.floor(baseReward * (pickaxeBonus / 100));
    const addHeroSkillRewardOnly = addHeroReward - addEquipmentRewardOnly;


    // 2. Calculate Damage
    const heroDamages: Record<string, number> = {};
    
    partyHeroes.forEach((hero) => {
        let finalDmg = 0;
        
        // Instant Death Logic check
        if (config.deathChance > 0 && Math.random() < config.deathChance) {
            finalDmg = 9999; // Fatal damage signal
        } else {
            const rawDmg = Math.floor(Math.random() * (config.maxDmg - config.minDmg + 1)) + config.minDmg;
            
            // Equipment Mitigation (Helmet)
            const helmetEquip = gameState.equipment.find(e => e.id === hero.equipmentIds[1]);
            const helmetBonus = helmetEquip ? helmetEquip.bonus : 0;
            
            // Skill Mitigation (Self)
            let selfSkillMitigation = 0;
            if (isSkillActive(hero) && (hero.skillType || 0) % 10 !== 1) {
                selfSkillMitigation = (hero.skillDamage || 0);
            }

            // Total Reduction
            const totalReduction = hero.damageReduction + helmetBonus + teamDamageReduction + selfSkillMitigation;
            
            finalDmg = rawDmg;
            if (totalReduction > 0) {
              finalDmg = Math.max(0, rawDmg - Math.ceil(rawDmg * (totalReduction / 100)));
            }
        }
        heroDamages[hero.id] = finalDmg;
    });

    return {
        baseReward,
        addEquipmentReward: addEquipmentRewardOnly,
        addHeroReward: addHeroSkillRewardOnly,
        heroDamages,
        actualDurationMultiplier: Math.max(0.1, 1 - (totalTimeBonus / 100))
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
      id: Math.random().toString(), // Temp ID
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
          heroDamages
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
                newQuest.id = inserted.quest_pid.toString();
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
    const newHeroes = [...gameState.heroes];
    let deadHeroIds: string[] = [];

    // Process sequentially for async DB
    for (const quest of completed) {
      const config = gameState.questConfigs.find(q => q.rank === quest.rank);
      if (!config) continue;

      const logs: string[] = [];
      const questHeroes = quest.heroIds
        .map(id => newHeroes.find(h => h.id === id))
        .filter((h): h is Hero => !!h);

      // Retrieve Pre-calculated Results
      let { baseReward, addHeroReward, addEquipmentReward, heroDamages } = quest.results || { 
          baseReward: 0, addHeroReward: 0, addEquipmentReward: 0, heroDamages: {} 
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
      
      const bonusReward = addEquipmentReward + addHeroReward;
      let finalReward = baseReward + bonusReward;
      
      let survivors = 0;

      questHeroes.forEach(hero => {
        const idx = newHeroes.findIndex(h => h.id === hero.id);
        if (idx === -1) return;

        let isDead = false;
        
        // Use pre-calculated damage
        const damageTaken = heroDamages[hero.id] || 0;

        // Check death condition (Damage >= HP or 9999 flag)
        const currentHp = hero.hp;
        let newHp = Math.max(0, currentHp - damageTaken);

        if (damageTaken >= 9999) {
             // Instant Death Flag from Depart
             newHp = 0;
             deadHeroIds.push(hero.id);
             logs.push(`💀 悲報: ${hero.name} は帰らぬ犬となりました...`);
             isDead = true;
        } else {
             newHeroes[idx] = { ...hero, hp: newHp };
             
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

        if (!isDead) {
          survivors++;
        }
      });

      if (survivors === 0 && questHeroes.length > 0) {
        finalReward = 0;
        logs.push(`❌ パーティ全滅！クエスト失敗。報酬は得られません。`);
      } else {
        accumulatedTotalReward += finalReward;
      }

      resultList.push({
        questName: quest.name,
        rank: quest.rank,
        totalReward: finalReward,
        baseReward: finalReward === 0 ? 0 : baseReward,
        bonusReward: finalReward === 0 ? 0 : bonusReward,
        logs: logs
      });

      // Update DB for this quest
      if (farcasterUser?.fid) {
          const questPid = parseInt(quest.id);

          // 1. Get Quest Mining ID needed for quest_process_complete
          const { data: questMaster } = await supabase.from('quest_mining').select('id').eq('rank', quest.rank).single();

          if (questMaster) {
              // 2. Insert into quest_process_complete (Archive)
              const { error: completeError } = await supabase.from('quest_process_complete').insert({
                  fid: farcasterUser.fid,
                  quest_id: questMaster.id,
                  reward: finalReward
                  // archived_at is auto-set to NOW()
              });
              if (completeError) console.error("Error archiving to quest_process_complete:", completeError);
              
              // 3. Delete from quest_process (Active)
              const { error: deleteProcessError } = await supabase.from('quest_process').delete().eq('quest_pid', questPid);
              if (deleteProcessError) console.error("Error deleting from quest_process:", deleteProcessError);
          }

          // 4. Update Hero HPs and Handle Deaths (Batch Processing)
          const deadInThisQuest = questHeroes.filter(h => deadHeroIds.includes(h.id));
          const aliveInThisQuest = questHeroes.filter(h => !deadHeroIds.includes(h.id));

          // A. Handle Survivors
          for (const hero of aliveInThisQuest) {
              const newHp = newHeroes.find(h => h.id === hero.id)?.hp || 0;
              const playerHid = parseInt(hero.id);
              await supabase.from('quest_player_hero')
                  .update({ hp: newHp })
                  .eq('player_hid', playerHid);
          }

          // B. Handle Deaths (Batch)
          if (deadInThisQuest.length > 0) {
              const deadPids = deadInThisQuest.map(h => parseInt(h.id));
              
              // Fetch Master IDs needed for the lost log
              const { data: deadRows, error: fetchError } = await supabase
                  .from('quest_player_hero')
                  .select('player_hid, hero_id')
                  .in('player_hid', deadPids);
              
              if (fetchError) console.error("Error fetching dead heroes for log:", fetchError);

              if (deadRows && deadRows.length > 0) {
                  const lostRecords = deadRows.map(row => ({
                      fid: farcasterUser.fid,
                      hero_id: row.hero_id,
                      quest_pid: questPid
                  }));

                  // Insert into Lost Table
                  const { error: insertError } = await supabase
                      .from('quest_player_hero_lost')
                      .insert(lostRecords);
                  
                  if (insertError) console.error("Error inserting lost heroes:", insertError);

                  // Delete from Active Table
                  const { error: deleteError } = await supabase
                      .from('quest_player_hero')
                      .delete()
                      .in('player_hid', deadPids);
                      
                  if (deleteError) console.error("Error deleting dead heroes:", deleteError);
              }
          }

          // 5. Update stats (Quest Count)
          const { error: statError } = await supabase.rpc('increment_player_stat', { 
            player_fid: farcasterUser.fid, 
            column_name: 'quest_count', 
            amount: 1 
          });
          
          if (statError) {
             const { data } = await supabase.from('quest_player_stats').select('quest_count').eq('fid', farcasterUser.fid).single();
             if (data) {
                await supabase.from('quest_player_stats').update({ quest_count: (data.quest_count || 0) + 1 }).eq('fid', farcasterUser.fid);
             }
          }
      }
    }

    // Update Total Reward Stats
    if (farcasterUser?.fid && accumulatedTotalReward > 0) {
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

    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens + accumulatedTotalReward,
      heroes: newHeroes.filter(h => !deadHeroIds.includes(h.id)),
      activeQuests: prev.activeQuests.filter(q => q.endTime > now),
      partyPresets: prev.partyPresets.map(p => p.map(id => (id && deadHeroIds.includes(id)) ? null : id))
    }));

    setReturnResult({ results: resultList, totalTokens: accumulatedTotalReward });
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
