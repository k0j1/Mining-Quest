
import React, { useState } from 'react';
import { View } from './types';
import { ICONS } from './constants';
import StatusBoard from './components/StatusBoard';
import MiningBackground from './components/MiningBackground';
import ResultModal from './components/ResultModal';
import { playClick, playConfirm, toggleSound } from './utils/sound';
import { useGameLogic } from './hooks/useGameLogic';

// Views
import PartyView from './components/views/PartyView';
import DepartView from './components/views/DepartView';
import RecoveryView from './components/views/RecoveryView';
import GachaView from './components/views/GachaView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const { gameState, ui, actions } = useGameLogic();

  const handleNavClick = (view: View) => {
    playClick();
    setCurrentView(view);
  };

  const handleToggleSound = () => {
    const newState = !isSoundOn;
    setIsSoundOn(newState);
    toggleSound(newState);
    if (newState) playConfirm(); // Sound confirmation when turning ON
  };

  const renderContent = () => {
    const commonProps = {
      isSoundOn,
      onToggleSound: handleToggleSound,
      onDebugAddTokens: actions.debugAddTokens
    };

    switch (currentView) {
      case View.PARTY:
        return (
          <PartyView 
            gameState={gameState} 
            onEquipItem={actions.equipItem}
            onSwitchParty={actions.switchParty}
            onUnlockParty={actions.unlockParty}
            onAssignHero={actions.assignHeroToParty}
            {...commonProps}
          />
        );

      case View.GACHA:
        return (
          <GachaView 
            gameState={gameState} 
            onRollGacha={actions.rollGacha}
            isGachaRolling={ui.isGachaRolling}
            gachaResult={ui.gachaResult}
            onCloseResult={() => { playClick(); ui.setGachaResult(null); }}
            {...commonProps}
          />
        );

      case View.DEPART:
        return (
          <DepartView 
            gameState={gameState} 
            onDepart={(rank) => {
              const success = actions.depart(rank);
              if (success) setCurrentView(View.HOME);
              return success;
            }}
            onSwitchParty={actions.switchParty}
            {...commonProps}
          />
        );

      case View.RETURN:
        return (
          <StatusBoard 
            state={gameState} 
            view={View.RETURN} 
            title="帰還ポッド" 
            actionButtonLabel="報酬を回収して帰還" 
            onAction={actions.returnFromQuest}
            {...commonProps}
          />
        );
      
      case View.RECOVERY:
        return (
          <RecoveryView 
            gameState={gameState} 
            onPotion={actions.usePotion}
            onElixir={actions.useElixir}
            {...commonProps}
          />
        );

      case View.HOME:
      default:
        return <StatusBoard state={gameState} view={View.HOME} title="ベースキャンプ" {...commonProps} />;
    }
  };

  const navItems = [
    { 
      view: View.HOME, 
      label: 'HOME', 
      icon: ICONS.HOME, 
      imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Home.png' 
    },
    { 
      view: View.PARTY, 
      label: '編成', 
      icon: ICONS.PARTY, 
      imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Formation.png' 
    },
    { 
      view: View.DEPART, 
      label: '出発', 
      icon: ICONS.DEPART, 
      imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Quest.png' 
    },
    { 
      view: View.RETURN, 
      label: '帰還', 
      icon: ICONS.RETURN, 
      imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Results.png' 
    },
    { 
      view: View.GACHA, 
      label: 'ガチャ', 
      icon: ICONS.GACHA, 
      imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Gacha.png' 
    },
    { 
      view: View.RECOVERY, 
      label: '回復', 
      icon: ICONS.RECOVERY, 
      imageUrl: 'https://miningquest.k0j1.v2002.coreserver.jp/images/Recovery.png' 
    },
  ];

  return (
    <div className="fixed inset-0 flex flex-col max-w-4xl mx-auto overflow-hidden bg-slate-950 border-x border-slate-800">
      
      {/* Main Area: Scrollable */}
      <main className="flex-1 relative overflow-hidden">
        <MiningBackground />
        <div className="relative z-10 h-full">
          {renderContent()}
        </div>
      </main>

      {/* Overlays */}
      {ui.returnResult && (
        <ResultModal 
          results={ui.returnResult.results}
          totalTokens={ui.returnResult.totalTokens}
          onClose={() => { 
            playConfirm(); 
            ui.setReturnResult(null); 
            setCurrentView(View.HOME); 
          }}
        />
      )}

      {/* Sticky Bottom Nav */}
      <nav className="flex-none bg-slate-950/98 backdrop-blur-2xl border-t border-slate-800 flex items-center justify-around px-2 z-[60] pb-[env(safe-area-inset-bottom)] h-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {navItems.map(({ view, label, icon: Icon, imageUrl }) => (
          <button
            key={view}
            onClick={() => handleNavClick(view)}
            className={`flex flex-col items-center justify-center transition-all duration-300 w-14 pb-1 group ${
              currentView === view ? 'scale-110' : 'opacity-70 grayscale'
            }`}
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Image with SVG Fallback */}
              <img 
                src={imageUrl} 
                alt={label} 
                className={`w-full h-full object-contain transition-all duration-300 ${
                  currentView === view ? 'drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' : ''
                }`}
                onError={(e) => {
                  // Fallback to Icon if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  const sibling = (e.target as HTMLImageElement).nextElementSibling;
                  if (sibling) (sibling as HTMLElement).style.display = 'block';
                }}
              />
              <div style={{ display: 'none' }} className="fallback-icon">
                 <Icon className={`w-6 h-6 ${currentView === view ? 'text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]' : 'text-slate-500'}`} />
              </div>

              {/* Active Indicator bar */}
              {currentView === view && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(129,140,248,1)]"></div>
              )}
            </div>
            <span className={`text-[9px] mt-1 font-black tracking-tighter transition-colors ${
               currentView === view ? 'text-indigo-300' : 'text-slate-500'
            }`}>
              {label}
            </span>
          </button>
        ))}
      </nav>

      {/* Decorative top bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 z-[100]"></div>
    </div>
  );
};

export default App;
