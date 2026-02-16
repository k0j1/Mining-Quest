
import React, { useState } from 'react';
import AdminUserInspector from './AdminUserInspector';
import AdminDbBrowser from './AdminDbBrowser';
import AdminContractPanel from './AdminContractPanel';

interface AdminDashboardProps {
  onClose: () => void;
  onTriggerMaintenance?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onTriggerMaintenance }) => {
  const [activeTab, setActiveTab] = useState<'DB' | 'USER' | 'CONTRACT'>('USER'); 

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0 shadow-md z-30">
        <div className="flex items-center gap-4">
           <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2">
             <span>🛠️</span> ADMIN
           </h2>
           <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button 
                onClick={() => setActiveTab('USER')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeTab === 'USER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                User
              </button>
              <button 
                onClick={() => setActiveTab('DB')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeTab === 'DB' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                DB
              </button>
              <button 
                onClick={() => setActiveTab('CONTRACT')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeTab === 'CONTRACT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Contract
              </button>
           </div>
           
           {/* Maintenance Test Button */}
           {onTriggerMaintenance && (
             <button 
                onClick={onTriggerMaintenance}
                className="px-3 py-1.5 bg-rose-900/30 text-rose-300 border border-rose-800 rounded text-[10px] font-bold hover:bg-rose-800 hover:text-white transition-colors flex items-center gap-1"
             >
                <span>🚧</span> TEST MAINT
             </button>
           )}
        </div>
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold border border-slate-700 hover:bg-slate-700 text-xs"
        >
          Close
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'DB' && <AdminDbBrowser />}
      {activeTab === 'USER' && <AdminUserInspector />}
      {activeTab === 'CONTRACT' && <AdminContractPanel />}
    </div>
  );
};

export default AdminDashboard;
