
import React from 'react';
import { View } from '../types';
import { ICONS } from '../constants';

interface NavItem {
  view: View;
  label: string;
  icon: (props: any) => React.JSX.Element;
  imageUrl: string;
}

interface BottomNavProps {
  currentView: View;
  onNavClick: (view: View) => void;
}

const NAV_ITEMS: NavItem[] = [
  { view: View.HOME, label: 'BASE', icon: ICONS.HOME, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Home.png' },
  { view: View.PARTY, label: 'TEAM', icon: ICONS.PARTY, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Formation.png' },
  { view: View.DEPART, label: 'QUEST', icon: ICONS.DEPART, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Quest.png' },
  { view: View.RETURN, label: 'RESULT', icon: ICONS.RETURN, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Results.png' },
  { view: View.GACHA, label: 'GACHA', icon: ICONS.GACHA, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Gacha.png' },
  { view: View.RECOVERY, label: 'HEAL', icon: ICONS.RECOVERY, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Recovery.png' },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavClick }) => {
  return (
    <nav className="flex-none bg-black/80 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-3 z-[100] pb-[env(safe-area-inset-bottom)] h-[calc(6rem+env(safe-area-inset-bottom))]">
      {NAV_ITEMS.map(({ view, label, imageUrl }) => (
        <button
          key={view}
          onClick={() => onNavClick(view)}
          className={`flex flex-col items-center justify-center transition-all duration-500 w-14 pb-2 group ${
            currentView === view ? 'scale-110 opacity-100' : 'opacity-40 grayscale-[0.6]'
          }`}
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Image with High-End Glow */}
            <div className={`absolute inset-0 bg-indigo-500/20 blur-lg rounded-full transition-opacity duration-500 ${
              currentView === view ? 'opacity-100' : 'opacity-0'
            }`}></div>
            
            <img 
              src={imageUrl} 
              alt={label} 
              className={`w-full h-full object-contain relative z-10 transition-transform duration-500 ${
                currentView === view ? 'drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]' : ''
              }`}
            />

            {/* Modern Active Indicator */}
            {currentView === view && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-amber-400 rounded-full shadow-[0_0_15px_#fbbf24] z-20"></div>
            )}
          </div>
          <span className={`text-[8px] mt-1.5 font-black tracking-widest transition-colors uppercase font-orbitron ${
             currentView === view ? 'text-amber-400 drop-shadow-sm' : 'text-slate-500'
          }`}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
