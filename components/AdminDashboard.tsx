
import React, { useState } from 'react';
import AdminUserInspector from './AdminUserInspector';
import AdminDbBrowser from './AdminDbBrowser';

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'DB' | 'USER'>('USER'); 

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
           </div>
        </div>
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold border border-slate-700 hover:bg-slate-700 text-xs"
        >
          Close
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'DB' ? <AdminDbBrowser /> : <AdminUserInspector />}
    </div>
  );
};

export default AdminDashboard;
