import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const CONTRACT_ADDRESS = '59da3faa2652c3a96a8beb9e1ca05355bb1d4b30d44b43c2fc64eadebb19dcec';

export const useGuiBalance = () => { 
  const { account, connected } = useWallet();
  const [balance, setBalance] = useState<string>('0');

  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(aptosConfig);

  const fetchGuiTokenMetadata = async () => {
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::gui_arena::get_gui_token_metadata`,
          typeArguments: [],
          functionArguments: [],
        },
      });
      return result && result.length > 0 ? (result[0] as string) : null;
    } catch (error) {
      console.error('Failed to fetch GUI token metadata:', error);
      return null;
    }
  };

  const fetchBalance = async (accountAddress: string) => {
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::gui_arena::get_balance`,
          typeArguments: [],
          functionArguments: [accountAddress],
        },
      });
      if (result && result.length > 0 && result[0] !== null && result[0] !== undefined) {
        return result[0].toString();
      }
      return '0';
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return '0';
    }
  };

  const refresh = async () => {
    if (connected && account) {
      const balance = await fetchBalance(account.address.toString());
      setBalance(balance);
    }
  };

  useEffect(() => {
    refresh();
  }, [connected, account]);

  return { balance, refresh };
};