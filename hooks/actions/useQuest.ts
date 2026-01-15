
import { Dispatch, SetStateAction } from 'react';
import { GameState, Quest, Hero, QuestRank } from '../../types';
import { QUEST_CONFIG } from '../../constants';
import { playClick, playDepart, playError } from '../../utils/sound';

interface UseQuestProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  setReturnResult: (result: { results: any[], totalTokens: number } | null) => void;
}

export const useQuest = ({ gameState, setGameState, showNotification, setReturnResult }: UseQuestProps) => {
  
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
