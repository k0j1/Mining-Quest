import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';

interface AccountModalProps {
  user: any;
  balance: number | null;
  onClose: () => void;
}

// Allowed Admin FIDs
const ADMIN_FIDS = [891963, 159718, 406233, 1379028]; // ここに管理者のFIDを追加してください

const AccountModal: React.FC<AccountModalProps> = ({ user, balance, onClose }) => {
  const [showAdmin, setShowAdmin] = useState(false);

  if (!user) return null;

  // useGameLogicで正規化されたアドレス(address)を優先使用し、なければcustodyAddressなどをフォールバック
  const ethAddress = user.address || user.custodyAddress || 'No Address';
  const truncatedAddress = ethAddress.length > 20 ? `${ethAddress.slice(0, 6)}...${ethAddress.slice(-4)}` : ethAddress;

  const isAdmin = ADMIN_FIDS.includes(user.fid);

  if (showAdmin) {
    return <AdminDashboard onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm glass-panel rounded-[2.5rem] border-2 border-indigo-500/30 overflow-hidden flex flex-col shadow-[0_0_50px_rgba(79,70,229,0.3)]">
        <div className="p-8 flex flex-col items-center text-center">
          {/* PFP with Glow */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-40 rounded-full animate-pulse"></div>
            <img 
              src={user.pfpUrl} 
              alt={user.username} 
              className="w-24 h-24 rounded-full border-4 border-indigo-400 relative z-10 object-cover"
            />
          </div>

          <h2 className="text-2xl font-orbitron font-bold text-white mb-1">@{user.username}</h2>
          <p className="text-slate-400 text-xs font-mono bg-slate-800/50 px-3 py-1 rounded-full mb-8">
            {truncatedAddress}
          </p>

          <div className="w-full bg-slate-900/50 rounded-2xl p-6 border border-white/5 mb-8">
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">On-chain Balance</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-orbitron font-black text-yellow-400">
                {balance !== null ? balance.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---'}
              </span>
              <span className="text-yellow-600 font-bold">$CHH</span>
            </div>
          </div>

          <div className="w-full space-y-3">
             {isAdmin && (
               <button 
                 onClick={() => setShowAdmin(true)}
                 className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
               >
                 <span>🛠️</span> ADMIN DASHBOARD
               </button>
             )}

             <button 
               onClick={onClose}
               className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-indigo-900/40"
             >
               閉じる
             </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AccountModal;