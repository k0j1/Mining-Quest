
import { supabase } from "../lib/supabase";
import { QuestRank } from "../types";
import { getHeroImageUrl } from "../utils/heroUtils";

// Rarity Logic (Fallback for local / equipment)
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

  if (rand < 50) return 'C';
  if (rand < 82) return 'UC';
  if (rand < 98) return 'R';
  if (rand < 99.9) return 'E';
  return 'L';
};

export const rollGachaItem = async (type: 'Hero' | 'Equipment', forceRarity?: QuestRank, fid?: number) => {
  
  // ---------------------------------------------------------
  // HERO LOGIC (DB RPC Priority)
  // ---------------------------------------------------------
  if (type === 'Hero') {
    // If we have a user FID, run the logic on the DB side for security
    if (fid) {
        const { data, error } = await supabase.rpc('roll_hero_gacha', { 
            p_fid: fid, 
            p_min_rarity: forceRarity || null 
        });

        if (error) {
            console.error("Gacha RPC Error:", error);
            throw new Error(`Gacha Transaction Failed: ${error.message}`);
        }

        if (!data || data.length === 0) {
            throw new Error("Gacha RPC returned no data");
        }

        const result = data[0]; // RPC returns an array

        // Map RPC result to Hero object format
        // Approximate damage reduction mapping for UI consistency if needed
        const drMap: Record<string, number> = { C: 2, UC: 5, R: 10, E: 15, L: 20 };

        return {
            id: result.res_id, // CHANGED: 'id' -> 'res_id' to match corrected RPC
            name: result.name,
            species: result.species,
            rarity: result.rarity,
            trait: result.ability,
            damageReduction: drMap[result.rarity] || 0,
            hp: result.hp,
            imageUrl: getHeroImageUrl(result.name, 's'),
            skillQuest: result.skill_quest || 0,
            skillDamage: result.skill_damage || 0,
            skillTime: result.skill_time || 0,
            skillType: result.skill_type || 0,
            isPersisted: true // Flag to indicate this doesn't need client-side insert
        };
    }

    // --- FALLBACK: Local Logic (No FID) ---
    const targetRarity = forceRarity || determineRarity(type);
    
    const { data, error } = await supabase
      .from('quest_hero')
      .select('*')
      .eq('rarity', targetRarity);
    
    if (error) throw new Error("Failed to fetch hero data");
    if (!data || data.length === 0) throw new Error("No hero data found");
    
    const selectedHero = data[Math.floor(Math.random() * data.length)];
    const drMap: Record<string, number> = { C: 2, UC: 5, R: 10, E: 15, L: 20 };

    return {
      name: selectedHero.name,
      species: selectedHero.species,
      rarity: selectedHero.rarity,
      trait: selectedHero.ability,
      damageReduction: drMap[selectedHero.rarity] || 0,
      hp: selectedHero.hp,
      imageUrl: getHeroImageUrl(selectedHero.name, 's'),
      skillQuest: selectedHero.skill_quest || 0,
      skillDamage: selectedHero.skill_damage || 0,
      skillTime: selectedHero.skill_time || 0,
      skillType: selectedHero.skill_type || 0,
      isPersisted: false
    };
  }

  // ---------------------------------------------------------
  // EQUIPMENT LOGIC (Keep Client-Side for now, or move later)
  // ---------------------------------------------------------
  else {
    const targetRarity = forceRarity || determineRarity(type);
    const { data, error } = await supabase
      .from('quest_equipment')
      .select('*')
      .eq('rarity', targetRarity);

    if (error) throw new Error("Failed to fetch equipment data");
    if (!data || data.length === 0) throw new Error("No equipment data found");

    const selectedEquip = data[Math.floor(Math.random() * data.length)];

    return { 
      name: selectedEquip.name, 
      type: selectedEquip.type, 
      rarity: selectedEquip.rarity, 
      bonus: selectedEquip.bonus,
      isPersisted: false
    };
  }
};
