import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network, InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { Card, Button, Typography, Space, message } from 'antd';
import { useGuiBalance } from '../hooks/useGuiBalance';

const { Title, Text } = Typography;

const CONTRACT_ADDRESS = '59da3faa2652c3a96a8beb9e1ca05355bb1d4b30d44b43c2fc64eadebb19dcec';
const REQUIRED_GUI = 10 * 1e8; // 10 GUI in smallest unit

const VotePage: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const { balance: guiBalance, refresh } = useGuiBalance();
  const [memes, setMemes] = useState([
    {
      id: 1,
      title: 'Gigachad Energy',
      imageUrl: '/api/placeholder/400/400',
      votes: 156,
      creator: '0x1234567890abcdef1234567890abcdef12345678',
      ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      timestamp: Date.now() - 86400000,
    },
    {
      id: 2,
      title: 'Epic Futurama Moment',
      imageUrl: '/api/placeholder/400/400',
      votes: 142,
      creator: '0xabcdef1234567890abcdef1234567890abcdef12',
      ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdH',
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: Date.now() - 172800000,
    },
    {
      id: 3,
      title: 'Classic Drake Template',
      imageUrl: '/api/placeholder/400/400',
      votes: 98,
      creator: '0x9876543210fedcba9876543210fedcba98765432',
      ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdI',
      transactionHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      timestamp: Date.now() - 259200000,
    },
  ]);
  const [voting, setVoting] = useState<number | null>(null);

  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(aptosConfig);

  const handleVote = async (memeId: number) => {
    if (!account) {
      message.error('Please connect your wallet');
      return;
    }

    const balanceNum = parseFloat(guiBalance);
    if (balanceNum < REQUIRED_GUI) {
      message.error('Insufficient GUI tokens. You need at least 10 GUI to vote.');
      return;
    }

    setVoting(memeId);
    try {
      // Corrected payload structure for InputEntryFunctionData
      const payload: InputEntryFunctionData = {
        function: `${CONTRACT_ADDRESS}::gui_arena::vote_for_meme`,
        typeArguments: [],
        functionArguments: [1, memeId],
      };

      const response = await signAndSubmitTransaction({
        data: payload,
      });
      
      await aptos.waitForTransaction({ transactionHash: response.hash });

      setMemes(prev => prev.map(meme =>
        meme.id === memeId ? { ...meme, votes: meme.votes + 1 } : meme
      ));
      refresh();
      message.success('Vote cast successfully!');
    } catch (error) {
      console.error('Vote failed:', error);
      message.error('Failed to cast vote. Please try again.');
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="arena-bg" />
      <div className="max-w-7xl mx-auto pt-32 px-4 pb-12 relative z-10">
        <Title level={2} className="text-gray-100 text-center">Vote for Your Favorite Meme</Title>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {memes.map(meme => (
            <Card
              key={meme.id}
              className="arena-card"
              cover={<img src={meme.imageUrl} alt={meme.title} style={{ height: 400, objectFit: 'cover' }} />}
            >
              <Card.Meta
                title={<Text className="text-gray-100">{meme.title}</Text>}
                description={
                  <Space direction="vertical">
                    <Text className="text-gray-400">Votes: {meme.votes}</Text>
                    <Text className="text-gray-400">Creator: {meme.creator.slice(0, 6)}...{meme.creator.slice(-4)}</Text>
                    <Button
                      type="primary"
                      className="arena-btn"
                      onClick={() => handleVote(meme.id)}
                      disabled={!account || parseFloat(guiBalance) < REQUIRED_GUI}
                      loading={voting === meme.id}
                    >
                      Vote (10 GUI)
                    </Button>
                  </Space>
                }
              />
            </Card>
          ))}
        </Space>
      </div>
    </div>
  );
};

export default VotePage;