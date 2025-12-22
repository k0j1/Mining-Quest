
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
  power: number;
  luck: number;
  stamina: number;
  maxStamina: number;
  imageUrl: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'Pickaxe' | 'Helmet' | 'Vest';
  bonus: number;
  rarity: string;
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
