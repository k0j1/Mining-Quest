import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { playClick } from '../utils/sound';

interface AdminDashboardProps {
  onClose: () => void;
}

const TABLES = [
  'quest_hero',
  'quest_equipment',
  'quest_mining',
  'quest_player_stats',
  'quest_player_hero',
  'quest_player_equipment',
  'quest_player_party',
  'quest_process'
];

// Helper to determine Primary Key for updates
const getPKey = (table: string): string => {
  if (table === 'quest_player_hero') return 'player_hid';
  if (table === 'quest_player_equipment') return 'player_eid';
  if (table === 'quest_process') return 'quest_pid';
  // quest_player_party has composite PK (fid, party_no) - simple edit might fail without special handling
  // For simplicity, we use 'id' as default fallback, but for composite PKs we might disable edit or warn
  return 'id';
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTable, setActiveTable] = useState(TABLES[0]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit State
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editJson, setEditJson] = useState('');

  const fetchData = async (table: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from(table)
        .select('*')
        .limit(50); // Limit to avoid massive load

      if (err) throw err;
      setData(rows || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTable);
  }, [activeTable]);

  const handleEdit = (row: any) => {
    setEditingRow(row);
    setEditJson(JSON.stringify(row, null, 2));
  };

  const handleSave = async () => {
    if (!editingRow) return;
    try {
      const updatedRow = JSON.parse(editJson);
      const pk = getPKey(activeTable);
      
      // If table has composite PK or no ID, this might fail.
      if (!updatedRow[pk] && activeTable === 'quest_player_party') {
          // Special handling for composite PK if needed, but for now specific ID-based update:
          const { error } = await supabase
            .from(activeTable)
            .update(updatedRow)
            .eq('fid', updatedRow.fid)
            .eq('party_no', updatedRow.party_no);
          if (error) throw error;
      } else {
          const { error } = await supabase
            .from(activeTable)
            .update(updatedRow)
            .eq(pk, updatedRow[pk]);
          if (error) throw error;
      }

      alert('Update Successful');
      setEditingRow(null);
      fetchData(activeTable);
    } catch (e: any) {
      alert(`Update Failed: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2">
          <span>🛠️</span> ADMIN DASHBOARD
        </h2>
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold border border-slate-700 hover:bg-slate-700"
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div className="p-2 bg-slate-900/50 overflow-x-auto whitespace-nowrap border-b border-slate-800 shrink-0 custom-scrollbar">
        {TABLES.map(table => (
          <button
            key={table}
            onClick={() => { playClick(); setActiveTable(table); }}
            className={`px-3 py-1.5 mx-1 rounded text-xs font-bold transition-all ${
              activeTable === table 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {table}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950 text-xs font-mono">
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading...</div>
        ) : error ? (
          <div className="text-red-400 p-4 border border-red-900 rounded bg-red-900/20">{error}</div>
        ) : (
          <div className="min-w-max">
            {data.length === 0 ? (
              <p className="text-slate-600 italic">No Data found.</p>
            ) : (
              <table className="w-full border-collapse border border-slate-800 text-left">
                <thead>
                  <tr className="bg-slate-900">
                    <th className="p-2 border border-slate-800 text-slate-400">Action</th>
                    {Object.keys(data[0]).map(key => (
                      <th key={key} className="p-2 border border-slate-800 text-indigo-400">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="p-2 border border-slate-800">
                        <button 
                          onClick={() => handleEdit(row)}
                          className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 rounded text-[10px] text-white transition-colors"
                        >
                          EDIT
                        </button>
                      </td>
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="p-2 border border-slate-800 text-slate-300 truncate max-w-[200px]">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-xl border border-slate-700 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between">
              <h3 className="text-white font-bold">Edit Row ({activeTable})</h3>
              <button onClick={() => setEditingRow(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="w-full h-64 bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded border border-slate-800 focus:border-indigo-500 outline-none resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                ※ JSON形式で編集してください。Primary Keyを変更すると新しいレコードとして作成されるか、エラーになります。
              </p>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setEditingRow(null)} className="px-4 py-2 bg-slate-800 text-white rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-500">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;