
import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../../types';
import { playClick, playConfirm, playError } from '../../utils/sound';
import { supabase } from '../../lib/supabase';

interface UsePartyProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotification: (msg: string, type: 'error' | 'success') => void;
  farcasterUser?: any;
  refetchBalance?: () => Promise<void>;
}

export const useParty = ({ gameState, setGameState, showNotification, farcasterUser, refetchBalance }: UsePartyProps) => {

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
    const cost = 10000;
    if (gameState.tokens < cost) {
      playError();
      showNotification(`トークンが足りません！ (必要: ${cost.toLocaleString()} $CHH)`, 'error');
      return;
    }
    playConfirm();
    setGameState(prev => {
      const newUnlocked = [...prev.unlockedParties];
      newUnlocked[index] = true;
      return { ...prev, tokens: prev.tokens - cost, unlockedParties: newUnlocked, activePartyIndex: index };
    });
    
    // In DB, unlocking is implicit by having a record, or we just rely on local token burn for now
    // as there is no specific "unlock" table, but we should create the party record.
    if (farcasterUser?.fid) {
        // Initial insert to 'unlock' - CHANGED heroX_id to heroX_hid
        await supabase.from('quest_player_party').upsert({
            fid: farcasterUser.fid,
            party_no: index + 1,
            hero1_hid: null,
            hero2_hid: null,
            hero3_hid: null
        }, { onConflict: 'fid,party_no' });
    }
    
    if (refetchBalance) refetchBalance();
  };

  const savePartyToDB = async (partyIndex: number, heroes: (string | null)[]) => {
      if (!farcasterUser?.fid) return;
      
      // CHANGED heroX_id to heroX_hid
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
