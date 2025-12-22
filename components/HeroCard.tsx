
import React from 'react';
import { Hero } from '../types';

interface HeroCardProps {
  hero: Hero;
  index: number;
  compact?: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  isDragging?: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({ 
  hero, 
  index, 
  compact, 
  onDragStart, 
  onDragOver, 
  onDrop,
  isDragging 
}) => {
  const rarityColors = {
    Common: 'bg-slate-500',
    Rare: 'bg-blue-600',
    Epic: 'bg-purple-600',
    Legendary: 'bg-amber-500'
  };

  const slots = [0, 1, 2];

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) onDragStart(e, index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragOver) onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop) onDrop(e, index);
  };

  if (compact) {
    return (
      <div 
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex items-center space-x-2 p-2 glass-panel rounded-lg cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'opacity-30' : 'opacity-100'} hover:border-indigo-500/50`}
      >
        <img src={hero.imageUrl} className="w-10 h-10 rounded-full border border-indigo-400 object-cover flex-shrink-0" alt={hero.name} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="font-bold text-[10px] truncate">{hero.name}</p>
            <span className={`text-[8px] px-1 rounded text-white ml-1 ${rarityColors[hero.rarity]}`}>{hero.rarity[0]}</span>
          </div>
          <div className="w-full bg-slate-700 h-1 rounded-full mt-1">
            <div 
              className="bg-green-500 h-1 rounded-full" 
              style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative group transition-all duration-300 ${isDragging ? 'opacity-30' : 'opacity-100'} cursor-grab active:cursor-grabbing`}
    >
      <div className={`relative w-full aspect-[3/4] sm:aspect-[2/3] rounded-xl overflow-hidden border-2 border-slate-700 glass-panel shadow-lg group-hover:border-indigo-500/50`}>
        <img src={hero.imageUrl} className="w-full h-2/5 object-cover" alt={hero.name} />
        <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-lg ${rarityColors[hero.rarity]}`}>
          {hero.rarity}
        </div>
        <div className="p-2 space-y-1">
          <h3 className="text-xs sm:text-sm font-orbitron font-bold text-center border-b border-slate-600 pb-0.5 truncate">{hero.name}</h3>
          
          <div className="flex justify-center py-1">
            <div className="flex space-x-1">
              {slots.map(i => (
                <div key={i} className={`w-6 h-6 rounded-md border flex items-center justify-center ${hero.equipmentIds[i] ? 'bg-indigo-900/40 border-indigo-400' : 'bg-slate-800/50 border-slate-700 border-dashed'}`}>
                  {hero.equipmentIds[i] ? <span className="text-xs">⚒️</span> : <span className="text-[10px] text-slate-600">+</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">HP</span>
              <span className="font-mono">{hero.hp}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 to-green-500 h-full"
                style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="text-[10px] font-bold text-indigo-300 text-center pt-1">
            LV. {hero.level}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;
