
import React from 'react';
import Header from '../Header';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t } = useLanguage();
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <Header 
        title={t('lightpaper.title')} 
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
              {t('lightpaper.intro')}
            </p>
          </section>

          {/* Core Loop */}
          <section className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-lg font-bold text-amber-500 mb-4 flex items-center">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
              {t('lightpaper.core_loop')}
            </h2>
            <div className="overflow-x-auto">
              <ol className="list-decimal list-inside space-y-3 text-xs whitespace-nowrap min-w-max">
                <li><strong className="text-slate-200">{t('lightpaper.step1').split(':')[0]}</strong>: {t('lightpaper.step1').split(':')[1] || t('lightpaper.step1')}</li>
                <li><strong className="text-slate-200">{t('lightpaper.step2').split(':')[0]}</strong>: {t('lightpaper.step2').split(':')[1] || t('lightpaper.step2')}</li>
                <li><strong className="text-slate-200">{t('lightpaper.step3').split(':')[0]}</strong>: {t('lightpaper.step3').split(':')[1] || t('lightpaper.step3')}</li>
                <li><strong className="text-slate-200">{t('lightpaper.step4').split(':')[0]}</strong>: {t('lightpaper.step4').split(':')[1] || t('lightpaper.step4')}</li>
                <li><strong className="text-slate-200">{t('lightpaper.step5').split(':')[0]}</strong>: {t('lightpaper.step5').split(':')[1] || t('lightpaper.step5')}</li>
                <li><strong className="text-slate-200">{t('lightpaper.step6').split(':')[0]}</strong>: {t('lightpaper.step6').split(':')[1] || t('lightpaper.step6')}</li>
              </ol>
            </div>
          </section>

          {/* Specs: Heroes */}
          <section>
            <h2 className="text-lg font-bold text-indigo-400 mb-4 flex items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
              {t('lightpaper.heroes')}
            </h2>
            <div className="space-y-4 text-sm">
              <p>{t('lightpaper.hero_desc1')}</p>
              <p className="text-slate-400 bg-slate-800 p-2 rounded border border-slate-700">
                 ⚠️ <strong>{t('lightpaper.wipeout_rule')}</strong><br/>
                 {t('lightpaper.wipeout_desc')}
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                <li><strong>{t('lightpaper.rarity').split(':')[0]}</strong>: {t('lightpaper.rarity').split(':')[1] || t('lightpaper.rarity')}</li>
                <li><strong>{t('lightpaper.equip_slots').split(':')[0]}</strong>: {t('lightpaper.equip_slots').split(':')[1] || t('lightpaper.equip_slots')}</li>
                <li><strong>{t('lightpaper.skills').split(':')[0]}</strong>: {t('lightpaper.skills').split(':')[1] || t('lightpaper.skills')}</li>
                <li><strong>{t('lightpaper.hp').split(':')[0]}</strong>: {t('lightpaper.hp').split(':')[1] || t('lightpaper.hp')}</li>
              </ul>
            </div>
          </section>

          {/* Specs: Equipment */}
          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
              {t('lightpaper.equip_effects')}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="font-bold text-slate-200 mb-1">{t('lightpaper.pickaxe')}</div>
                <p className="text-xs text-slate-400">{t('lightpaper.pickaxe_desc')}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="font-bold text-slate-200 mb-1">{t('lightpaper.helmet')}</div>
                <p className="text-xs text-slate-400">{t('lightpaper.helmet_desc')}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="font-bold text-slate-200 mb-1">{t('lightpaper.boots')}</div>
                <p className="text-xs text-slate-400">{t('lightpaper.boots_desc')}</p>
              </div>
            </div>
          </section>

          {/* Specs: Quests */}
          <section>
            <h2 className="text-lg font-bold text-rose-400 mb-4 flex items-center">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2"></span>
              {t('lightpaper.quest_ranks')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap min-w-max">
                <thead className="text-slate-500 border-b border-slate-700">
                  <tr>
                    <th className="py-2 pr-4">{t('lightpaper.rank')}</th>
                    <th className="py-2 pr-4">{t('lightpaper.cost')}</th>
                    <th className="py-2 pr-4">{t('lightpaper.base_time')}</th>
                    <th className="py-2">{t('lightpaper.risk')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2 font-bold text-slate-400">C</td>
                    <td className="py-2">0</td>
                    <td className="py-2">30m</td>
                    <td className="py-2 text-slate-500">{t('lightpaper.risk_c')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-emerald-500">UC</td>
                    <td className="py-2">20</td>
                    <td className="py-2">60m</td>
                    <td className="py-2 text-slate-500">{t('lightpaper.risk_uc')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-indigo-400">R</td>
                    <td className="py-2">50</td>
                    <td className="py-2">120m</td>
                    <td className="py-2 text-orange-300">{t('lightpaper.risk_r')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-fuchsia-400">E</td>
                    <td className="py-2">150</td>
                    <td className="py-2">360m</td>
                    <td className="py-2 text-red-400">{t('lightpaper.risk_e')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-amber-500">L</td>
                    <td className="py-2">300</td>
                    <td className="py-2">960m</td>
                    <td className="py-2 text-red-600 font-bold">{t('lightpaper.risk_l')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

           {/* Cost Specs */}
           <section className="border-t border-slate-800 pt-6">
            <h2 className="text-sm font-bold text-slate-300 mb-3">{t('lightpaper.cost_list')}</h2>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex justify-between items-center">
                <span>{t('lightpaper.hero_gacha_1')}</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">10,000 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>{t('lightpaper.hero_gacha_3')}</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">50,000 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>{t('lightpaper.equip_gacha_1')}</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">6,000 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>{t('lightpaper.equip_gacha_3')}</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">30,000 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>{t('lightpaper.party_unlock')}</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">100,000 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>{t('lightpaper.potion')}</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">100 $CHH</span>
              </li>
              <li className="flex justify-between items-center">
                <span>{t('lightpaper.elixir')}</span>
                <span className="text-amber-500 font-bold whitespace-nowrap ml-4">500 $CHH</span>
              </li>
            </ul>
          </section>

          <div className="pt-8 text-center">
            <button 
              onClick={onBack}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-600"
            >
              {t('lightpaper.back_home')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightpaperView;
