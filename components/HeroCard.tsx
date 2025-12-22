
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
  onEquipClick?: (heroId: string, slotIndex: number) => void;
}

const HeroCard: React.FC<HeroCardProps> = ({ 
  hero, 
  index, 
  compact, 
  onDragStart, 
  onDragOver, 
  onDrop,
  isDragging,
  onEquipClick
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
        className={`flex items-center space-x-2 p-2 glass-panel rounded-lg cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'} hover:border-indigo-500/50 relative overflow-visible`}
      >
        <div className="relative flex-shrink-0">
          <img src={hero.imageUrl} className="w-10 h-10 rounded-lg border border-indigo-400 object-cover" alt={hero.name} />
          <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full border border-white shadow-sm ${rarityColors[hero.rarity]}`}></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <p className="font-bold text-[10px] truncate">{hero.name}</p>
            <div className="flex space-x-0.5">
               {slots.map(i => (
                 <div key={i} className={`w-2 h-2 rounded-full ${hero.equipmentIds[i] ? 'bg-indigo-400' : 'bg-slate-700'}`}></div>
               ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[12px] font-mono font-bold text-white flex-shrink-0">
              HP: {hero.hp}
            </span>
            <div className="flex-1 bg-slate-700 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
              />
            </div>
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
      className={`relative group transition-all duration-300 ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'} cursor-grab active:cursor-grabbing overflow-visible pb-4`}
    >
      {/* Square Main Card Container */}
      <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-slate-700 glass-panel shadow-2xl group-hover:border-indigo-400/80 transition-colors`}>
        <img src={hero.imageUrl} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" alt={hero.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>

        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg text-white uppercase tracking-wider ${rarityColors[hero.rarity]}`}>
            {hero.rarity}
          </span>
          <span className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold font-orbitron text-indigo-300 border border-indigo-500/30">
            LV.{hero.level}
          </span>
        </div>

        <div className="absolute bottom-4 left-2.5 right-2.5">
          <h3 className="text-[10px] sm:text-xs font-orbitron font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate mb-0.5">
            {hero.name}
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-[12px] sm:text-sm font-mono font-black text-white drop-shadow-md">
              HP: {hero.hp} / 100
            </span>
            <div className="w-1/3 bg-slate-900/60 h-1 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Protruding Equipment Slots Design - Now interactive */}
      <div className="absolute -bottom-1.5 right-1.5 flex gap-1 z-10">
        {slots.map(i => (
          <button 
            key={i} 
            onClick={(e) => {
              e.stopPropagation();
              if (onEquipClick) onEquipClick(hero.id, i);
            }}
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl border-2 flex items-center justify-center shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1.5 hover:scale-110 active:scale-95 ${
              hero.equipmentIds[i] 
                ? 'bg-indigo-600 border-indigo-300 shadow-indigo-500/50 text-white' 
                : 'bg-slate-800/90 border-slate-700 border-dashed text-slate-500 backdrop-blur-sm hover:border-indigo-500/50 hover:text-indigo-400'
            }`}
          >
            {hero.equipmentIds[i] ? (
              <span className="text-xs sm:text-base">⚒️</span>
            ) : (
              <span className="text-[10px] font-bold">+</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroCard;
