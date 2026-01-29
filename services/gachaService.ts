import { supabase } from "../lib/supabase";
import { QuestRank } from "../types";

// Rarity Logic
const determineRarity = (type: 'Hero' | 'Equipment', minRarity: QuestRank = 'C'): QuestRank => {
  const rand = Math.random() * 100;
  
  // If minRarity is 'R', we only roll for R, E, L
  if (minRarity === 'R') {
    // Weights: R: 75%, E: 20%, L: 5%
    if (rand < 75) return 'R';
    if (rand < 95) return 'E';
    return 'L';
  }

  if (type === 'Hero') {
    // Hero: C 50% / UC 30% / R 15% / E 4% / L 1%
    if (rand < 50) return 'C';
    if (rand < 80) return 'UC';
    if (rand < 95) return 'R';
    if (rand < 99) return 'E';
    return 'L';
  } else {
    // Equipment: C 55% / UC 28% / R 12% / E 4% / L 1%
    if (rand < 55) return 'C';
    if (rand < 83) return 'UC';
    if (rand < 95) return 'R';
    if (rand < 99) return 'E';
    return 'L';
  }
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
      imageUrl: `https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/s/${selectedHero.name}_s.png`
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