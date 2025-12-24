
import React, { useState } from 'react';
import { View } from './types';
import { ICONS } from './constants';
import StatusBoard from './components/StatusBoard';
import MiningBackground from './components/MiningBackground';
import ResultModal from './components/ResultModal';
import { playClick, playConfirm, toggleBGM } from './utils/sound';
import { useGameLogic } from './hooks/useGameLogic';

// Views
import PartyView from './components/views/PartyView';
import DepartView from './components/views/DepartView';
import RecoveryView from './components/views/RecoveryView';
import GachaView from './components/views/GachaView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isBgmOn, setIsBgmOn] = useState(false);
  const { gameState, ui, actions } = useGameLogic();

  const handleNavClick = (view: View) => {
    playClick();
    setCurrentView(view);
  };

  const handleToggleBgm = () => {
    const newState = !isBgmOn;
    setIsBgmOn(newState);
    toggleBGM(newState);
    if (!isBgmOn) playConfirm(); // Sound confirmation when turning ON
  };

  const renderContent = () => {
    switch (currentView) {
      case View.PARTY:
        return (
          <PartyView 
            gameState={gameState} 
            onSwapHeroes={actions.swapHeroes}
            onEquipItem={actions.equipItem}
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
          />
        );
      
      case View.RECOVERY:
        return (
          <RecoveryView 
            gameState={gameState} 
            onPotion={actions.usePotion}
            onElixir={actions.useElixir} 
          />
        );

      case View.HOME:
      default:
        return <StatusBoard state={gameState} view={View.HOME} title="ベースキャンプ" />;
    }
  };

  const navItems = [
    { view: View.HOME, label: 'HOME', icon: ICONS.HOME },
    { view: View.PARTY, label: '編成', icon: ICONS.PARTY },
    { view: View.DEPART, label: '出発', icon: ICONS.DEPART },
    { view: View.RETURN, label: '帰還', icon: ICONS.RETURN },
    { view: View.GACHA, label: 'ガチャ', icon: ICONS.GACHA },
    { view: View.RECOVERY, label: '回復', icon: ICONS.RECOVERY },
  ];

  return (
    <div className="fixed inset-0 flex flex-col max-w-4xl mx-auto overflow-hidden bg-slate-950 border-x border-slate-800">
      {/* Sound Toggle Button (Fixed on top right) */}
      <button 
        onClick={handleToggleBgm}
        className="fixed top-3 right-3 z-[110] p-2 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-full hover:bg-slate-800 active:scale-95 transition-all"
        aria-label="Toggle BGM"
      >
        {isBgmOn ? (
          <div className="flex space-x-0.5 items-end h-4 w-4 justify-center">
            <div className="w-1 bg-green-400 rounded-t animate-[bounce_1s_infinite]"></div>
            <div className="w-1 bg-green-400 rounded-t animate-[bounce_1.2s_infinite]"></div>
            <div className="w-1 bg-green-400 rounded-t animate-[bounce_0.8s_infinite]"></div>
          </div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
        )}
      </button>

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
      <nav className="flex-none bg-slate-950/98 backdrop-blur-2xl border-t border-slate-800 flex items-center justify-around px-2 z-[60] pb-[env(safe-area-inset-bottom)] h-[calc(5rem+env(safe-area-inset-bottom))]">
        {navItems.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => handleNavClick(view)}
            className={`flex flex-col items-center justify-center transition-all duration-300 w-14 pb-1 ${
              currentView === view ? 'text-indigo-400 scale-110' : 'text-slate-500'
            }`}
          >
            <Icon className={`w-6 h-6 ${currentView === view ? 'drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]' : ''}`} />
            <span className="text-[10px] mt-1.5 font-bold tracking-tight">{label}</span>
          </button>
        ))}
      </nav>

      {/* Decorative top bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 z-[100]"></div>
    </div>
  );
};

export default App;
