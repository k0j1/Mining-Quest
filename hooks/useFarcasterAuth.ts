
import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { supabase } from '../lib/supabase';

const CHH_CONTRACT_ADDRESS = '0xb0525542E3D818460546332e76E511562dFf9B07';
const BASE_RPC_URL = 'https://mainnet.base.org';

export const useFarcasterAuth = (setNotification: (msg: string, type: 'error' | 'success') => void) => {
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [onChainBalanceRaw, setOnChainBalanceRaw] = useState<number | null>(null);

  const fetchBalance = async (address: string) => {
    try {
      if (!address.startsWith('0x')) {
         console.warn("Invalid address format for balance fetch:", address);
         setOnChainBalanceRaw(0);
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

      if (result.result && result.result !== '0x') {
        const balanceBigInt = BigInt(result.result);
        const numericBalance = Number(balanceBigInt) / 1e18; // 18 decimals assumption
        console.log(`Balance Fetched: ${numericBalance} CHH`);
        setOnChainBalanceRaw(numericBalance);
      } else {
        console.log("Balance result is 0x or empty, setting to 0");
        setOnChainBalanceRaw(0);
      }
    } catch (e: any) {
      console.error("Balance fetch error:", e);
      // RPCエラー等の場合は0を表示して、UIがローディング状態のままになるのを防ぐ
      setOnChainBalanceRaw(0);
    }
  };

  useEffect(() => {
    const initFarcasterContext = async () => {
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
                fetchBalance(ethAddress).catch(e => {
                  console.warn("Balance fetch failed in catch:", e);
                  setOnChainBalanceRaw(0);
                });
              } else {
                 console.warn("No ETH address found for user");
                 setOnChainBalanceRaw(0);
              }
            } else {
              console.log("No user in Farcaster context");
            }
        } else {
          console.log("SDK context is null (Browser preview?)");
        }
      } catch (e: any) {
        console.warn("Farcaster Context initialization warning:", e);
        setNotification(`FC Login Error: ${e.message}`, 'error');
      }
    };
    initFarcasterContext();
  }, []);

  return { farcasterUser, onChainBalanceRaw };
};
