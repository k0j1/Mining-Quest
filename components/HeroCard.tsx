
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

  const slots = [0, 1, 2];

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 glass-panel rounded-xl">
        <img src={hero.imageUrl} className="w-12 h-12 rounded-full border-2 border-indigo-400 object-cover" alt={hero.name} />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="font-bold text-sm">{hero.name}</p>
            <div className="flex space-x-1">
              {slots.map(i => (
                <div key={i} className={`w-3 h-3 rounded-full border ${hero.equipmentIds[i] ? 'bg-indigo-400 border-indigo-300' : 'border-slate-600'}`}></div>
              ))}
              <span className={`text-[10px] px-1.5 rounded text-white ml-2 ${rarityColors[hero.rarity]}`}>{hero.rarity}</span>
            </div>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
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
        <div className="p-4 space-y-3">
          <h3 className="text-xl font-orbitron font-bold text-center border-b border-slate-600 pb-1">{hero.name}</h3>
          
          <div className="flex justify-center items-center space-x-4">
            <div className="text-center">
              <span className="block text-slate-400 text-[10px] uppercase mb-1">EQUIPMENT SLOTS</span>
              <div className="flex space-x-2">
                {slots.map(i => (
                  <div key={i} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${hero.equipmentIds[i] ? 'bg-indigo-900/40 border-indigo-400' : 'bg-slate-800/50 border-slate-700 border-dashed'}`}>
                    {hero.equipmentIds[i] ? (
                      <span className="text-lg">⚒️</span>
                    ) : (
                      <span className="text-slate-600 text-xs">+</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">HP</span>
              <span className="font-mono">{hero.hp} / {hero.maxHp}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full transition-all duration-500"
                style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs font-bold text-indigo-300">
              LV. {hero.level}
            </div>
            <div className="text-[10px] text-slate-500 font-orbitron">
              CHW-0{hero.id.replace(/\D/g,'')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;
