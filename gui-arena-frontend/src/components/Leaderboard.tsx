import React, { useState, useEffect } from 'react';
import { Card, Table, Avatar, Space, Typography, Badge, Button, message, Spin, Image } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  EyeOutlined,
  HeartOutlined,
  ShareAltOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Meme {
  id: number;
  title: string;
  imageUrl: string;
  creator: string;
  votes: number;
  ipfsHash?: string;
  createdAt: string;
  tags?: string[];
}

interface LeaderboardEntry extends Meme {
  rank: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
  previousRank?: number;
}

const STORAGE_KEY = 'hackathon-your-memes';

// Only the three specific memes you requested
const DEFAULT_MEMES: Meme[] = [
  {
    id: 0,
    title: 'Futurama Meme',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreifn547igtb7nguirwyojedwwx27oi2g53s2bhxzqfg5pzwkmvsrxm',
    creator: '0x1234...5678',
    votes: 42,
    ipfsHash: 'bafkreifn547igtb7nguirwyojedwwx27oi2g53s2bhxzqfg5pzwkmvsrxm',
    createdAt: new Date().toISOString(),
    tags: ['funny', 'futurama', 'classic'],
  },
  {
    id: 1,
    title: 'Drake Meme',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/bafybeig2he2froozbtus7p4rahjcfto5fugfftyrmh7tm6zldlnscyjdce',
    creator: '0x1234...5678',
    votes: 38,
    ipfsHash: 'bafybeig2he2froozbtus7p4rahjcfto5fugfftyrmh7tm6zldlnscyjdce',
    createdAt: new Date().toISOString(),
    tags: ['drake', 'choice', 'trending'],
  },
  {
    id: 2,
    title: 'Chad Meme',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/bafybeigp3dswhqoifqidv24agif65jdf7oouiemzkstkgvjedflem7jnsi',
    creator: '0x1234...5678',
    votes: 55,
    ipfsHash: 'bafybeigp3dswhqoifqidv24agif65jdf7oouiemzkstkgvjedflem7jnsi',
    createdAt: new Date().toISOString(),
    tags: ['chad', 'sigma', 'based'],
  },
];

const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getRankIcon = (rank: number): JSX.Element => {
  switch (rank) {
    case 1:
      return <CrownOutlined className="text-yellow-500 text-2xl" />;
    case 2:
      return <TrophyOutlined className="text-gray-400 text-xl" />;
    case 3:
      return <StarOutlined className="text-orange-500 text-xl" />;
    default:
      return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
  }
};

const MemeImage: React.FC<{ imageUrl: string; rank: number; ipfsHash?: string }> = ({ imageUrl, rank, ipfsHash }) => (
  <div className="relative group">
    <div className={`relative overflow-hidden rounded-2xl ${
      rank === 1 ? 'ring-4 ring-yellow-400 shadow-2xl' :
      rank === 2 ? 'ring-4 ring-gray-400 shadow-xl' :
      rank === 3 ? 'ring-4 ring-orange-400 shadow-lg' :
      'ring-2 ring-purple-300 shadow-md'
    }`}>
      <Image
        src={imageUrl}
        alt="Meme"
        width={80}
        height={80}
        className="object-cover transition-transform duration-300 group-hover:scale-110"
        preview={{
          mask: <EyeOutlined className="text-white text-xl" />,
        }}
      />
      {rank <= 3 && (
        <div className="absolute -top-2 -right-2 z-10">
          {getRankIcon(rank)}
        </div>
      )}
    </div>
    {ipfsHash && (
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity">
        IPFS: {ipfsHash.slice(0, 8)}...
      </div>
    )}
  </div>
);

const MemeDetails: React.FC<{ record: LeaderboardEntry }> = ({ record }) => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center space-x-3">
      <Text className="text-lg font-bold text-white">{record.title}</Text>
      {record.rank <= 3 && (
        <Badge 
          count={`#${record.rank}`} 
          className={`${
            record.rank === 1 ? 'bg-yellow-500' :
            record.rank === 2 ? 'bg-gray-400' :
            'bg-orange-500'
          }`}
        />
      )}
    </div>
    
    <div className="flex items-center space-x-4 text-sm text-gray-400">
      <span>Creator: {formatAddress(record.creator)}</span>
      <span>•</span>
      <span>{new Date(record.createdAt).toLocaleDateString()}</span>
    </div>
    
    {record.tags && (
      <div className="flex flex-wrap gap-1 mt-2">
        {record.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30"
          >
            #{tag}
          </span>
        ))}
      </div>
    )}
  </div>
);

const PerformanceMetrics: React.FC<{ record: LeaderboardEntry }> = ({ record }) => (
  <div className="flex flex-col items-center space-y-3">
    <div className="text-center">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <HeartOutlined className="text-red-500" />
        <Text className="text-2xl font-bold text-white">{record.votes}</Text>
      </div>
      <Text className="text-sm text-gray-400">votes</Text>
    </div>
    
    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${
          record.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
          record.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
          record.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
          'bg-gradient-to-r from-purple-400 to-purple-600'
        }`}
        style={{ width: `${record.percentage}%` }}
      />
    </div>
    
    <Text className="text-sm text-gray-400">{record.percentage.toFixed(1)}% of total votes</Text>
    
    {record.trend && (
      <div className={`flex items-center space-x-1 text-xs ${
        record.trend === 'up' ? 'text-green-400' :
        record.trend === 'down' ? 'text-red-400' :
        'text-gray-400'
      }`}>
        <ThunderboltOutlined />
        <span>{record.trend === 'up' ? 'Rising' : record.trend === 'down' ? 'Falling' : 'Stable'}</span>
      </div>
    )}
  </div>
);

const Actions: React.FC<{ record: LeaderboardEntry }> = ({ record }) => (
  <div className="flex flex-col space-y-2">
    <Button
      type="primary"
      icon={<HeartOutlined />}
      className="bg-gradient-to-r from-red-500 to-pink-500 border-0 rounded-xl"
      onClick={() => {
        message.success(`Voted for ${record.title}!`);
      }}
    >
      Vote
    </Button>
    
    <Button
      icon={<ShareAltOutlined />}
      className="border-purple-400 text-purple-400 hover:bg-purple-500/10 rounded-xl"
      onClick={() => {
        navigator.clipboard.writeText(`Check out this meme: ${record.title}`);
        message.success('Link copied to clipboard!');
      }}
    >
      Share
    </Button>
    
    {record.ipfsHash && (
      <Button
        size="small"
        className="text-xs border-gray-600 text-gray-400 hover:bg-gray-700 rounded-xl"
        onClick={() => {
          window.open(`https://gateway.pinata.cloud/ipfs/${record.ipfsHash}`, '_blank');
        }}
      >
        View on IPFS
      </Button>
    )}
  </div>
);

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get memes from localStorage or use defaults
      const savedMemes = localStorage.getItem(STORAGE_KEY);
      const memes: Meme[] = savedMemes ? JSON.parse(savedMemes) : DEFAULT_MEMES;
      
      // If no saved memes, save the defaults
      if (!savedMemes) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMES));
      }
      
      // Calculate total votes
      const total = memes.reduce((sum, meme) => sum + meme.votes, 0);
      setTotalVotes(total);
      
      // Create leaderboard entries with rankings and percentages
      const sortedMemes = memes
        .sort((a, b) => b.votes - a.votes)
        .map((meme, index) => ({
          ...meme,
          rank: index + 1,
          percentage: total > 0 ? (meme.votes / total) * 100 : 0,
                    trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable' as 'up' | 'down' | 'stable',
          previousRank: index + Math.floor(Math.random() * 3) - 1, // Simulate previous rank
        }));
      
      setLeaderboardData(sortedMemes);
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
      message.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div className="flex items-center justify-center">
          {getRankIcon(rank)}
        </div>
      ),
    },
    {
      title: 'Meme',
      key: 'meme',
      render: (record: LeaderboardEntry) => (
        <div className="flex items-center space-x-4">
          <MemeImage 
            imageUrl={record.imageUrl} 
            rank={record.rank} 
            ipfsHash={record.ipfsHash} 
          />
          <MemeDetails record={record} />
        </div>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      width: 200,
      render: (record: LeaderboardEntry) => (
        <PerformanceMetrics record={record} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: LeaderboardEntry) => (
        <Actions record={record} />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" className="mb-4" />
          <Text className="text-white text-lg">Loading Battle Arena Leaderboard...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <TrophyOutlined className="text-yellow-500 text-4xl" />
            <Title level={1} className="text-white mb-0 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Battle Arena Leaderboard
            </Title>
            <FireOutlined className="text-red-500 text-4xl animate-pulse" />
          </div>
          
          <Text className="text-gray-300 text-lg block mb-6">
            The ultimate meme battleground - where only the strongest survive!
          </Text>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
              <div className="text-center">
                <CrownOutlined className="text-yellow-500 text-3xl mb-2" />
                <Title level={3} className="text-white mb-1">
                  {leaderboardData.length > 0 ? leaderboardData[0].title : 'No Champion'}
                </Title>
                <Text className="text-yellow-400">Current Champion</Text>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <div className="text-center">
                <ThunderboltOutlined className="text-purple-500 text-3xl mb-2" />
                <Title level={3} className="text-white mb-1">{totalVotes}</Title>
                <Text className="text-purple-400">Total Votes Cast</Text>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
              <div className="text-center">
                <FireOutlined className="text-blue-500 text-3xl mb-2" />
                <Title level={3} className="text-white mb-1">{leaderboardData.length}</Title>
                <Text className="text-blue-400">Memes in Arena</Text>
              </div>
            </Card>
          </div>
        </div>

        {/* Leaderboard Table */}
        <Card 
          className="bg-gray-900/50 backdrop-blur-lg border-purple-500/30 shadow-2xl"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={leaderboardData}
            rowKey="id"
            pagination={false}
            className="leaderboard-table"
            rowClassName={(record) => 
              `leaderboard-row transition-all duration-300 hover:bg-purple-500/10 ${
                record.rank === 1 ? 'bg-yellow-500/5' :
                record.rank === 2 ? 'bg-gray-500/5' :
                record.rank === 3 ? 'bg-orange-500/5' : ''
              }`
            }
            scroll={{ x: 800 }}
          />
        </Card>

        {/* Bottom Actions */}
        <div className="text-center mt-8">
          <Space size="large">
            <Button
              type="primary"
              size="large"
              icon={<HeartOutlined />}
              className="bg-gradient-to-r from-red-500 to-pink-500 border-0 rounded-2xl px-8 h-12 font-semibold"
              onClick={() => window.location.href = '/vote'}
            >
              Vote Now
            </Button>
            
            <Button
              size="large"
              icon={<FireOutlined />}
              className="border-purple-400 text-purple-400 hover:bg-purple-500/10 rounded-2xl px-8 h-12 font-semibold"
              onClick={() => window.location.href = '/submit'}
            >
              Submit Meme
            </Button>
          </Space>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-gray-400 text-sm">
          <p>🏆 Rankings update in real-time • ⚡ Powered by Aptos Blockchain • 🔥 IPFS Storage</p>
          <p className="mt-2">Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;