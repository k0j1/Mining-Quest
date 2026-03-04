import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 簡易的な翻訳辞書
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    
    // BottomNav
    'nav.home': 'HOME',
    'nav.party': 'PARTY',
    'nav.gacha': 'GACHA',
    'nav.shop': 'SHOP',
    
    // Header
    'header.title': 'Crypto Hero Hunter',
    'header.reload': 'Reload',
    
    // AccountModal
    'account.title': 'User Info',
    'account.language': 'Language',
    'account.lang.en': 'English',
    'account.lang.ja': '日本語',
    'account.logout': 'Logout',
    'account.balance': 'Balance',
    
    // DepartView
    'depart.title': 'QUEST',
    'depart.select_diff': 'Select difficulty to depart',
    'depart.loading': 'Loading Quests...',
    'depart.time': 'TIME',
    'depart.reward': 'Reward',
    'depart.damage': 'Damage',
    'depart.cost': 'Cost',
    'depart.confirm_title': 'Confirm Departure',
    'depart.wipeout_risk': '💀 WIPEOUT RISK',
    'depart.death_risk': '⚠️ DEATH RISK',
    'depart.target_dest': 'Target Destination',
    'depart.rank': 'RANK',
    'depart.mission_forecast': 'Mission Forecast',
    'depart.high_mortality': 'HIGH MORTALITY',
    'depart.caution': 'CAUTION',
    'depart.reward_forecast': 'Reward Forecast',
    'depart.damage_forecast': 'Damage Forecast by Hero',
    'depart.duration_forecast': 'Duration (Speed Bonus)',
    'depart.select_party': 'SELECT PARTY',
    'depart.party': 'Party',
    'depart.questing': 'Questing',
    'depart.not_enough_members': 'Not enough members',
    'depart.need_3_heroes': '3 heroes are required for a quest',
    'depart.party_questing': 'This party is currently questing',
    'depart.select_another_party': 'Please select another party',
    'depart.dead_hero_warning': '⚠️ There is a hero with 0 HP! Cannot depart.',
    'depart.cancel': 'Cancel',
    'depart.processing': 'Processing...',
    'depart.insufficient_funds': 'Insufficient Funds',
    'depart.force_depart': 'Force Depart (DANGER)',
    'depart.depart_btn': 'Depart',
    
    // PartyView
    'party.title': 'PARTY',
    'party.save': 'SAVE',
    'party.lock': 'LOCK',
    'party.team_status': 'Team Status',
    'party.reward': 'Reward',
    'party.speed': 'Speed',
    'party.show_details': 'Show Detailed Status',
    'party.barracks': 'Barracks',
    'party.select_hero_for_slot': 'Select Hero for Slot',
    'party.sort_rarity': 'Rarity',
    'party.sort_hp_asc': 'HP Low',
    'party.sort_hp_desc': 'HP High',
    'party.no_heroes': 'NO HEROES IN BARRACKS',
    'party.no_match': 'NO HEROES MATCH FILTER',
    'party.deploy_party': 'DEPLOY PARTY',
    'party.cost': 'Cost',
    'party.cancel': 'Cancel',
    'party.unlock': 'Unlock',
    'party.insufficient': 'Insufficient',
    'party.team_defense': 'Team Defense',
    'party.team_defense_desc1': '*Applies damage reduction to the entire team.',
    'party.team_defense_desc2': 'Individual equipment (Helmet) effects are not included here.',
    
    // GachaView
    'gacha.title': 'SUMMON',
    'gacha.hero': 'Hero',
    'gacha.equipment': 'Equipment',
    'gacha.list': 'List',
    'gacha.connecting': 'CONNECTING...',
    'gacha.hero_summon': 'Hero Summon',
    'gacha.equip_forge': 'Equipment Forge',
    'gacha.single_pull': '1x Summon',
    'gacha.triple_pull': '3x Summon',
    'gacha.guaranteed_r': '1x R+ Guaranteed',
    'gacha.rates': 'Drop Rates:',
    'gacha.no_image': 'NO IMAGE',
    'gacha.hero_list_title': 'Hero Drop Rates',
    'gacha.equip_list_title': 'Equipment Drop Rates',
    'gacha.loading': 'Loading...',
    'gacha.no_hero_data': 'No hero data found in database.',
    'gacha.no_equip_data': 'No equipment data found in database.',
    'gacha.tap_to_close': 'TAP TO CLOSE',
    'gacha.single': '1x SUMMON',
    'gacha.multi': '10x SUMMON',
    
    // RecoveryView
    'recovery.title': 'RECOVERY',
    'recovery.shop_inventory': 'Shop & Inventory',
    'recovery.potion': 'Potion (+10 HP)',
    'recovery.elixir': 'Elixir (Full Heal)',
    'recovery.owned': 'Owned:',
    'recovery.buy_bulk': 'Buy Bulk',
    'recovery.select_items': 'Select items to buy',
    'recovery.party': 'Party',
    'recovery.standby': 'Standby (HP Low→High)',
    'recovery.no_heroes': 'NO HEROES',
    'recovery.mission': 'MISSION',
    'recovery.use': 'USE',
    
    // StatusBoard
    'status.expected_reward': 'Expected Reward:',
    'status.status': 'Status',
    'status.completed': 'Completed',
    'status.time_left': 'Time Left',
    'status.view_lightpaper': 'View Lightpaper',
    'status.add_app': 'Add App',
    'status.ongoing_quests': 'Ongoing Quests',
    'status.in_progress': 'In Progress',
    'status.waiting_quest': 'Waiting for Quest',
    'status.tactical_teams': 'Tactical Teams',
    'status.party': 'PARTY',
    'status.questing': 'Questing',
    'status.return_btn': 'Collect Reward & Return',
    
    // ResultModal
    'result.get_reward': 'GET REWARD',
    'result.mission_accomplished': 'Mission Accomplished',
    'result.view_tx': 'View Transaction on BaseScan',
    'result.close': 'CLOSE',
    'result.mission_complete': 'MISSION COMPLETE',
    'result.quest_report': 'Quest Report',
    'result.claimed': 'CLAIMED',
    'result.processing': 'PROCESSING...',
    'result.error': 'ERROR',
    'result.base_reward': 'Base Reward:',
    'result.total_bonus': 'Total Bonus:',
    'result.hero_trait': '└ Hero Trait',
    'result.equip_effect': '└ Equip Effect',
    'result.total_earnings': 'Total Earnings',
    'result.claim_error': 'CLAIM ERROR',
    'result.copied': 'COPIED!',
    'result.copy': 'COPY',
    'result.all_claimed': 'ALL CLAIMED',
    'result.claim_reward': 'Claim Reward',
    'result.remaining': 'Remaining',
    
    // LightpaperView
    'lightpaper.title': 'Lightpaper',
    'lightpaper.intro': 'Mining Quest is a high-risk, high-return idle RPG where you lead animal heroes on grueling mining missions. Use the tokens ($CHH) you earn to strengthen your troops and aim for deeper abysses.',
    'lightpaper.core_loop': 'Core Loop',
    'lightpaper.step1': 'PARTY: Select heroes and equip them.',
    'lightpaper.step2': 'QUEST: Select difficulty and dispatch to mine (consumes $CHH).',
    'lightpaper.step3': 'WAIT: Wait until return time (progresses even when app is closed).',
    'lightpaper.step4': 'RESULT: Claim quest rewards.',
    'lightpaper.step5': 'HEAL: Heal if damaged.',
    'lightpaper.step6': 'GACHA: Recruit new forces with earned $CHH.',
    'lightpaper.heroes': 'Heroes & Stats',
    'lightpaper.hero_desc1': 'Heroes are the main characters of mining. If HP reaches 0, the hero is lost (deleted).',
    'lightpaper.wipeout_rule': 'WIPEOUT RULE:',
    'lightpaper.wipeout_desc': 'If all heroes participating in a quest die (HP 0), the quest is considered a failure and no rewards are obtained.',
    'lightpaper.rarity': 'Rarity: C / UC / R / E / L (L is highest)',
    'lightpaper.equip_slots': 'Equip Slots: All heroes can equip 3 items (Pickaxe, Helmet, Boots).',
    'lightpaper.skills': 'Skills (Traits): Each hero has unique abilities that increase rewards or reduce damage when conditions are met.',
    'lightpaper.hp': 'HP: Higher rarity means higher max HP.',
    'lightpaper.equip_effects': 'Equipment Effects',
    'lightpaper.pickaxe': 'Pickaxe',
    'lightpaper.pickaxe_desc': 'Increases earned rewards ($CHH). The total value of the entire party is applied.',
    'lightpaper.helmet': 'Helmet',
    'lightpaper.helmet_desc': 'Reduces damage taken by the equipped hero. Increases individual survival rate.',
    'lightpaper.boots': 'Boots',
    'lightpaper.boots_desc': 'Increases mining speed. Example: +100% speed halves the required time.',
    'lightpaper.quest_ranks': 'Quest Ranks',
    'lightpaper.rank': 'Rank',
    'lightpaper.cost': 'Cost',
    'lightpaper.base_time': 'Base Time',
    'lightpaper.risk': 'Risk',
    'lightpaper.risk_c': 'Very Low',
    'lightpaper.risk_uc': 'Low',
    'lightpaper.risk_r': 'Medium',
    'lightpaper.risk_e': 'High (Heavy Damage)',
    'lightpaper.risk_l': 'Instant Death Possible',
    'lightpaper.cost_list': 'Cost List',
    'lightpaper.hero_gacha_1': 'Hero Gacha (1x)',
    'lightpaper.hero_gacha_3': 'Hero Gacha (3x / R+ Guaranteed)',
    'lightpaper.equip_gacha_1': 'Equip Gacha (1x)',
    'lightpaper.equip_gacha_3': 'Equip Gacha (3x / R+ Guaranteed)',
    'lightpaper.party_unlock': 'Party Slot Unlock',
    'lightpaper.potion': 'Potion (+10HP)',
    'lightpaper.elixir': 'Elixir (MaxHP)',
    'lightpaper.back_home': 'Back to Home',
    
    // ShopView
    'shop.title': 'ITEM SHOP',
    'shop.buy': 'BUY',
  },
  ja: {
    // Common
    'common.close': '閉じる',
    'common.cancel': 'キャンセル',
    'common.confirm': '確認',
    'common.back': '戻る',
    'common.loading': '読み込み中...',
    
    // BottomNav (常に英語にするため、ここは英語のままか、使用しない)
    'nav.home': 'HOME',
    'nav.party': 'PARTY',
    'nav.gacha': 'GACHA',
    'nav.shop': 'SHOP',
    
    // Header
    'header.title': 'Crypto Hero Hunter',
    'header.reload': '再読み込み',
    
    // AccountModal
    'account.title': 'ユーザー情報',
    'account.language': '言語設定',
    'account.lang.en': 'English',
    'account.lang.ja': '日本語',
    'account.logout': 'ログアウト',
    'account.balance': '残高',
    
    // DepartView
    'depart.title': 'クエスト',
    'depart.select_diff': '難易度を選択してクエストに出発します',
    'depart.loading': 'クエスト読み込み中...',
    'depart.time': '時間',
    'depart.reward': '報酬',
    'depart.damage': 'ダメージ',
    'depart.cost': 'コスト',
    'depart.confirm_title': '出撃確認',
    'depart.wipeout_risk': '💀 全滅の危険',
    'depart.death_risk': '⚠️ 死亡の危険',
    'depart.target_dest': '目的地',
    'depart.rank': 'ランク',
    'depart.mission_forecast': 'ミッション予測',
    'depart.high_mortality': '死亡率高',
    'depart.caution': '注意',
    'depart.reward_forecast': '報酬予測',
    'depart.damage_forecast': 'ヒーロー別 被ダメージ予測',
    'depart.duration_forecast': '所要時間 (速度上昇)',
    'depart.select_party': 'パーティ選択',
    'depart.party': 'パーティ',
    'depart.questing': '任務中',
    'depart.not_enough_members': 'メンバーが足りません',
    'depart.need_3_heroes': 'クエストには3名のヒーローが必要です',
    'depart.party_questing': 'このパーティは任務中です',
    'depart.select_another_party': '別のパーティを選択してください',
    'depart.dead_hero_warning': '⚠️ HPが0のヒーローがいます！出発できません。',
    'depart.cancel': 'キャンセル',
    'depart.processing': '処理中...',
    'depart.insufficient_funds': '資金不足',
    'depart.force_depart': '強行突破する (DANGER)',
    'depart.depart_btn': '出発する',
    
    // PartyView
    'party.title': 'パーティ編成',
    'party.save': '保存',
    'party.lock': '未解放',
    'party.team_status': 'チームステータス',
    'party.reward': '報酬',
    'party.speed': '速度',
    'party.show_details': '詳細ステータスを表示',
    'party.barracks': '兵舎',
    'party.select_hero_for_slot': 'スロットのヒーローを選択',
    'party.sort_rarity': 'レア度順',
    'party.sort_hp_asc': 'HP低い順',
    'party.sort_hp_desc': 'HP高い順',
    'party.no_heroes': '兵舎にヒーローがいません',
    'party.no_match': '条件に一致するヒーローがいません',
    'party.deploy_party': 'パーティ解放',
    'party.cost': 'コスト',
    'party.cancel': 'キャンセル',
    'party.unlock': '解放する',
    'party.insufficient': '不足',
    'party.team_defense': 'チーム防御',
    'party.team_defense_desc1': '*チーム全体に適用されるダメージ軽減効果です。',
    'party.team_defense_desc2': '個別の装備(Helmet)効果はここには含まれません。',
    
    // GachaView
    'gacha.title': '召喚',
    'gacha.hero': 'ヒーロー',
    'gacha.equipment': '装備品',
    'gacha.list': '一覧',
    'gacha.connecting': '通信中...',
    'gacha.hero_summon': 'ヒーロー召喚',
    'gacha.equip_forge': '装備品作成',
    'gacha.single_pull': '1回ガチャ',
    'gacha.triple_pull': '3連ガチャ',
    'gacha.guaranteed_r': 'R以上1枠確定',
    'gacha.rates': '提供割合:',
    'gacha.no_image': 'NO IMAGE',
    'gacha.hero_list_title': '排出ヒーロー一覧',
    'gacha.equip_list_title': '排出装備一覧',
    'gacha.loading': '読み込み中...',
    'gacha.no_hero_data': 'ヒーローデータが見つかりません。',
    'gacha.no_equip_data': '装備データが見つかりません。',
    'gacha.tap_to_close': 'タップして閉じる',
    'gacha.single': '1回召喚',
    'gacha.multi': '10回召喚',
    
    // RecoveryView
    'recovery.title': '回復',
    'recovery.shop_inventory': 'ショップ＆インベントリ',
    'recovery.potion': 'ポーション (+10 HP)',
    'recovery.elixir': 'エリクサー (全回復)',
    'recovery.owned': '所持:',
    'recovery.buy_bulk': 'まとめて購入',
    'recovery.select_items': '購入するアイテムを選択',
    'recovery.party': 'パーティ',
    'recovery.standby': '待機中 (HP低い順)',
    'recovery.no_heroes': 'ヒーローがいません',
    'recovery.mission': '任務中',
    'recovery.use': '使用',
    
    // StatusBoard
    'status.expected_reward': '予想報酬:',
    'status.status': 'ステータス',
    'status.completed': '完了',
    'status.time_left': '残り時間',
    'status.view_lightpaper': 'ライトペーパーを見る',
    'status.add_app': 'アプリを登録',
    'status.ongoing_quests': '進行中のクエスト',
    'status.in_progress': '進行中',
    'status.waiting_quest': 'クエスト待機中',
    'status.tactical_teams': '編成済みパーティ',
    'status.party': 'パーティ',
    'status.questing': '任務中',
    'status.return_btn': '報酬を回収して帰還',
    
    // ResultModal
    'result.get_reward': '報酬獲得',
    'result.mission_accomplished': 'ミッション完了',
    'result.view_tx': 'BaseScanでトランザクションを見る',
    'result.close': '確認 (閉じる)',
    'result.mission_complete': 'ミッション完了',
    'result.quest_report': 'クエストレポート',
    'result.claimed': '獲得済み',
    'result.processing': '処理中...',
    'result.error': 'エラー',
    'result.base_reward': '基本報酬:',
    'result.total_bonus': 'ボーナス合計:',
    'result.hero_trait': '└ ヒーロー特性',
    'result.equip_effect': '└ 装備品効果',
    'result.total_earnings': '合計獲得報酬',
    'result.claim_error': '獲得エラー',
    'result.copied': 'コピーしました!',
    'result.copy': 'コピー',
    'result.all_claimed': '全て獲得済み',
    'result.claim_reward': '報酬を受け取る',
    'result.remaining': '残り',
    
    // LightpaperView
    'lightpaper.title': 'ライトペーパー',
    'lightpaper.intro': 'Mining Questは、動物のヒーローたちを率いて過酷な採掘任務に挑む、ハイリスク・ハイリターンな放置型RPGです。獲得したトークン($CHH)を使用して部隊を強化し、さらなる深淵を目指してください。',
    'lightpaper.core_loop': 'ゲームサイクル',
    'lightpaper.step1': 'PARTY (編成): ヒーローを選び、装備を整える',
    'lightpaper.step2': 'QUEST (出発): 難易度を選んで採掘へ派遣（$CHHを消費）',
    'lightpaper.step3': '待機: 帰還時間まで待つ（アプリを閉じても進行します）',
    'lightpaper.step4': 'RESULT (帰還): クエスト報酬を獲得',
    'lightpaper.step5': 'HEAL (回復): ダメージを受けた場合は回復',
    'lightpaper.step6': 'GACHA (強化): 獲得した$CHHで新戦力を補充',
    'lightpaper.heroes': 'ヒーローとステータス',
    'lightpaper.hero_desc1': 'ヒーローは採掘の主役です。HPが0になるとヒーローはロスト（消滅）します。',
    'lightpaper.wipeout_rule': 'WIPEOUT RULE:',
    'lightpaper.wipeout_desc': 'クエストに参加したヒーローが全員死亡（HP 0）した場合、クエストは失敗扱いとなり、報酬は一切得られません。',
    'lightpaper.rarity': 'レアリティ: C / UC / R / E / L (Lが最高)',
    'lightpaper.equip_slots': '装備スロット: 全てのヒーローが3枠 (Pickaxe, Helmet, Boots) を装備可能です。',
    'lightpaper.skills': 'スキル (特性): 各ヒーローは固有の能力を持ち、条件を満たすと報酬アップやダメージ軽減などの効果を発揮します。',
    'lightpaper.hp': 'HP: レアリティが高いほど最大HPが高く設定されています。',
    'lightpaper.equip_effects': '装備品の効果',
    'lightpaper.pickaxe': '⛏️ ピッケル (Pickaxe)',
    'lightpaper.pickaxe_desc': '獲得報酬($CHH)が増加します。パーティ全員の合計値が適用されます。',
    'lightpaper.helmet': '🪖 ヘルメット (Helmet)',
    'lightpaper.helmet_desc': '装備したヒーローの被ダメージを軽減します。個人の生存率を高めます。',
    'lightpaper.boots': '👢 ブーツ (Boots)',
    'lightpaper.boots_desc': '採掘速度を上昇させます。例: 速度+100%なら、所要時間は半分になります。',
    'lightpaper.quest_ranks': 'クエストランク',
    'lightpaper.rank': 'Rank',
    'lightpaper.cost': 'Cost',
    'lightpaper.base_time': 'Base Time',
    'lightpaper.risk': 'Risk',
    'lightpaper.risk_c': 'とても低い',
    'lightpaper.risk_uc': '低',
    'lightpaper.risk_r': '中',
    'lightpaper.risk_e': '高 (大ダメージ)',
    'lightpaper.risk_l': '一撃死亡有り',
    'lightpaper.cost_list': 'コスト一覧',
    'lightpaper.hero_gacha_1': 'ヒーローガチャ (1回)',
    'lightpaper.hero_gacha_3': 'ヒーローガチャ (3連/R以上確定)',
    'lightpaper.equip_gacha_1': '装備品ガチャ (1回)',
    'lightpaper.equip_gacha_3': '装備品ガチャ (3連/R以上確定)',
    'lightpaper.party_unlock': 'パーティ枠解放',
    'lightpaper.potion': 'ポーション (+10HP)',
    'lightpaper.elixir': 'エリクサー (MaxHP)',
    'lightpaper.back_home': 'ホームに戻る',
    
    // ShopView
    'shop.title': 'アイテムショップ',
    'shop.buy': '購入',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ja')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
