export interface Meme {
  id: number;
  title: string;
  imageUrl: string;
  ipfsHash?: string;
  creator: string;
  votes: number;
  transactionHash?: string;
}

export interface Tournament {
  id: number;
  title: string;
  creator: string;
  submission_deadline: number;
  voting_deadline: number;
  is_active: boolean;
  total_submissions: number;
  total_votes: number;
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