import React from 'react';
import { Button, message, Typography, Space } from 'antd';
import { WalletOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

const { Text } = Typography;

const WalletConnection: React.FC = () => {
  const { account, connected, connect, disconnect, wallets } = useWallet();

  const handleConnect = async () => {
    try {
      if (wallets.length > 0) {
        await connect(wallets[0].name);
        message.success('Wallet connected successfully!');
      } else {
        message.error('No wallet found. Please install a wallet extension.');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      message.error('Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      message.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
      message.error('Failed to disconnect wallet');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (connected && account) {
    return (
      <Space>
        <Text className="text-white">
          {formatAddress(account.address?.toString() || '')}
        </Text>
        <Button
          icon={<DisconnectOutlined />}
          onClick={handleDisconnect}
          className="border-red-400 text-red-400 hover:bg-red-500/10"
        >
          Disconnect
        </Button>
      </Space>
    );
  }

  return (
    <Button
      type="primary"
      icon={<WalletOutlined />}
      onClick={handleConnect}
      className="bg-gradient-to-r from-purple-500 to-pink-500 border-0"
    >
      Connect Wallet
    </Button>
  );
};

export default WalletConnection;