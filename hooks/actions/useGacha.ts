
import { Dispatch, SetStateAction, useState } from 'react';
import { GameState } from '../../types';
import { rollGachaItem } from '../../services/gachaService';
import { playConfirm, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';
import { getHeroImageUrl } from '../../utils/heroUtils';
import { sdk } from '@farcaster/frame-sdk';
import { createPublicClient, createWalletClient, custom, http, parseAbi, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { CHH_CONTRACT_ADDRESS, GACHA_PAYMENT_CONTRACT_ADDRESS } from '../../constants';

const GACHA_PAYMENT_ABI = parseAbi([
  'function payForGacha(string memory gachaType, uint256 amount) external'
]);

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)'
]);

interface UseGachaProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  farcasterUser?: any;
  refetchBalance: () => Promise<void>;
  t: (key: string, params?: any) => string;
}

export const useGacha = ({ gameState, setGameState, showNotification, farcasterUser, refetchBalance, t }: UseGachaProps) => {
  const [gachaResult, setGachaResult] = useState<{ type: 'Hero' | 'Equipment'; data: any[] } | null>(null);
  const [isGachaRolling, setIsGachaRolling] = useState(false);

  // Helper for on-chain payment
  const handleOnChainPayment = async (gachaType: string, amount: bigint) => {
    if (!farcasterUser?.address) {
      throw new Error("Wallet not connected");
    }

    const provider = sdk.wallet.ethProvider;
    if (!provider) throw new Error("No provider found");

    const publicClient = createPublicClient({
      chain: base,
      transport: http("https://mainnet.base.org")
    });

    const walletClient = createWalletClient({
      chain: base,
      transport: custom(provider)
    });

    const userAddress = farcasterUser.address as `0x${string}`;

    // 1. Check Allowance
    const allowance = await publicClient.readContract({
      address: CHH_CONTRACT_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, GACHA_PAYMENT_CONTRACT_ADDRESS as `0x${string}`]
    });

    if (allowance < amount) {
      showNotification(t('notify.approving_tokens'), 'success');
      const approveHash = await walletClient.writeContract({
        address: CHH_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [GACHA_PAYMENT_CONTRACT_ADDRESS as `0x${string}`, amount],
        account: userAddress
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // 2. Pay for Gacha
    showNotification(t('notify.processing_payment'), 'success');
    const payHash = await walletClient.writeContract({
      address: GACHA_PAYMENT_CONTRACT_ADDRESS as `0x${string}`,
      abi: GACHA_PAYMENT_ABI,
      functionName: 'payForGacha',
      args: [gachaType, amount],
      account: userAddress
    });

    await publicClient.waitForTransactionReceipt({ hash: payHash });
    return payHash;
  };

  // Helper to verify payment on backend
  const verifyPaymentOnBackend = async (txHash: string, tab: string, isTriple: boolean) => {
    const response = await fetch('/api/gacha/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txHash,
        fid: farcasterUser?.fid,
        tab,
        isTriple
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Payment verification failed");
    }
    return response.json();
  };

  // Helper to save to DB (Only used for Equipment or Local Fallback)
  const persistGachaResults = async (tab: 'Hero' | 'Equipment', items: any[]) => {
    if (!farcasterUser?.fid) return items; // Return as is if no user (local mode)

    const fid = farcasterUser.fid;
    const persistedItems = [...items];

    if (tab === 'Hero') {
      // NOTE: This block is now mostly for fallback if RPC wasn't used
      for (let i = 0; i < persistedItems.length; i++) {
        const item = persistedItems[i];
        if (item.isPersisted) continue; // Skip if already saved via RPC

        // 1. Get Master ID
        const { data: masterData } = await supabase.from('quest_hero').select('id').eq('name', item.name).single();
        if (masterData) {
            const { data: inserted, error } = await supabase.from('quest_player_hero').insert({
                fid: fid,
                hero_id: masterData.id,
                hp: item.hp,
                recovery_count: 0
            }).select('player_hid').single();

            if (!error && inserted) {
                // Update the ID to the DB ID
                persistedItems[i].id = inserted.player_hid.toString();
            }
        }
      }
      
      // Update stats only if we did manual inserts (RPC does it internally)
      const manualInserts = persistedItems.filter(i => !i.isPersisted).length;
      if (manualInserts > 0) {
          const { error: statError } = await supabase.rpc('increment_player_stat', { 
              player_fid: fid, 
              column_name: 'gacha_hero_count', 
              amount: manualInserts 
          });
          if (statError) console.error("Stat update error:", statError);
      }

    } else {
      // Equipment Logic
      let manualInsertsCount = 0;

      for (let i = 0; i < persistedItems.length; i++) {
        const item = persistedItems[i];
        if (item.isPersisted) continue; // FIX: Skip if already saved via RPC to prevent duplicates

        const { data: masterData } = await supabase.from('quest_equipment').select('id').eq('name', item.name).single();
        if (masterData) {
            const { data: inserted, error } = await supabase.from('quest_player_equipment').insert({
                fid: fid,
                equipment_id: masterData.id
            }).select('player_eid').single();

            if (!error && inserted) {
                persistedItems[i].id = inserted.player_eid.toString();
                manualInsertsCount++;
            }
        }
      }

      // Update stats only for manual inserts
      if (manualInsertsCount > 0) {
        const { error: statError } = await supabase.rpc('increment_player_stat', { 
            player_fid: fid, 
            column_name: 'gacha_equipment_count', 
            amount: manualInsertsCount 
        });
        if (statError) console.error("Stat update error:", statError);
      }
    }

    return persistedItems;
  };

  const processGachaItems = (tab: 'Hero' | 'Equipment', items: any[]) => {
    setGameState(prev => {
      const next = { ...prev };
      
      if (tab === 'Hero') {
        const newHeroes = items.map(result => {
           const maxHp = result.hp || 50;
           return {
            id: result.id || Math.random().toString(),
            name: result.name,
            species: result.species,
            rarity: result.rarity,
            trait: result.trait,
            damageReduction: result.damageReduction,
            level: 1, 
            hp: maxHp, 
            maxHp: maxHp,
            imageUrl: result.imageUrl || getHeroImageUrl(result.name, 's'),
            equipmentIds: ['', '', ''],
            // Map skills
            skillQuest: result.skillQuest,
            skillDamage: result.skillDamage,
            skillTime: result.skillTime,
            skillType: result.skillType
          };
        });
        next.heroes = [...prev.heroes, ...newHeroes];
      } else {
        const newEquipment = items.map(result => ({
            id: result.id || Math.random().toString(),
            name: result.name,
            type: result.type,
            bonus: result.bonus,
            rarity: result.rarity,
            level: 0
        }));
        next.equipment = [...prev.equipment, ...newEquipment];
      }
      return next;
    });
  };

  const rollGacha = async (tab: 'Hero' | 'Equipment') => {
    const cost = tab === 'Hero' ? 10000 : 6000;
    if (gameState.tokens < cost) {
      playError();
      showNotification(t('notify.insufficient_tokens', { amount: cost.toLocaleString() }), 'error');
      return;
    }
    
    setIsGachaRolling(true);
    try {
      // 1. On-chain Payment
      const amountBigInt = parseUnits(cost.toString(), 18);
      const txHash = await handleOnChainPayment(tab === 'Hero' ? 'HERO_SINGLE' : 'EQUIP_SINGLE', amountBigInt);
      
      // 2. Verify on Backend
      await verifyPaymentOnBackend(txHash, tab, false);

      playConfirm();
      
      // 3. Roll Gacha (RPC handles item grant)
      // NOTE: We pass skipTokenCheck: true if we had a way to tell the RPC to skip it.
      // For now, we assume the RPC might still check tokens, so we might need to update it.
      const result = await rollGachaItem(tab, undefined, farcasterUser?.fid);
      
      // Handle Persistence (Skip if RPC handled it)
      const persisted = await persistGachaResults(tab, [result]);
      
      setGachaResult({ type: tab, data: persisted });
      // Tokens are updated by refetchBalance since they are on-chain
      processGachaItems(tab, persisted);
      
      await refetchBalance();

    } catch (e: any) {
      console.error(e);
      showNotification(t('notify.gacha_error', { message: e.message }), 'error');
    } finally {
      setIsGachaRolling(false);
    }
  };

  const rollGachaTriple = async (tab: 'Hero' | 'Equipment') => {
    const baseCost = tab === 'Hero' ? 10000 : 6000;
    const cost = baseCost * 5; 

    if (gameState.tokens < cost) {
      playError();
      showNotification(t('notify.insufficient_tokens', { amount: cost.toLocaleString() }), 'error');
      return;
    }
    
    setIsGachaRolling(true);

    try {
      // 1. On-chain Payment
      const amountBigInt = parseUnits(cost.toString(), 18);
      const txHash = await handleOnChainPayment(tab === 'Hero' ? 'HERO_TRIPLE' : 'EQUIP_TRIPLE', amountBigInt);
      
      // 2. Verify on Backend
      await verifyPaymentOnBackend(txHash, tab, true);

      playConfirm();

      // 3. Roll Gacha
      const results = await Promise.all([
        rollGachaItem(tab, undefined, farcasterUser?.fid),
        rollGachaItem(tab, undefined, farcasterUser?.fid),
        rollGachaItem(tab, 'R', farcasterUser?.fid) // Guaranteed Slot
      ]);

      const persisted = await persistGachaResults(tab, results);

      setGachaResult({ type: tab, data: persisted });
      processGachaItems(tab, persisted);
      
      await refetchBalance();

    } catch (e: any) {
      console.error(e);
      showNotification(t('notify.gacha_error', { message: e.message }), 'error');
    } finally {
      setIsGachaRolling(false);
    }
  };

  return { 
    gachaResult, 
    setGachaResult, 
    isGachaRolling, 
    rollGacha, 
    rollGachaTriple 
  };
};
