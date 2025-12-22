
import React, { useState, useEffect } from 'react';
import { View, Hero, Equipment, Quest, GameState, QuestRank } from './types';
import { INITIAL_HEROES, INITIAL_EQUIPMENT, ICONS, QUEST_CONFIG } from './constants';
import StatusBoard from './components/StatusBoard';
import HeroCard from './components/HeroCard';
import MiningBackground from './components/MiningBackground';
import GachaEffect from './components/GachaEffect';
import EquipmentSelector from './components/EquipmentSelector';
import { generateGachaItem } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [gameState, setGameState] = useState<GameState>({
    tokens: 12500,
    heroes: INITIAL_HEROES,
    equipment: INITIAL_EQUIPMENT,
    activeQuests: []
  });
  const [gachaTab, setGachaTab] = useState<'Hero' | 'Equipment'>('Hero');
  const [gachaResult, setGachaResult] = useState<{ type: 'Hero' | 'Equipment'; data: any } | null>(null);
  const [isGachaRolling, setIsGachaRolling] = useState(false);
  
  // New selection state for swapping heroes
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number | null>(null);
  
  // Equipment selection state
  const [equippingState, setEquippingState] = useState<{ heroId: string, slotIndex: number } | null>(null);

  const handleDepart = (rank: QuestRank) => {
    const config = QUEST_CONFIG[rank];
    const mainHeroes = gameState.heroes.slice(0, 3);

    // 1. Check Tokens
    if (gameState.tokens < config.burnCost) {
      alert(`トークンが足りません！ (必要: ${config.burnCost} $CHH)`);
      return;
    }

    // 2. Check General Health (Must be alive)
    if (mainHeroes.some(h => h.hp <= 0)) {
      alert("HPが0のヒーローが編成に含まれています。回復してください。");
      return;
    }

    // 3. Check Rank E Specific Requirement
    if (rank === 'E' && config.minHpReq) {
      if (mainHeroes.some(h => h.hp < config.minHpReq!)) {
        alert(`ランクEのクエストに出発するには、メイン編成全員のHPが${config.minHpReq}以上必要です。`);
        return;
      }
    }

    // 4. Create Quest
    const newQuest: Quest = {
      id: Math.random().toString(),
      name: config.name,
      rank: rank,
      duration: config.duration,
      endTime: Date.now() + config.duration * 1000,
      reward: Math.floor((config.minReward + config.maxReward) / 2), // Display expected reward
      status: 'active'
    };

    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - config.burnCost,
      activeQuests: [...prev.activeQuests, newQuest]
    }));

    alert(`${config.name}へ出発しました！\n所要時間: ${Math.floor(config.duration / 60)}分`);
    setCurrentView(View.HOME);
  };

  const handleReturn = () => {
    const now = Date.now();
    const completed = gameState.activeQuests.filter(q => q.endTime <= now);
    
    if (completed.length === 0) {
      alert("まだ完了したクエストはありません。タイマーの終了をお待ちください。");
      return;
    }

    let totalReward = 0;
    let report = "";
    let deadHeroes: string[] = [];

    // Process results
    const newHeroes = [...gameState.heroes];
    const mainPartyIndices = [0, 1, 2];

    completed.forEach(quest => {
      const config = QUEST_CONFIG[quest.rank];
      
      // Calculate Reward
      const reward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
      totalReward += reward;
      
      report += `【${quest.name} (Rank ${quest.rank})】\n`;
      report += `💰 報酬: ${reward} $CHH\n`;

      // Apply Damage / Death to Main Party
      mainPartyIndices.forEach(idx => {
        if (idx >= newHeroes.length) return;
        
        // Skip if already dead/removed in this loop
        if (deadHeroes.includes(newHeroes[idx].id)) return;

        // Death Check (Rank L only usually)
        if (config.deathChance > 0 && Math.random() < config.deathChance) {
           deadHeroes.push(newHeroes[idx].id);
           report += `💀 悲報: ${newHeroes[idx].name} は帰らぬ犬となりました...\n`;
        } else {
           // Damage
           const dmg = Math.floor(Math.random() * (config.maxDmg - config.minDmg + 1)) + config.minDmg;
           const currentHp = newHeroes[idx].hp;
           const newHp = Math.max(0, currentHp - dmg);
           newHeroes[idx] = { ...newHeroes[idx], hp: newHp };
           report += `💥 ${newHeroes[idx].name}: -${dmg} HP (残: ${newHp})\n`;
        }
      });
      report += "\n";
    });

    // Remove dead heroes completely
    const survivors = newHeroes.filter(h => !deadHeroes.includes(h.id));

    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens + totalReward,
      heroes: survivors,
      activeQuests: prev.activeQuests.filter(q => q.endTime > now)
    }));

    alert(report);
  };

  const handleRecovery = () => {
    const cost = 500;
    if (gameState.tokens < cost) {
      alert("トークンが足りません！");
      return;
    }
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - cost,
      heroes: prev.heroes.map(h => ({ ...h, hp: h.maxHp }))
    }));
    alert("全てのヒーローのHPが回復しました！");
  };

  const handleGacha = async () => {
    const cost = 1000;
    if (gameState.tokens < cost) {
      alert("トークンが足りません！");
      return;
    }

    setIsGachaRolling(true);
    try {
      const result = await generateGachaItem(gachaTab);
      if (result) {
        setGachaResult({ type: gachaTab, data: result });
        
        setGameState(prev => {
          const nextState = { ...prev, tokens: prev.tokens - cost };
          if (gachaTab === 'Hero') {
            const newHero: Hero = {
              id: Math.random().toString(),
              name: result.name || "謎のチワワ",
              rarity: result.rarity || 'Common',
              level: 1,
              hp: 100,
              maxHp: 100,
              imageUrl: `https://picsum.photos/seed/${Math.random()}/300/400`,
              equipmentIds: []
            };
            nextState.heroes = [...prev.heroes, newHero];
          } else {
            const newEquip: Equipment = {
              id: Math.random().toString(),
              name: result.name || "鉄のつるはし",
              type: result.type || 'Pickaxe',
              bonus: Math.floor(Math.random() * 20) + 5,
              rarity: result.rarity || 'Common'
            };
            nextState.equipment = [...prev.equipment, newEquip];
          }
          return nextState;
        });
      }
    } finally {
      setIsGachaRolling(false);
    }
  };

  const handleHeroClick = (index: number) => {
    if (selectedHeroIndex === null) {
      setSelectedHeroIndex(index);
    } else if (selectedHeroIndex === index) {
      setSelectedHeroIndex(null);
    } else {
      // Perform Swap
      const newHeroes = [...gameState.heroes];
      const temp = newHeroes[selectedHeroIndex];
      newHeroes[selectedHeroIndex] = newHeroes[index];
      newHeroes[index] = temp;
      setGameState(prev => ({ ...prev, heroes: newHeroes }));
      setSelectedHeroIndex(null);
    }
  };

  const handleEquipClick = (heroId: string, slotIndex: number) => {
    setEquippingState({ heroId, slotIndex });
  };

  const handleSelectEquipment = (equipmentId: string | null) => {
    if (!equippingState) return;

    setGameState(prev => ({
      ...prev,
      heroes: prev.heroes.map(hero => {
        if (hero.id !== equippingState.heroId) return hero;
        const newEquipIds = [...hero.equipmentIds];
        if (equipmentId === null) {
          // Remove item
          newEquipIds[equippingState.slotIndex] = '';
        } else {
          // Add/Replace item
          newEquipIds[equippingState.slotIndex] = equipmentId;
        }
        return { ...hero, equipmentIds: newEquipIds };
      })
    }));

    setEquippingState(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case View.PARTY:
        return (
          <div className="p-4 h-full overflow-y-auto pb-24">
            <h1 className="text-xl font-orbitron font-bold text-indigo-300 mb-1">パーティ編成</h1>
            <p className="text-[10px] text-slate-500 mb-6">タップして入れ替え対象を選択してください</p>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8">
              {gameState.heroes.slice(0, 3).map((hero, idx) => (
                <div key={hero.id} className="relative">
                  <div className="absolute -top-2 left-0 right-0 flex justify-center z-20">
                    <span className="bg-indigo-600 text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-indigo-400 whitespace-nowrap">
                      SLOT {idx + 1}
                    </span>
                  </div>
                  <HeroCard 
                    hero={hero} 
                    index={idx}
                    isSelected={selectedHeroIndex === idx}
                    onClick={() => handleHeroClick(idx)}
                    onEquipClick={handleEquipClick}
                    isMainSlot
                  />
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center">
                <span className="w-1 h-3 bg-slate-700 mr-2 rounded-full"></span>
                リザーブ・メンバー
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 {gameState.heroes.slice(3).map((hero, idx) => {
                   const actualIndex = idx + 3;
                   return (
                    <HeroCard 
                      key={hero.id} 
                      hero={hero} 
                      index={actualIndex}
                      compact 
                      isSelected={selectedHeroIndex === actualIndex}
                      onClick={() => handleHeroClick(actualIndex)}
                    />
                  );
                 })}
              </div>
            </div>
          </div>
        );

      case View.GACHA:
        return (
          <div className="p-6 h-full overflow-y-auto pb-24 flex flex-col items-center">
            <h1 className="text-2xl font-orbitron font-bold text-indigo-300 mb-6">採掘ガチャ</h1>
            <div className="flex bg-slate-900 p-1.5 rounded-2xl w-full max-w-md mb-8 border border-slate-800">
              <button 
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${gachaTab === 'Hero' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                onClick={() => setGachaTab('Hero')}
              >
                ヒーロー
              </button>
              <button 
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${gachaTab === 'Equipment' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                onClick={() => setGachaTab('Equipment')}
              >
                装備品
              </button>
            </div>
            <div className="glass-panel p-10 rounded-[2.5rem] text-center space-y-8 max-w-md w-full border-t-8 border-t-yellow-500 shadow-2xl relative overflow-hidden">
              {isGachaRolling && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-orbitron font-bold text-indigo-400 animate-pulse">CONNECTING...</p>
                </div>
              )}
              <div className="relative inline-block">
                <div className="text-7xl animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">🎁</div>
                <div className="absolute inset-0 animate-ping bg-yellow-500/20 rounded-full"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{gachaTab === 'Hero' ? '新しいチワワを呼ぶ' : '地下の遺物を探す'}</h2>
                <p className="text-slate-400 text-sm">コスト: <span className="text-yellow-400 font-black text-lg">1,000 $CHH</span></p>
              </div>
              <button 
                onClick={handleGacha}
                disabled={isGachaRolling}
                className={`w-full py-5 bg-gradient-to-b from-yellow-400 to-yellow-600 text-slate-950 rounded-2xl font-black text-xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-yellow-900/20 ${isGachaRolling ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
              >
                ガチャを回す
              </button>
            </div>
          </div>
        );

      case View.DEPART:
        return (
          <div className="flex flex-col h-full bg-slate-950">
             {/* Sticky Header */}
             <div className="p-6 bg-slate-900/80 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md flex-none">
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-orbitron font-bold text-indigo-300">出発ゲート</h1>
                  <div className="flex items-center space-x-2 bg-slate-800 px-4 py-1.5 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <span className="text-yellow-400 text-sm font-black">$CHH:</span>
                    <span className="font-orbitron text-lg font-bold">{gameState.tokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                <p className="text-xs text-slate-500 mb-2">難易度を選択してクエストに出発します</p>
                {(Object.keys(QUEST_CONFIG) as QuestRank[]).map((rank) => {
                  const config = QUEST_CONFIG[rank];
                  const rankColors: Record<QuestRank, string> = {
                    C: 'border-slate-600 bg-slate-900/50',
                    UC: 'border-green-600 bg-green-900/20',
                    R: 'border-blue-600 bg-blue-900/20',
                    E: 'border-orange-600 bg-orange-900/20',
                    L: 'border-purple-600 bg-purple-900/20'
                  };
                  const rankBadges: Record<QuestRank, string> = {
                    C: 'bg-slate-600',
                    UC: 'bg-green-600',
                    R: 'bg-blue-600',
                    E: 'bg-orange-600',
                    L: 'bg-purple-600'
                  };

                  return (
                    <button
                      key={rank}
                      onClick={() => handleDepart(rank)}
                      className={`w-full text-left relative group overflow-hidden rounded-xl border-l-4 p-4 transition-all hover:translate-x-1 active:scale-95 ${rankColors[rank]}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center space-x-2">
                           <span className={`text-xs font-black px-2 py-0.5 rounded text-white ${rankBadges[rank]}`}>{rank}</span>
                           <h3 className="font-bold text-slate-200">{config.name}</h3>
                         </div>
                         <div className="text-right">
                           <span className="block text-[10px] text-slate-400 font-mono">所要時間</span>
                           <span className="font-orbitron font-bold text-indigo-300">{Math.floor(config.duration / 60)}m</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                         <div className="bg-slate-950/50 p-2 rounded">
                           <p className="text-slate-500">報酬レンジ</p>
                           <p className="text-yellow-400 font-bold">{config.minReward} - {config.maxReward} $CHH</p>
                         </div>
                         <div className="bg-slate-950/50 p-2 rounded">
                           <p className="text-slate-500">出発コスト</p>
                           <p className="text-white font-bold">{config.burnCost} $CHH</p>
                         </div>
                         <div className="bg-slate-950/50 p-2 rounded">
                           <p className="text-slate-500">被ダメージ/人</p>
                           <p className="text-red-400 font-bold">{config.minDmg} - {config.maxDmg}</p>
                         </div>
                         <div className="bg-slate-950/50 p-2 rounded relative overflow-hidden">
                           <p className="text-slate-500">特記事項</p>
                           {rank === 'L' ? (
                             <p className="text-purple-400 font-black animate-pulse">☠️ 即死率 1.6%</p>
                           ) : rank === 'E' ? (
                             <p className="text-orange-400 font-bold">⚠️ HP71以上限定</p>
                           ) : (
                             <p className="text-slate-400">特になし</p>
                           )}
                         </div>
                      </div>
                    </button>
                  );
                })}
             </div>
          </div>
        );

      case View.RETURN:
        return <StatusBoard state={gameState} view={View.RETURN} title="帰還ポッド" actionButtonLabel="報酬を回収して帰還" onAction={handleReturn} />;
      case View.RECOVERY:
        return <StatusBoard state={gameState} view={View.RECOVERY} title="チワワ・エステ" actionButtonLabel="HP全回復 (500 $CHH)" onAction={handleRecovery} />;
      case View.HOME:
      default:
        return <StatusBoard state={gameState} view={View.HOME} title="ベースキャンプ" />;
    }
  };

  const navItems = [
    { view: View.HOME, label: 'HOME', icon: ICONS.HOME },
    { view: View.PARTY, label: '編成', icon: ICONS.PARTY },
    { view: View.DEPART, label: '出発', icon: ICONS.DEPART },
    { view: View.RETURN, label: '帰還', icon: ICONS.RETURN },
    { view: View.GACHA, label: 'ガチャ', icon: ICONS.GACHA },
    { view: View.RECOVERY, label: '回復', icon: ICONS.RECOVERY },
  ];

  return (
    <div className="fixed inset-0 flex flex-col max-w-4xl mx-auto overflow-hidden bg-slate-950 border-x border-slate-800">
      {/* Main Area: Scrollable */}
      <main className="flex-1 relative overflow-hidden">
        <MiningBackground />
        <div className="relative z-10 h-full">
          {renderContent()}
        </div>
      </main>

      {/* Overlays */}
      {gachaResult && <GachaEffect result={gachaResult} onClose={() => setGachaResult(null)} />}
      {equippingState && (
        <EquipmentSelector 
          hero={gameState.heroes.find(h => h.id === equippingState.heroId)!}
          slotIndex={equippingState.slotIndex}
          equipmentList={gameState.equipment}
          allHeroes={gameState.heroes}
          onSelect={handleSelectEquipment}
          onClose={() => setEquippingState(null)}
        />
      )}

      {/* Sticky Bottom Nav */}
      <nav className="flex-none bg-slate-950/98 backdrop-blur-2xl border-t border-slate-800 flex items-center justify-around px-2 z-[60] pb-[env(safe-area-inset-bottom)] h-[calc(5rem+env(safe-area-inset-bottom))]">
        {navItems.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`flex flex-col items-center justify-center transition-all duration-300 w-14 pb-1 ${
              currentView === view ? 'text-indigo-400 scale-110' : 'text-slate-500'
            }`}
          >
            <Icon className={`w-6 h-6 ${currentView === view ? 'drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]' : ''}`} />
            <span className="text-[10px] mt-1.5 font-bold tracking-tight">{label}</span>
          </button>
        ))}
      </nav>

      {/* Decorative top bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 z-[100]"></div>
    </div>
  );
};

export default App;
