import React, { useEffect, useState } from 'react';
import {
  TrophyOutlined,
  HeartOutlined,
  PlusOutlined,
  FireOutlined,
  UserOutlined,
  StarOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  CrownOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Space, Row, Col, Statistic, Badge, Tooltip, Switch } from 'antd';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useGuiBalance } from '../hooks/useGuiBalance';

const { Title, Paragraph, Text } = Typography;

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { account, connected } = useWallet();
  const { balance: guiBalance } = useGuiBalance();
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 15,
    }));
    setParticles(newParticles);
  }, []);

  const savedMemes = localStorage.getItem('hackathon-your-memes');
  const savedVotes = localStorage.getItem('hackathon-your-votes');
  const memes = savedMemes ? JSON.parse(savedMemes) : [];
  const userVotes = savedVotes ? JSON.parse(savedVotes).length : 0;
  const totalVotes = memes.reduce((sum: number, meme: any) => sum + meme.votes, 0);
  const topMeme = memes.length > 0 ? memes.sort((a: any, b: any) => b.votes - a.votes)[0] : null;
  const guiTokensUsed = memes.reduce((sum: number, meme: any) => sum + (meme.votes * 10 + 100), 0);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="arena-bg" />
      {!reducedMotion && (
        <div className="particles">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={{ left: `${particle.x}%`, animationDelay: `${particle.delay}s` }}
            />
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto pt-32 px-4 pb-12 relative z-10">
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full blur-xl opacity-75 animate-pulse" />
            <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 p-6 rounded-full">
              <div className="bg-gray-900 p-4 rounded-full flex items-center justify-center space-x-2">
                <TrophyOutlined className="text-6xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500" />
                <Tooltip title="Powered by GUI Token">
                  <DollarOutlined className="text-4xl text-green-400" />
                </Tooltip>
              </div>
            </div>
          </div>

          <Title
            level={1}
            className="text-7xl md:text-5xl font-black mb-6 neon-text"
            style={{
              fontFamily: 'Orbitron, monospace',
              background: 'linear-gradient(135deg, #FF1493 0%, #8B5CF6 50%, #00FFFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            MEME BATTLE ARENA
          </Title>

          <Paragraph className="text-xl text-gray-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join the <span className="text-cyan-400 font-bold">decentralized meme arena</span>! Submit memes via IPFS,
            vote with <span className="text-green-400 font-bold">GUI tokens</span>, and claim the crown!
          </Paragraph>

          <div className="flex justify-end mb-4">
            <Space>
              <Text className="text-gray-100">Reduce Motion</Text>
              <Switch checked={reducedMotion} onChange={setReducedMotion} />
            </Space>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
            <div className="arena-card p-6 text-center group">
              <div className="relative">
                <FireOutlined className="text-4xl text-red-500 mb-3 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-red-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <Statistic value={memes.length} valueStyle={{ color: '#EF4444', fontSize: '2.5rem', fontFamily: 'Orbitron, monospace', fontWeight: 900 }} />
              <Text className="text-gray-400 font-semibold uppercase tracking-wider">Battle Memes</Text>
            </div>
            <div className="arena-card p-6 text-center group">
              <div className="relative">
                <HeartOutlined className="text-4xl text-pink-500 mb-3 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-pink-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <Statistic value={totalVotes} valueStyle={{ color: '#EC4899', fontSize: '2.5rem', fontFamily: 'Orbitron, monospace', fontWeight: 900 }} />
              <Text className="text-gray-400 font-semibold uppercase tracking-wider">Total Votes</Text>
            </div>
            <div className="arena-card p-6 text-center group">
              <div className="relative">
                <UserOutlined className="text-4xl text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <Statistic value={userVotes} valueStyle={{ color: '#3B82F6', fontSize: '2.5rem', fontFamily: 'Orbitron, monospace', fontWeight: 900 }} />
              <Text className="text-gray-400 font-semibold uppercase tracking-wider">Your Votes</Text>
            </div>
            <div className="arena-card p-6 text-center group">
              <div className="relative">
                <CrownOutlined className="text-4xl text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-yellow-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <Statistic value={topMeme ? topMeme.votes : 0} valueStyle={{ color: '#EAB308', fontSize: '2.5rem', fontFamily: 'Orbitron, monospace', fontWeight: 900 }} />
              <Text className="text-gray-400 font-semibold uppercase tracking-wider">Champion Votes</Text>
            </div>
            {connected && (
              <div className="arena-card p-6 text-center group">
                <div className="relative">
                  <DollarOutlined className="text-4xl text-green-500 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                </div>
                <Statistic value={(parseFloat(guiBalance) / 1e8).toFixed(2)} valueStyle={{ color: '#10B981', fontSize: '2.5rem', fontFamily: 'Orbitron, monospace', fontWeight: 900 }} />
                <Text className="text-gray-400 font-semibold uppercase tracking-wider">Your GUI Balance</Text>
              </div>
            )}
          </div>

          {topMeme && (
            <div className="arena-card p-8 mb-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
              <div className="flex items-center justify-center space-x-4 mb-4">
                <CrownOutlined className="text-3xl text-yellow-400 animate-bounce" />
                <Title level={3} className="text-yellow-400 mb-0 font-black" style={{ fontFamily: 'Orbitron, monospace' }}>
                  REIGNING CHAMPION
                </Title>
                <CrownOutlined className="text-3xl text-yellow-400 animate-bounce" />
              </div>
              <Text className="text-2xl text-white">
                👑 <span className="font-bold text-yellow-300">{topMeme.title}</span> dominates with{' '}
                <span className="text-3xl font-black text-orange-400">{topMeme.votes}</span> votes!
              </Text>
            </div>
          )}

          <Space size="large" wrap className="justify-center flex-col md:flex-row">
            <Button size="large" className="arena-btn h-16 px-12 text-xl mb-4 md:mb-0" icon={<PlusOutlined className="text-xl" />} onClick={() => navigate('/submit')}>
              🚀 Submit Meme (100 GUI)
            </Button>
            <Button size="large" className="arena-btn h-16 px-12 text-xl mb-4 md:mb-0" icon={<HeartOutlined className="text-xl" />} onClick={() => navigate('/vote')}>
              ⚡ Vote Now (10 GUI/Vote)
            </Button>
            <Button size="large" className="arena-btn h-16 px-12 text-xl" icon={<TrophyOutlined className="text-xl" />} onClick={() => navigate('/leaderboard')}>
              👑 Leaderboard
            </Button>
          </Space>
        </div>

        <Row gutter={[32, 32]} className="mb-16">
          <Col xs={24} md={8}>
            <div className="arena-card h-full p-8 text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-full inline-block">
                  <RocketOutlined className="text-4xl text-white" />
                </div>
              </div>
              <Title level={3} className="text-purple-400 mb-4 font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
                IPFS POWERED
              </Title>
              <Paragraph className="text-gray-100 text-lg leading-relaxed">
                Upload memes to <span className="text-cyan-400 font-semibold">decentralized storage</span> via Pinata for permanent, secure access.
              </Paragraph>
              <div className="flex justify-center space-x-2 mt-4">
                <Badge count="Decentralized" style={{ backgroundColor: '#8B5CF6' }} />
                <Badge count="Permanent" style={{ backgroundColor: '#EC4899' }} />
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="arena-card h-full p-8 text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-500 p-6 rounded-full inline-block">
                  <ThunderboltOutlined className="text-4xl text-white" />
                </div>
              </div>
              <Title level={3} className="text-cyan-400 mb-4 font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
                BLOCKCHAIN VOTING
              </Title>
              <Paragraph className="text-gray-100 text-lg leading-relaxed">
                Cast votes using <span className="text-green-400 font-semibold">GUI tokens</span> via your Aptos wallet for transparent, immutable results.
              </Paragraph>
              <div className="flex justify-center space-x-2 mt-4">
                <Badge count="Transparent" style={{ backgroundColor: '#06B6D4' }} />
                <Badge count="Immutable" style={{ backgroundColor: '#3B82F6' }} />
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="arena-card h-full p-8 text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-r from-green-500 to-teal-500 p-6 rounded-full inline-block">
                  <DollarOutlined className="text-4xl text-white" />
                </div>
              </div>
              <Title level={3} className="text-green-400 mb-4 font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
                GUI TOKEN POWER
              </Title>
              <Paragraph className="text-gray-100 text-lg leading-relaxed">
                Use <span className="text-green-400 font-semibold">GUI tokens</span> to submit memes, cast votes, and earn rewards. Power up your arena experience!
              </Paragraph>
              <div className="flex justify-center space-x-2 mt-4">
                <Badge count="Utility Token" style={{ backgroundColor: '#10B981' }} />
                <Badge count="Rewarding" style={{ backgroundColor: '#14B8A6' }} />
              </div>
            </div>
          </Col>
        </Row>

        <div className="arena-card p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
          <Row gutter={[24, 24]} justify="center" className="mb-8">
            <Col xs={12} sm={8} md={4}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/30 hover:border-purple-500/60 transition-colors">
                <div className="text-2xl mb-2">⚡</div>
                <Badge count="Aptos" style={{ backgroundColor: '#000', fontSize: '12px' }} />
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/30 hover:border-cyan-500/60 transition-colors">
                <div className="text-2xl mb-2">🌐</div>
                <Badge count="IPFS" style={{ backgroundColor: '#06B6D4', fontSize: '12px' }} />
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-teal-500/30 hover:border-teal-500/60 transition-colors">
                <div className="text-2xl mb-2">📌</div>
                <Badge count="Pinata" style={{ backgroundColor: '#14B8A6', fontSize: '12px' }} />
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-500/30 hover:border-blue-500/60 transition-colors">
                <div className="text-2xl mb-2">⚛️</div>
                <Badge count="React" style={{ backgroundColor: '#3B82F6', fontSize: '12px' }} />
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-green-500/30 hover:border-green-500/60 transition-colors">
                <div className="text-2xl mb-2">💰</div>
                <Badge count="GUI Token" style={{ backgroundColor: '#10B981', fontSize: '12px' }} />
              </div>
            </Col>
          </Row>
          <Paragraph className="text-gray-100 text-lg">
            Built with cutting-edge tech for a <span className="text-cyan-400 font-semibold">decentralized</span> and{' '}
            <span className="text-purple-400 font-semibold">fun</span> experience.
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default Homepage;