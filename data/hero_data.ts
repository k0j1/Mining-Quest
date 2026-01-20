
import { Species, QuestRank } from '../types';

export interface HeroDefinition {
  name: string;
  rarity: QuestRank;
  hp: number;
  ability: string;
  species: Species;
}

export const HERO_DEFINITIONS: HeroDefinition[] = [
  { name: "Magician's Cat", rarity: "C", hp: 50, ability: "HP30以上で出発時、チームのクエスト報酬 +10%", species: "Cat" },
  { name: "SwordsmanCat", rarity: "C", hp: 50, ability: "HP20以下の間このキャラクターの受けるダメージが -5%", species: "Cat" },
  { name: "ScoutRat", rarity: "C", hp: 50, ability: "採掘時間が -5%", species: "Other" },
  { name: "MedicalHamster", rarity: "C", hp: 50, ability: "チームの受けるダメージが -1%　・　チームのクエスト報酬  -5%", species: "Other" },
  { name: "ScoutDog", rarity: "C", hp: 50, ability: "採掘時間が -5%", species: "Dog" },
  { name: "ScoutMonkey", rarity: "C", hp: 50, ability: "採掘時間が -5%", species: "Other" },
  { name: "ArcherLeopard", rarity: "C", hp: 50, ability: "このキャラクターの受けるダメージが -1%", species: "Cat" },
  { name: "ArcherRabbit", rarity: "C", hp: 50, ability: "このキャラクターの受けるダメージが -1%", species: "Other" },
  { name: "Magician's Snake", rarity: "C", hp: 50, ability: "HP30以上で出発時、チームのクエスト報酬 +10%", species: "Other" },
  { name: "WizardKoala", rarity: "C", hp: 50, ability: "HP30以上で出発時、チームのクエスト報酬 +10%", species: "Other" },
  { name: "Magician's Lesser Panda", rarity: "C", hp: 50, ability: "HP30以上で出発時、チームのクエスト報酬 +10%", species: "Other" },
  { name: "ElephantWarrior", rarity: "C", hp: 50, ability: "このキャラクターの受けるダメージが -1%", species: "Other" },
  { name: "ScoutPenguin", rarity: "C", hp: 50, ability: "採掘時間が -5%", species: "Bird" },
  { name: "Miner's Hedgehog", rarity: "C", hp: 50, ability: "チームのクエスト報酬 +5%", species: "Other" },
  { name: "Miner's Panda", rarity: "C", hp: 50, ability: "チームのクエスト報酬 +5%", species: "Other" },
  { name: "Miner's Otter", rarity: "C", hp: 50, ability: "チームのクエスト報酬 +5%", species: "Other" },
  { name: "Miner's Turtle", rarity: "C", hp: 50, ability: "チームのクエスト報酬 +5%", species: "Other" },
  { name: "Big-EaterRaccoon", rarity: "C", hp: 50, ability: "HP=100％で出発時、このキャラクターの受けるダメージが -30%", species: "Other" },
  { name: "MushroomFrog", rarity: "C", hp: 50, ability: "HP=100％で出発時、このキャラクターの受けるダメージが -30%", species: "Other" },
  { name: "MiningMonkey", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%", species: "Other" },
  { name: "MiningFox", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%", species: "Other" },
  { name: "MiningTiger", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%", species: "Cat" },
  { name: "MiningSheep", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%", species: "Other" },
  { name: "MiningPanda", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%", species: "Other" },
  { name: "MiningDog", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%", species: "Dog" },
  { name: "MiningOwl", rarity: "UC", hp: 60, ability: "チームのクエスト報酬 +10%", species: "Bird" },
  { name: "AppleBird", rarity: "UC", hp: 60, ability: "HP=100％で出発時、このキャラクターの受けるダメージが -50%", species: "Bird" },
  { name: "WizardBird", rarity: "UC", hp: 60, ability: "HP30以上で出発時、チームのクエスト報酬 +15%", species: "Bird" },
  { name: "WizardRaccoon", rarity: "UC", hp: 60, ability: "HP30以上で出発時、チームのクエスト報酬 +15%", species: "Other" },
  { name: "ArcherCat", rarity: "UC", hp: 60, ability: "このキャラクターの受けるダメージが -5%", species: "Cat" },
  { name: "PanDuck", rarity: "UC", hp: 60, ability: "HP=100％で出発時、このキャラクターの受けるダメージが -50%", species: "Bird" },
  { name: "ScoutGorilla", rarity: "UC", hp: 60, ability: "採掘時間が -20%", species: "Other" },
  { name: "ScoutCat", rarity: "R", hp: 80, ability: "採掘時間が -10%", species: "Cat" },
  { name: "MiningChihuahua", rarity: "R", hp: 80, ability: "チームのクエスト報酬 +15%", species: "Dog" },
  { name: "MiningGorilla", rarity: "R", hp: 80, ability: "チームのクエスト報酬 +15%", species: "Other" },
  { name: "MiningWolf", rarity: "R", hp: 80, ability: "チームのクエスト報酬 +15%", species: "Dog" },
  { name: "SwordsmanTiger", rarity: "R", hp: 80, ability: "HP60以下の間このキャラクターの受けるダメージが -20%", species: "Cat" },
  { name: "SwordsmanLion", rarity: "R", hp: 80, ability: "このキャラクターの受けるダメージが -10%", species: "Cat" },
  { name: "GemGorilla", rarity: "E", hp: 90, ability: "チームのクエスト報酬 +25%", species: "Other" },
  { name: "WizardRabbit", rarity: "E", hp: 90, ability: "HP30以上で出発時、チームのクエスト報酬 +30%", species: "Other" },
  { name: "GemChihuahua", rarity: "E", hp: 90, ability: "チームのクエスト報酬 +25%", species: "Dog" },
  { name: "LegendRetriever", rarity: "L", hp: 100, ability: "チーム全員の受けるダメージが -20%", species: "Dog" },
];
