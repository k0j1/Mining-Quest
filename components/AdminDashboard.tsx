
import React, { useState, useEffect, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState<'DB' | 'USER'>('USER'); 
  
  // DB Browser State
  const [activeTable, setActiveTable] = useState(TABLES[0]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editJson, setEditJson] = useState('');

  // User Inspector State
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
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
  
  const searchTimeout = useRef<any>(null);

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

  // Search Debounce
  useEffect(() => {
    if (activeTab !== 'USER') return;
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (userSearch.length > 0) {
        searchTimeout.current = setTimeout(() => {
            fetchUserList();
        }, 500);
    } else {
        setUserList([]);
        setShowUserDropdown(false);
    }
  }, [userSearch]);

  const fetchUserList = async () => {
    // Only search if not currently loading detail to prevent UI jumpiness
    try {
      let query = supabase
        .from('quest_player_stats')
        .select('*')
        .ilike('username', `%${userSearch}%`)
        .order('last_active', { ascending: false })
        .limit(10);
      
      const { data, error } = await query;
      if (error) throw error;
      setUserList(data || []);
      setShowUserDropdown(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserSelect = async (user: any) => {
    playClick();
    setSelectedUser(user);
    setUserSearch(user.username || '');
    setShowUserDropdown(false); // Hide dropdown
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

  // Helper to find hero info from player_hid
  const getHeroInfo = (playerHid: number) => {
    if (!userDetails?.heroes) return null;
    return userDetails.heroes.find((h: any) => h.player_hid === playerHid);
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
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-950">
      
      {/* 1. Search Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/30 z-20">
         <div className="relative max-w-lg mx-auto">
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                <input 
                    type="text" 
                    placeholder="Search User by Name..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onFocus={() => { if (userList.length > 0) setShowUserDropdown(true); }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none shadow-sm"
                />
            </div>
            
            {/* Dropdown Results */}
            {showUserDropdown && userList.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50">
                    {userList.map(user => (
                        <div 
                            key={user.fid}
                            onClick={() => handleUserSelect(user)}
                            className="p-3 border-b border-slate-800 last:border-none cursor-pointer hover:bg-indigo-900/20 transition-colors flex items-center justify-between group"
                        >
                            <div className="font-bold text-slate-200 text-sm group-hover:text-white">@{user.username || 'Unknown'}</div>
                            <div className="text-[10px] text-slate-500">Last: {new Date(user.last_active).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            )}
         </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        {loadingDetails ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm tracking-wider">Loading User Data...</span>
           </div>
        ) : !selectedUser ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
              <span className="text-4xl mb-4">👤</span>
              <span className="text-sm font-bold">Select a user to inspect</span>
           </div>
        ) : (
           <div className="space-y-8 max-w-5xl mx-auto pb-20">
              
              {/* Profile Header */}
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-center gap-6">
                 <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 overflow-hidden shrink-0 shadow-inner relative">
                     {/* Try to show pfp if available in future, for now placeholder */}
                     <div className="w-full h-full flex items-center justify-center text-4xl text-slate-600">👤</div>
                 </div>
                 <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">@{selectedUser.username}</h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                       <span className="px-3 py-1 rounded-full bg-amber-900/20 border border-amber-500/30 text-amber-500 font-mono font-bold text-sm">
                          {selectedUser.tokens?.toLocaleString() || 0} $CHH
                       </span>
                       <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                          Quests: {selectedUser.quest_count || 0}
                       </span>
                       <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                          Last Active: {new Date(selectedUser.last_active).toLocaleString()}
                       </span>
                    </div>
                 </div>
              </div>

              {/* Active Quests */}
              {userDetails?.activeQuests && userDetails.activeQuests.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Current Activity
                  </h3>
                  <div className="grid gap-3">
                    {userDetails.activeQuests.map((q: any) => (
                      <div key={q.quest_pid} className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl flex justify-between items-center">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-400 text-[10px] font-black border border-emerald-500/20">Active</span>
                              <span className="font-bold text-white text-sm">{(q.quest_mining && q.quest_mining.name) || 'Unknown Quest'}</span>
                           </div>
                           <div className="text-xs text-emerald-500/70 font-mono">End: {new Date(q.end_time).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parties Visualizer */}
              {userDetails?.parties && (
                 <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                       Active Parties
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {[0, 1, 2].map(idx => {
                          const party = userDetails!.parties.find((p: any) => p.party_no === idx + 1);
                          const heroes = [
                              party?.hero1_hid ? getHeroInfo(party.hero1_hid) : null,
                              party?.hero2_hid ? getHeroInfo(party.hero2_hid) : null,
                              party?.hero3_hid ? getHeroInfo(party.hero3_hid) : null,
                          ];

                          return (
                             <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-indigo-400">PARTY {idx + 1}</span>
                                    {!party && <span className="text-[9px] text-slate-500">Not Created</span>}
                                </div>
                                <div className="p-3 grid grid-cols-3 gap-2">
                                    {heroes.map((h, i) => (
                                        <div key={i} className="aspect-[4/5] bg-slate-950 rounded border border-slate-800 flex flex-col items-center justify-center overflow-hidden relative">
                                            {h ? (
                                                <>
                                                    <img 
                                                        src={`https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/s/${h.quest_hero?.name}_s.png`} 
                                                        className="w-full h-full object-cover opacity-80"
                                                        alt={h.quest_hero?.name}
                                                    />
                                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-[1px] p-1 text-center">
                                                        <div className="text-[8px] font-bold text-white truncate w-full">{h.quest_hero?.name}</div>
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-slate-700 font-bold uppercase">Empty</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              )}

              {/* Inventory: Heroes */}
              {userDetails?.heroes && (
                 <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                       <span>Inventory: Heroes</span>
                       <span className="text-slate-600 bg-slate-900 px-2 py-0.5 rounded text-[10px]">Total: {userDetails.heroes.length}</span>
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                       {userDetails.heroes.map((h: any) => {
                          const rarity = h.quest_hero?.rarity || 'C';
                          const rarityColor = 
                             rarity === 'L' ? 'border-amber-500/50 text-amber-500' : 
                             rarity === 'E' ? 'border-fuchsia-500/50 text-fuchsia-500' :
                             rarity === 'R' ? 'border-indigo-500/50 text-indigo-500' :
                             rarity === 'UC' ? 'border-emerald-500/50 text-emerald-500' : 
                             'border-slate-700 text-slate-400';

                          return (
                            <div key={h.player_hid} className={`bg-slate-900 border rounded-xl overflow-hidden relative group ${rarityColor}`}>
                                <div className="absolute top-1 left-1 z-10 bg-black/70 px-1.5 rounded text-[9px] font-black backdrop-blur-sm border border-white/10">
                                    {rarity}
                                </div>
                                <div className="aspect-square bg-slate-800 overflow-hidden">
                                    {h.quest_hero?.name && (
                                    <img src={`https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/s/${h.quest_hero.name}_s.png`} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="p-1.5 bg-slate-950/80">
                                    <div className="text-[9px] font-bold text-slate-300 truncate mb-0.5">{h.quest_hero?.name}</div>
                                    <div className={`text-[9px] font-mono font-bold ${h.hp < h.quest_hero?.hp * 0.3 ? 'text-rose-500' : 'text-emerald-400'}`}>
                                        HP {h.hp}/{h.quest_hero?.hp}
                                    </div>
                                </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
              )}

              {/* Inventory: Equipment */}
              {userDetails?.equipment && (
                 <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                       <span>Inventory: Equipment</span>
                       <span className="text-slate-600 bg-slate-900 px-2 py-0.5 rounded text-[10px]">Total: {userDetails.equipment.length}</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                       {userDetails.equipment.map((e: any) => {
                           const typeIcon = e.quest_equipment?.type === 'Pickaxe' ? '⛏️' : e.quest_equipment?.type === 'Helmet' ? '🪖' : '👢';
                           const rarity = e.quest_equipment?.rarity || 'C';
                           const borderColor = rarity === 'L' ? 'border-amber-500/30' : 'border-slate-800';

                           return (
                              <div key={e.player_eid} className={`bg-slate-900 border ${borderColor} p-2 rounded-lg flex items-center gap-2`}>
                                 <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded text-lg">
                                    {typeIcon}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <div className="text-[9px] font-bold text-slate-300 truncate">{e.quest_equipment?.name || 'Unknown'}</div>
                                    <div className="text-[8px] font-black text-slate-500">{rarity} Rank</div>
                                 </div>
                              </div>
                           );
                       })}
                    </div>
                 </div>
              )}
              
              {/* Lost Heroes */}
              {userDetails?.lostHeroes && userDetails.lostHeroes.length > 0 && (
                 <div>
                    <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4 border-b border-rose-900/30 pb-2">
                       Graveyard (Lost Heroes)
                    </h3>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3 opacity-60">
                       {userDetails.lostHeroes.map((h: any) => (
                          <div key={h.lost_id} className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-center grayscale hover:grayscale-0 transition-all">
                             <div className="text-xl mb-1">💀</div>
                             <div className="text-[9px] font-bold text-slate-400 truncate">{h.quest_hero?.name || 'Unknown'}</div>
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
