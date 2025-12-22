
import React, { useState, useEffect } from 'react';
import { View, Hero, Equipment, Quest, GameState } from './types';
import { INITIAL_HEROES, INITIAL_EQUIPMENT, ICONS } from './constants';
import StatusBoard from './components/StatusBoard';
import HeroCard from './components/HeroCard';
import { getMiningInsight, generateGachaItem } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [gameState, setGameState] = useState<GameState>({
    tokens: 12500,
    heroes: INITIAL_HEROES,
    equipment: INITIAL_EQUIPMENT,
    activeQuests: []
  });
  const [insight, setInsight] = useState<string>("採掘の極意を読み込み中...");
  const [gachaTab, setGachaTab] = useState<'Hero' | 'Equipment'>('Hero');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      const msg = await getMiningInsight();
      setInsight(msg);
    };
    fetchInsight();
  }, [currentView]);

  const handleDepart = () => {
    const newQuest: Quest = {
      id: Math.random().toString(),
      name: '暗黒の地下洞窟',
      duration: 300,
      endTime: Date.now() + 300 * 1000,
      reward: 1500,
      status: 'active'
    };
    setGameState(prev => ({
      ...prev,
      activeQuests: [...prev.activeQuests, newQuest]
    }));
    alert("クエストに出発しました！");
  };

  const handleReturn = () => {
    if (gameState.activeQuests.length === 0) {
      alert("帰還するクエストがありません。");
      return;
    }
    const totalReward = gameState.activeQuests.reduce((acc, q) => acc + q.reward, 0);
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens + totalReward,
      activeQuests: []
    }));
    alert(`${totalReward} CHIWAを獲得して帰還しました！`);
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

    alert("ガチャ演出中...");
    const result = await generateGachaItem(gachaTab);
    
    if (result) {
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
        setGameState(prev => ({ ...prev, tokens: prev.tokens - cost, heroes: [...prev.heroes, newHero] }));
      } else {
        const newEquip: Equipment = {
          id: Math.random().toString(),
          name: result.name || "鉄のつるはし",
          type: result.type || 'Pickaxe',
          bonus: Math.floor(Math.random() * 20) + 5,
          rarity: 'Common'
        };
        setGameState(prev => ({ ...prev, tokens: prev.tokens - cost, equipment: [...prev.equipment, newEquip] }));
      }
      alert(`${result.name}を獲得しました！`);
    }
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    if (draggingIndex === null || draggingIndex === dropIndex) return;

    const newHeroes = [...gameState.heroes];
    const draggedHero = newHeroes[draggingIndex];
    newHeroes.splice(draggingIndex, 1);
    newHeroes.splice(dropIndex, 0, draggedHero);

    setGameState(prev => ({ ...prev, heroes: newHeroes }));
    setDraggingIndex(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case View.PARTY:
        return (
          <div className="p-4 h-full overflow-y-auto pb-32">
            <div className="mb-4">
              <h1 className="text-xl font-orbitron font-bold text-indigo-300">パーティ編成</h1>
              <p className="text-[10px] text-slate-400">ドラッグして順番を入れ替えます（上位3人が出撃メンバー）</p>
            </div>

            {/* Top 3 Slots (Formation) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
              {gameState.heroes.slice(0, 3).map((hero, idx) => (
                <div key={hero.id} className="relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-[8px] font-bold px-2 py-0.5 rounded-full z-10 shadow-lg border border-indigo-400">
                    SLOT {idx + 1}
                  </div>
                  <HeroCard 
                    hero={hero} 
                    index={idx}
                    isDragging={draggingIndex === idx}
                    onDragStart={onDragStart}
                    onDrop={onDrop}
                  />
                </div>
              ))}
              {/* Fill empty slots if less than 3 heroes */}
              {Array.from({ length: Math.max(0, 3 - gameState.heroes.length) }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-[2/3] border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-900/50">
                   <span className="text-slate-600 text-[10px] font-bold">空きスロット</span>
                </div>
              ))}
            </div>

            {/* Bench / Inventory Grid */}
            <div className="mt-6">
              <h2 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest border-l-2 border-slate-700 pl-2">ベンチヒーロー</h2>
              <div className="grid grid-cols-2 gap-3">
                 {gameState.heroes.slice(3).map((hero, idx) => {
                   const actualIndex = idx + 3;
                   return (
                    <HeroCard 
                      key={hero.id} 
                      hero={hero} 
                      index={actualIndex}
                      compact 
                      isDragging={draggingIndex === actualIndex}
                      onDragStart={onDragStart}
                      onDrop={onDrop}
                    />
                  );
                 })}
              </div>
              {gameState.heroes.length <= 3 && (
                <p className="text-center text-slate-600 text-xs py-8 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                  控えのヒーローはいません
                </p>
              )}
            </div>
          </div>
        );

      case View.GACHA:
        return (
          <div className="p-6 h-full overflow-y-auto pb-32 flex flex-col items-center">
            <h1 className="text-2xl font-orbitron font-bold text-indigo-300 mb-6">幸運のガチャ</h1>
            
            <div className="flex bg-slate-800 p-1 rounded-xl w-full max-w-md mb-8">
              <button 
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${gachaTab === 'Hero' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                onClick={() => setGachaTab('Hero')}
              >
                ヒーロー
              </button>
              <button 
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${gachaTab === 'Equipment' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                onClick={() => setGachaTab('Equipment')}
              >
                装備品
              </button>
            </div>

            <div className="glass-panel p-8 rounded-3xl text-center space-y-6 max-w-md w-full border-t-4 border-t-yellow-500 shadow-2xl">
              <div className="text-5xl animate-bounce">🎁</div>
              <h2 className="text-2xl font-bold">{gachaTab === 'Hero' ? '新しい仲間を迎えよう' : '伝説の道具を探そう'}</h2>
              <p className="text-slate-400">1回: <span className="text-yellow-400 font-bold">1,000 CHIWA</span></p>
              <button 
                onClick={handleGacha}
                className="w-full py-4 bg-yellow-500 text-slate-900 rounded-xl font-black text-xl hover:bg-yellow-400 active:scale-95 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]"
              >
                ガチャを回す
              </button>
            </div>
          </div>
        );

      case View.DEPART:
        return <StatusBoard state={gameState} title="クエスト出発" actionButtonLabel="探検に出発する (5分)" onAction={handleDepart} />;
      
      case View.RETURN:
        return <StatusBoard state={gameState} title="拠点へ帰還" actionButtonLabel="報酬を受け取って帰還する" onAction={handleReturn} />;
      
      case View.RECOVERY:
        return <StatusBoard state={gameState} title="癒やしの泉" actionButtonLabel="HPを全回復する (500 CHIWA)" onAction={handleRecovery} />;
      
      case View.HOME:
      default:
        return (
          <div className="h-full flex flex-col">
            <StatusBoard state={gameState} title="マイ・キャンプ" />
            <div className="fixed bottom-24 left-4 right-4 bg-indigo-900/80 border border-indigo-400/30 p-4 rounded-2xl">
              <p className="text-xs font-bold text-indigo-300 uppercase mb-1 flex items-center">
                <span className="mr-2">💡</span> チワワ賢者の助言
              </p>
              <p className="text-sm italic">"{insight}"</p>
            </div>
          </div>
        );
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto overflow-hidden relative shadow-2xl bg-slate-950">
      {/* Main Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto h-20 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700 flex items-center justify-around px-2 z-50">
        {navItems.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`flex flex-col items-center justify-center transition-all duration-300 w-14 ${
              currentView === view ? 'text-indigo-400 scale-110' : 'text-slate-500'
            }`}
          >
            <Icon className={`w-6 h-6 ${currentView === view ? 'drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' : ''}`} />
            <span className="text-[10px] mt-1 font-bold">{label}</span>
          </button>
        ))}
      </nav>
      
      {/* Visual Decoration */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[gradient_3s_linear_infinite]"></div>
    </div>
  );
};

export default App;
