
import { Dispatch, SetStateAction } from 'react';
import { GameState, Quest, Hero, QuestRank } from '../../types';
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
  
  const depart = async (rank: QuestRank) => {
    playClick();

    // Check if any quest is already active
    if (gameState.activeQuests.length > 0) {
      playError();
      showNotification("クエストは1つしか同時に進行できません。帰還を待ってください。", 'error');
      return false;
    }

    // Find Config from State (Loaded from DB)
    const config = gameState.questConfigs.find(q => q.rank === rank);
    if (!config) {
        playError();
        showNotification("クエストデータの読み込みに失敗しました。", 'error');
        return false;
    }

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

    const startTime = Date.now();
    const endTime = startTime + actualDuration * 1000;

    // Create Local Quest Object
    const newQuest: Quest = {
      id: Math.random().toString(), // Temp ID, updated if DB success
      name: config.name,
      rank: rank,
      duration: config.duration,
      actualDuration: actualDuration,
      endTime: endTime,
      reward: Math.floor((config.minReward + config.maxReward) / 2),
      status: 'active',
      heroIds: partyHeroes.map(h => h.id)
    };

    // DB Insert
    if (farcasterUser?.fid) {
        // Need to find quest_mining.id. We only have rank/name in config. 
        // We should really store ID in config. Assuming we fetch it or look it up.
        // Optimization: GameState.questConfigs should include ID.
        // For now, look up by name/rank or assume `config` has `id` if we modify type.
        // Let's query based on rank.
        const { data: questMaster } = await supabase.from('quest_mining').select('id').eq('rank', rank).single();
        
        // Also need party ID. We can lookup quest_player_party.
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
                status: 'active'
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

    let totalReward = 0;
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

      const partyPickaxeBonus = questHeroes.reduce((acc, h) => {
        const equip = gameState.equipment.find(e => e.id === h.equipmentIds[0]);
        return acc + (equip ? equip.bonus : 0);
      }, 0);

      const baseReward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
      const bonusReward = Math.floor(baseReward * (partyPickaxeBonus / 100));
      let finalReward = baseReward + bonusReward;

      let survivors = 0;
      const damageMap: Record<string, number> = {};

      questHeroes.forEach(hero => {
        const idx = newHeroes.findIndex(h => h.id === hero.id);
        if (idx === -1) return;

        let isDead = false;
        let finalDmg = 0;

        if (config.deathChance > 0 && Math.random() < config.deathChance) {
          deadHeroIds.push(hero.id);
          logs.push(`💀 悲報: ${hero.name} は帰らぬ犬となりました...`);
          isDead = true;
          finalDmg = hero.hp; // All HP lost
        } else {
          const rawDmg = Math.floor(Math.random() * (config.maxDmg - config.minDmg + 1)) + config.minDmg;
          const helmetEquip = gameState.equipment.find(e => e.id === hero.equipmentIds[1]);
          const helmetBonus = helmetEquip ? helmetEquip.bonus : 0;
          const totalReduction = hero.damageReduction + helmetBonus;
          
          finalDmg = rawDmg;
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
        
        damageMap[hero.id] = finalDmg;

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

      // Update DB for this quest
      if (farcasterUser?.fid) {
          const questPid = parseInt(quest.id);

          // 1. Update quest_process
          await supabase.from('quest_process').update({
              status: 'completed',
              base_reward: finalReward, // Simplified to store total as base in this prototype or split
              add_hero_reward: bonusReward, 
              hero1_damage: damageMap[questHeroes[0]?.id] || 0,
              hero2_damage: damageMap[questHeroes[1]?.id] || 0,
              hero3_damage: damageMap[questHeroes[2]?.id] || 0
          }).eq('quest_pid', questPid);

          // 2. Update Hero HPs and Handle Deaths
          for (const hero of questHeroes) {
              const newHp = newHeroes.find(h => h.id === hero.id)?.hp || 0;
              const playerHid = parseInt(hero.id);
              
              if (deadHeroIds.includes(hero.id)) {
                  // Retrieve master hero_id for record keeping (since local hero object might not have raw master ID)
                  // But wait, we need the master hero_id. 
                  // In local state, we don't store master ID explicitly in `Hero` type, but we can look it up or assume.
                  // Best approach: Query the `quest_player_hero` to get `hero_id` before deleting.
                  const { data: currentHeroData } = await supabase
                      .from('quest_player_hero')
                      .select('hero_id')
                      .eq('player_hid', playerHid)
                      .single();

                  if (currentHeroData) {
                      // Insert into Lost Table
                      await supabase.from('quest_player_hero_lost').insert({
                          fid: farcasterUser.fid,
                          hero_id: currentHeroData.hero_id,
                          quest_pid: questPid
                      });

                      // Delete from Active Table
                      await supabase.from('quest_player_hero').delete().eq('player_hid', playerHid);
                  }
              } else {
                  // Just update HP for survivors
                  await supabase.from('quest_player_hero')
                      .update({ hp: newHp })
                      .eq('player_hid', playerHid);
              }
          }

          // 3. Update stats
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
