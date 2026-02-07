
import { Hero, Equipment } from '../types';
import { isSkillActive } from './skill';

export interface PartyStats {
  totalRewardBonus: number;
  totalSpeedBonus: number;
  teamDamageReduction: number;
  breakdown: {
    reward: { hero: number; equip: number };
    speed: { hero: number; equip: number };
  };
  totalHp: number;
  maxHp: number;
}

/**
 * Calculates aggregated stats for a party of heroes, including equipment and skills.
 */
export const calculatePartyStats = (heroes: Hero[], allEquipment: Equipment[]): PartyStats => {
  const activeHeroes = heroes.filter(h => !!h);

  // 1. Reward Bonus
  const rewardEquip = activeHeroes.reduce((acc, h) => {
    const pickaxe = allEquipment.find(e => e.id === h.equipmentIds[0]);
    return acc + (pickaxe ? pickaxe.bonus : 0);
  }, 0);

  const rewardHero = activeHeroes.reduce((acc, h) => {
    let bonus = 0;
    if (h.skillQuest && h.skillQuest > 0) {
      if (isSkillActive(h)) bonus = h.skillQuest;
    } else {
      // Legacy Regex Fallback
      if (isSkillActive(h) && h.trait) {
        const match = h.trait.match(/クエスト報酬\s*\+(\d+)%/);
        bonus = match ? parseInt(match[1]) : 0;
      }
    }
    return acc + bonus;
  }, 0);

  // 2. Speed Bonus
  const speedEquip = activeHeroes.reduce((acc, h) => {
    const boots = allEquipment.find(e => e.id === h.equipmentIds[2]);
    return acc + (boots ? boots.bonus : 0);
  }, 0);

  const speedHero = activeHeroes.reduce((acc, h) => {
    let bonus = 0;
    if (isSkillActive(h)) {
      bonus = h.skillTime || 0;
      // Legacy Regex Fallback
      if (bonus === 0 && h.trait) {
        const match = h.trait.match(/採掘速度\s*\+(\d+)%/);
        if (match) bonus = parseInt(match[1]);
      }
    }
    return acc + bonus;
  }, 0);

  // 3. Team Damage Reduction (Skills only)
  // Individual helmet stats are calculated per hero, not global team reduction usually, 
  // but skills often apply to team.
  let teamDamageReduction = 0;
  activeHeroes.forEach(h => {
    if (isSkillActive(h) && (h.skillType || 0) % 10 === 1) {
      teamDamageReduction += (h.skillDamage || 0);
    }
  });

  // 4. HP Stats
  const totalHp = activeHeroes.reduce((acc, h) => acc + h.hp, 0);
  const maxHp = activeHeroes.reduce((acc, h) => acc + h.maxHp, 0);

  return {
    totalRewardBonus: rewardEquip + rewardHero,
    totalSpeedBonus: speedEquip + speedHero,
    teamDamageReduction,
    breakdown: {
      reward: { hero: rewardHero, equip: rewardEquip },
      speed: { hero: speedHero, equip: speedEquip }
    },
    totalHp,
    maxHp
  };
};

/**
 * Calculates damage reduction for a single hero, considering their equipment and team buffs.
 */
export const calculateHeroDamageReduction = (
  hero: Hero, 
  allEquipment: Equipment[], 
  teamDamageReduction: number = 0
): number => {
  // Equipment Mitigation (Helmet)
  const helmetEquip = allEquipment.find(e => e.id === hero.equipmentIds[1]);
  const helmetBonus = helmetEquip ? helmetEquip.bonus : 0;
  
  // Skill Mitigation (Self)
  // Check if skill is active and is a self-defensive skill (usually not team type)
  // Logic derived from useQuest: (h.skillType || 0) % 10 !== 1 means Self?
  let selfSkillMitigation = 0;
  if (isSkillActive(hero) && (hero.skillType || 0) % 10 !== 1) {
      selfSkillMitigation = (hero.skillDamage || 0);
  }

  return helmetBonus + teamDamageReduction + selfSkillMitigation;
};
