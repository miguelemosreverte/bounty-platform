import BountyPlatformABI from '../../abis/BountyPlatform.json';
import LeaderboardABI from '../../abis/Leaderboard.json';

export const BOUNTY_PLATFORM = {
  address: (process.env.NEXT_PUBLIC_BOUNTY_CONTRACT || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  abi: BountyPlatformABI,
} as const;

export const LEADERBOARD = {
  address: (process.env.NEXT_PUBLIC_LEADERBOARD_CONTRACT || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  abi: LeaderboardABI,
} as const;
