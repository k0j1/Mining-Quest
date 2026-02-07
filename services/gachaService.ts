
import { supabase } from "../lib/supabase";
import { QuestRank } from "../types";
import { getHeroImageUrl } from "../utils/heroUtils";

// Rarity Logic
// Updated Rates: L:0.1%, E:1.9%, R:16%, UC:32%, C:50%
export const HERO_RATES = { C: 50, UC: 32, R: 16, E: 1.9, L: 0.1 };
export const EQUIPMENT_RATES = { C: 50, UC: 32, R: 16, E: 1.9, L: 0.1 };

const determineRarity = (type: 'Hero' | 'Equipment', minRarity: QuestRank = 'C'): QuestRank => {
  const rand = Math.random() * 100;
  
  // If minRarity is 'R', we only roll for R, E, L (Guaranteed Pull)
  if (minRarity === 'R') {
    // Weights: R: 75%, E: 20%, L: 5% (Maintained generous rates for special pull)
    if (rand < 75) return 'R';
    if (rand < 95) return 'E';
    return 'L';
  }

  // Normal Pull Rates
  // C: 50%  (0   - 49.9)
  // UC: 32% (50  - 81.9)
  // R: 16%  (82  - 97.9)
  // E: 1.9% (98  - 99.89)
  // L: 0.1% (99.9 - 100)
  
  if (rand < 50) return 'C';
  if (rand < 82) return 'UC';
  if (rand < 98) return 'R';
  if (rand < 99.9) return 'E';
  return 'L';
};

export const rollGachaItem = async (type: 'Hero' | 'Equipment', forceRarity?: QuestRank) => {
  
  // 1. Determine Rarity
  const targetRarity = forceRarity || determineRarity(type);
  
  // ---------------------------------------------------------
  // HERO LOGIC
  // ---------------------------------------------------------
  if (type === 'Hero') {
    // Strictly fetch from DB
    const { data, error } = await supabase
      .from('quest_hero')
      .select('*')
      .eq('rarity', targetRarity);
    
    if (error) {
      console.error("Gacha DB Error:", error);
      throw new Error("Failed to fetch hero data from database");
    }

    if (!data || data.length === 0) {
      throw new Error(`No hero data found in database for rarity ${targetRarity}`);
    }
    
    // Pick one random hero from the pool
    const selectedHero = data[Math.floor(Math.random() * data.length)];
    
    // Map approximate damage reduction based on rarity (since it might not be in DB schema provided)
    const drMap: Record<string, number> = { C: 2, UC: 5, R: 10, E: 15, L: 20 };

    return {
      name: selectedHero.name,
      species: selectedHero.species,
      rarity: selectedHero.rarity,
      trait: selectedHero.ability,
      damageReduction: drMap[selectedHero.rarity] || 0,
      hp: selectedHero.hp,
      imageUrl: getHeroImageUrl(selectedHero.name, 's'),
      // Map New Skill Columns
      skillQuest: selectedHero.skill_quest || 0,
      skillDamage: selectedHero.skill_damage || 0,
      skillTime: selectedHero.skill_time || 0,
      skillType: selectedHero.skill_type || 0
    };
  }

  // ---------------------------------------------------------
  // EQUIPMENT LOGIC
  // ---------------------------------------------------------
  else {
    // Strictly fetch from DB
    const { data, error } = await supabase
      .from('quest_equipment')
      .select('*')
      .eq('rarity', targetRarity);

    if (error) {
      console.error("Gacha DB Error:", error);
      throw new Error("Failed to fetch equipment data from database");
    }

    if (!data || data.length === 0) {
       throw new Error(`No equipment data found in database for rarity ${targetRarity}`);
    }

    const selectedEquip = data[Math.floor(Math.random() * data.length)];

    return { 
      name: selectedEquip.name, 
      type: selectedEquip.type, 
      rarity: selectedEquip.rarity, 
      bonus: selectedEquip.bonus 
    };
  }
};
