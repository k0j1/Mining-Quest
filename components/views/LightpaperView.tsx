
import React from 'react';
import Header from '../Header';

interface LightpaperViewProps {
  tokens: number;
  onBack: () => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onDebugAddTokens?: () => void;
  farcasterUser?: any;
  onChainBalance?: number | null;
  onAccountClick?: () => void;
}

const LightpaperView: React.FC<LightpaperViewProps> = ({
  tokens,
  onBack,
  isSoundOn,
  onToggleSound,
  onDebugAddTokens,
  farcasterUser,
  onChainBalance,
  onAccountClick
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <Header 
        title="Lightpaper" 
        tokens={tokens} 
        isSoundOn={isSoundOn} 
        onToggleSound={onToggleSound} 
        onDebugAddTokens={onDebugAddTokens}
        farcasterUser={farcasterUser}
        onChainBalance={onChainBalance}
        onAccountClick={onAccountClick}
      />

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-24 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-10 text-slate-300 leading-relaxed">
          
          {/* Intro */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📜</span>
              <h1 className="text-2xl font-black text-white font-orbitron">MINING QUEST</h1>
            </div>
            <p className="text-sm text-slate-400">
              Mining Questは、動物のヒーローたちを率いて過酷な採掘任務に挑む、ハイリスク・ハイリターンな放置型RPGです。<br/>
              獲得したトークン($CHH)を使用して部隊を強化し、さらなる深淵を目指してください。
            </p>
          </section>

          {/* Core Loop */}
          <section className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-lg font-bold text-amber-500 mb-4 flex items-center">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
              ゲームサイクル
            </h2>
            <div className="overflow-x-auto">
              <ol className="list-decimal list-inside space-y-3 text-xs whitespace-nowrap min-w-max">
                <li><strong className="text-slate-200">PARTY (編成)</strong>: ヒーローを選び、装備を整える</li>
                <li><strong className="text-slate-200">QUEST (出発)</strong>: 難易度を選んで採掘へ派遣（$CHHを消費）</li>
                <li><strong className="text-slate-200">待機</strong>: 帰還時間まで待つ（アプリを閉じても進行します）</li>
                <li><strong className="text-slate-200">RESULT (帰還)</strong>: クエスト報酬を獲得</li>
                <li><strong className="text-slate-200">HEAL (回復)</strong>: ダメージを受けた場合は回復</li>
                <li><strong className="text-slate-200">GACHA (強化)</strong>: 獲得した$CHHで新戦力を補充</li>
              </ol>
            </div>
          </section>

          {/* Specs: Heroes */}
          <section>
            <h2 className="text-lg font-bold text-indigo-400 mb-4 flex items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
              ヒーローとステータス
            </h2>
            <div className="space-y-4 text-sm">
              <p>ヒーローは採掘の主役です。<strong className="text-red-400">HPが0になるとヒーローはロスト（消滅）します。</strong></p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                <li><strong>レアリティ</strong>: C / UC / R / E / L (Lが最高)</li>
                <li><strong>装備スロット</strong>: レアリティが高いほど、装備スロットが増えます。</li>
                <li><strong>HP</strong>: 全員最大100。クエストで減少します。</li>
              </ul>
            </div>
          </section>

          {/* Specs: Equipment */}
          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
              装備品の効果
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="font-bold text-slate-200 mb-1">⛏️ ピッケル (Pickaxe)</div>
                <p className="text-xs text-slate-400">獲得報酬($CHH)が増加します。<br/>パーティ全員の合計値が適用されます。</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="font-bold text-slate-200 mb-1">🪖 ヘルメット (Helmet)</div>
                <p className="text-xs text-slate-400">装備したヒーローの被ダメージを軽減します。<br/>個人の生存率を高めます。</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="font-bold text-slate-200 mb-1">👢 ブーツ (Boots)</div>
                <p className="text-xs text-slate-400">クエストの所要時間を短縮します。<br/>パーティ全員の合計値が適用されます。</p>
              </div>
            </div>
          </section>

          {/* Specs: Quests */}
          <section>
            <h2 className="text-lg font-bold text-rose-400 mb-4 flex items-center">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2"></span>
              クエストランク
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap min-w-max">
                <thead className="text-slate-500 border-b border-slate-700">
                  <tr>
                    <th className="py-2 pr-4">Rank</th>
                    <th className="py-2 pr-4">Cost</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2 font-bold text-slate-400">C</td>
                    <td className="py-2">0</td>
                    <td className="py-2">15m</td>
                    <td className="py-2 text-slate-500">とても低い</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-emerald-500">UC</td>
                    <td className="py-2">20</td>
                    <td className="py-2">30m</td>
                    <td className="py-2 text-slate-500">低</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-indigo-400">R</td>
                    <td className="py-2">50</td>
                    <td className="py-2">1h</td>
                    <td className="py-2 text-orange-300">中</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-fuchsia-400">E</td>
                    <td className="py-2">150</td>
                    <td className="py-2">3h</td>
                    <td className="py-2 text-red-400">高 (大ダメージ)</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-amber-500">L</td>
                    <td className="py-2">300</td>
                    <td className="py-2">8h</td>
                    <td className="py-2 text-red-600 font-bold">一撃死亡有り</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[10px] text-slate-500">※ダメージによってHPが0になるとヒーローはロストします</p>
            </div>
          </section>

           {/* Cost Specs */}
           <section className="border-t border-slate-800 pt-6">
            <h2 className="text-sm font-bold text-slate-300 mb-3">コスト一覧</h2>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex justify-between items-center">
                <span>ヒーローガチャ</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">10,000 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>装備品ガチャ</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">6,000 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>パーティ枠解放</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">10,000 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>ポーション (+10HP)</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">200 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>エリクサー (MaxHP)</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">1,200 $CHH</span>
              </li>
            </ul>
          </section>

          <div className="pt-8 text-center">
            <button 
              onClick={onBack}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-600"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightpaperView;
