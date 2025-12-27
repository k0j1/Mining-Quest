
export enum View {
  HOME = 'HOME',
  PARTY = 'TEAM',
  DEPART = 'QUEST',
  RETURN = 'RESULT',
  GACHA = 'GACHA',
  RECOVERY = 'RECOVERY'
}

export type QuestRank = 'C' | 'UC' | 'R' | 'E' | 'L';

export type Species = 'Dog' | 'Cat' | 'Bird' | 'Other';

export interface Hero {
  id: string;
  name: string;
  species: Species;
  rarity: QuestRank;
  trait: string; // e.g. "厚い毛皮"
  damageReduction: number; // Percentage e.g. 5 for -5%
  level: number;
  hp: number;
  maxHp: number; // Fixed at 100 usually
  imageUrl: string;
  equipmentIds: string[]; // [0]: Pickaxe, [1]: Helmet, [2]: Boots
}

export interface Equipment {
  id: string;
  name: string;
  type: 'Pickaxe' | 'Helmet' | 'Boots';
  bonus: number;
  rarity: QuestRank; // C, UC, R, E, L
}

export interface Quest {
  id: string;
  name: string;
  rank: QuestRank;
  duration: number; // in seconds (original duration)
  actualDuration: number; // in seconds (after boots reduction)
  endTime: number; // timestamp
  reward: number; // Estimated or minimum reward for display, actual calc on return
  status: 'active' | 'completed';
  heroIds: string[]; // IDs of heroes sent on this quest
}

export interface GameState {
  tokens: number;
  heroes: Hero[];
  equipment: Equipment[];
  activeQuests: Quest[];
  // Party Management
  activePartyIndex: number; // 0, 1, 2
  unlockedParties: boolean[]; // [true, false, false]
  partyPresets: (string | null)[][]; // 3 arrays of 3 slots. string=heroId, null=empty
}
