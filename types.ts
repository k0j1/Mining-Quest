
export enum View {
  HOME = 'HOME',
  PARTY = '編成',
  DEPART = '出発',
  RETURN = '帰還',
  GACHA = 'ガチャ',
  RECOVERY = '回復'
}

export interface Hero {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  level: number;
  hp: number;
  maxHp: number;
  imageUrl: string;
  equipmentIds: string[];
}

export interface Equipment {
  id: string;
  name: string;
  type: 'Pickaxe' | 'Helmet' | 'Vest';
  bonus: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface Quest {
  id: string;
  name: string;
  duration: number; // in seconds
  endTime: number; // timestamp
  reward: number;
  status: 'active' | 'completed';
}

export interface GameState {
  tokens: number;
  heroes: Hero[];
  equipment: Equipment[];
  activeQuests: Quest[];
}
