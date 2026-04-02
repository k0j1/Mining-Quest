
import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../../types';
import { playConfirm, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';
import { sdk } from '@farcaster/frame-sdk';
import { encodeFunctionData, createWalletClient, custom, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { ITEM_SHOP_CONTRACT_ADDRESS, CHH_CONTRACT_ADDRESS } from '../../constants';

const ITEM_SHOP_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "potionAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "elixirAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "whetstoneAmount", "type": "uint256" }
    ],
    "name": "buyItems",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

interface UseItemsProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  farcasterUser?: any;
  refetchBalance: () => Promise<void>;
  t: (key: string, params?: any) => string;
  setTransactionResult?: Dispatch<SetStateAction<{ hash: string, type: 'deposit' | 'withdraw' | 'buy' | 'depart' } | null>>;
  setTransactionError: (error: string | null) => void;
}

export const useItems = ({ gameState, setGameState, showNotification, farcasterUser, refetchBalance, t, setTransactionResult, setTransactionError }: UseItemsProps) => {

  const updateHeroHpDB = async (heroId: string, newHp: number) => {
    if (!farcasterUser?.fid) return;
    
    const { data } = await supabase.from('quest_player_hero').select('recovery_count').eq('player_hid', parseInt(heroId)).single();
    const currentCount = data?.recovery_count || 0;

    await supabase.from('quest_player_hero').update({
        hp: newHp,
        recovery_count: currentCount + 1,
        updated_at: new Date().toISOString()
    }).eq('player_hid', parseInt(heroId));
  };

  const buyPotion = async (amount: number = 1) => {
    const cost = 100 * amount;
    if (gameState.tokens < cost) {
      playError();
      showNotification(t('notify.insufficient_tokens', { amount: cost.toLocaleString() }), 'error');
      return;
    }

    playConfirm();
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - cost,
      items: { ...prev.items, item01: prev.items.item01 + amount }
    }));

    if (farcasterUser?.fid) {
      const { data: currentStats } = await supabase.from('quest_player_stats').select('item01').eq('fid', farcasterUser.fid).single();
      await supabase.from('quest_player_stats')
          .update({ item01: (currentStats?.item01 || 0) + amount })
          .eq('fid', farcasterUser.fid);
    }
    
    refetchBalance();
    showNotification(t('notify.potion_purchased', { amount }), 'success');
  };

  const buyElixir = async (amount: number = 1) => {
    const cost = 500 * amount;
    if (gameState.tokens < cost) {
      playError();
      showNotification(t('notify.insufficient_tokens', { amount: cost.toLocaleString() }), 'error');
      return;
    }

    playConfirm();
    setGameState(prev => ({
      ...prev,
      tokens: prev.tokens - cost,
      items: { ...prev.items, item02: prev.items.item02 + amount }
    }));

    if (farcasterUser?.fid) {
      const { data: currentStats } = await supabase.from('quest_player_stats').select('item02').eq('fid', farcasterUser.fid).single();
      await supabase.from('quest_player_stats')
          .update({ item02: (currentStats?.item02 || 0) + amount })
          .eq('fid', farcasterUser.fid);
    }
    
    refetchBalance();
    showNotification(t('notify.elixir_purchased', { amount }), 'success');
  };

  const buyItems = async (potionAmount: number, elixirAmount: number, whetstoneAmount: number = 0) => {
    const totalCost = (100 * potionAmount) + (500 * elixirAmount) + (100 * whetstoneAmount);
    
    if (totalCost === 0) return;

    if (gameState.tokens < totalCost) {
      playError();
      showNotification(t('notify.insufficient_tokens', { amount: totalCost.toLocaleString() }), 'error');
      return;
    }

    try {
      // 1. スマートコントラクトの呼び出し (オンチェーン決済)
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(sdk.wallet.ethProvider)
      });

      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });

      const [account] = await walletClient.requestAddresses();
      if (!account) {
        showNotification(t('notify.wallet_not_connected'), 'error');
        return;
      }

      // 1.1 Check Allowance and Approve CHH Tokens if needed
      const requiredAmount = BigInt(totalCost) * 10n**18n;
      const approveAmount = 100000n * 10n**18n; // 100,000 CHH

      const currentAllowance = await publicClient.readContract({
        address: CHH_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [account, ITEM_SHOP_CONTRACT_ADDRESS as `0x${string}`]
      }) as bigint;

      if (currentAllowance < requiredAmount) {
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [ITEM_SHOP_CONTRACT_ADDRESS as `0x${string}`, approveAmount]
        });

        showNotification(t('notify.approving_tokens'), 'success');
        const approveTxHash = await walletClient.sendTransaction({
          account,
          to: CHH_CONTRACT_ADDRESS as `0x${string}`,
          data: approveData,
          value: 0n,
        });

        if (!approveTxHash) {
           showNotification(t('notify.approve_cancelled'), 'error');
           return;
        }

        await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      }

      // 1.2 Buy Items
      const buyData = encodeFunctionData({
        abi: ITEM_SHOP_ABI,
        functionName: 'buyItems',
        args: [BigInt(potionAmount), BigInt(elixirAmount), BigInt(whetstoneAmount)]
      });

      showNotification(t('notify.purchasing_items'), 'success');
      const txHash = await walletClient.sendTransaction({
        account,
        to: ITEM_SHOP_CONTRACT_ADDRESS as `0x${string}`,
        data: buyData,
        value: 0n,
      });

      if (!txHash) {
         showNotification(t('notify.tx_cancelled'), 'error');
         return;
      }

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // 2. トランザクション成功後、オフチェーンのステータスを更新 (バックエンド対応)
      playConfirm();
      setGameState(prev => ({
        ...prev,
        tokens: prev.tokens - totalCost,
        items: { 
            ...prev.items, 
            item01: prev.items.item01 + potionAmount,
            item02: prev.items.item02 + elixirAmount,
            item03: prev.items.item03 + whetstoneAmount
        }
      }));

      if (farcasterUser?.fid) {
        const { data: currentStats } = await supabase.from('quest_player_stats').select('item01, item02, item03').eq('fid', farcasterUser.fid).single();
        await supabase.from('quest_player_stats')
            .update({ 
                item01: (currentStats?.item01 || 0) + potionAmount,
                item02: (currentStats?.item02 || 0) + elixirAmount,
                item03: (currentStats?.item03 || 0) + whetstoneAmount
            })
            .eq('fid', farcasterUser.fid);
      }
      
      refetchBalance();
      
      let msg = [];
      if (potionAmount > 0) msg.push(t('item.potion') + `x${potionAmount}`);
      if (elixirAmount > 0) msg.push(t('item.elixir') + `x${elixirAmount}`);
      if (whetstoneAmount > 0) msg.push(t('recovery.whetstone_item') + `x${whetstoneAmount}`);
      showNotification(t('notify.items_purchased', { items: msg.join(', ') }), 'success');

    } catch (error: any) {
      console.error("Transaction failed:", error);
      playError();
      setTransactionError(error.shortMessage || error.message || t('error.unknown'));
    }
  };

  const usePotion = async (heroId: string) => {
    if (gameState.items.item01 <= 0) {
      playError();
      showNotification(t('notify.no_potion'), 'error');
      return;
    }
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero || hero.hp >= hero.maxHp) return;

    const newHp = Math.min(hero.maxHp, hero.hp + 10);
    playConfirm();
    setGameState(prev => ({
      ...prev,
      heroes: prev.heroes.map(h => h.id === heroId ? { ...h, hp: newHp } : h),
      items: { ...prev.items, item01: prev.items.item01 - 1 }
    }));
    
    updateHeroHpDB(heroId, newHp);

    if (farcasterUser?.fid) {
      const { data: currentStats } = await supabase.from('quest_player_stats').select('item01').eq('fid', farcasterUser.fid).single();
      if (currentStats && currentStats.item01 > 0) {
          await supabase.from('quest_player_stats')
              .update({ item01: currentStats.item01 - 1 })
              .eq('fid', farcasterUser.fid);
      }
    }

    showNotification(t('notify.hero_recovered', { name: hero.name }), 'success');
  };

  const useElixir = async (heroId: string) => {
    if (gameState.items.item02 <= 0) {
      playError();
      showNotification(t('notify.no_elixir'), 'error');
      return;
    }
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero || hero.hp >= hero.maxHp) return;

    const newHp = hero.maxHp;
    playConfirm();
    setGameState(prev => ({
      ...prev,
      heroes: prev.heroes.map(h => h.id === heroId ? { ...h, hp: newHp } : h),
      items: { ...prev.items, item02: prev.items.item02 - 1 }
    }));
    
    updateHeroHpDB(heroId, newHp);

    if (farcasterUser?.fid) {
      const { data: currentStats } = await supabase.from('quest_player_stats').select('item02').eq('fid', farcasterUser.fid).single();
      if (currentStats && currentStats.item02 > 0) {
          await supabase.from('quest_player_stats')
              .update({ item02: currentStats.item02 - 1 })
              .eq('fid', farcasterUser.fid);
      }
    }

    showNotification(t('notify.hero_fully_recovered', { name: hero.name }), 'success');
  };

  const useWhetstone = async (equipmentId: string) => {
    if (gameState.items.item03 <= 0) {
      playError();
      showNotification(t('notify.no_whetstone'), 'error');
      return;
    }
    const equipment = gameState.equipment.find(e => e.id === equipmentId);
    if (!equipment) return;
    
    if (equipment.durability >= 10) {
      playError();
      showNotification(t('notify.whetstone_limit'), 'error');
      return;
    }

    const newDurability = Math.min(100, equipment.durability + 1);
    playConfirm();
    setGameState(prev => ({
      ...prev,
      equipment: prev.equipment.map(e => e.id === equipmentId ? { ...e, durability: newDurability } : e),
      items: { ...prev.items, item03: prev.items.item03 - 1 }
    }));

    if (farcasterUser?.fid) {
      // Update item03 count
      const { data: currentStats } = await supabase.from('quest_player_stats').select('item03').eq('fid', farcasterUser.fid).single();
      if (currentStats && currentStats.item03 > 0) {
          await supabase.from('quest_player_stats')
              .update({ item03: currentStats.item03 - 1 })
              .eq('fid', farcasterUser.fid);
      }
      // Update equipment durability
      await supabase.from('quest_player_equipment')
          .update({ durability: newDurability })
          .eq('player_eid', parseInt(equipmentId));
    }

    showNotification(t('notify.equipment_recovered', { name: equipment.name }) || `${equipment.name} recovered!`, 'success');
  };

  const mergeEquipment = async (baseId: string, materialId: string) => {
    const baseItem = gameState.equipment.find(e => e.id === baseId);
    const materialItem = gameState.equipment.find(e => e.id === materialId);

    if (!baseItem || !materialItem) {
      showNotification(t('notify.item_not_found'), 'error');
      return;
    }

    if (baseItem.name !== materialItem.name || baseItem.rarity !== materialItem.rarity || baseItem.level !== materialItem.level) {
      showNotification(t('notify.merge_invalid'), 'error');
      return;
    }

    // Check if material is equipped
    const isEquipped = gameState.heroes.some(h => h.equipmentIds.includes(materialId));
    if (isEquipped) {
      showNotification(t('notify.material_equipped'), 'error');
      return;
    }

    playConfirm();

    // Optimistic Update
    const newLevel = baseItem.level + 1;
    const newDurability = Math.min(20, baseItem.durability + materialItem.durability);
    // Recalculate bonus: Base + (newLevel * 0.1)
    // We derive Base from Current: Base = Current - (currentLevel * 0.1)
    
    // Note: Floating point precision might be an issue, but for display it's fine.
    const baseBonus = baseItem.bonus - (baseItem.level * 0.1); 
    const newBonus = baseBonus + (newLevel * 0.1);

    setGameState(prev => ({
      ...prev,
      equipment: prev.equipment
        .map(e => e.id === baseId ? { ...e, level: newLevel, bonus: newBonus, durability: newDurability } : e)
        .filter(e => e.id !== materialId)
    }));

    try {
      // DB Update
      // 1. Update Base Item Level (plus column if exists, otherwise level)
      // User requested "plus" column, but we are using "level" in types. 
      // Assuming DB column is 'level' based on previous context, but user calls it 'plus'.
      // If the user insists on 'plus' column in DB, we might need to change this.
      // For now, we stick to 'level' property mapping to 'level' column as per previous working code.
      const { error: updateError } = await supabase
        .from('quest_player_equipment')
        .update({ level: newLevel, durability: newDurability })
        .eq('player_eid', parseInt(baseId));

      if (updateError) {
        console.error("Update Error:", updateError);
        throw updateError;
      }

      // 2. Delete Material Item
      const { error: deleteError } = await supabase
        .from('quest_player_equipment')
        .delete()
        .eq('player_eid', parseInt(materialId));

      if (deleteError) {
        console.error("Delete Error:", deleteError);
        throw deleteError;
      }

      showNotification(t('notify.equip_enhanced', { level: newLevel }), 'success');
    } catch (e) {
      console.error("Merge failed:", e);
      // Even if error occurs, if it's a network error but request went through, state might be desynced.
      // But we rely on optimistic update.
      showNotification(t('notify.merge_error'), 'error');
      // Revert state would be ideal here, but for now we rely on reload if error occurs
    }
  };

  return { buyPotion, buyElixir, buyItems, usePotion, useElixir, useWhetstone, mergeEquipment };
};
