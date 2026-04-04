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
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "previewClaimAmount",
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
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getClaimStatus",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const useReward = () => {
  const [isClaiming, setIsClaiming] = useState(false);

  const checkGetClaimStatus = async (address: string) => {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });

      const isClaimed = await publicClient.readContract({
        address: REWARD_MANAGER_CONTRACT_ADDRESS as `0x${string}`,
        abi: REWARD_MANAGER_ABI,
        functionName: 'getClaimStatus',
        args: [address as `0x${string}`]
      });

      return isClaimed as boolean;
    } catch (error) {
      console.error('Error checking getClaimStatus:', error);
      return false;
    }
  };

  const claimReward = async (address: string, fid?: number) => {
    try {
      setIsClaiming(true);

      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });

      const { request, result } = await publicClient.simulateContract({
        address: REWARD_MANAGER_CONTRACT_ADDRESS as `0x${string}`,
        abi: REWARD_MANAGER_ABI,
        functionName: 'claim',
        account: address as `0x${string}`
      });

      if (!sdk.wallet.ethProvider) {
        throw new Error('Wallet provider not found');
      }

      const walletClient = createWalletClient({
        chain: base,
        transport: custom(sdk.wallet.ethProvider)
      });

      const txHash = await walletClient.writeContract(request);

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      console.log('[useReward] Claim transaction receipt:', receipt);

      // Process claimed assets if fid is provided
      let generatedItems: any[] = [];
      if (fid && result) {
        generatedItems = await processClaimedAssets(fid, result as any);
      }

      return { success: true, txHash, assets: result, generatedItems };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false, error };
    } finally {
      setIsClaiming(false);
    }
  };

  const processClaimedAssets = async (fid: number, assets: any) => {
    try {
      console.log('[useReward] Processing claimed assets for FID:', fid, assets);
      
      // 1. Generate Heroes
      const heroPromises: Promise<any>[] = [];
      const addHeroes = (count: number, rarity: string) => {
        for (let i = 0; i < count; i++) {
          heroPromises.push(rollGachaItem('Hero', rarity as any, fid, true));
        }
      };
      
      addHeroes(Number(assets.heroCommon), 'C');
      addHeroes(Number(assets.heroUncommon), 'UC');
      addHeroes(Number(assets.heroRare), 'R');
      
      const generatedHeroes = await Promise.all(heroPromises);

      // 2. Generate Equipment
      const equipPromises: Promise<any>[] = [];
      const addEquips = (count: number, rarity: string) => {
        for (let i = 0; i < count; i++) {
          equipPromises.push(rollGachaItem('Equipment', rarity as any, fid, true));
        }
      };
      
      addEquips(Number(assets.equipCommon), 'C');
      addEquips(Number(assets.equipUncommon), 'UC');
      addEquips(Number(assets.equipRare), 'R');
      
      const generatedEquips = await Promise.all(equipPromises);

      // 3. Update Items
      const potionCount = Number(assets.itemPotion);
      const elixirCount = Number(assets.itemElixir);
      const whetstoneCount = Number(assets.itemWhetstone);

      console.log(`[useReward] Processing items: Potion=${potionCount}, Elixir=${elixirCount}, Whetstone=${whetstoneCount}`);

      if (potionCount > 0 || elixirCount > 0 || whetstoneCount > 0) {
        const { data: stats, error: fetchError } = await supabase
          .from('quest_player_stats')
          .select('item01, item02, item03')
          .eq('fid', fid)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[useReward] Error fetching player stats:', fetchError);
        }

        const currentItem01 = stats?.item01 || 0;
        const currentItem02 = stats?.item02 || 0;
        const currentItem03 = stats?.item03 || 0;

        const { error: upsertError } = await supabase
          .from('quest_player_stats')
          .upsert({
            fid: fid,
            item01: currentItem01 + potionCount,
            item02: currentItem02 + elixirCount,
            item03: currentItem03 + whetstoneCount
          }, { onConflict: 'fid' });

        if (upsertError) {
          console.error('[useReward] Error upserting player stats:', upsertError);
        } else {
          console.log('[useReward] Successfully updated player stats items');
        }
      }

      // 4. Save Heroes
      for (const hero of generatedHeroes) {
        const { data: masterData } = await supabase.from('quest_hero').select('id').eq('name', hero.name).single();
        if (masterData) {
          await supabase.from('quest_player_hero').insert({
            fid: fid,
            hero_id: masterData.id,
            hp: hero.hp,
            recovery_count: 0
          });
        }
      }
      if (generatedHeroes.length > 0) {
          await supabase.rpc('increment_player_stat', { 
              player_fid: fid, 
              column_name: 'gacha_hero_count', 
              amount: generatedHeroes.length 
          });
      }

      // 5. Save Equipment
      for (const equip of generatedEquips) {
        const { data: masterData } = await supabase.from('quest_equipment').select('id').eq('name', equip.name).single();
        if (masterData) {
          await supabase.from('quest_player_equipment').insert({
            fid: fid,
            equipment_id: masterData.id,
            durability: 10
          });
        }
      }
      if (generatedEquips.length > 0) {
          await supabase.rpc('increment_player_stat', { 
              player_fid: fid, 
              column_name: 'gacha_equipment_count', 
              amount: generatedEquips.length 
          });
      }
      
      console.log('[useReward] Successfully processed claimed assets');
      return [...generatedHeroes, ...generatedEquips];
    } catch (error) {
      console.error('[useReward] Error processing claimed assets:', error);
      return [];
    }
  };

  const getPreviewClaimAmount = async (address: string) => {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });

      const assets = await publicClient.readContract({
        address: REWARD_MANAGER_CONTRACT_ADDRESS as `0x${string}`,
        abi: REWARD_MANAGER_ABI,
        functionName: 'previewClaimAmount',
        args: [address as `0x${string}`]
      });

      return assets;
    } catch (error) {
      console.error('Error previewing claim amount:', error);
      return null;
    }
  };

  return {
    isClaiming,
    checkGetClaimStatus,
    getPreviewClaimAmount,
    claimReward
  };
};
