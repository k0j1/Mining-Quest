import React, { useState, useEffect, useCallback } from 'react';
import { View } from './types';
import StatusBoard from './components/StatusBoard';
import MiningBackground from './components/MiningBackground';
import ResultModal from './components/ResultModal';
import AccountModal from './components/AccountModal';
import BottomNav from './components/BottomNav';
import Notification from './components/Notification';
import DebugConsole from './components/DebugConsole'; 
import EnvSetup from './components/EnvSetup'; // Import Setup Screen
import { playClick, playConfirm, toggleSound } from './utils/sound';
import { useGameLogic } from './hooks/useGameLogic';
import { sdk } from '@farcaster/frame-sdk';
import { supabase, isSupabaseConfigured } from './lib/supabase'; // Import check flag

// Views
import PartyView from './components/views/PartyView';
import DepartView from './components/views/DepartView';
import RecoveryView from './components/views/RecoveryView';
import GachaView from './components/views/GachaView';
import LightpaperView from './components/views/LightpaperView';

const App: React.FC = () => {
  // 0. Configuration Check - Return early if keys are missing
  if (!isSupabaseConfigured) {
    return <EnvSetup />;
  }

  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [isFarcasterEnv, setIsFarcasterEnv] = useState(false); 
  
  // Maintenance State
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isConnectionChecked, setIsConnectionChecked] = useState(false);

  const { gameState, farcasterUser, onChainBalanceRaw, ui, actions } = useGameLogic();

  // Supabase Connection Check
  useEffect(() => {
    const checkSupabase = async () => {
       try {
         // タイムアウトを設定 (5秒)
         const timeoutPromise = new Promise((_, reject) => 
           setTimeout(() => reject(new Error('Connection timeout')), 5000)
         );
         
         // 単純なHEADリクエストで接続確認
         const queryPromise = supabase.from('quest_hero').select('count', { count: 'exact', head: true });
         
         const { error } = await Promise.race([queryPromise, timeoutPromise]) as any;
         
         if (error) throw error;
         
         setIsMaintenance(false);
       } catch (err) {
         console.error("Supabase Health Check Failed:", err);
         setIsMaintenance(true);
       } finally {
         setIsConnectionChecked(true);
       }
    };
    
    checkSupabase();
  }, []);

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
    const safetyTimer = setTimeout(() => {
      if (!isSDKLoaded) {
        console.warn("Loading timeout - Forcing ready() to show debug console");
        try {
          if (sdk && sdk.actions) {
             sdk.actions.ready();
          }
        } catch(e) { console.error("Force ready failed:", e); }
        
        if (!isConnectionChecked) {
             setAppError("Loading Timeout: App took too long to start.\nForcing display for debugging.");
        }
      }
    }, 3000);

    const load = async () => {
      try {
        if (sdk && sdk.context) {
           sdk.context.then(context => {
             if (context) {
                console.log("Farcaster Context Detected:", context);
                setIsFarcasterEnv(true);
             }
           }).catch((e) => {
             console.log("Not in Farcaster Frame context or context failed:", e);
           });
        }

        setTimeout(() => {
          try {
            if (sdk && sdk.actions) {
               sdk.actions.ready();
               setIsSDKLoaded(true); 
            } else {
               console.log("Farcaster SDK actions not available (Browser mode?)");
               setIsSDKLoaded(true);
            }
          } catch (e: any) {
            console.warn("Farcaster SDK ready signal failed:", e);
            setAppError(`SDK Ready Error: ${e.message}`);
          }
        }, 200); 
      } catch (e: any) {
         setAppError(`Init Error: ${e.message}`);
      }
    };

    if (sdk && !isSDKLoaded) {
      load();
    }
    
    return () => clearTimeout(safetyTimer);
  }, [isSDKLoaded, isConnectionChecked]); 

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

  // Maintenance: Reset Settings Handler
  const handleResetSettings = () => {
    if (window.confirm("接続設定をリセットして、セットアップ画面に戻りますか？\n(入力されたAPIキー情報は削除されます)")) {
      localStorage.removeItem('VITE_SUPABASE_URL');
      localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
      window.location.reload();
    }
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
            onSwapSlots={actions.swapPartyPositions}
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
            onDepart={async (rank) => {
              const success = await actions.depart(rank);
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

  // 1. Loading State (Connection Check)
  if (!isConnectionChecked) {
     return (
       <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white z-[9999]">
          <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-xs font-bold tracking-widest text-slate-400 animate-pulse">CONNECTING...</p>
          </div>
       </div>
     );
  }

  // 2. Maintenance Mode
  if (isMaintenance) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-8 text-center z-[9999]">
         <MiningBackground />
         <div className="relative z-10 flex flex-col items-center">
            <div className="text-6xl mb-6 animate-bounce">🚧</div>
            <h2 className="text-2xl font-black text-amber-500 mb-4 tracking-widest uppercase">MAINTENANCE</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
              現在サーバーに接続できません。<br/>
              メンテナンス中か、ネットワークの問題、あるいは設定されたAPIキーが無効な可能性があります。
            </p>
            
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={() => window.location.reload()}
                className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold text-white transition-all active:scale-95 shadow-lg border border-indigo-500/50 flex items-center justify-center gap-2"
              >
                <span>🔄</span> 再接続を試みる
              </button>

              <button 
                onClick={handleResetSettings}
                className="w-full px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-full font-bold text-slate-400 text-xs transition-all active:scale-95 border border-slate-700 flex items-center justify-center gap-2"
              >
                <span>⚙️</span> 接続設定をリセット (API Key再入力)
              </button>
            </div>
         </div>
         
         {/* Debug Console in Maintenance Mode */}
         <DebugConsole isEnabled={true} />
      </div>
    );
  }

  // 3. Critical Error
  if (appError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-8 text-center z-[9999]">
        <h2 className="text-2xl font-bold text-rose-500 mb-4">CRITICAL ERROR</h2>
        <div className="bg-slate-900 p-4 rounded-xl border border-rose-900 w-full overflow-auto max-h-[50vh] mb-8">
          <p className="font-mono text-xs text-rose-200 break-words whitespace-pre-wrap">{appError}</p>
        </div>
        
        <div className="flex gap-4">
            <button 
              onClick={() => { setAppError(null); setIsSDKLoaded(true); }}
              className="px-6 py-3 bg-slate-800 border border-slate-600 rounded-full font-bold hover:bg-slate-700 active:scale-95 text-sm"
            >
              Ignore & Continue
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 border border-indigo-500 rounded-full font-bold hover:bg-indigo-500 active:scale-95 text-sm"
            >
              Reload App
            </button>
        </div>
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

      {/* Debug Console: Enabled only if Error occurred (User requested removal of bug icon for normal use) */}
      <DebugConsole isEnabled={appError !== null} />

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