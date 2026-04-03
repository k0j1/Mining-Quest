
import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../../types';
import { playClick, playConfirm, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';
import { sdk } from '@farcaster/frame-sdk';
import { encodeFunctionData, createWalletClient, custom, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { PARTY_UNLOCK_CONTRACT_ADDRESS, CHH_CONTRACT_ADDRESS } from '../../constants';

const PARTY_UNLOCK_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "partyIndex", "type": "uint256" }],
    "name": "unlockParty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

interface UsePartyProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  farcasterUser?: any;
  refetchBalance: () => Promise<void>;
  t: (key: string, params?: any) => string;
}

export const useParty = ({ gameState, setGameState, showNotification, farcasterUser, refetchBalance, t }: UsePartyProps) => {

  const equipItem = async (heroId: string, slotIndex: number, equipmentId: string | null) => {
    playConfirm();
    
    // Update State
    setGameState(prev => ({
      ...prev,
      heroes: prev.heroes.map(h => h.id === heroId ? {
        ...h,
        equipmentIds: h.equipmentIds.map((eid, idx) => idx === slotIndex ? (equipmentId || '') : eid)
      } : h)
    }));

    // Update DB
    if (farcasterUser?.fid) {
      const updateData: any = {};
      if (slotIndex === 0) updateData.pickaxe_player_eid = equipmentId ? parseInt(equipmentId) : null;
      if (slotIndex === 1) updateData.helmet_player_eid = equipmentId ? parseInt(equipmentId) : null;
      if (slotIndex === 2) updateData.boots_player_eid = equipmentId ? parseInt(equipmentId) : null;

      const { error } = await supabase
        .from('quest_player_hero')
        .update(updateData)
        .eq('player_hid', parseInt(heroId))
        .eq('fid', farcasterUser.fid);
        
      if (error) console.error("Equip DB Update Error:", error);
    }
  };

  const switchParty = (index: number) => {
    playClick();
    setGameState(prev => ({ ...prev, activePartyIndex: index }));
  };

  const unlockParty = async (index: number) => {
    const cost = 100000; // 10万 CHH
    if (gameState.tokens < cost) {
      playError();
      showNotification(t('notify.insufficient_tokens', { amount: cost.toLocaleString() }), 'error');
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

      // 1.1 Unlock Party
      const unlockData = encodeFunctionData({
        abi: PARTY_UNLOCK_ABI,
        functionName: 'unlockParty',
        args: [BigInt(index + 1)] // partyIndex is 1-based
      });

      showNotification(t('notify.unlocking_party'), 'success');
      const txHash = await walletClient.sendTransaction({
        account,
        to: PARTY_UNLOCK_CONTRACT_ADDRESS as `0x${string}`,
        data: unlockData,
        value: 0n,
      });

      if (!txHash) {
          showNotification(t('notify.tx_cancelled'), 'error');
          return;
      }

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // 2. トランザクション成功後、オフチェーンのステータスを更新
      playConfirm();
      setGameState(prev => {
        const newUnlocked = [...prev.unlockedParties];
        newUnlocked[index] = true;
        return { ...prev, tokens: prev.tokens - cost, unlockedParties: newUnlocked, activePartyIndex: index };
      });
      
      if (farcasterUser?.fid) {
          await supabase.from('quest_player_party').upsert({
              fid: farcasterUser.fid,
              party_no: index + 1,
              hero1_hid: null,
              hero2_hid: null,
              hero3_hid: null
          }, { onConflict: 'fid,party_no' });
      }
      
      refetchBalance();
      showNotification(t('notify.party_unlocked'), 'success');
    } catch (error: any) {
      console.error("Unlock failed:", error);
      playError();
      showNotification(t('error.unknown'), 'error');
    }
  };

  const savePartyToDB = async (partyIndex: number, heroes: (string | null)[]) => {
      if (!farcasterUser?.fid) return;
      
      const { error } = await supabase.from('quest_player_party').upsert({
          fid: farcasterUser.fid,
          party_no: partyIndex + 1,
          hero1_hid: heroes[0] ? parseInt(heroes[0]) : null,
          hero2_hid: heroes[1] ? parseInt(heroes[1]) : null,
          hero3_hid: heroes[2] ? parseInt(heroes[2]) : null
      }, { onConflict: 'fid,party_no' });

      if (error) console.error("Party Save Error:", error);
  };

  const assignHeroToParty = (slotIndex: number, heroId: string | null) => {
    playConfirm();
    let newPartyState: (string | null)[] = [];
    
    setGameState(prev => {
      const newPresets = [...prev.partyPresets];
      const activeParty = [...newPresets[prev.activePartyIndex]];
      if (heroId) {
        const existingIdx = activeParty.indexOf(heroId);
        if (existingIdx !== -1) activeParty[existingIdx] = null;
      }
      activeParty[slotIndex] = heroId;
      newPresets[prev.activePartyIndex] = activeParty;
      newPartyState = activeParty;
      return { ...prev, partyPresets: newPresets };
    });

    // DB Sync
    savePartyToDB(gameState.activePartyIndex, newPartyState);
  };

  const swapPartyPositions = (index1: number, index2: number) => {
    playConfirm();
    let newPartyState: (string | null)[] = [];

    setGameState(prev => {
      const newPresets = [...prev.partyPresets];
      const activeParty = [...newPresets[prev.activePartyIndex]];
      
      const temp = activeParty[index1];
      activeParty[index1] = activeParty[index2];
      activeParty[index2] = temp;
      
      newPresets[prev.activePartyIndex] = activeParty;
      newPartyState = activeParty;
      return { ...prev, partyPresets: newPresets };
    });
    
    // DB Sync
    savePartyToDB(gameState.activePartyIndex, newPartyState);
  };

  return { equipItem, switchParty, unlockParty, assignHeroToParty, swapPartyPositions };
};
