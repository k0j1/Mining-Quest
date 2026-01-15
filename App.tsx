
import React, { useState, useEffect, useCallback } from 'react';
import { View } from './types';
import StatusBoard from './components/StatusBoard';
import MiningBackground from './components/MiningBackground';
import ResultModal from './components/ResultModal';
import AccountModal from './components/AccountModal';
import BottomNav from './components/BottomNav';
import Notification from './components/Notification';
import DebugConsole from './components/DebugConsole'; // Import DebugConsole
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
  const [appError, setAppError] = useState<string | null>(null);
  const [isFarcasterEnv, setIsFarcasterEnv] = useState(false); // State to track environment
  
  // useGameLogic フック内のエラーも捕捉したいが、フック自体のクラッシュはErrorBoundaryが必要。
  // ここではフックから返される通知などを利用する。
  const { gameState, farcasterUser, onChainBalanceRaw, ui, actions } = useGameLogic();

  // グローバルエラーハンドリング
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setAppError(event.message || "Unknown error occurred");
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      setAppError(`Promise Rejected: ${event.reason?.message || event.reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Farcaster Frame v2 Loading Optimization
  useEffect(() => {
    const load = async () => {
      try {
        // Check if running in Farcaster context
        if (sdk && sdk.context) {
           sdk.context.then(context => {
             if (context) {
                console.log("Farcaster Context Detected:", context);
                setIsFarcasterEnv(true);
             }
           }).catch(() => {
             console.log("Not in Farcaster Frame context");
           });
        }

        // Give the app a moment to paint the initial UI before signaling ready
        setTimeout(() => {
          try {
            if (sdk && sdk.actions) {
               sdk.actions.ready();
            } else {
               // ローカル環境などでSDKがない場合
               console.log("Farcaster SDK actions not available (Browser mode?)");
            }
          } catch (e: any) {
            console.warn("Farcaster SDK ready signal failed:", e);
            setAppError(`SDK Ready Error: ${e.message}`);
          }
        }, 200); // Wait a bit longer to ensure render
      } catch (e: any) {
         setAppError(`Init Error: ${e.message}`);
      }
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

  // 致命的なエラーが発生した場合の表示
  if (appError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-8 text-center z-[9999]">
        <h2 className="text-2xl font-bold text-rose-500 mb-4">CRITICAL ERROR</h2>
        <div className="bg-slate-900 p-4 rounded-xl border border-rose-900 w-full overflow-auto max-h-[50vh]">
          <p className="font-mono text-xs text-rose-200 break-words">{appError}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-3 bg-slate-800 border border-slate-600 rounded-full font-bold hover:bg-slate-700 active:scale-95"
        >
          Reload App
        </button>
        {/* Error時もDebugConsoleは表示する */}
        <DebugConsole isEnabled={true} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col max-w-4xl mx-auto overflow-hidden bg-slate-950 border-x border-slate-800 shadow-2xl">
      <main className="flex-1 relative overflow-hidden">
        <MiningBackground />
        <div className="relative z-10 h-full">
          {renderContent()}
        </div>
      </main>

      {/* Debug Console: Only enabled if in Farcaster Environment */}
      <DebugConsole isEnabled={isFarcasterEnv} />

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
