export interface Meme {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  ipfsHash: string;
  creator: string;
  votes: number;
  createdAt: number;
  tags?: string[];
}

export interface VotingMeme extends Meme {
  rank: number;
  percentage: number;
  hasVoted: boolean;
}

export interface MemeVotingProps {
  memes?: Meme[];
  userVotes?: number[];
  onVote?: (memeId: number) => Promise<void>;
  loading?: boolean;
}

export interface User {
  address: string;
  votes: number[];
  submissions: number[];
  joinedAt: number;
}

export interface VoteTransaction {
  memeId: number;
  voter: string;
  timestamp: number;
  transactionHash?: string;
}

export interface LeaderboardEntry {
  meme: Meme;
  rank: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ArenaStats {
  totalMemes: number;
  totalVotes: number;
  activeUsers: number;
  topMeme: Meme | null;
  recentActivity: VoteTransaction[];
}