
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { playClick } from '../utils/sound';

const TABLES = [
  'quest_hero',
  'quest_equipment',
  'quest_mining',
  'quest_player_stats',
  'quest_player_hero',
  'quest_player_equipment',
  'quest_player_party',
  'quest_process',
  'quest_process_complete',
  'quest_player_hero_lost'
];

// Helper to determine Primary Key for updates/deletes
const getPKey = (table: string): string => {
  if (table === 'quest_player_hero') return 'player_hid';
  if (table === 'quest_player_equipment') return 'player_eid';
  if (table === 'quest_process') return 'quest_pid';
  if (table === 'quest_player_stats') return 'fid';
  if (table === 'quest_player_party') return 'party_id';
  if (table === 'quest_player_hero_lost') return 'lost_id';
  return 'id';
};

const AdminDbBrowser: React.FC = () => {
  const [activeTable, setActiveTable] = useState(TABLES[0]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editJson, setEditJson] = useState('');

  // Search & Sort State
  const [searchField, setSearchField] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = async (table: string) => {
    setLoading(true);
    setError(null);
    try {
      const pk = getPKey(table);
      const currentSortBy = sortBy || pk;

      let query = supabase
        .from(table)
        .select('*')
        .limit(50)
        .order(currentSortBy, { ascending: sortOrder === 'asc' });

      if (searchField && searchQuery) {
        if (/^\d+$/.test(searchQuery)) {
           query = query.eq(searchField, parseInt(searchQuery));
        } else {
           query = query.ilike(searchField, `%${searchQuery}%`);
        }
      }

      const { data: rows, error: err } = await query;

      if (err) throw err;
      setData(rows || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset search/sort when table changes
    setSearchField('');
    setSearchQuery('');
    setSortBy('');
    setSortOrder('desc');
    fetchData(activeTable);
  }, [activeTable]);

  const handleEdit = (row: any) => {
    setEditingRow(row);
    setEditJson(JSON.stringify(row, null, 2));
  };

  const handleDelete = async (row: any) => {
    if (!row.fid && !confirm("このレコードにはFIDがありません。マスターデータを削除してもよろしいですか？")) {
      return;
    }
    if (!confirm("このレコードを削除してもよろしいですか？この操作は取り消せません。")) {
      return;
    }

    try {
      const pk = getPKey(activeTable);
      const query = supabase.from(activeTable).delete().eq(pk, row[pk]);
      const { error } = await query;
      if (error) throw error;
      alert('削除に成功しました');
      fetchData(activeTable);
    } catch (e: any) {
      alert(`削除に失敗しました: ${e.message}`);
    }
  };

  const handleSave = async () => {
    if (!editingRow) return;
    try {
      const updatedRow = JSON.parse(editJson);
      const pk = getPKey(activeTable);
      const query = supabase.from(activeTable).update(updatedRow).eq(pk, updatedRow[pk]);
      const { error } = await query;
      if (error) throw error;
      alert('更新に成功しました');
      setEditingRow(null);
      fetchData(activeTable);
    } catch (e: any) {
      alert(`更新に失敗しました: ${e.message}`);
    }
  };

  return (
    <>
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

      {/* Search & Sort Controls */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap gap-3 items-center text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">検索:</span>
          <input 
            type="text" 
            placeholder="カラム名 (例: fid)" 
            value={searchField}
            onChange={e => setSearchField(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white w-32 focus:border-indigo-500 outline-none"
          />
          <input 
            type="text" 
            placeholder="値" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData(activeTable)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white w-40 focus:border-indigo-500 outline-none"
          />
        </div>
        
        <span className="text-slate-700">|</span>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400">ソート:</span>
          <input 
            type="text" 
            placeholder={`カラム名 (空なら ${getPKey(activeTable)})`} 
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData(activeTable)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white w-48 focus:border-indigo-500 outline-none"
          />
          <select 
            value={sortOrder} 
            onChange={e => setSortOrder(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white focus:border-indigo-500 outline-none"
          >
            <option value="desc">降順</option>
            <option value="asc">昇順</option>
          </select>
        </div>

        <button 
          onClick={() => fetchData(activeTable)}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-colors ml-auto shadow-sm active:scale-95"
        >
          適用
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-slate-950 text-xs font-mono">
        {loading ? (
          <div className="text-center py-10 text-slate-500">読み込み中...</div>
        ) : error ? (
          <div className="text-red-400 p-4 border border-red-900 rounded bg-red-900/20">{error}</div>
        ) : (
          <div className="min-w-max">
            {data.length === 0 ? (
              <p className="text-slate-600 italic">データが見つかりません。</p>
            ) : (
              <table className="w-full border-collapse border border-slate-800 text-left">
                <thead>
                  <tr className="bg-slate-900">
                    <th className="p-2 border border-slate-800 text-slate-400 sticky left-0 bg-slate-900 z-10 shadow-md">操作</th>
                    {Object.keys(data[0]).map(key => (
                      <th key={key} className="p-2 border border-slate-800 text-indigo-400">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-900/50 group">
                      <td className="p-2 border border-slate-800 sticky left-0 bg-slate-950 group-hover:bg-slate-900/50 z-10 shadow-sm flex gap-2">
                        <button 
                          onClick={() => handleEdit(row)}
                          className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 rounded text-[10px] text-white transition-colors border border-slate-700"
                        >
                          編集
                        </button>
                        {row.fid && (
                          <button 
                            onClick={() => handleDelete(row)}
                            className="px-2 py-1 bg-rose-900/30 hover:bg-rose-600 rounded text-[10px] text-rose-200 hover:text-white transition-colors border border-rose-900/50"
                          >
                            削除
                          </button>
                        )}
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
              <h3 className="text-white font-bold">行の編集 ({activeTable})</h3>
              <button onClick={() => setEditingRow(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="w-full h-64 bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded border border-slate-800 focus:border-indigo-500 outline-none resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                ※ JSON形式で編集してください。Primary Key ({getPKey(activeTable)}) を変更すると新しいレコードとして作成されるか、エラーになります。
              </p>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setEditingRow(null)} className="px-4 py-2 bg-slate-800 text-white rounded">キャンセル</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-500">変更を保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDbBrowser;
