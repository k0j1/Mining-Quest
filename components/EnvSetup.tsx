import React, { useState } from 'react';
import MiningBackground from './MiningBackground';

const EnvSetup: React.FC = () => {
  const [key, setKey] = useState('');

  const handleSave = () => {
    if (!key) {
      alert('Anon Keyを入力してください');
      return;
    }
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', key.trim());
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-6 z-[9999]">
      <MiningBackground />
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl border border-slate-700 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-xl font-black text-white mb-2 font-orbitron">SYSTEM SETUP</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            APIキー(.env)が見つかりません。<br/>
            SupabaseプロジェクトのAnon Keyを入力してください。<br/>
            <span className="text-[10px] opacity-70">※入力情報はブラウザにのみ保存され、外部には送信されません。</span>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>設定を保存して開始</span>
        </button>
      </div>
    </div>
  );
};

export default EnvSetup;