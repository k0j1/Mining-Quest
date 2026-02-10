
import { useState, useEffect, useCallback, useRef } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { supabase } from '../lib/supabase';

const CHH_CONTRACT_ADDRESS = '0xb0525542E3D818460546332e76E511562dFf9B07';
const BASE_RPC_URL = 'https://mainnet.base.org';

export const useFarcasterAuth = (setNotification: (msg: string, type: 'error' | 'success') => void) => {
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [onChainBalanceRaw, setOnChainBalanceRaw] = useState<number | null>(null);
  
  // Guard to ensure initialization runs only once
  const isInitialized = useRef(false);

  const fetchBalance = useCallback(async (address: string) => {
    try {
      if (!address.startsWith('0x')) {
         console.warn("Invalid address format for balance fetch:", address);
         return;
      }

      console.log(`Fetching CHH balance for: ${address} on BASE Chain`);

      const response = await fetch(BASE_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: CHH_CONTRACT_ADDRESS,
            data: '0x70a08231' + address.replace('0x', '').toLowerCase().padStart(64, '0') // balanceOf(address)
          }, 'latest']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
         throw new Error(`RPC Error: ${result.error.message}`);
      }

      if (result.result && result.result !== '0x' && result.result.length > 2) {
        const balanceBigInt = BigInt(result.result);
        const numericBalance = Number(balanceBigInt) / 1e18; // 18 decimals assumption
        console.log(`Balance Fetched: ${numericBalance} CHH`);
        setOnChainBalanceRaw(numericBalance);
      } else {
        console.warn("Balance fetch returned empty/invalid result (0x), ignoring update.");
      }
    } catch (e: any) {
      console.error("Balance fetch error:", e);
    }
  }, []);

  const refetchBalance = useCallback(async () => {
    if (farcasterUser?.address) {
        await fetchBalance(farcasterUser.address);
    } else {
        console.log("Skipping refetch: No wallet address connected");
    }
  }, [farcasterUser, fetchBalance]);

  useEffect(() => {
    // Strict Mode / Double-Render Guard
    if (isInitialized.current) return;

    const initFarcasterContext = async () => {
      // Mark as initialized immediately to block subsequent calls
      isInitialized.current = true;
      
      try {
        if (sdk && sdk.context) {
            const context = await sdk.context;
            console.log("SDK Context Loaded:", context);
            
            if (context?.user) {
              const u = context.user as any;
              console.log("Raw User Data:", JSON.stringify(u));

              const pfpUrl = u.pfpUrl || u.pfp_url || "";
              
              let ethAddress: string | null = null;

              // 1. Try to get connected wallet address
              try {
                const accounts = await sdk.wallet.ethProvider.request({ method: 'eth_requestAccounts' }) as string[];
                if (Array.isArray(accounts) && accounts.length > 0) {
                  ethAddress = accounts[0];
                  console.log("Wallet Connected via Provider:", ethAddress);
                }
              } catch (walletErr) {
                console.warn("Wallet provider request failed:", walletErr);
              }

              // 2. Fallback to Profile Verified Addresses
              if (!ethAddress) {
                if (Array.isArray(u.verifiedAddresses) && u.verifiedAddresses.length > 0) {
                  ethAddress = u.verifiedAddresses[0];
                } 
                else if (Array.isArray(u.verifications) && u.verifications.length > 0) {
                  ethAddress = u.verifications[0];
                }
                // 3. Fallback to Custody
                else if (u.custodyAddress) {
                  ethAddress = u.custodyAddress;
                }
                // 4. Fallback to generic address field
                else if (u.address) {
                  ethAddress = u.address;
                }
              }

              if (ethAddress && !ethAddress.startsWith('0x')) {
                ethAddress = `0x${ethAddress}`;
              }

              console.log("Resolved Final Address:", ethAddress);

              const user = {
                ...u,
                pfpUrl,
                address: ethAddress,
                username: u.username || 'Unknown Miner'
              };
              
              setFarcasterUser(user);

              // --- Sync to DB ---
              if (user.fid) {
                try {
                  const { error } = await supabase.from('quest_player_stats').upsert({
                    fid: user.fid,
                    username: user.username,
                    display_name: user.displayName,
                    last_active: new Date().toISOString()
                  }, { onConflict: 'fid' });
                  
                  if (error) console.error("Error syncing player stats:", error);
                  else console.log("Player stats synced for FID:", user.fid);
                  
                } catch (dbError) {
                  console.error("DB Sync Exception:", dbError);
                }
              }

              if (ethAddress) {
                console.log("Fetching balance from BASE chain...");
                // Just call directly, don't await to block UI if slow
                fetchBalance(ethAddress).catch(e => {
                  console.warn("Balance fetch failed in catch:", e);
                });
              } else {
                 console.warn("No ETH address found for user");
              }
            } else {
              console.log("No user in Farcaster context");
            }
        } else {
          console.log("SDK context is null (Browser preview?)");
        }
      } catch (e: any) {
        console.warn("Farcaster Context initialization warning:", e);
        // Only notify error if we actually tried and failed significantly, 
        // preventing notification spam on soft-errors
        setNotification(`FC Login Error: ${e.message}`, 'error');
      }
    };
    
    initFarcasterContext();
  }, [fetchBalance, setNotification]);

  return { farcasterUser, onChainBalanceRaw, refetchBalance };
};
