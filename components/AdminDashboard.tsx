
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'DB' | 'USER'>('USER'); // Default to User Inspector
  
  // DB Browser State
  const [activeTable, setActiveTable] = useState(TABLES[0]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editJson, setEditJson] = useState('');

  // User Inspector State
  const [userSearch, setUserSearch] = useState('');
  const [userList, setUserList] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<{
    parties: any[];
    heroes: any[];
    equipment: any[];
    activeQuests: any[];
    lostHeroes: any[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- DB BROWSER FUNCTIONS ---

  const fetchData = async (table: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from(table)
        .select('*')
        .limit(50)
        .order(getPKey(table), { ascending: false });

      if (err) throw err;
      setData(rows || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'DB') {
      fetchData(activeTable);
    }
  }, [activeTable, activeTab]);

  const handleEdit = (row: any) => {
    setEditingRow(row);
    setEditJson(JSON.stringify(row, null, 2));
  };

  const handleDelete = async (row: any) => {
    if (!row.fid && !confirm("This record does not have an FID. Are you sure you want to delete MASTER DATA?")) {
      return;
    }
    if (!confirm("Are you sure you want to DELETE this record? This cannot be undone.")) {
      return;
    }

    try {
      const pk = getPKey(activeTable);
      const query = supabase.from(activeTable).delete().eq(pk, row[pk]);
      const { error } = await query;
      if (error) throw error;
      alert('Delete Successful');
      fetchData(activeTable);
    } catch (e: any) {
      alert(`Delete Failed: ${e.message}`);
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
      alert('Update Successful');
      setEditingRow(null);
      fetchData(activeTable);
    } catch (e: any) {
      alert(`Update Failed: ${e.message}`);
    }
  };

  // --- USER INSPECTOR FUNCTIONS ---

  useEffect(() => {
    if (activeTab === 'USER') {
      fetchUserList();
    }
  }, [activeTab]); // Initial load

  const fetchUserList = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('quest_player_stats')
        .select('*')
        .order('last_active', { ascending: false })
        .limit(50);
      
      if (userSearch) {
        query = query.ilike('username', `%${userSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUserList(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (user: any) => {
    playClick();
    setSelectedUser(user);
    setLoadingDetails(true);
    try {
      const fid = user.fid;
      const [p, h, e, q, l] = await Promise.all([
        supabase.from('quest_player_party').select('*').eq('fid', fid).order('party_no'),
        supabase.from('quest_player_hero').select('*, quest_hero(*)').eq('fid', fid).order('player_hid', { ascending: false }),
        supabase.from('quest_player_equipment').select('*, quest_equipment(*)').eq('fid', fid).order('player_eid', { ascending: false }),
        supabase.from('quest_process').select('*, quest_mining(*)').eq('fid', fid),
        supabase.from('quest_player_hero_lost').select('*, quest_hero(*)').eq('fid', fid).order('id', { ascending: false }).limit(20)
      ]);

      setUserDetails({
        parties: p.data || [],
        heroes: h.data || [],
        equipment: e.data || [],
        activeQuests: q.data || [],
        lostHeroes: l.data || []
      });
    } catch (err) {
      console.error("Error loading user details:", err);
      alert("Failed to load user details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderDbBrowser = () => (
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
                    <th className="p-2 border border-slate-800 text-slate-400 sticky left-0 bg-slate-900 z-10 shadow-md">Action</th>
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
                          EDIT
                        </button>
                        {row.fid && (
                          <button 
                            onClick={() => handleDelete(row)}
                            className="px-2 py-1 bg-rose-900/30 hover:bg-rose-600 rounded text-[10px] text-rose-200 hover:text-white transition-colors border border-rose-900/50"
                          >
                            DEL
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
    </>
  );

  const renderUserInspector = () => (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar: User List */}
      <div className="w-1/4 min-w-[200px] border-r border-slate-800 flex flex-col bg-slate-900/30">
        <div className="p-3 border-b border-slate-800">
          <input 
            type="text" 
            placeholder="Search User..." 
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUserList()}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
             <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
          ) : (
            userList.map(user => (
              <div 
                key={user.fid}
                onClick={() => handleUserSelect(user)}
                className={`p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors ${selectedUser?.fid === user.fid ? 'bg-indigo-900/20 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="font-bold text-slate-200 text-xs truncate">@{user.username || 'Unknown'}</div>
                <div className="text-[10px] text-slate-500 font-mono">FID: {user.fid}</div>
                <div className="text-[9px] text-slate-600 mt-1 truncate">Last: {new Date(user.last_active).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main: Details */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-6 custom-scrollbar">
        {loadingDetails ? (
           <div className="h-full flex items-center justify-center text-slate-500 text-sm">Loading User Data...</div>
        ) : !selectedUser ? (
           <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">Select a user to inspect</div>
        ) : (
           <div className="space-y-8 max-w-4xl mx-auto pb-20">
              
              {/* Profile Card */}
              <div className="flex items-start gap-6 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
                 <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-indigo-500/30 overflow-hidden shrink-0">
                    <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                 </div>
                 <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">@{selectedUser.username} <span className="text-sm font-normal text-slate-500">(FID: {selectedUser.fid})</span></h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                       <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="block text-slate-500 text-[10px]">Tokens ($CHH)</span>
                          <span className="font-mono text-amber-500 font-bold text-lg">{userDetails ? '---' : selectedUser.tokens || 0} (OnChain)</span>
                       </div>
                       <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="block text-slate-500 text-[10px]">Quest Count</span>
                          <span className="font-mono text-white font-bold text-lg">{selectedUser.quest_count || 0}</span>
                       </div>
                       <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="block text-slate-500 text-[10px]">Hero Gacha</span>
                          <span className="font-mono text-white font-bold text-lg">{selectedUser.gacha_hero_count || 0}</span>
                       </div>
                       <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="block text-slate-500 text-[10px]">Last Active</span>
                          <span className="font-mono text-slate-400">{new Date(selectedUser.last_active).toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Active Quests */}
              {userDetails?.activeQuests && userDetails.activeQuests.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Active Quests</h3>
                  <div className="grid gap-3">
                    {userDetails.activeQuests.map((q: any) => (
                      <div key={q.quest_pid} className="bg-emerald-900/10 border border-emerald-500/30 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-bold text-emerald-400 text-sm">{(q.quest_mining && q.quest_mining.name) || 'Unknown Quest'}</span>
                          <span className="text-xs text-slate-500 ml-2">End: {new Date(q.end_time).toLocaleString()}</span>
                        </div>
                        <div className="text-xs font-mono bg-black/30 px-2 py-1 rounded">PID: {q.quest_pid}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parties */}
              {userDetails?.parties && (
                 <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Party Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {[0, 1, 2].map(idx => {
                          const party = userDetails!.parties.find((p: any) => p.party_no === idx + 1);
                          return (
                             <div key={idx} className="bg-slate-900 border border-slate-700 p-3 rounded-xl">
                                <div className="text-xs font-bold text-indigo-400 mb-2">Party {idx + 1}</div>
                                <div className="space-y-1 text-[10px] font-mono">
                                   <div className="flex justify-between"><span>Slot 1:</span> <span className="text-slate-300">{party?.hero1_hid || 'Empty'}</span></div>
                                   <div className="flex justify-between"><span>Slot 2:</span> <span className="text-slate-300">{party?.hero2_hid || 'Empty'}</span></div>
                                   <div className="flex justify-between"><span>Slot 3:</span> <span className="text-slate-300">{party?.hero3_hid || 'Empty'}</span></div>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              )}

              {/* Heroes */}
              {userDetails?.heroes && (
                 <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                       Heroes ({userDetails.heroes.length})
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                       {userDetails.heroes.map((h: any) => (
                          <div key={h.player_hid} className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-center relative group">
                             <div className={`text-[9px] font-black absolute top-1 left-1 px-1 rounded ${h.quest_hero?.rarity === 'L' ? 'bg-amber-500 text-black' : 'bg-slate-700 text-white'}`}>
                                {h.quest_hero?.rarity || 'C'}
                             </div>
                             <div className="w-12 h-12 mx-auto bg-slate-800 rounded mb-1 overflow-hidden">
                                {h.quest_hero?.name && (
                                   <img src={`https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/s/${h.quest_hero.name}_s.png`} className="w-full h-full object-cover" />
                                )}
                             </div>
                             <div className="text-[10px] font-bold text-slate-300 truncate">{h.quest_hero?.name || 'Unknown'}</div>
                             <div className={`text-[10px] font-mono ${h.hp === 0 ? 'text-red-500 font-bold' : 'text-emerald-400'}`}>HP: {h.hp}</div>
                             <div className="text-[8px] text-slate-600">ID: {h.player_hid}</div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
              
              {/* Lost Heroes */}
              {userDetails?.lostHeroes && userDetails.lostHeroes.length > 0 && (
                 <div>
                    <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                       Lost Heroes (Graveyard)
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 opacity-70">
                       {userDetails.lostHeroes.map((h: any) => (
                          <div key={h.lost_id} className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-center grayscale">
                             <div className="w-10 h-10 mx-auto bg-slate-800 rounded mb-1 flex items-center justify-center text-lg">
                                💀
                             </div>
                             <div className="text-[10px] font-bold text-slate-400 truncate">{h.quest_hero?.name || 'Unknown'}</div>
                             <div className="text-[8px] text-slate-600">{new Date(h.created_at).toLocaleDateString()}</div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              {/* Equipment */}
              {userDetails?.equipment && (
                 <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                       Equipment ({userDetails.equipment.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {userDetails.equipment.map((e: any) => (
                          <div key={e.player_eid} className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center gap-2">
                             <div className="text-xl">
                                {e.quest_equipment?.type === 'Pickaxe' ? '⛏️' : e.quest_equipment?.type === 'Helmet' ? '🪖' : '👢'}
                             </div>
                             <div className="min-w-0">
                                <div className="text-[10px] font-bold text-slate-300 truncate">{e.quest_equipment?.name || 'Unknown'}</div>
                                <div className="text-[9px] text-slate-500">ID: {e.player_eid}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

           </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
           <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2">
             <span>🛠️</span> ADMIN DASHBOARD
           </h2>
           <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button 
                onClick={() => setActiveTab('USER')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeTab === 'USER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                User Inspector
              </button>
              <button 
                onClick={() => setActiveTab('DB')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeTab === 'DB' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Database Browser
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
      {activeTab === 'DB' ? renderDbBrowser() : renderUserInspector()}

      {/* Edit Modal (DB Browser only) */}
      {editingRow && activeTab === 'DB' && (
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
                ※ JSON形式で編集してください。Primary Key ({getPKey(activeTable)}) を変更すると新しいレコードとして作成されるか、エラーになります。
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
