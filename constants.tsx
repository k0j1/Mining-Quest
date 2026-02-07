
import React from 'react';
import { Hero, Equipment, QuestRank } from './types';
import { HERO_DEFINITIONS } from './data/hero_data';
import { getHeroImageUrl } from './utils/heroUtils';

// Toggle this to show/hide "TEST MODE" overlay on banners
export const IS_TEST_MODE = true;

// Equipment Stats Configuration
export const EQUIPMENT_STATS = {
  Pickaxe: { C: 3, UC: 6, R: 10, E: 15, L: 25 }, // Reward Increase %
  Helmet: { C: 5, UC: 10, R: 15, E: 20, L: 30 }, // Damage Reduction %
  Boots: { C: 3, UC: 6, R: 10, E: 15, L: 25 }    // Speed Increase %
};

// Re-export GACHA_HERO_DATA for GachaView compatibility
export const GACHA_HERO_DATA = HERO_DEFINITIONS;

// Helper to create a hero instance from definition
const createHero = (id: string, name: string, level: number, equipmentIds: string[] = ['', '', '']): Hero => {
  const def = HERO_DEFINITIONS.find(h => h.name === name);
  if (!def) {
    // Fallback if name not found
    return {
        id,
        name: "Unknown Hero",
        species: "Other",
        rarity: "C",
        trait: "None",
        damageReduction: 0,
        level: 1,
        hp: 50,
        maxHp: 50,
        imageUrl: "https://placehold.co/300x400/1e293b/475569?text=Unknown",
        equipmentIds,
        skillQuest: 0,
        skillDamage: 0,
        skillTime: 0,
        skillType: 0
    };
  }

  // Determine damage reduction based on rarity/type logic if needed, 
  // or just use a default map since it's not strictly in the json for all.
  // The JSON has "ability" which is the trait.
  // We can approximate damage reduction based on rarity for now.
  const drMap: Record<string, number> = { C: 2, UC: 5, R: 10, E: 15, L: 20 };

  return {
    id,
    name: def.name,
    species: def.species,
    rarity: def.rarity,
    trait: def.ability,
    damageReduction: 0, // Base Damage Reduction is always 0, relies on skill/equip
    level,
    hp: def.hp,
    maxHp: def.hp,
    imageUrl: getHeroImageUrl(def.name, 's'),
    equipmentIds,
    skillQuest: def.skillQuest || 0,
    skillDamage: def.skillDamage || 0,
    skillTime: def.skillTime || 0,
    skillType: def.skillType || 0
  };
};

export const INITIAL_HEROES: Hero[] = [];

export const INITIAL_EQUIPMENT: Equipment[] = [];

export const ICONS = {
  HOME: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  PARTY: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  DEPART: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  ),
  RETURN: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
  ),
  GACHA: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
    </svg>
  ),
  RECOVERY: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )
};
