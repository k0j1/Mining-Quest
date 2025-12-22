
import React from 'react';
import { Hero } from '../types';

interface HeroCardProps {
  hero: Hero;
  compact?: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({ hero, compact }) => {
  const rarityColors = {
    Common: 'bg-slate-500',
    Rare: 'bg-blue-600',
    Epic: 'bg-purple-600',
    Legendary: 'bg-amber-500'
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 glass-panel rounded-xl">
        <img src={hero.imageUrl} className="w-12 h-12 rounded-full border-2 border-indigo-400" alt={hero.name} />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="font-bold text-sm">{hero.name}</p>
            <span className={`text-[10px] px-1.5 rounded text-white ${rarityColors[hero.rarity]}`}>{hero.rarity}</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${(hero.stamina / hero.maxStamina) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group perspective-1000">
      <div className={`relative w-full aspect-[2/3] rounded-2xl overflow-hidden border-4 border-slate-700 glass-panel shadow-2xl transition-transform duration-500 group-hover:scale-105`}>
        <img src={hero.imageUrl} className="w-full h-1/2 object-cover" alt={hero.name} />
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold shadow-lg ${rarityColors[hero.rarity]}`}>
          {hero.rarity}
        </div>
        <div className="p-4 space-y-2">
          <h3 className="text-xl font-orbitron font-bold text-center border-b border-slate-600 pb-1">{hero.name}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-xs">POWER</span>
              <span className="font-bold text-yellow-400">{hero.power}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-xs">LUCK</span>
              <span className="font-bold text-cyan-400">{hero.luck}</span>
            </div>
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">STAMINA</span>
              <span>{hero.stamina} / {hero.maxStamina}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full"
                style={{ width: `${(hero.stamina / hero.maxStamina) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-center mt-4 text-xs font-bold text-indigo-300">
            LEVEL {hero.level}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;
