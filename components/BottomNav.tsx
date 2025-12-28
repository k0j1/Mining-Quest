
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
  { view: View.HOME, label: 'HOME', icon: ICONS.HOME, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Home.png' },
  { view: View.PARTY, label: 'PARTY', icon: ICONS.PARTY, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Formation.png' },
  { view: View.DEPART, label: 'QUEST', icon: ICONS.DEPART, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Quest.png' },
  { view: View.RETURN, label: 'RESULT', icon: ICONS.RETURN, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Results.png' },
  { view: View.GACHA, label: 'GACHA', icon: ICONS.GACHA, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Gacha.png' },
  { view: View.RECOVERY, label: 'HEAL', icon: ICONS.RECOVERY, imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Recovery.png' },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavClick }) => {
  return (
    <nav className="flex-none bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 z-[100] pb-[env(safe-area-inset-bottom)] h-[calc(6rem+env(safe-area-inset-bottom))]">
      {NAV_ITEMS.map(({ view, label, imageUrl }) => (
        <button
          key={view}
          onClick={() => onNavClick(view)}
          className={`flex flex-col items-center justify-center transition-all duration-200 w-16 pb-1 group ${
            currentView === view ? 'opacity-100 transform -translate-y-1' : 'opacity-40 grayscale'
          }`}
        >
          <div className="relative w-12 h-12 flex items-center justify-center mb-1">
            <img 
              src={imageUrl} 
              alt={label} 
              className={`w-10 h-10 object-contain relative z-10 transition-transform ${
                currentView === view ? 'scale-110 drop-shadow-md' : 'scale-100'
              }`}
            />
          </div>
          <span className={`text-[9px] font-bold tracking-wider transition-colors uppercase ${
             currentView === view ? 'text-indigo-400' : 'text-slate-500'
          }`}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
