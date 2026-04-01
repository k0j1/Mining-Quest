
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
       

        <div className="relative z-10 flex flex-col items-center">
          <div className="text-6xl mb-6 animate-bounce">
              🚧
          </div>
          <h2 className="text-2xl font-black text-amber-500 mb-4 tracking-widest uppercase">
              MAINTENANCE
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
            {isBlocked ? (
              <span>
                We are currently under maintenance.<br/>
                Please try accessing again later.
              </span>
            ) : (
              <span>
                Unable to connect to the server.<br/>
                We might be under maintenance, experiencing network issues, or the API key may be invalid.
              </span>
            )}
          </p>
          
          {!isBlocked && (
            <div className="flex flex-col gap-4 w-full max-w-xs">
              {/* Retry Button */}
              <button 
                onClick={onReload}
                className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold text-white transition-all active:scale-95 shadow-lg border border-indigo-500/50 flex items-center justify-center gap-2"
              >
                <span>🔄</span> Retry Connection
              </button>
            </div>
          )}
       </div>
       
       {/* Debug Console in Maintenance Mode */}
       <DebugConsole isEnabled={true} />
    </div>
  );
};

export default MaintenanceScreen;
