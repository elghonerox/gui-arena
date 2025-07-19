import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useGuiBalance } from '../hooks/useGuiBalance';
import { Card, Button, Typography, Space, Row, Col, message } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

const MemeVoting: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const { balance: guiBalance, refresh } = useGuiBalance();
  const [memes, setMemes] = useState<any[]>([]);
  const [voting, setVoting] = useState<string | null>(null);

  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(aptosConfig);
  const CONTRACT_ADDRESS = '59da3faa2652c3a96a8beb9e1ca05355bb1d4b30d44b43c2fc64eadebb19dcec';
  const REQUIRED_GUI = 10 * 1e8; // 10 GUI per vote

  useEffect(() => {
    const savedMemes = localStorage.getItem('hackathon-your-memes');
    if (savedMemes) {
      setMemes(JSON.parse(savedMemes));
    }
  }, []);

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

    setVoting(memeId.toString());
    try {
      // Build the transaction using the new SDK structure
      const transaction = await aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${CONTRACT_ADDRESS}::gui_arena::vote_for_meme`,
          functionArguments: [1, memeId], // Hardcoded tournament_id = 1
        },
      });

      // Sign and submit the transaction
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      // Update local storage
      const updatedMemes = memes.map((meme) =>
        meme.id === memeId ? { ...meme, votes: meme.votes + 1 } : meme
      );
      setMemes(updatedMemes);
      localStorage.setItem('hackathon-your-memes', JSON.stringify(updatedMemes));

      // Update votes
      const savedVotes = JSON.parse(localStorage.getItem('hackathon-your-votes') || '[]');
      savedVotes.push({ memeId, timestamp: Date.now() });
      localStorage.setItem('hackathon-your-votes', JSON.stringify(savedVotes));

      refresh(); // Update balance
      message.success('Vote cast successfully!');
    } catch (error) {
      console.error('Voting failed:', error);
      message.error('Failed to cast vote. Please try again.');
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="arena-bg" />
      <div className="max-w-7xl mx-auto pt-32 px-4 pb-12 relative z-10">
        <Title level={2} className="text-gray-100 text-center mb-8">Vote for Memes</Title>
        <Space direction="vertical" size="middle" className="w-full">
          <Text className="text-gray-100">
            Your Balance: {(parseFloat(guiBalance) / 1e8).toFixed(2)} GUI
          </Text>
          <Text className="text-gray-100">Cost per Vote: {(REQUIRED_GUI / 1e8).toFixed(2)} GUI</Text>
          {parseFloat(guiBalance) < REQUIRED_GUI && (
            <Text type="danger">Insufficient balance to vote</Text>
          )}
        </Space>
        <Row gutter={[16, 16]} className="mt-8">
          {memes.map((meme) => {
            const hasVoted = JSON.parse(localStorage.getItem('hackathon-your-votes') || '[]').some(
              (vote: any) => vote.memeId === meme.id
            );
            return (
              <Col xs={24} sm={12} md={8} key={meme.id}>
                <Card
                  className="arena-card"
                  cover={<img alt={meme.title} src={`https://ipfs.io/ipfs/${meme.ipfsHash}`} />}
                  actions={[
                    <Button
                      key="vote"
                      type={hasVoted ? 'default' : 'primary'}
                      className="arena-btn"
                      disabled={!account || parseFloat(guiBalance) < REQUIRED_GUI || hasVoted}
                      loading={voting === meme.id.toString()}
                      onClick={() => handleVote(meme.id)}
                      icon={hasVoted ? <HeartFilled /> : <HeartOutlined />}
                    >
                      {hasVoted ? 'Voted' : `Vote (${meme.votes} votes)`}
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={<Text className="text-gray-100">{meme.title}</Text>}
                    description={<Text className="text-gray-400">{meme.description || 'No description'}</Text>}
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
};

export default MemeVoting;