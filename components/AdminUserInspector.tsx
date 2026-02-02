
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { playClick } from '../utils/sound';

const AdminUserInspector: React.FC = () => {
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

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    // デバウンス処理だが、空文字でもリストを取得するように変更
    searchTimeout.current = setTimeout(() => {
        fetchUserList();
    }, 300);
  }, [userSearch]);

  const fetchUserList = async () => {
    try {
      let query = supabase
        .from('quest_player_stats')
        .select('*')
        .order('last_active', { ascending: false })
        .limit(10);
      
      if (userSearch.length > 0) {
        query = query.ilike('username', `%${userSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setUserList(data || []);
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

    // Helper to fetch with specific error logging
    const safeFetch = async (label: string, query: any) => {
        const { data, error } = await query;
        if (error) {
            console.error(`[Admin] Error fetching ${label}:`, error);
            return []; // Return empty array to prevent crashing other requests
        }
        return data || [];
    };

    try {
      const fid = user.fid;
      
      // Execute queries in parallel but handle errors individually
      const [parties, heroes, equipment, activeQuests, lostHeroes, completedQuests] = await Promise.all([
        safeFetch('Parties', supabase.from('quest_player_party').select('*').eq('fid', fid).order('party_no')),
        
        safeFetch('Heroes', supabase.from('quest_player_hero').select('*, quest_hero(*)').eq('fid', fid).order('player_hid', { ascending: false })),
        
        safeFetch('Equipment', supabase.from('quest_player_equipment').select('*, quest_equipment(*)').eq('fid', fid).order('player_eid', { ascending: false })),
        
        safeFetch('Active Quests', supabase.from('quest_process').select('*, quest_mining(*)').eq('fid', fid)),
        
        // Changed sort to Primary Key (lost_id) to ensure it works even if created_at is missing/named differently
        safeFetch('Lost Heroes', supabase.from('quest_player_hero_lost').select('*, quest_hero(*)').eq('fid', fid).order('lost_id', { ascending: false }).limit(20)),
        
        // Changed sort to Primary Key (id) for safety
        safeFetch('Completed Quests', supabase.from('quest_process_complete').select('*, quest_mining(*)').eq('fid', fid).order('id', { ascending: false }).limit(20))
      ]);

      setUserDetails({
        parties,
        heroes,
        equipment,
        activeQuests,
        lostHeroes,
        completedQuests
      });
    } catch (err) {
      console.error("Error loading user details:", err);
      alert("Failed to load user details. See console for errors.");
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

  // Calculate Party Stats Logic
  const calculatePartyStats = (party: any) => {
    if (!party) return null;
    const heroIds = [party.hero1_hid, party.hero2_hid, party.hero3_hid].filter(Boolean);
    const heroes = heroIds.map(id => getHeroInfo(id)).filter(Boolean);
    
    let totalHp = 0;
    let rewardBonus = 0;
    let speedBonus = 0;

    heroes.forEach(h => {
        totalHp += h.hp;
        
        // Skill Bonus
        const master = h.quest_hero;
        if (master) {
            rewardBonus += master.skill_quest || 0;
            speedBonus += master.skill_time || 0;
            
            // Regex fallback
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

  return (
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
                    onFocus={() => { fetchUserList(); setShowUserDropdown(true); }}
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
                                
                                // Find Party Number
                                const usedParty = userDetails.parties.find((p: any) => p.party_id === q.party_id);
                                const partyNo = usedParty ? usedParty.party_no : '?';
                                const qm = q.quest_mining || {};

                                // Display Actual Calculated Values from quest_process
                                const totalReward = (q.base_reward || 0) + (q.add_hero_reward || 0) + (q.add_equipment_reward || 0);

                                // Collect Hero Damage Details
                                const heroImpacts: any[] = [];
                                if (usedParty) {
                                    const slots = [
                                        { hid: usedParty.hero1_hid, dmg: q.hero1_damage },
                                        { hid: usedParty.hero2_hid, dmg: q.hero2_damage },
                                        { hid: usedParty.hero3_hid, dmg: q.hero3_damage }
                                    ];
                                    slots.forEach(slot => {
                                        if (slot.hid) {
                                            const h = getHeroInfo(slot.hid);
                                            if (h) {
                                                const dmg = slot.dmg || 0;
                                                heroImpacts.push({
                                                    name: h.quest_hero?.name || 'Unknown',
                                                    current: h.hp,
                                                    damage: dmg,
                                                    remaining: Math.max(0, h.hp - dmg)
                                                });
                                            }
                                        }
                                    });
                                }

                                return (
                                <div key={q.quest_pid} className="bg-slate-900 border border-amber-500/30 p-3 rounded-xl flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                                    <div className="pl-2 min-w-0 flex-1">
                                        <div className="text-xs font-bold text-white truncate">{qm.name || 'Unknown Quest'}</div>
                                        
                                        <div className="mt-1">
                                            <div className="flex items-center gap-2 text-[10px]">
                                                <span className="font-bold text-indigo-400">Party {partyNo}</span>
                                                <span className="text-amber-500 font-mono font-bold">💰+{totalReward}</span>
                                            </div>
                                            
                                            {heroImpacts.length > 0 && (
                                              <div className="mt-1 space-y-0.5 bg-slate-950/30 p-1.5 rounded border border-slate-800/50 inline-block w-full">
                                                  {heroImpacts.map((h, idx) => (
                                                      <div key={idx} className="flex items-center gap-2 text-[9px] font-mono leading-tight">
                                                          <span className="text-slate-400 w-24 truncate">{h.name}</span>
                                                          <div className="flex items-center gap-1">
                                                              <span className={`${h.current < 20 ? 'text-orange-400' : 'text-slate-300'}`}>{h.current}</span>
                                                              <span className="text-slate-600">→</span>
                                                              <span className={`${h.remaining === 0 ? 'text-red-500 font-bold' : h.remaining < 20 ? 'text-orange-400' : 'text-emerald-400'}`}>{h.remaining}</span>
                                                          </div>
                                                          <span className="text-rose-500/70 text-[8px]">(-{h.damage})</span>
                                                      </div>
                                                  ))}
                                              </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1 ml-2 shrink-0 self-start">
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
                                        <span>{new Date(q.archived_at || q.created_at || q.end_time || 0).toLocaleDateString()}</span>
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
                                    <div className="text-[7px] text-slate-600">{new Date(h.created_at || h.lost_at || 0).toLocaleDateString()}</div>
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
};

export default AdminUserInspector;
