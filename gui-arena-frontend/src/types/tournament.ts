export interface Tournament {
  id: string;
  title: string;
  creator: string;
  entry_fee: number;
  start_time: number;
  end_time: number;
  voting_end_time: number;
  max_participants: number;
  state: TournamentState;
  total_prize_pool: number;
  participant_addresses: string[];
  winner_addresses: string[];
}

export interface Submission {
  id: string;
  title: string;
  creator: string;
  ipfs_hash: string;
  url: string;
  timestamp: number;
  quadratic_score: number;
  votes: number;
  votingDeadline: number;
  submitter: string;
}

export interface Vote {
  voter: string;
  submission_creator: string;
  weight: number;
  timestamp: number;
}

export interface Winner {
  address: string;
  score: number;
  rank: number;
  prize_amount: number;
}

export interface LeaderboardEntry {
  id: string;
  title: string;
  submitter: string;
  votes: number;
  percentage: number;
  rank: number;
}

export enum TournamentState {
  UPCOMING = 0,
  ACTIVE = 1,
  VOTING = 2,
  ENDED = 3
}

export interface WalletInfo {
  address: string;
  publicKey: string;
  connected: boolean;
}

export interface ContractEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface PlatformStats {
  totalTournaments: number;
  totalSubmissions: number;
  totalVotes: number;
  totalPrizePool: number;
}