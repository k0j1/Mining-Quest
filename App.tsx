
import React, { useState } from 'react';
import { View } from './types';
import { ICONS } from './constants';
import StatusBoard from './components/StatusBoard';
import MiningBackground from './components/MiningBackground';
import ResultModal from './components/ResultModal';
import { playClick, playConfirm } from './utils/sound';
import { useGameLogic } from './hooks/useGameLogic';

// Views
import PartyView from './components/views/PartyView';
import DepartView from './components/views/DepartView';
import RecoveryView from './components/views/RecoveryView';
import GachaView from './components/views/GachaView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const { gameState, ui, actions } = useGameLogic();

  const handleNavClick = (view: View) => {
    playClick();
    setCurrentView(view);
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
