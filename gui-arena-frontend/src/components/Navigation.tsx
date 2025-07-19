import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button, Dropdown, Menu, Space, Typography } from 'antd';
import { WalletOutlined, DownOutlined } from '@ant-design/icons';
import { useGuiBalance } from '../hooks/useGuiBalance';

const { Text } = Typography;

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const { account, connect, disconnect, wallets } = useWallet();
  const { balance: guiBalance } = useGuiBalance();

  const walletMenu = (
    <Menu>
      <Menu.Item key="balance">
        <Text>Balance: {(parseFloat(guiBalance) / 1e8).toFixed(2)} GUI</Text>
      </Menu.Item>
      <Menu.Item key="disconnect" onClick={disconnect}>
        Disconnect
      </Menu.Item>
    </Menu>
  );

  const handleConnect = () => {
    if (wallets.length > 0) {
      connect(wallets[0].name);
    }
  };

  return (
    <div className="arena-nav fixed top-0 left-0 w-full z-20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Text
          className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          GUI Arena
        </Text>
        <Space size="large">
          <Button className="arena-btn" onClick={() => navigate('/')}>
            Home
          </Button>
          <Button className="arena-btn" onClick={() => navigate('/submit')}>
            Submit
          </Button>
          <Button className="arena-btn" onClick={() => navigate('/vote')}>
            Vote
          </Button>
          <Button className="arena-btn" onClick={() => navigate('/leaderboard')}>
            Leaderboard
          </Button>
          {account ? (
            <Dropdown overlay={walletMenu} trigger={['click']}>
              <Button className="arena-btn">
                <WalletOutlined /> {account.address.toString().slice(0, 6)}... <DownOutlined />
              </Button>
            </Dropdown>
          ) : (
            <Button className="arena-btn" onClick={handleConnect}>
              Connect Wallet
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default Navigation;