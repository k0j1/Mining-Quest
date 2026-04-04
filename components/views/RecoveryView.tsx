
import React from 'react';
import { gsap } from 'gsap';
import { GameState, Hero, Equipment } from '../../types';
import Header from '../Header';
import EquipmentIcon from '../EquipmentIcon';
import { playClick } from '../../utils/sound';
import { FlaskConical, TestTube, Hammer } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const EffectDisplay = ({ text }: { text: string }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (ref.current) {
            gsap.fromTo(ref.current, { opacity: 0, y: 0 }, { opacity: 1, y: -20, duration: 0.5, ease: "power2.out" });
            gsap.to(ref.current, { opacity: 0, delay: 0.5, duration: 0.5 });
        }
    }, [text]);
    return <div ref={ref} className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-50 pointer-events-none"><span className="text-amber-400 font-black text-lg drop-shadow-md">{text}</span></div>;
}

interface RecoveryViewProps {
  gameState: GameState;
  onBuyItems: (potionAmount: number, elixirAmount: number, whetstoneAmount: number) => void;
  onPotion: (heroId: string) => void;
  onElixir: (heroId: string) => void;
  onWhetstone: (equipmentId: string) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onDebugAddTokens?: () => void;
  farcasterUser?: any;
  onChainBalance?: number | null;
  onAccountClick?: () => void;
}

const RecoveryView: React.FC<RecoveryViewProps> = ({ 
  gameState, 
  onBuyItems,
  onPotion, 
  onElixir, 
  onWhetstone,
  isSoundOn, 
  onToggleSound, 
  onDebugAddTokens, 
  farcasterUser,
  onChainBalance,
  onAccountClick
}) => {
  const { t } = useLanguage();
  const [potionAmount, setPotionAmount] = React.useState(0);
  const [elixirAmount, setElixirAmount] = React.useState(0);
  const [whetstoneAmount, setWhetstoneAmount] = React.useState(0);
  const [activeEffect, setActiveEffect] = React.useState<{id: string, text: string} | null>(null);

  const triggerEffect = (id: string, text: string) => {
    setActiveEffect({id, text});
    setTimeout(() => setActiveEffect(null), 1000);
  };

  const [activeTab, setActiveTab] = React.useState<'heroes' | 'equipment'>('heroes');

  const rarityColors: Record<string, string> = {
    C: 'bg-slate-600 text-slate-100',
    UC: 'bg-emerald-600 text-emerald-50',
    R: 'bg-indigo-600 text-indigo-50',
    E: 'bg-fuchsia-600 text-fuchsia-50',
    L: 'bg-amber-600 text-amber-50'
  };

  // Get list of heroes currently on quests
  const activeQuestHeroIds = gameState.activeQuests.flatMap(q => q.heroIds);
  
  // Get list of heroes assigned to any party
  const allAssignedHeroIds = gameState.partyPresets.flat().filter((id): id is string => !!id);

  // Group assigned heroes by party
  const parties = [0, 1, 2].map(partyIndex => {
      const heroIds = gameState.partyPresets[partyIndex];
      const heroes = heroIds
          .map(id => gameState.heroes.find(h => h.id === id))
          .filter((h): h is Hero => !!h);
      return { id: partyIndex, heroes };
  });

  // Filter unassigned heroes and SORT BY HP ASCENDING (Lowest HP first)
  const unassignedHeroes = gameState.heroes
    .filter(h => !allAssignedHeroIds.includes(h.id))
    .sort((a, b) => a.hp - b.hp);

  const allHeroesInOrder = [
    ...parties[0].heroes,
    ...parties[1].heroes,
    ...parties[2].heroes,
    ...unassignedHeroes
  ];

  const allEquipmentInOrder: Equipment[] = [];
  allHeroesInOrder.forEach(hero => {
    hero.equipmentIds.forEach(eqId => {
      const eq = gameState.equipment.find(e => e.id === eqId);
      if (eq) allEquipmentInOrder.push(eq);
    });
  });
  const equippedIds = allHeroesInOrder.flatMap(h => h.equipmentIds);
  const unequippedEquipment = gameState.equipment.filter(e => !equippedIds.includes(e.id));
  allEquipmentInOrder.push(...unequippedEquipment);

  const totalCost = (potionAmount * 100) + (elixirAmount * 500) + (whetstoneAmount * 100);
  const canBuy = totalCost > 0 && gameState.tokens >= totalCost;

  // Render Helper for Hero Card
  const renderHeroCard = (hero: Hero) => {
    const hpPercent = (hero.hp / hero.maxHp) * 100;
    const isFull = hero.hp >= hero.maxHp;
    const isQuesting = activeQuestHeroIds.includes(hero.id);
    const isAssigned = allAssignedHeroIds.includes(hero.id);
    
    const hasPotion = gameState.items.item01 > 0;
    const hasElixir = gameState.items.item02 > 0;

    const partyIndex = gameState.partyPresets.findIndex(ids => ids.includes(hero.id));

    return (
      <div key={hero.id} className={`w-full bg-slate-800/80 rounded-xl border flex flex-col relative overflow-hidden transition-all group ${
          isQuesting 
            ? 'border-slate-800 opacity-60' 
            : isAssigned 
                ? 'border-indigo-500/30 shadow-sm' 
                : 'border-slate-700'
      }`}>
          {activeEffect?.id === hero.id && <EffectDisplay text={activeEffect.text} />}
          {/* Questing Overlay */}
          {isQuesting && (
            <div className="absolute inset-0 bg-slate-950/70 z-20 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-[8px] font-black text-amber-500 border border-amber-500/30 bg-amber-950/90 px-1.5 py-0.5 rounded uppercase tracking-wider transform -rotate-6">
                  {t('recovery.mission')}
              </span>
            </div>
          )}

          {/* Top: Image & Status */}
          <div className="relative aspect-square w-full bg-slate-900">
              <img 
                src={hero.imageUrl} 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                alt={hero.name} 
              />
              
              {/* HP Badge */}
              <div className="absolute top-1 right-1 bg-black/60 px-1 rounded backdrop-blur-sm border border-white/10 z-10">
                  <span className={`text-[8px] font-bold ${hero.hp < hero.maxHp * 0.3 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                      HP {hero.hp}
                  </span>
              </div>

              {/* Party Label */}
              {partyIndex !== -1 && (
                <div className="absolute bottom-1 right-1 z-30">
                  <span className="bg-indigo-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full border border-indigo-400 shadow-sm uppercase tracking-tighter">
                    Party 0{partyIndex + 1}
                  </span>
                </div>
              )}
          </div>

          {/* Bottom: Info & Actions */}
          <div className="p-1.5 flex flex-col gap-1.5 bg-slate-800/90">
              <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-[9px] text-slate-200 truncate">{hero.name}</h3>
                  {/* HP Bar */}
                  <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-700/50 w-full">
                      <div 
                        className={`h-full transition-all duration-500 ${hero.hp < hero.maxHp * 0.3 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${hpPercent}%` }}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-1 mt-0.5">
                  {/* Potion Button */}
                  <button 
                    onClick={() => {
                        onPotion(hero.id);
                        triggerEffect(hero.id, 'HP+10');
                    }}
                    disabled={isFull || isQuesting || !hasPotion} 
                    className={`h-8 rounded-lg flex flex-col items-center justify-center border transition-all active:scale-95 ${
                        isFull || isQuesting || !hasPotion
                          ? 'bg-slate-900 border-slate-800 opacity-30 cursor-not-allowed grayscale' 
                          : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                    }`}
                    title="Potion (+10 HP)"
                  >
                      <span className="flex items-center justify-center h-4"><FlaskConical size={12} className="text-emerald-400" /></span>
                      <span className={`text-[7px] font-bold leading-tight ${hasPotion ? 'text-slate-300' : 'text-rose-500'}`}>HP+10</span>
                  </button>
                  
                  {/* Elixir Button */}
                  <button 
                      onClick={() => {
                          onElixir(hero.id);
                          triggerEffect(hero.id, 'HP100%');
                      }}
                      disabled={isFull || isQuesting || !hasElixir} 
                      className={`h-8 rounded-lg flex flex-col items-center justify-center border transition-all active:scale-95 ${
                          isFull || isQuesting || !hasElixir
                            ? 'bg-slate-900 border-slate-800 opacity-30 cursor-not-allowed grayscale'
                            : 'bg-indigo-900/40 border-indigo-500/40 hover:bg-indigo-900/60 hover:border-indigo-400/60'
                      }`}
                      title="Elixir (Full Heal)"
                  >
                      <span className="flex items-center justify-center h-4"><TestTube size={12} className="text-indigo-400" /></span>
                      <span className={`text-[7px] font-bold leading-tight ${hasElixir ? 'text-indigo-300' : 'text-rose-500'}`}>HP100%</span>
                  </button>
              </div>
          </div>
      </div>
    );
  };

  const renderEquipmentCard = (eq: Equipment) => {
    const isLimit = eq.durability >= 10;
    const hasWhetstone = gameState.items.item03 > 0;
    const isEquipped = equippedIds.includes(eq.id);
    // Find if the hero equipping this is on a quest
    const heroEquipping = allHeroesInOrder.find(h => h.equipmentIds.includes(eq.id));
    const isQuesting = heroEquipping ? activeQuestHeroIds.includes(heroEquipping.id) : false;
    const partyIndex = heroEquipping ? gameState.partyPresets.findIndex(ids => ids.includes(heroEquipping.id)) : -1;

    // Rarity styles matching HeroCard slots
    const slotBgColors: Record<string, string> = {
      C: 'bg-slate-900/80 border-slate-700',
      UC: 'bg-emerald-900/40 border-emerald-700/50',
      R: 'bg-indigo-900/40 border-indigo-700/50',
      E: 'bg-fuchsia-900/40 border-fuchsia-700/50',
      L: 'bg-amber-900/40 border-amber-700/50'
    };

    const textColors: Record<string, string> = {
      C: 'text-slate-700',
      UC: 'text-emerald-500',
      R: 'text-indigo-500',
      E: 'text-fuchsia-500',
      L: 'text-amber-500'
    };

    return (
      <div key={eq.id} className={`w-full bg-slate-800/80 rounded-xl border flex flex-col relative overflow-hidden transition-all group ${
          isQuesting 
            ? 'border-slate-800 opacity-60' 
            : isEquipped 
                ? 'border-amber-500/30 shadow-sm' 
                : 'border-slate-700'
      }`}>
          {activeEffect?.id === eq.id && <EffectDisplay text={activeEffect.text} />}
          {/* Questing Overlay */}
          {isQuesting && (
            <div className="absolute inset-0 bg-slate-950/70 z-20 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-[8px] font-black text-amber-500 border border-amber-500/30 bg-amber-950/90 px-1.5 py-0.5 rounded uppercase tracking-wider transform -rotate-6">
                  {t('recovery.mission')}
              </span>
            </div>
          )}

          {/* Top: Image & Status */}
          <div className={`relative aspect-square w-full flex items-center justify-center overflow-hidden ${slotBgColors[eq.rarity] || slotBgColors.C}`}>
              {/* Rarity Background Text */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 font-black text-6xl -rotate-12 select-none pointer-events-none">
                <span className={textColors[eq.rarity] || textColors.C}>{eq.rarity}</span>
              </div>

              <div className="relative z-10 transform scale-150 drop-shadow-2xl">
                <EquipmentIcon 
                  type={eq.type} 
                  rarity={eq.rarity} 
                  size="2.5em" 
                />
              </div>

              {/* Rarity Badge */}
              <div className={`absolute top-1 left-1 z-20 px-1.5 py-0.5 rounded text-[8px] font-black shadow-sm border border-white/10 ${rarityColors[eq.rarity]}`}>
                  {eq.rarity}
              </div>
              
              {/* Durability Badge */}
              <div className="absolute top-1 right-1 bg-black/60 px-1 rounded backdrop-blur-sm border border-white/10 z-10">
                  <span className={`text-[8px] font-bold ${
                    eq.durability === 0 
                      ? 'text-rose-500 animate-pulse font-black' 
                      : eq.durability < 10 
                        ? 'text-amber-400' 
                        : 'text-emerald-400'
                  }`}>
                      Dur {eq.durability}
                  </span>
              </div>

              {/* Party Label */}
              {partyIndex !== -1 && (
                <div className="absolute bottom-1 right-1 z-30">
                  <span className="bg-amber-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full border border-amber-400 shadow-sm uppercase tracking-tighter">
                    Party 0{partyIndex + 1}
                  </span>
                </div>
              )}
          </div>

          {/* Bottom: Info & Actions */}
          <div className="p-1.5 flex flex-col gap-1.5 bg-slate-800/90 flex-1 justify-between">
              <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-[9px] text-slate-200 truncate">{eq.name}</h3>
                  <div className="text-[8px] text-slate-400">Lv.{eq.level} / {eq.rarity}</div>
              </div>

              <div className="mt-0.5">
                  {/* Whetstone Button */}
                  <button 
                    onClick={() => {
                        onWhetstone(eq.id);
                        triggerEffect(eq.id, 'Dur+1');
                    }}
                    disabled={isLimit || isQuesting || !hasWhetstone} 
                    className={`w-full h-8 rounded-lg flex items-center justify-center gap-1 border transition-all active:scale-95 ${
                        isLimit || isQuesting || !hasWhetstone
                          ? 'bg-slate-900 border-slate-800 opacity-30 cursor-not-allowed grayscale' 
                          : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                    }`}
                    title={t('recovery.whetstone')}
                  >
                      <Hammer size={12} className="text-slate-300" />
                      <span className={`text-[7px] font-bold leading-tight ${hasWhetstone ? 'text-slate-300' : 'text-rose-500'}`}>Dur+1</span>
                  </button>
              </div>
          </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
       <Header 
         title={t('recovery.title')} 
         tokens={gameState.tokens} 
         isSoundOn={isSoundOn} 
         onToggleSound={onToggleSound} 
         onDebugAddTokens={onDebugAddTokens}
         farcasterUser={farcasterUser}
         onChainBalance={onChainBalance}
         onAccountClick={onAccountClick}
       />

       <div className="flex-1 overflow-y-auto px-3 py-4 pb-24 bg-slate-900 custom-scrollbar">
          
          {/* Inventory Section */}
          <div className="mb-6 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('recovery.shop_inventory')}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
                {/* Potion */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700 flex flex-col items-center">
                    <div className="mb-1 flex items-center justify-center h-8"><FlaskConical size={24} className="text-emerald-400" /></div>
                    <div className="text-[10px] font-bold text-slate-300 mb-1">{t('recovery.potion')}</div>
                    <div className="text-[10px] text-slate-400 mb-2">100 $CHH</div>
                    <div className="text-xs font-black text-emerald-400 mb-2">{t('recovery.owned')} {gameState.items.item01}</div>
                    
                    <div className="flex items-center gap-2 w-full justify-center">
                        <button 
                            onClick={() => { playClick(); setPotionAmount(Math.max(0, potionAmount - 1)); }}
                            className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center font-bold"
                        >-</button>
                        <span className="text-sm font-bold w-6 text-center">{potionAmount}</span>
                        <button 
                            onClick={() => { playClick(); setPotionAmount(Math.min(99, potionAmount + 1)); }}
                            className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center font-bold"
                        >+</button>
                    </div>
                </div>
                {/* Elixir */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700 flex flex-col items-center">
                    <div className="mb-1 flex items-center justify-center h-8"><TestTube size={24} className="text-indigo-400" /></div>
                    <div className="text-[10px] font-bold text-slate-300 mb-1">{t('recovery.elixir')}</div>
                    <div className="text-[10px] text-slate-400 mb-2">500 $CHH</div>
                    <div className="text-xs font-black text-indigo-400 mb-2">{t('recovery.owned')} {gameState.items.item02}</div>
                    
                    <div className="flex items-center gap-2 w-full justify-center">
                        <button 
                            onClick={() => { playClick(); setElixirAmount(Math.max(0, elixirAmount - 1)); }}
                            className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center font-bold"
                        >-</button>
                        <span className="text-sm font-bold w-6 text-center">{elixirAmount}</span>
                        <button 
                            onClick={() => { playClick(); setElixirAmount(Math.min(99, elixirAmount + 1)); }}
                            className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center font-bold"
                        >+</button>
                    </div>
                </div>
                {/* Whetstone */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700 flex flex-col items-center">
                    <div className="mb-1 flex items-center justify-center h-8"><Hammer size={24} className="text-slate-400" /></div>
                    <div className="text-[10px] font-bold text-slate-300 mb-1">{t('recovery.whetstone_item')}</div>
                    <div className="text-[10px] text-slate-400 mb-2">100 $CHH</div>
                    <div className="text-xs font-black text-slate-400 mb-2">{t('recovery.owned')} {gameState.items.item03}</div>
                    
                    <div className="flex items-center gap-2 w-full justify-center">
                        <button 
                            onClick={() => { playClick(); setWhetstoneAmount(Math.max(0, whetstoneAmount - 1)); }}
                            className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center font-bold"
                        >-</button>
                        <span className="text-sm font-bold w-6 text-center">{whetstoneAmount}</span>
                        <button 
                            onClick={() => { playClick(); setWhetstoneAmount(Math.min(99, whetstoneAmount + 1)); }}
                            className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center font-bold"
                        >+</button>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => { 
                    playClick(); 
                    onBuyItems(potionAmount, elixirAmount, whetstoneAmount); 
                    setPotionAmount(0);
                    setElixirAmount(0);
                    setWhetstoneAmount(0);
                }}
                disabled={!canBuy}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg border-b-4 ${
                    canBuy
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800' 
                    : 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed'
                }`}
            >
                {totalCost > 0 ? `${t('recovery.buy_bulk')} (${totalCost.toLocaleString()} $CHH)` : t('recovery.select_items')}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => { playClick(); setActiveTab('heroes'); }}
              className={`flex-1 py-2 px-4 rounded-t-lg border-b-2 font-bold text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'heroes' 
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-400 hover:bg-slate-800/30'
              }`}
            >
              <span className={`w-1.5 h-4 rounded-full ${activeTab === 'heroes' ? 'bg-indigo-500' : 'bg-slate-600'}`}></span>
              Heroes
            </button>
            <button 
              onClick={() => { playClick(); setActiveTab('equipment'); }}
              className={`flex-1 py-2 px-4 rounded-t-lg border-b-2 font-bold text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'equipment' 
                  ? 'border-amber-500 text-amber-400 bg-slate-800/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-400 hover:bg-slate-800/30'
              }`}
            >
              <span className={`w-1.5 h-4 rounded-full ${activeTab === 'equipment' ? 'bg-amber-500' : 'bg-slate-600'}`}></span>
              Equipment
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-2 pb-4">
            {activeTab === 'heroes' && (
              <>
                {allHeroesInOrder.map(renderHeroCard)}
                {allHeroesInOrder.length === 0 && (
                  <div className="col-span-3 p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-600 text-xs font-bold">
                    {t('recovery.no_heroes')}
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'equipment' && (
              <>
                {allEquipmentInOrder.map(renderEquipmentCard)}
                {allEquipmentInOrder.length === 0 && (
                  <div className="col-span-3 p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-600 text-xs font-bold">
                    No Equipment
                  </div>
                )}
              </>
            )}
          </div>

       </div>
    </div>
  );
};

export default RecoveryView;

