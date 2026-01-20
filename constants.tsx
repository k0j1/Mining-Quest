
import React from 'react';
import { Hero, Equipment, QuestRank } from './types';

// Equipment Stats Configuration
export const EQUIPMENT_STATS = {
  Pickaxe: { C: 3, UC: 6, R: 10, E: 15, L: 25 }, // Reward Increase %
  Helmet: { C: 5, UC: 10, R: 15, E: 20, L: 30 }, // Damage Reduction %
  Boots: { C: 3, UC: 6, R: 10, E: 15, L: 25 }    // Duration Reduction %
};

// Gacha Hero List (Display Data)
export const GACHA_HERO_DATA = [
  { name: "Magician's Cat", rarity: "C", hp: 50, ability: "HP30以上で出発時、チームのクエスト報酬 +10%" },
  { name: "SwordsmanCat", rarity: "C", hp: 50, ability: "HP20以下の間このキャラクターの受けるダメージが -5%" },
  { name: "ScoutRat", rarity: "C", hp: 50, ability: "採掘時間が -5%" },
  { name: "MedicalHamster", rarity: "C", hp: 50, ability: "チームの受けるダメージが -1%　・　チームのクエスト報酬  -5%" },
  { name: "ScoutDog", rarity: "C", hp: 50, ability: "採掘時間が -5%" },
  { name: "ScoutMonkey", rarity: "C", hp: 50, ability: "採掘時間が -5%" },
  { name: "ArcherLeopard", rarity: "C", hp: 50, ability: "このキャラクターの受けるダメージが -1%" },
  { name: "ArcherRabbit", rarity: "C", hp: 50, ability: "このキャラクターの受けるダメージが -1%" },
  { name: "Magician's Snake", rarity: "C", hp: 50, ability: "HP30以上で出発時、チームのクエスト報酬 +10%" },
  { name: "WizardKoala", rarity: "C", hp: 50, ability: "HP30以上で出発時、チームのクエスト報酬 +10%" },
  { name: "Magician's Lesser Panda", rarity: "C", hp: 50, ability: "HP30以上で出発時、チームのクエスト報酬 +10%" },
  { name: "ElephantWarrior", rarity: "C", hp: 50, ability: "このキャラクターの受けるダメージが -1%" },
  { name: "ScoutPenguin", rarity: "C", hp: 50, ability: "採掘時間が -5%" },
  { name: "Miner's Hedgehog", rarity: "C", hp: 50, ability: "チームのクエスト報酬 +5%" },
  { name: "Miner's Panda", rarity: "C", hp: 50, ability: "チームのクエスト報酬 +5%" },
  { name: "Miner's Otter", rarity: "C", hp: 50, ability: "チームのクエスト報酬 +5%" },
  { name: "Miner's Turtle", rarity: "C", hp: 50, ability: "チームのクエスト報酬 +5%" },
  { name: "Big-EaterRaccoon", rarity: "C", hp: 50, ability: "HP=100％で出発時、このキャラクターの受けるダメージが -30%" },
  { name: "MushroomFrog", rarity: "C", hp: 50, ability: "HP=100％で出発時、このキャラクターの受けるダメージが -30%" },
  { name: "MiningMonkey", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%" },
  { name: "MiningFox", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%" },
  { name: "MiningTiger", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%" },
  { name: "MiningSheep", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%" },
  { name: "MiningPanda", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%" },
  { name: "MiningDog", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%" },
  { name: "MiningOwl", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%" },
  { name: "AppleBird", rarity: "UC", hp: 60, ability: "HP=100％で出発時、このキャラクターの受けるダメージが -50%" },
  { name: "WizardBird", rarity: "UC", hp: 60, ability: "HP30以上で出発時、チームのクエスト報酬 +15%" },
  { name: "WizardRaccoon", rarity: "UC", hp: 60, ability: "HP30以上で出発時、チームのクエスト報酬 +15%" },
  { name: "ArcherCat", rarity: "UC", hp: 60, ability: "このキャラクターの受けるダメージが -5%" },
  { name: "PanDuck", rarity: "UC", hp: 60, ability: "HP=100％で出発時、このキャラクターの受けるダメージが -50%" },
  { name: "ScoutGorilla", rarity: "UC", hp: 60, ability: "採掘時間が -20%" },
  { name: "ScoutCat", rarity: "R", hp: 80, ability: "採掘時間が -10%" },
  { name: "MiningChihuahua", rarity: "R", hp: 80, ability: "チームのクエスト報酬 +15%" },
  { name: "MiningGorilla", rarity: "R", hp: 80, ability: "チームのクエスト報酬 +15%" },
  { name: "MiningWolf", rarity: "R", hp: 80, ability: "チームのクエスト報酬 +15%" },
  { name: "SwordsmanTiger", rarity: "R", hp: 80, ability: "HP60以下の間このキャラクターの受けるダメージが -20%" },
  { name: "SwordsmanLion", rarity: "R", hp: 80, ability: "このキャラクターの受けるダメージが -10%" },
  { name: "GemGorilla", rarity: "E", hp: 90, ability: "チームのクエスト報酬 +25%" },
  { name: "WizardRabbit", rarity: "E", hp: 90, ability: "HP30以上で出発時、チームのクエスト報酬 +30%" },
  { name: "GemChihuahua", rarity: "E", hp: 90, ability: "チームのクエスト報酬 +25%" },
  { name: "LegendRetriever", rarity: "L", hp: 100, ability: "チーム全員の受けるダメージが -20%" },
];

export const INITIAL_HEROES: Hero[] = [
  {
    id: 'h1',
    name: 'チワワ軍曹',
    species: 'Dog',
    rarity: 'E',
    trait: '不屈の魂',
    damageReduction: 10,
    level: 12,
    hp: 80,
    maxHp: 80,
    imageUrl: 'https://picsum.photos/seed/dog1/300/400',
    equipmentIds: ['e1', '', '']
  },
  {
    id: 'h2',
    name: '三毛猫ミケ',
    species: 'Cat',
    rarity: 'C',
    trait: '身軽',
    damageReduction: 5,
    level: 5,
    hp: 50,
    maxHp: 50,
    imageUrl: 'https://picsum.photos/seed/cat1/300/400',
    equipmentIds: ['', '', '']
  },
  {
    id: 'h3',
    name: 'ゴールデン・バグ',
    species: 'Dog',
    rarity: 'L',
    trait: '鋼の肉体',
    damageReduction: 20,
    level: 25,
    hp: 100,
    maxHp: 100,
    imageUrl: 'https://picsum.photos/seed/dog3/300/400',
    equipmentIds: ['', 'e2', '']
  },
  {
    id: 'h4',
    name: 'キャプテン・パロット',
    species: 'Bird',
    rarity: 'R',
    trait: '空の監視者',
    damageReduction: 8,
    level: 8,
    hp: 70,
    maxHp: 70,
    imageUrl: 'https://picsum.photos/seed/bird1/300/400',
    equipmentIds: ['', '', '']
  },
  {
    id: 'h5',
    name: 'ブラック・パンサー',
    species: 'Cat',
    rarity: 'E',
    trait: '闇に潜む',
    damageReduction: 15,
    level: 15,
    hp: 80,
    maxHp: 80,
    imageUrl: 'https://picsum.photos/seed/cat2/300/400',
    equipmentIds: ['', '', '']
  },
  {
    id: 'h6',
    name: 'スピード・ラッセル',
    species: 'Dog',
    rarity: 'C',
    trait: '走り屋',
    damageReduction: 3,
    level: 3,
    hp: 50,
    maxHp: 50,
    imageUrl: 'https://picsum.photos/seed/dog6/300/400',
    equipmentIds: ['', '', '']
  },
  {
    id: 'h7',
    name: '賢者フクロウ',
    species: 'Bird',
    rarity: 'L',
    trait: '未来予知',
    damageReduction: 25,
    level: 30,
    hp: 100,
    maxHp: 100,
    imageUrl: 'https://picsum.photos/seed/bird2/300/400',
    equipmentIds: ['', '', '']
  },
  {
    id: 'h8',
    name: '穴掘りウサギ',
    species: 'Other',
    rarity: 'R',
    trait: '逃げ足',
    damageReduction: 12,
    level: 10,
    hp: 70,
    maxHp: 70,
    imageUrl: 'https://picsum.photos/seed/rabbit1/300/400',
    equipmentIds: ['', '', '']
  },
  {
    id: 'h9',
    name: '柴犬・小太郎',
    species: 'Dog',
    rarity: 'E',
    trait: '忠義',
    damageReduction: 12,
    level: 18,
    hp: 80,
    maxHp: 80,
    imageUrl: 'https://picsum.photos/seed/dog9/300/400',
    equipmentIds: ['', '', '']
  },
  {
    id: 'h10',
    name: '見習いハムスター',
    species: 'Other',
    rarity: 'C',
    trait: 'ちょこまか',
    damageReduction: 2,
    level: 1,
    hp: 50,
    maxHp: 50,
    imageUrl: 'https://picsum.photos/seed/hamster1/300/400',
    equipmentIds: ['', '', '']
  }
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  { id: 'e1', name: '錆びたツルハシ', type: 'Pickaxe', bonus: 3, rarity: 'C' },
  { id: 'e2', name: '幸運のヘルメット', type: 'Helmet', bonus: 15, rarity: 'R' },
  { id: 'e3', name: '瞬足ブーツ', type: 'Boots', bonus: 6, rarity: 'UC' }
];

interface QuestConfig {
  name: string;
  duration: number; // seconds
  minReward: number;
  maxReward: number;
  burnCost: number;
  minDmg: number;
  maxDmg: number;
  deathChance: number; // 0 to 1
  minHpReq?: number;
}

export const QUEST_CONFIG: Record<QuestRank, QuestConfig> = {
  C: {
    name: '近場の採掘場',
    duration: 15 * 60,
    minReward: 2,
    maxReward: 200,
    burnCost: 0,
    minDmg: 2,
    maxDmg: 5,
    deathChance: 0
  },
  UC: {
    name: '忘れられた坑道',
    duration: 30 * 60,
    minReward: 5,
    maxReward: 500,
    burnCost: 20,
    minDmg: 4,
    maxDmg: 12,
    deathChance: 0
  },
  R: {
    name: '水晶の地底湖',
    duration: 60 * 60,
    minReward: 10,
    maxReward: 1200,
    burnCost: 50,
    minDmg: 10,
    maxDmg: 40,
    deathChance: 0
  },
  E: {
    name: '灼熱のマグマ帯',
    duration: 3 * 60 * 60,
    minReward: 30,
    maxReward: 3000,
    burnCost: 150,
    minDmg: 20,
    maxDmg: 70,
    deathChance: 0,
    minHpReq: 71
  },
  L: {
    name: '奈落の深淵',
    duration: 8 * 60 * 60,
    minReward: 80,
    maxReward: 8000,
    burnCost: 300,
    minDmg: 40,
    maxDmg: 100,
    deathChance: 1 / 61 // approx 1.64%
  }
};

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
