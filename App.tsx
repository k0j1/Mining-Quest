
import React, { useState, useEffect, useCallback } from 'react';
import { View } from './types';
import StatusBoard from './components/StatusBoard';
import MiningBackground from './components/MiningBackground';
import ResultModal from './components/ResultModal';
import AccountModal from './components/AccountModal';
import BottomNav from './components/BottomNav';
import Notification from './components/Notification';
import { playClick, playConfirm, toggleSound } from './utils/sound';
import { useGameLogic } from './hooks/useGameLogic';
import { sdk } from '@farcaster/frame-sdk';

// Views
import PartyView from './components/views/PartyView';
import DepartView from './components/views/DepartView';
import RecoveryView from './components/views/RecoveryView';
import GachaView from './components/views/GachaView';
import LightpaperView from './components/views/LightpaperView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  
  const { gameState, farcasterUser, onChainBalanceRaw, ui, actions } = useGameLogic();

  // Farcaster Frame v2 Loading Optimization
  // https://miniapps.farcaster.xyz/docs/guides/loading
  useEffect(() => {
    const load = async () => {
      // Give the app a moment to paint the initial UI before signaling ready
      // This prevents the splash screen from hiding before the app is visible
      setTimeout(() => {
        try {
          sdk.actions.ready();
        } catch (e) {
          console.warn("Farcaster SDK ready signal failed:", e);
        }
      }, 100); 
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const handleNavClick = (view: View) => {
    playClick();
    setCurrentView(view);
  };

  const handleToggleSound = () => {
    const newState = !isSoundOn;
    setIsSoundOn(newState);
    toggleSound(newState);
    if (newState) playConfirm();
  };

  const commonProps = {
    isSoundOn,
    onToggleSound: handleToggleSound,
    onDebugAddTokens: actions.debugAddTokens,
    farcasterUser,
    onChainBalance: onChainBalanceRaw,
    onAccountClick: () => { playClick(); setShowAccountModal(true); }
  };

  const renderContent = () => {
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
            onRollGachaTriple={actions.rollGachaTriple}
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
            title="回収" 
            actionButtonLabel="報酬を回収して帰還" 
            onAction={actions.returnFromQuest}
            onDebugCompleteQuest={actions.debugCompleteQuest}
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

      case View.LIGHTPAPER:
        return (
          <LightpaperView
            tokens={gameState.tokens}
            onBack={() => { playClick(); setCurrentView(View.HOME); }}
            {...commonProps}
          />
        );

      case View.HOME:
      default:
        return (
          <StatusBoard 
            state={gameState} 
            view={View.HOME} 
            title="ベースキャンプ" 
            onShowLightpaper={() => setCurrentView(View.LIGHTPAPER)}
            onDebugCompleteQuest={actions.debugCompleteQuest}
            {...commonProps} 
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col max-w-4xl mx-auto overflow-hidden bg-slate-950 border-x border-slate-800 shadow-2xl">
      <main className="flex-1 relative overflow-hidden">
        <MiningBackground />
        <div className="relative z-10 h-full">
          {renderContent()}
        </div>
      </main>

      {/* Notification Toast */}
      {ui.notification && (
        <Notification 
          message={ui.notification.message}
          type={ui.notification.type}
          onClose={() => ui.setNotification(null)}
        />
      )}

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

      {showAccountModal && (
        <AccountModal 
          user={farcasterUser}
          balance={onChainBalanceRaw}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      <BottomNav 
        currentView={currentView === View.LIGHTPAPER ? View.HOME : currentView} 
        onNavClick={handleNavClick} 
      />

      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 z-[100]"></div>
    </div>
  );
};

export default App;
