
import React, { useState, useEffect } from 'react';
import { View, Hero, Equipment, Quest, GameState } from './types';
import { INITIAL_HEROES, INITIAL_EQUIPMENT, ICONS } from './constants';
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
  };

  const handleReturn = () => {
    const now = Date.now();
    const completed = gameState.activeQuests.filter(q => q.endTime <= now);
    
    if (completed.length === 0) {
      alert("まだ完了したクエストはありません。タイマーの終了をお待ちください。");
      return;
    }

    const totalReward = completed.reduce((acc, q) => acc + q.reward, 0);
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens + totalReward,
      activeQuests: prev.activeQuests.filter(q => q.endTime > now)
    }));
    alert(`${totalReward} $CHHを獲得しました！`);
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
        return <StatusBoard state={gameState} view={View.DEPART} title="出発ゲート" actionButtonLabel="探検に出発 (5分)" onAction={handleDepart} />;
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
