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

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      // Note: With the new contract, the claim function returns the assets directly.
      // However, reading them from transaction logs or just relying on the event is better.
      // For now, we assume the assets are emitted in the event or we can fetch them if needed.
      // Since getUserAssets is gone, we rely on the event or return value if possible.
      // For this implementation, we will return success and let the UI handle the state.
      
      console.log('[useReward] Claim transaction receipt:', receipt);

      return { success: true, txHash };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false, error };
    } finally {
      setIsClaiming(false);
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
