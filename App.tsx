
import React, { useState, useEffect } from 'react';
import { View } from './types';
import StatusBoard from './components/StatusBoard';
import MiningBackground from './components/MiningBackground';
import ResultModal from './components/ResultModal';
import BottomNav from './components/BottomNav';
import { playClick, playConfirm, toggleSound } from './utils/sound';
import { useGameLogic } from './hooks/useGameLogic';
import { sdk } from '@farcaster/frame-sdk';

// Views
import PartyView from './components/views/PartyView';
import DepartView from './components/views/DepartView';
import RecoveryView from './components/views/RecoveryView';
import GachaView from './components/views/GachaView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const { gameState, ui, actions } = useGameLogic();

  useEffect(() => {
    // Farcaster SDK ready signal: This is critical for the app to show up in the Farcaster client.
    const init = async () => {
      try {
        console.log("Farcaster SDK: Signaling ready...");
        await sdk.actions.ready();
      } catch (e) {
        console.error("Farcaster SDK ready error", e);
      }
    };
    init();
  }, []);

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
      <BottomNav 
        currentView={currentView} 
        onNavClick={handleNavClick} 
      />

      {/* Decorative top bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 z-[100]"></div>
    </div>
  );
};

export default App;
