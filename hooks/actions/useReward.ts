import { useState } from 'react';
import { createPublicClient, createWalletClient, custom, http, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import { REWARD_MANAGER_CONTRACT_ADDRESS } from '../../constants';
import { sdk } from '@farcaster/frame-sdk';
import { supabase } from '../../lib/supabase';
import { rollGachaItem } from '../../services/gachaService';

const REWARD_MANAGER_ABI = [
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getUserAssets",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "chhBalance", "type": "uint256" },
          { "internalType": "uint256", "name": "heroCommon", "type": "uint256" },
          { "internalType": "uint256", "name": "heroUncommon", "type": "uint256" },
          { "internalType": "uint256", "name": "heroRare", "type": "uint256" },
          { "internalType": "uint256", "name": "equipCommon", "type": "uint256" },
          { "internalType": "uint256", "name": "equipUncommon", "type": "uint256" },
          { "internalType": "uint256", "name": "equipRare", "type": "uint256" },
          { "internalType": "uint256", "name": "itemPotion", "type": "uint256" },
          { "internalType": "uint256", "name": "itemElixir", "type": "uint256" },
          { "internalType": "uint256", "name": "itemWhetstone", "type": "uint256" }
        ],
        "internalType": "struct RewardManager.UserAssets",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "hasClaimed",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const useReward = () => {
  const [isClaiming, setIsClaiming] = useState(false);

  const checkHasClaimed = async (address: string) => {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });

      const hasClaimed = await publicClient.readContract({
        address: REWARD_MANAGER_CONTRACT_ADDRESS as `0x${string}`,
        abi: REWARD_MANAGER_ABI,
        functionName: 'hasClaimed',
        args: [address as `0x${string}`]
      });

      return hasClaimed as boolean;
    } catch (error) {
      console.error('Error checking hasClaimed:', error);
      return false;
    }
  };

  const claimReward = async (address: string, fid?: number) => {
    try {
      setIsClaiming(true);

      const data = encodeFunctionData({
        abi: REWARD_MANAGER_ABI,
        functionName: 'claim',
        args: []
      });

      if (!sdk.wallet.ethProvider) {
        throw new Error('Wallet provider not found');
      }

      const walletClient = createWalletClient({
        chain: base,
        transport: custom(sdk.wallet.ethProvider)
      });

      const txHash = await walletClient.sendTransaction({
        account: address as `0x${string}`,
        to: REWARD_MANAGER_CONTRACT_ADDRESS as `0x${string}`,
        data: data,
        chain: base
      });

      if (!txHash) {
        throw new Error('Transaction rejected or failed');
      }

      // Wait for transaction to be mined
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

      // Fetch user assets after claiming
      const userAssets = await publicClient.readContract({
        address: REWARD_MANAGER_CONTRACT_ADDRESS as `0x${string}`,
        abi: REWARD_MANAGER_ABI,
        functionName: 'getUserAssets',
        args: [address as `0x${string}`]
      }) as any;

      // Process and save assets to database
      if (userAssets && fid) {
        console.log('[useReward] Processing claimed assets for FID:', fid, userAssets);
        
        // 1. Save Heroes
        const heroPromises: Promise<any>[] = [];
        const addHeroes = (count: number, rarity: 'C' | 'UC' | 'R') => {
          for (let i = 0; i < count; i++) {
            heroPromises.push(rollGachaItem('Hero', rarity, fid));
          }
        };
        addHeroes(Number(userAssets.heroCommon), 'C');
        addHeroes(Number(userAssets.heroUncommon), 'UC');
        addHeroes(Number(userAssets.heroRare), 'R');
        
        // 2. Save Equipment
        const equipPromises: Promise<any>[] = [];
        const addEquips = (count: number, rarity: 'C' | 'UC' | 'R') => {
          for (let i = 0; i < count; i++) {
            equipPromises.push(rollGachaItem('Equipment', rarity, fid));
          }
        };
        addEquips(Number(userAssets.equipCommon), 'C');
        addEquips(Number(userAssets.equipUncommon), 'UC');
        addEquips(Number(userAssets.equipRare), 'R');

        // Wait for all gacha rolls to complete
        const [heroes, equips] = await Promise.all([
          Promise.all(heroPromises),
          Promise.all(equipPromises)
        ]);

        // 3. Save Items (Potions, Elixirs, Whetstones)
        const potionCount = Number(userAssets.itemPotion);
        const elixirCount = Number(userAssets.itemElixir);
        const whetstoneCount = Number(userAssets.itemWhetstone);

        if (potionCount > 0 || elixirCount > 0 || whetstoneCount > 0) {
          // Fetch current stats to increment
          const { data: currentStats } = await supabase
            .from('quest_player_stats')
            .select('item01, item02, item03')
            .eq('fid', fid)
            .single();

          const currentPotion = currentStats?.item01 || 0;
          const currentElixir = currentStats?.item02 || 0;
          const currentWhetstone = currentStats?.item03 || 0;

          await supabase
            .from('quest_player_stats')
            .upsert({
              fid: fid,
              item01: currentPotion + potionCount,
              item02: currentElixir + elixirCount,
              item03: currentWhetstone + whetstoneCount
            }, { onConflict: 'fid' });
        }
        
        console.log('[useReward] Successfully saved claimed assets to DB.');
      }

      return { success: true, txHash, assets: userAssets };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false, error };
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    isClaiming,
    checkHasClaimed,
    claimReward
  };
};
