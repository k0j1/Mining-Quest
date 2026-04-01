import React from 'react';

interface ClaimPreviewProps {
  assets: any;
  title?: string;
  onClaim?: () => void;
  isClaiming?: boolean;
  onCancel?: () => void;
}

const ClaimPreview: React.FC<ClaimPreviewProps> = ({ assets, title = "Claim Your Rewards Preview", onClaim, isClaiming, onCancel }) => {
  if (!assets) return null;

  const chhBalance = Number(assets.chhBalance || assets[0] || 0);
  const heroCommon = Number(assets.heroCommon || assets[1] || 0);
  const heroUncommon = Number(assets.heroUncommon || assets[2] || 0);
  const heroRare = Number(assets.heroRare || assets[3] || 0);
  const equipCommon = Number(assets.equipCommon || assets[4] || 0);
  const equipUncommon = Number(assets.equipUncommon || assets[5] || 0);
  const equipRare = Number(assets.equipRare || assets[6] || 0);
  const itemPotion = Number(assets.itemPotion || assets[7] || 0);
  const itemElixir = Number(assets.itemElixir || assets[8] || 0);
  const itemWhetstone = Number(assets.itemWhetstone || assets[9] || 0);

  return (
    <div className="w-full mt-4 p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl border border-indigo-500/50 shadow-lg z-20 relative">
      <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-indigo-200">
        <div className="bg-slate-800/50 p-2 rounded">
          <span className="block text-slate-400 mb-1">CHH Balance</span>
          <span className="font-bold text-white text-lg">{Math.round(chhBalance / 10**18)} <span className="text-xs text-indigo-300">CHH</span></span>
        </div>

        {(heroCommon > 0 || heroUncommon > 0 || heroRare > 0) && (
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="block text-slate-400 mb-1">Heroes</span>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: heroCommon }).map((_, i) => (
                <div key={`hc-${i}`} className="w-8 h-10 rounded bg-slate-800 border border-slate-500 flex items-center justify-center shadow-sm">
                  <span className="font-bold text-slate-300 text-[10px]">C</span>
                </div>
              ))}
              {Array.from({ length: heroUncommon }).map((_, i) => (
                <div key={`huc-${i}`} className="w-8 h-10 rounded bg-emerald-900/30 border border-emerald-500 flex items-center justify-center shadow-sm">
                  <span className="font-bold text-emerald-400 text-[10px]">UC</span>
                </div>
              ))}
              {Array.from({ length: heroRare }).map((_, i) => (
                <div key={`hr-${i}`} className="w-8 h-10 rounded bg-blue-900/30 border border-blue-500 flex items-center justify-center shadow-sm">
                  <span className="font-bold text-blue-400 text-[10px]">R</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(equipCommon > 0 || equipUncommon > 0 || equipRare > 0) && (
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="block text-slate-400 mb-1">Equipment</span>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: equipCommon }).map((_, i) => (
                <div key={`ec-${i}`} className="w-8 h-8 rounded bg-slate-800 border border-slate-500 flex items-center justify-center shadow-sm">
                  <span className="font-bold text-slate-300 text-[10px]">C</span>
                </div>
              ))}
              {Array.from({ length: equipUncommon }).map((_, i) => (
                <div key={`euc-${i}`} className="w-8 h-8 rounded bg-emerald-900/30 border border-emerald-500 flex items-center justify-center shadow-sm">
                  <span className="font-bold text-emerald-400 text-[10px]">UC</span>
                </div>
              ))}
              {Array.from({ length: equipRare }).map((_, i) => (
                <div key={`er-${i}`} className="w-8 h-8 rounded bg-blue-900/30 border border-blue-500 flex items-center justify-center shadow-sm">
                  <span className="font-bold text-blue-400 text-[10px]">R</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(itemPotion > 0 || itemElixir > 0 || itemWhetstone > 0) && (
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="block text-slate-400 mb-1">Items</span>
            <div className="flex flex-col gap-1">
              {itemPotion > 0 && (
                <div className="flex items-center justify-between bg-slate-900/50 px-2 py-1 rounded">
                  <span className="text-slate-300 text-[10px]">Potion</span>
                  <span className="font-bold text-white text-xs">x{itemPotion}</span>
                </div>
              )}
              {itemElixir > 0 && (
                <div className="flex items-center justify-between bg-slate-900/50 px-2 py-1 rounded">
                  <span className="text-slate-300 text-[10px]">Elixir</span>
                  <span className="font-bold text-white text-xs">x{itemElixir}</span>
                </div>
              )}
              {itemWhetstone > 0 && (
                <div className="flex items-center justify-between bg-slate-900/50 px-2 py-1 rounded">
                  <span className="text-slate-300 text-[10px]">Whetstone</span>
                  <span className="font-bold text-white text-xs">x{itemWhetstone}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {onClaim && (
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isClaiming}
              className="flex-1 px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all bg-slate-700 text-white hover:bg-slate-600 active:scale-95"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={onClaim}
            disabled={isClaiming}
            className={`flex-[2] py-2 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              isClaiming ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
            }`}
          >
            {isClaiming ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Claiming...
              </>
            ) : (
              <>
                <span>🎁</span> Claim Rewards
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClaimPreview;
