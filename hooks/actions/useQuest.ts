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
  
  // Helper: Calculate Rewards & Damages
  const calculateQuestResults = (config: QuestConfig, partyHeroes: Hero[]) => {
    // 1. Calculate Rewards
    const baseReward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;

    // Equipment Bonus (Pickaxe)
    const partyPickaxeBonusPercent = partyHeroes.reduce((acc, h) => {
        const equip = gameState.equipment.find(e => e.id === h.equipmentIds[0]);
        return acc + (equip ? equip.bonus : 0);
    }, 0);
    const addEquipmentReward = Math.floor(baseReward * (partyPickaxeBonusPercent / 100));

    // Hero Trait Bonus (Regex Parse)
    const partyHeroBonusPercent = partyHeroes.reduce((acc, h) => {
        const match = h.trait?.match(/クエスト報酬\s*\+(\d+)%/);
        return acc + (match ? parseInt(match[1]) : 0);
    }, 0);
    const addHeroReward = Math.floor(baseReward * (partyHeroBonusPercent / 100));

    // 2. Calculate Damage
    const heroDamages: Record<string, number> = {};
    
    partyHeroes.forEach((hero) => {
        let finalDmg = 0;
        
        // Instant Death Logic check
        if (config.deathChance > 0 && Math.random() < config.deathChance) {
            finalDmg = 9999; // Fatal damage signal
        } else {
            const rawDmg = Math.floor(Math.random() * (config.maxDmg - config.minDmg + 1)) + config.minDmg;
            const helmetEquip = gameState.equipment.find(e => e.id === hero.equipmentIds[1]);
            const helmetBonus = helmetEquip ? helmetEquip.bonus : 0;
            const totalReduction = hero.damageReduction + helmetBonus;
            
            finalDmg = rawDmg;
            if (totalReduction > 0) {
              finalDmg = Math.max(0, rawDmg - Math.ceil(rawDmg * (totalReduction / 100)));
            }
        }
        heroDamages[hero.id] = finalDmg;
    });

    return {
        baseReward,
        addEquipmentReward,
        addHeroReward,
        heroDamages
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

    // --- Calculate Results using Helper ---
    const { baseReward, addEquipmentReward, addHeroReward, heroDamages } = calculateQuestResults(config, partyHeroes);

    // Duration Logic
    const totalBootsBonus = partyHeroes.reduce((acc, hero) => {
      const equipId = hero.equipmentIds[2];
      const equip = gameState.equipment.find(e => e.id === equipId);
      return acc + (equip ? equip.bonus : 0);
    }, 0);
    
    const reductionMultiplier = Math.max(0.1, 1 - (totalBootsBonus / 100));
    const actualDuration = Math.floor(config.duration * reductionMultiplier);

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
      // Check if results are valid. If baseReward is 0, recalculate (fallback for old data/errors)
      let { baseReward, addHeroReward, addEquipmentReward, heroDamages } = quest.results || { 
          baseReward: 0, addHeroReward: 0, addEquipmentReward: 0, heroDamages: {} 
      };

      let isRecalculated = false;
      if (!baseReward || baseReward === 0) {
          console.log(`[useQuest] Results missing or zero for quest ${quest.id}. Recalculating...`);
          const calculated = calculateQuestResults(config, questHeroes);
          baseReward = calculated.baseReward;
          addHeroReward = calculated.addHeroReward;
          addEquipmentReward = calculated.addEquipmentReward;
          heroDamages = calculated.heroDamages;
          isRecalculated = true;
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

          // 1. Update quest_process status to completed
          // Include calculated results if they were missing
          const updatePayload: any = { status: 'completed' };
          
          if (isRecalculated) {
             updatePayload.base_reward = baseReward;
             updatePayload.add_hero_reward = addHeroReward;
             updatePayload.add_equipment_reward = addEquipmentReward;
             if (quest.heroIds[0]) updatePayload.hero1_damage = heroDamages[quest.heroIds[0]] || 0;
             if (quest.heroIds[1]) updatePayload.hero2_damage = heroDamages[quest.heroIds[1]] || 0;
             if (quest.heroIds[2]) updatePayload.hero3_damage = heroDamages[quest.heroIds[2]] || 0;
          }

          await supabase.from('quest_process').update(updatePayload).eq('quest_pid', questPid);

          // 2. Update Hero HPs and Handle Deaths
          for (const hero of questHeroes) {
              const newHp = newHeroes.find(h => h.id === hero.id)?.hp || 0;
              const playerHid = parseInt(hero.id);
              
              if (deadHeroIds.includes(hero.id)) {
                  const { data: currentHeroData } = await supabase
                      .from('quest_player_hero')
                      .select('hero_id')
                      .eq('player_hid', playerHid)
                      .single();

                  if (currentHeroData) {
                      await supabase.from('quest_player_hero_lost').insert({
                          fid: farcasterUser.fid,
                          hero_id: currentHeroData.hero_id,
                          quest_pid: questPid
                      });
                      await supabase.from('quest_player_hero').delete().eq('player_hid', playerHid);
                  }
              } else {
                  await supabase.from('quest_player_hero')
                      .update({ hp: newHp })
                      .eq('player_hid', playerHid);
              }
          }

          // 3. Update stats (Quest Count)
          const { error: statError } = await supabase.rpc('increment_player_stat', { 
            player_fid: farcasterUser.fid, 
            column_name: 'quest_count', 
            amount: 1 
          });
          
          if (statError) {
             // Fallback
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

  return { depart, returnFromQuest, debugCompleteQuest };
};