
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
    heroes: any[]; // quest_player_hero + join quest_hero
    equipment: any[]; // quest_player_equipment + join quest_equipment
    activeQuests: any[];
    completedQuests: any[];
    lostHeroes: any[];
  } | null>(null);
  
  const [loadingDetails, setLoadingDetails] = useState(false);
  const searchTimeout = useRef<any>(null);
  // Timer for updating "Time Left" displays
  const [now, setNow] = useState(Date.now());

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    setShowUserDropdown(false); 
    setLoadingDetails(true);
    try {
      const fid = user.fid;
      const [p, h, e, q, l, c] = await Promise.all([
        supabase.from('quest_player_party').select('*').eq('fid', fid).order('party_no'),
        supabase.from('quest_player_hero').select('*, quest_hero(*)').eq('fid', fid).order('player_hid', { ascending: false }),
        supabase.from('quest_player_equipment').select('*, quest_equipment(*)').eq('fid', fid).order('player_eid', { ascending: false }),
        supabase.from('quest_process').select('*, quest_mining(*)').eq('fid', fid),
        supabase.from('quest_player_hero_lost').select('*, quest_hero(*)').eq('fid', fid).order('id', { ascending: false }).limit(20),
        supabase.from('quest_process_complete').select('*, quest_mining(*)').eq('fid', fid).order('created_at', { ascending: false }).limit(20)
      ]);

      setUserDetails({
        parties: p.data || [],
        heroes: h.data || [],
        equipment: e.data || [],
        activeQuests: q.data || [],
        lostHeroes: l.data || [],
        completedQuests: c.data || []
      });
    } catch (err) {
      console.error("Error loading user details:", err);
      alert("Failed to load user details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInstantComplete = async (questPid: number) => {
    if (!confirm("クエストを即時完了させますか？\n(終了時間を現在時刻に更新します)")) return;
    
    try {
      const now = new Date();
      now.setSeconds(now.getSeconds() - 1); // Ensure it is in the past

      const { error } = await supabase
        .from('quest_process')
        .update({ end_time: now.toISOString() })
        .eq('quest_pid', questPid);

      if (error) throw error;
      
      // Refresh user details
      if (selectedUser) {
         handleUserSelect(selectedUser);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  // --- DATA HELPERS ---

  const getHeroInfo = (playerHid: number) => {
    if (!userDetails?.heroes) return null;
    return userDetails.heroes.find((h: any) => h.player_hid === playerHid);
  };

  const getEquipmentInfo = (playerEid: number | null) => {
    if (!playerEid || !userDetails?.equipment) return null;
    return userDetails.equipment.find((e: any) => e.player_eid === playerEid);
  };

  // Calculate Party Stats Logic (Simplified version of Game Logic)
  const calculatePartyStats = (party: any) => {
    if (!party) return null;
    const heroIds = [party.hero1_hid, party.hero2_hid, party.hero3_hid].filter(Boolean);
    const heroes = heroIds.map(id => getHeroInfo(id)).filter(Boolean);
    
    let totalHp = 0;
    let rewardBonus = 0;
    let speedBonus = 0;

    heroes.forEach(h => {
        totalHp += h.hp;
        
        // Skill Bonus (Approximate based on master columns if available, or regex traits)
        const master = h.quest_hero;
        if (master) {
            rewardBonus += master.skill_quest || 0;
            speedBonus += master.skill_time || 0;
            
            // Regex fallback if columns 0
            if (!master.skill_quest && master.ability) {
               const m = master.ability.match(/報酬\s*\+(\d+)%/);
               if (m) rewardBonus += parseInt(m[1]);
            }
            if (!master.skill_time && master.ability) {
               const m = master.ability.match(/速度\s*\+(\d+)%/);
               if (m) speedBonus += parseInt(m[1]);
            }
        }

        // Equip Bonus
        const pickaxe = getEquipmentInfo(h.pickaxe_player_eid);
        if (pickaxe?.quest_equipment) rewardBonus += pickaxe.quest_equipment.bonus;

        const boots = getEquipmentInfo(h.boots_player_eid);
        if (boots?.quest_equipment) speedBonus += boots.quest_equipment.bonus;
    });

    return { totalHp, rewardBonus, speedBonus, heroCount: heroes.length };
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
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-950 text-slate-200">
      
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
                            <div className="text-[10px] text-slate-500">
                                <span className="mr-2">Quest: {user.quest_count}</span>
                                Last: {new Date(user.last_active).toLocaleDateString()}
                            </div>
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
           <div className="space-y-10 max-w-6xl mx-auto pb-20">
              
              {/* Profile Header */}
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-center gap-6">
                 <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-700 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                    {selectedUser.pfp_url ? <img src={selectedUser.pfp_url} className="w-full h-full object-cover" /> : <span className="text-4xl">👤</span>}
                 </div>
                 <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">@{selectedUser.username} <span className="text-xs text-slate-500 font-normal ml-2">FID: {selectedUser.fid}</span></h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                       <span className="px-3 py-1 rounded-full bg-amber-900/20 border border-amber-500/30 text-amber-500 font-mono font-bold text-sm">
                          {selectedUser.tokens?.toLocaleString() || 0} $CHH
                       </span>
                       <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                          Quests: {selectedUser.quest_count || 0}
                       </span>
                       <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                          Gacha Heroes: {selectedUser.gacha_hero_count || 0}
                       </span>
                    </div>
                 </div>
              </div>

              {/* SECTION: PARTIES & TEAM STATUS */}
              {userDetails?.parties && (
                <div>
                   <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center">
                       <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                       Parties & Status
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[0, 1, 2].map(idx => {
                         const party = userDetails!.parties.find((p: any) => p.party_no === idx + 1);
                         const heroes = [
                             party?.hero1_hid ? getHeroInfo(party.hero1_hid) : null,
                             party?.hero2_hid ? getHeroInfo(party.hero2_hid) : null,
                             party?.hero3_hid ? getHeroInfo(party.hero3_hid) : null,
                         ];
                         const stats = calculatePartyStats(party);

                         return (
                            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                               <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-700 flex justify-between items-center">
                                   <span className="text-[10px] font-bold text-indigo-400">PARTY {idx + 1}</span>
                                   {!party && <span className="text-[9px] text-slate-500">Not Created</span>}
                                   {stats && (
                                       <div className="flex gap-2 text-[9px] font-mono">
                                           <span className="text-emerald-400">HP {stats.totalHp}</span>
                                           <span className="text-amber-500">Rew+{stats.rewardBonus}%</span>
                                           <span className="text-blue-400">Spd+{stats.speedBonus}%</span>
                                       </div>
                                   )}
                               </div>
                               <div className="p-3 grid grid-cols-3 gap-2 flex-1">
                                   {heroes.map((h, i) => {
                                       const pickaxe = h ? getEquipmentInfo(h.pickaxe_player_eid) : null;
                                       const helmet = h ? getEquipmentInfo(h.helmet_player_eid) : null;
                                       const boots = h ? getEquipmentInfo(h.boots_player_eid) : null;
                                       
                                       return (
                                       <div key={i} className="aspect-[3/4] bg-slate-950 rounded border border-slate-800 flex flex-col relative overflow-hidden group">
                                           {h ? (
                                               <>
                                                   <img 
                                                       src={`https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/s/${h.quest_hero?.name}_s.png`} 
                                                       className="w-full h-full object-cover opacity-80"
                                                       alt={h.quest_hero?.name}
                                                   />
                                                   {/* Equipment Icons Overlay */}
                                                   <div className="absolute top-0 right-0 p-1 flex flex-col gap-0.5 items-end">
                                                      {pickaxe && <span className="text-[8px] bg-slate-900/80 text-amber-500 px-1 rounded border border-slate-700">⛏️{pickaxe.quest_equipment?.bonus}%</span>}
                                                      {helmet && <span className="text-[8px] bg-slate-900/80 text-emerald-500 px-1 rounded border border-slate-700">🪖{helmet.quest_equipment?.bonus}%</span>}
                                                      {boots && <span className="text-[8px] bg-slate-900/80 text-blue-500 px-1 rounded border border-slate-700">👢{boots.quest_equipment?.bonus}%</span>}
                                                   </div>
                                                   <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-[1px] p-1 text-center">
                                                       <div className="text-[8px] font-bold text-white truncate w-full">{h.quest_hero?.name}</div>
                                                       <div className={`text-[7px] font-mono font-bold ${h.hp < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>HP: {h.hp}</div>
                                                   </div>
                                               </>
                                           ) : (
                                               <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-700 font-bold uppercase">Empty</div>
                                           )}
                                       </div>
                                   )})}
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>
              )}

              {/* SECTION: QUESTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Active Quests */}
                  <div>
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Active Quests
                    </h3>
                    {userDetails?.activeQuests && userDetails.activeQuests.length > 0 ? (
                        <div className="space-y-2">
                            {userDetails.activeQuests.map((q: any) => {
                                const endTime = new Date(q.end_time).getTime();
                                const timeLeftMs = Math.max(0, endTime - now);
                                const minutes = Math.floor(timeLeftMs / 60000);
                                const seconds = Math.floor((timeLeftMs % 60000) / 1000);
                                
                                return (
                                <div key={q.quest_pid} className="bg-slate-900 border border-amber-500/30 p-3 rounded-xl flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                                    <div className="pl-2">
                                        <div className="text-xs font-bold text-white">{(q.quest_mining && q.quest_mining.name) || 'Unknown Quest'}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Party: {q.party_id}</div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <div className="text-[12px] text-amber-500 font-mono font-bold">
                                            {minutes}:{seconds.toString().padStart(2, '0')}
                                        </div>
                                        <button 
                                          onClick={() => handleInstantComplete(q.quest_pid)}
                                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[8px] font-bold px-2 py-1 rounded shadow-sm border border-indigo-400 transition-all active:scale-95"
                                        >
                                          ⚡ FINISH NOW
                                        </button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    ) : (
                        <div className="text-xs text-slate-600 italic">No active quests.</div>
                    )}
                  </div>

                  {/* Completed Quests Log */}
                  <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="text-lg">📜</span> Recent History
                    </h3>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {userDetails?.completedQuests && userDetails.completedQuests.length > 0 ? (
                            userDetails.completedQuests.map((q: any) => (
                                <div key={q.id} className="bg-slate-900/50 border border-slate-800 p-2 rounded flex justify-between items-center text-[10px]">
                                    <div className="text-slate-300">{(q.quest_mining && q.quest_mining.name) || `Quest #${q.quest_id}`}</div>
                                    <div className="flex gap-3 text-slate-500 font-mono">
                                        <span className="text-emerald-500 font-bold">+{q.reward} $CHH</span>
                                        <span>{new Date(q.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-slate-600 italic">No history found.</div>
                        )}
                    </div>
                  </div>
              </div>

              {/* SECTION: HEROES (Live & Dead) */}
              <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                       <span className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                           Inventory: Heroes
                       </span>
                       <span className="text-slate-600 bg-slate-900 px-2 py-0.5 rounded text-[10px]">
                           Live: {userDetails?.heroes?.length || 0} / Lost: {userDetails?.lostHeroes?.length || 0}
                       </span>
                  </h3>
                  
                  {/* Live Heroes */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-6">
                       {userDetails?.heroes?.map((h: any) => {
                          const rarity = h.quest_hero?.rarity || 'C';
                          const rarityColor = 
                             rarity === 'L' ? 'border-amber-500 text-amber-500' : 
                             rarity === 'E' ? 'border-fuchsia-500 text-fuchsia-500' :
                             rarity === 'R' ? 'border-indigo-500 text-indigo-500' :
                             rarity === 'UC' ? 'border-emerald-500 text-emerald-500' : 
                             'border-slate-700 text-slate-400';

                          return (
                            <div key={h.player_hid} className={`bg-slate-900 border rounded-lg overflow-hidden relative group ${rarityColor}`}>
                                <div className="absolute top-0.5 left-0.5 z-10 bg-black/70 px-1 rounded text-[8px] font-black backdrop-blur-sm">
                                    {rarity}
                                </div>
                                <div className="aspect-square bg-slate-800">
                                    <img src={`https://miningquest.k0j1.v2002.coreserver.jp/images/Hero/s/${h.quest_hero?.name}_s.png`} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-1 bg-slate-950/80 text-[8px] font-bold text-center truncate">
                                    {h.quest_hero?.name}
                                </div>
                            </div>
                          );
                       })}
                  </div>

                  {/* Lost Heroes */}
                  {userDetails?.lostHeroes && userDetails.lostHeroes.length > 0 && (
                      <div className="border-t border-rose-900/30 pt-4 mt-4">
                        <h4 className="text-[10px] font-bold text-rose-500 mb-2 uppercase">Graveyard (Recent Deaths)</h4>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 opacity-70">
                            {userDetails.lostHeroes.map((h: any) => (
                                <div key={h.lost_id} className="bg-slate-950 border border-slate-800 p-1.5 rounded text-center grayscale hover:grayscale-0 transition-all">
                                    <div className="text-lg">💀</div>
                                    <div className="text-[8px] font-bold text-slate-400 truncate">{h.quest_hero?.name || 'Unknown'}</div>
                                    <div className="text-[7px] text-slate-600">{new Date(h.lost_at).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                      </div>
                  )}
              </div>

              {/* SECTION: EQUIPMENT */}
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
                                    <div className="flex justify-between items-center mt-0.5">
                                        <span className="text-[8px] font-black text-slate-500">{rarity}</span>
                                        <span className="text-[8px] text-indigo-400">+{e.quest_equipment?.bonus}%</span>
                                    </div>
                                 </div>
                              </div>
                           );
                       })}
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
