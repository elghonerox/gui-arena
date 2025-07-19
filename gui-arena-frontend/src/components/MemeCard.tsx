import React, { useState } from 'react';
import { Card, Button, Typography, Avatar, Progress, Tooltip, Badge } from 'antd';
import { 
  HeartOutlined, 
  HeartFilled, 
  EyeOutlined, 
  TrophyOutlined,
  FireOutlined,
  CrownOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface MemeCardProps {
  meme: any;
  connected: boolean;
  votingLoading: number | null;
  handleVote: (id: number) => void;
  handleViewDetails: (meme: any) => void;
  rank?: number;
  totalVotes?: number;
}

const MemeCard: React.FC<MemeCardProps> = ({
  meme,
  connected,
  votingLoading,
  handleVote,
  handleViewDetails,
  rank,
  totalVotes = 1
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const votePercentage = Math.round((meme.votes / totalVotes) * 100) || 0;
  
  const getRankStyle = (rank?: number) => {
    switch (rank) {
      case 1:
        return 'rank-1 border-yellow-400 shadow-yellow-400/50';
      case 2:
        return 'rank-2 border-gray-400 shadow-gray-400/50';
      case 3:
        return 'rank-3 border-orange-400 shadow-orange-400/50';
      default:
        return 'border-purple-500/30';
    }
  };

  const getRankIcon = (rank?: number) => {
    switch (rank) {
      case 1:
        return <CrownOutlined className="text-yellow-400 text-2xl" />;
      case 2:
        return <TrophyOutlined className="text-gray-400 text-xl" />;
      case 3:
        return <TrophyOutlined className="text-orange-400 text-xl" />;
      default:
        return <FireOutlined className="text-purple-400 text-lg" />;
    }
  };

  return (
    <div 
      className={`vote-card arena-card ${meme.hasVoted ? 'voted' : ''} ${getRankStyle(rank)} relative group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
            {/* Rank Badge */}
      {rank && rank <= 3 && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
            ${rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' : ''}
            ${rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black' : ''}
            ${rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' : ''}
            shadow-lg animate-pulse
          `}>
            #{rank}
          </div>
        </div>
      )}

      {/* Glow Effect on Hover */}
      <div className={`
        absolute inset-0 rounded-3xl transition-opacity duration-300
        ${isHovered ? 'opacity-100' : 'opacity-0'}
        ${rank === 1 ? 'shadow-2xl shadow-yellow-400/30' : ''}
        ${rank === 2 ? 'shadow-2xl shadow-gray-400/30' : ''}
        ${rank === 3 ? 'shadow-2xl shadow-orange-400/30' : ''}
        ${!rank || rank > 3 ? 'shadow-2xl shadow-purple-400/30' : ''}
      `} />

      <Card
        className="h-full bg-transparent border-0 overflow-hidden"
        cover={
          <div className="relative overflow-hidden rounded-t-3xl">
            <img
              alt={meme.title}
              src={meme.imageUrl}
              className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/400/300';
              }}
            />
            
            {/* Overlay with rank icon */}
            <div className="absolute top-4 left-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-full p-2">
                {getRankIcon(rank)}
              </div>
            </div>

            {/* Vote percentage overlay */}
            <div className="absolute top-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
                <Text className="text-white font-bold text-sm">
                  {votePercentage}%
                </Text>
              </div>
            </div>

            {/* Voted indicator */}
            {meme.hasVoted && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <div className="bg-green-500 rounded-full p-3">
                  <HeartFilled className="text-white text-2xl" />
                </div>
              </div>
            )}
          </div>
        }
      >
        <div className="p-6">
          {/* Title */}
          <Title level={4} className="text-white mb-3 font-bold line-clamp-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            {meme.title}
          </Title>

          {/* Creator Info */}
          <div className="flex items-center space-x-3 mb-4">
            <Avatar 
              size="small" 
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {meme.creator?.slice(0, 2).toUpperCase() || 'AN'}
            </Avatar>
            <Text className="text-gray-400 text-sm">
              {meme.creator ? `${meme.creator.slice(0, 6)}...${meme.creator.slice(-4)}` : 'Anonymous'}
            </Text>
          </div>

          {/* Vote Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Text className="text-gray-400 text-sm font-semibold">BATTLE POWER</Text>
              <Text className="text-white font-bold">{meme.votes} votes</Text>
            </div>
            <Progress
              percent={votePercentage}
              showInfo={false}
              strokeColor={{
                '0%': rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#8B5CF6',
                '100%': rank === 1 ? '#FFA500' : rank === 2 ? '#A0A0A0' : rank === 3 ? '#FF8C00' : '#EC4899',
              }}
              trailColor="rgba(255,255,255,0.1)"
              strokeWidth={8}
              className="custom-progress"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              type={meme.hasVoted ? "default" : "primary"}
              icon={meme.hasVoted ? <HeartFilled /> : <HeartOutlined />}
              loading={votingLoading === meme.id}
              disabled={!connected || meme.hasVoted}
              onClick={() => handleVote(meme.id)}
              className={`
                flex-1 h-12 font-bold text-sm uppercase tracking-wider
                ${meme.hasVoted 
                  ? 'bg-green-600 border-green-600 text-white' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 border-0 text-white hover:from-pink-600 hover:to-purple-700'
                }
              `}
            >
              {meme.hasVoted ? 'VOTED' : 'VOTE'}
            </Button>
            
            <Tooltip title="View Details">
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(meme)}
                className="h-12 w-12 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
              />
            </Tooltip>
          </div>

          {/* Battle Stats */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Rank #{rank || '?'}</span>
              <span>{votePercentage}% dominance</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MemeCard;