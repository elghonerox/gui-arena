import React, { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Typography, Row, Col, Card, Space, Statistic, Button } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { useGuiBalance } from '../hooks/useGuiBalance';

const { Title, Text } = Typography;

const LeaderboardPage: React.FC = () => {
  const { account, connected } = useWallet();
  const { balance: guiBalance } = useGuiBalance();
  const [memes, setMemes] = useState<any[]>([]);

  useEffect(() => {
    const savedMemes = localStorage.getItem('hackathon-your-memes');
    if (savedMemes) {
      const parsedMemes = JSON.parse(savedMemes);
      setMemes(parsedMemes.sort((a: any, b: any) => b.votes - a.votes));
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="arena-bg" />
      <div className="max-w-7xl mx-auto pt-32 px-4 pb-12 relative z-10">
        <Title
          level={2}
          className="text-4xl md:text-3xl font-black text-center mb-8 neon-text"
          style={{
            fontFamily: 'Orbitron, monospace',
            background: 'linear-gradient(135deg, #FF1493 0%, #8B5CF6 50%, #00FFFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          LEADERBOARD
        </Title>
        <Space direction="vertical" size="middle" className="w-full text-center mb-8">
          <Text className="text-gray-100">
            Your Balance: {(parseFloat(guiBalance) / 1e8).toFixed(2)} GUI
          </Text>
          <Text className="text-gray-100">Vote for your favorite memes with GUI tokens!</Text>
        </Space>
        <Row gutter={[16, 16]}>
          {memes.length === 0 ? (
            <Col span={24}>
              <Text className="text-gray-100 text-center">No memes submitted yet.</Text>
            </Col>
          ) : (
            memes.map((meme, index) => (
              <Col xs={24} sm={12} md={8} key={meme.id}>
                <Card
                  className="arena-card"
                  cover={<img alt={meme.title} src={`https://ipfs.io/ipfs/${meme.ipfsHash}`} />}
                  extra={
                    index < 3 && (
                      <TrophyOutlined
                        className={`text-2xl ${
                          index === 0 ? 'text-yellow-400' : index === 1 ? 'text-silver-400' : 'text-bronze-400'
                        }`}
                      />
                    )
                  }
                >
                  <Card.Meta
                    title={<Text className="text-gray-100">{meme.title}</Text>}
                    description={
                      <Space direction="vertical">
                        <Text className="text-gray-400">{meme.description || 'No description'}</Text>
                        <Statistic
                          title={<Text className="text-gray-400">Votes</Text>}
                          value={meme.votes}
                          valueStyle={{ color: '#EAB308', fontFamily: 'Orbitron, monospace' }}
                        />
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))
          )}
        </Row>
        {connected && (
          <div className="text-center mt-8">
            <Button
              type="primary"
              className="arena-btn h-12 px-8 text-lg"
              onClick={() => window.location.href = '/vote'}
            >
              Vote Now (10 GUI/Vote)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;