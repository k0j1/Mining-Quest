
import React from 'react';
import MiningBackground from './MiningBackground';
import DebugConsole from './DebugConsole';

interface MaintenanceScreenProps {
  isBlocked: boolean;
  isTestMode: boolean;
  onResetSettings: () => void;
  onReload: () => void;
  onCloseTest?: () => void;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ 
  isBlocked, 
  isTestMode, 
  onResetSettings, 
  onReload,
  onCloseTest
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-8 text-center z-[9999]">
       <MiningBackground />
       
       {isTestMode && (
         <div className="absolute top-0 left-0 w-full bg-rose-600 text-white text-xs font-bold py-1 px-2 text-center z-50 shadow-md">
           ⚠️ MAINTENANCE PREVIEW MODE ⚠️
         </div>
       )}

       <div className="relative z-10 flex flex-col items-center">
          <div className="text-6xl mb-6 animate-bounce">
              {isBlocked ? '🚫' : '🚧'}
          </div>
          <h2 className="text-2xl font-black text-amber-500 mb-4 tracking-widest uppercase">
              {isBlocked ? 'ACCESS RESTRICTED' : 'MAINTENANCE'}
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
            {isBlocked ? (
              <span>
                このアカウントは利用が制限されています。<br/>
                運営までお問い合わせください。
              </span>
            ) : (
              <span>
                現在サーバーに接続できません。<br/>
                メンテナンス中か、ネットワークの問題、あるいは設定されたAPIキーが無効な可能性があります。
              </span>
            )}
          </p>
          
          {!isBlocked && (
            <div className="flex flex-col gap-4 w-full max-w-xs">
              {/* Test Mode: Close Button */}
              {isTestMode ? (
                <button 
                  onClick={onCloseTest}
                  className="w-full px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold text-white transition-all active:scale-95 shadow-lg border border-emerald-500/50 flex items-center justify-center gap-2"
                >
                  <span>✅</span> テストを終了して戻る
                </button>
              ) : (
                /* Real Mode: Retry Buttons */
                <>
                  <button 
                    onClick={onReload}
                    className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold text-white transition-all active:scale-95 shadow-lg border border-indigo-500/50 flex items-center justify-center gap-2"
                  >
                    <span>🔄</span> 再接続を試みる
                  </button>

                  <button 
                    onClick={onResetSettings}
                    className="w-full px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-full font-bold text-slate-400 text-xs transition-all active:scale-95 border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <span>⚙️</span> 接続設定をリセット (API Key再入力)
                  </button>
                </>
              )}
            </div>
          )}
       </div>
       
       {/* Debug Console in Maintenance Mode */}
       <DebugConsole isEnabled={true} />
    </div>
  );
};

export default MaintenanceScreen;
