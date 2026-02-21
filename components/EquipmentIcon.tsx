
import React, { useMemo } from 'react';
import { QuestRank } from '../types';

interface EquipmentIconProps {
  type: 'Pickaxe' | 'Helmet' | 'Boots';
  rarity?: QuestRank | string;
  size?: number | string;
  className?: string;
}

const EquipmentIcon: React.FC<EquipmentIconProps> = React.memo(({ 
  type, 
  rarity = 'C', 
  size = '1em',
  className = '' 
}) => {
  // Normalize rarity to short codes (C, UC, R, E, L)
  const normalizedRarity = useMemo(() => {
    const r = rarity.toUpperCase();
    if (r === 'RARE') return 'R';
    if (r === 'UNCOMMON') return 'UC';
    if (r === 'COMMON') return 'C';
    if (r === 'EPIC') return 'E';
    if (r === 'LEGENDARY') return 'L';
    return rarity; // Assume it's already a short code or other
  }, [rarity]);

  const typeMap = {
    Pickaxe: 'P',
    Helmet: 'H',
    Boots: 'B'
  };

  const typeChar = typeMap[type] || 'P';
  const imageUrl = `https://miningquest.k0j1.v2002.coreserver.jp/images/Equipment/${normalizedRarity}${typeChar}.png`;

  // Animation classes based on rarity
  let animClass = '';
  if (normalizedRarity === 'L') {
    animClass = 'eq-anim-l';
  } else if (normalizedRarity === 'E') {
    animClass = 'eq-anim-e';
  } else if (normalizedRarity === 'R') {
    animClass = 'eq-anim-r';
  }

  return (
    <>
      <style>{`
        @keyframes eq-float-l {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 10px rgba(245,158,11,0.6)) drop-shadow(0 0 20px rgba(245,158,11,0.4)); }
          50% { transform: translateY(-6px) scale(1.05); filter: drop-shadow(0 0 25px rgba(245,158,11,1)) drop-shadow(0 0 40px rgba(245,158,11,0.6)); }
        }
        @keyframes eq-float-e {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 8px rgba(147,51,234,0.5)); }
          50% { transform: translateY(-4px) scale(1.03); filter: drop-shadow(0 0 18px rgba(147,51,234,0.9)); }
        }
        @keyframes eq-glow-r {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(37,99,235,0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(37,99,235,0.7)); }
        }
        .eq-anim-l { animation: eq-float-l 2.5s ease-in-out infinite; }
        .eq-anim-e { animation: eq-float-e 3s ease-in-out infinite; }
        .eq-anim-r { animation: eq-glow-r 3.5s ease-in-out infinite; }
      `}</style>
      <img 
        src={imageUrl} 
        alt={`${normalizedRarity} ${type}`} 
        style={{ width: size, height: size, objectFit: 'contain' }}
        className={`${className} ${animClass}`}
        referrerPolicy="no-referrer"
      />
    </>
  );
});

export default EquipmentIcon;
