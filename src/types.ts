export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'SHINY' | 'EPIC';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  rarity: Rarity;
  mintNumber: number;
  obtainedAt: number;
  isFavorite?: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Drop {
  id: string;
  lat: number;
  lng: number;
  rarity: Rarity;
  genre: string;
  artistLimit?: string; // e.g. "Taylor Swift" specific drop
  claimedAt?: number; // timestamp if claimed, used for cooldown
  name: string;
}

export interface Badge {
  id: string;
  artist: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  icon: string;
  description: string;
  unlockedAt: number;
}

export interface TriviaQuest {
  id: string;
  artist: string;
  question: string;
  options: string[];
  correctIndex: number;
  coinsReward: number;
  xpReward: number;
  completed?: boolean;
}

export interface TradeOffer {
  id: string;
  senderId: string;
  senderName: string;
  offeredSongs: Song[];
  requestedCoins: number;
  requestedCriteria?: {
    rarity?: Rarity;
    artist?: string;
    genre?: string;
  };
  status: 'OPEN' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  bids: TradeBid[];
  createdAt: number;
}

export interface TradeBid {
  id: string;
  bidderId: string;
  bidderName: string;
  offeredCoins: number;
  offeredSongs: Song[];
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: number;
}

export interface UserStats {
  coins: number;
  xp: number;
  level: number;
  premium: boolean;
  radarLevel: number; // 1 to 5
  favorites: {
    artists: string[];
    genres: string[];
  };
  inventory: Song[];
  badges: Badge[];
  streak?: number;
  lastLoginDate?: string;
  dailyChallengeProgress?: number;
  dailyChallengeClaimed?: boolean;
  lastChallengeDate?: string;
}

export interface LeaderboardEntry {
  username: string;
  avatarUrl: string;
  xp: number;
  level: number;
  songCount: number;
  rareCount: number;
  isSelf?: boolean;
}

export interface DiscoveryComment {
  id: string;
  authorName: string;
  avatarUrl: string;
  text: string;
  timestamp: number;
}

export interface DiscoveryItem {
  id: string;
  collectorName: string;
  collectorAvatar: string;
  isFriend: boolean;
  distanceMeters: number;
  song: Song;
  likes: number;
  likedByMe: boolean;
  comments: DiscoveryComment[];
  collectedAt: number;
}

