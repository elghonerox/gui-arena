import React from 'react';
import { Modal, Typography, Space, Avatar, Progress, Badge, Button, Divider, message } from 'antd'; // Add message to imports
import { 
  HeartOutlined, 
  ShareAltOutlined, 
  DownloadOutlined, 
  LinkOutlined,
  TrophyOutlined,
  FireOutlined,
  EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface MemeDetailModalProps {
  visible: boolean;
  meme: any;
  onClose: () => void;
  totalVotes: number;
}

const MemeDetailModal: React.FC<MemeDetailModalProps> = ({ 
  visible, 
  meme, 
  onClose, 
  totalVotes 
}) => {
  if (!meme) return null;

  const votePercentage = totalVotes > 0 ? Math.round((meme.votes / totalVotes) * 100) : 0;
  const rank = meme.rank || '?';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this meme: ${meme.title}`,
          text: `This meme has ${meme.votes} votes in the Meme Battle Arena!`,
          url: window.location.href,
        });
            } catch (error) {
        console.log('Error sharing:', error);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('Link copied to clipboard!');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = meme.imageUrl;
    link.download = `${meme.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-purple-400';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { text: '👑 CHAMPION', color: '#FFD700' };
    if (rank === 2) return { text: '🥈 RUNNER-UP', color: '#C0C0C0' };
    if (rank === 3) return { text: '🥉 THIRD PLACE', color: '#CD7F32' };
    if (rank <= 10) return { text: '⭐ TOP 10', color: '#8B5CF6' };
    return { text: '🎯 COMPETITOR', color: '#6B7280' };
  };

  const rankBadge = getRankBadge(rank);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="arena-modal"
      centered
      destroyOnClose
    >
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl
              ${rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' : ''}
              ${rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black' : ''}
              ${rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' : ''}
              ${rank > 3 ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : ''}
              shadow-2xl
            `} style={{ fontFamily: 'Orbitron, monospace' }}>
              #{rank}
            </div>
            <Badge 
              count={rankBadge.text} 
              style={{ backgroundColor: rankBadge.color, color: rank <= 3 ? '#000' : '#fff' }} 
            />
          </div>
          
          <Title level={2} className="text-white mb-2 font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
            {meme.title}
          </Title>
          
          <Text className="text-gray-400">
            Submitted to the Arena • Battle ID: #{meme.id}
          </Text>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border-2 border-gray-600 shadow-2xl">
              <img
                src={meme.imageUrl}
                alt={meme.title}
                className="w-full h-auto max-h-96 object-contain bg-gray-900"
                onError={(e) => {
                  e.currentTarget.src = '/api/placeholder/400/400';
                }}
              />
              {rank <= 3 && (
                <div className="absolute top-4 right-4">
                  <div className={`
                    px-3 py-1 rounded-full font-bold text-sm
                    ${rank === 1 ? 'bg-yellow-400 text-black' : ''}
                    ${rank === 2 ? 'bg-gray-400 text-black' : ''}
                    ${rank === 3 ? 'bg-orange-400 text-white' : ''}
                    shadow-lg
                  `}>
                    {rank === 1 ? '👑 CHAMPION' : rank === 2 ? '🥈 2ND' : '🥉 3RD'}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
              >
                Share
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                className="flex-1 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
              >
                Download
              </Button>
              {meme.ipfsHash && (
                <Button
                  icon={<LinkOutlined />}
                  href={`https://gateway.pinata.cloud/ipfs/${meme.ipfsHash}`}
                  target="_blank"
                  className="flex-1 border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                >
                  IPFS
                </Button>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            {/* Vote Stats */}
            <div className="arena-card p-6">
              <div className="flex items-center justify-between mb-4">
                <Title level={4} className="text-white mb-0 font-bold">
                  <HeartOutlined className="mr-2 text-red-400" />
                  Battle Performance
                </Title>
                <div className={`text-3xl font-black ${getRankColor(rank)}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {meme.votes}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Text className="text-gray-400">Vote Share</Text>
                  <Text className="text-white font-bold">{votePercentage}%</Text>
                </div>
                
                <Progress
                  percent={votePercentage}
                  showInfo={false}
                  strokeColor={
                    rank === 1 ? { '0%': '#FFD700', '100%': '#FFA500' } :
                    rank === 2 ? { '0%': '#C0C0C0', '100%': '#A0A0A0' } :
                    rank === 3 ? { '0%': '#CD7F32', '100%': '#FF8C00' } :
                    { '0%': '#8B5CF6', '100%': '#EC4899' }
                  }
                  trailColor="rgba(255,255,255,0.1)"
                  strokeWidth={12}
                />
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      #{rank}
                    </div>
                    <Text className="text-gray-400 text-sm">Current Rank</Text>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {totalVotes > 0 ? Math.round((meme.votes / totalVotes) * 100) : 0}%
                    </div>
                    <Text className="text-gray-400 text-sm">Dominance</Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Creator Info */}
            <div className="arena-card p-6">
              <Title level={4} className="text-white mb-4 font-bold">
                <TrophyOutlined className="mr-2 text-yellow-400" />
                Creator Details
              </Title>
              
              <div className="flex items-center space-x-4 mb-4">
                <Avatar 
                  size={64} 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-2xl font-bold"
                >
                  {meme.creator?.slice(0, 2).toUpperCase() || 'AN'}
                </Avatar>
                <div>
                  <Text className="text-white font-bold block text-lg">
                    {meme.creator ? 'Verified Creator' : 'Anonymous Warrior'}
                  </Text>
                  <Text className="text-gray-400 font-mono text-sm">
                    {meme.creator ? `${meme.creator.slice(0, 12)}...${meme.creator.slice(-8)}` : 'Identity Hidden'}
                  </Text>
                </div>
              </div>

              {meme.transactionHash && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <Text className="text-gray-400 text-xs block mb-1">Blockchain Transaction:</Text>
                  <Text className="text-blue-400 font-mono text-xs break-all">
                    {meme.transactionHash}
                  </Text>
                </div>
              )}
            </div>

            {/* Achievement Badges */}
            <div className="arena-card p-6">
              <Title level={4} className="text-white mb-4 font-bold">
                <FireOutlined className="mr-2 text-orange-400" />
                Achievements
              </Title>
              
              <div className="space-y-3">
                {meme.votes >= 1 && (
                  <Badge count="🎯 First Vote" style={{ backgroundColor: '#10B981' }} className="w-full" />
                )}
                {meme.votes >= 10 && (
                  <Badge count="🔥 Popular" style={{ backgroundColor: '#F59E0B' }} className="w-full" />
                )}
                {meme.votes >= 25 && (
                  <Badge count="⚡ Trending" style={{ backgroundColor: '#8B5CF6' }} className="w-full" />
                )}
                {meme.votes >= 50 && (
                  <Badge count="🚀 Viral" style={{ backgroundColor: '#EF4444' }} className="w-full" />
                )}
                {meme.votes >= 100 && (
                  <Badge count="👑 Legendary" style={{ backgroundColor: '#FFD700', color: '#000' }} className="w-full" />
                )}
                {rank <= 3 && (
                  <Badge count="🏆 Podium Finisher" style={{ backgroundColor: '#DC2626' }} className="w-full" />
                )}
                {meme.ipfsHash && (
                  <Badge count="🌐 IPFS Stored" style={{ backgroundColor: '#06B6D4' }} className="w-full" />
                )}
              </div>
            </div>

            {/* Technical Details */}
            {(meme.ipfsHash || meme.transactionHash) && (
              <div className="arena-card p-6">
                <Title level={4} className="text-white mb-4 font-bold">
                  <LinkOutlined className="mr-2 text-cyan-400" />
                  Technical Details
                </Title>
                
                <div className="space-y-4">
                  {meme.ipfsHash && (
                    <div>
                      <Text className="text-gray-400 text-sm block mb-1">IPFS Hash (CID):</Text>
                      <div className="flex items-center space-x-2">
                        <Text className="text-cyan-400 font-mono text-sm bg-gray-800 px-2 py-1 rounded flex-1 break-all">
                          {meme.ipfsHash}
                        </Text>
                        <Button
                          size="small"
                          icon={<LinkOutlined />}
                          href={`https://gateway.pinata.cloud/ipfs/${meme.ipfsHash}`}
                          target="_blank"
                          className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {meme.transactionHash && (
                    <div>
                      <Text className="text-gray-400 text-sm block mb-1">Blockchain Transaction:</Text>
                      <div className="flex items-center space-x-2">
                        <Text className="text-purple-400 font-mono text-sm bg-gray-800 px-2 py-1 rounded flex-1 break-all">
                          {meme.transactionHash}
                        </Text>
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          href={`https://explorer.aptoslabs.com/txn/${meme.transactionHash}?network=testnet`}
                          target="_blank"
                          className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                        >
                          Explorer
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <Text className="text-gray-400">
                        <ClockCircleOutlined className="mr-1" />
                        Submitted to Arena
                      </Text>
                      <Text className="text-gray-300">
                        {new Date().toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Divider className="border-gray-700 my-6" />

        {/* Footer */}
        <div className="text-center">
          <Text className="text-gray-500 text-sm">
            This meme is permanently stored on IPFS and recorded on the Aptos blockchain.
            <br />
            Vote counts are updated in real-time and secured by decentralized technology.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default MemeDetailModal;