import React, { useState, useEffect } from 'react';
import { 
  Compass, Disc, ArrowLeftRight, Trophy, ShoppingBag, 
  Coins, Sparkles, User, LogOut, Check, Star, Play, Music, Flame, Lock, Radio
} from 'lucide-react';
import MusicRadarMap from './components/MusicRadarMap';
import CollectionAlbum from './components/CollectionAlbum';
import TradeMarketplace from './components/TradeMarketplace';
import QuestBoard from './components/QuestBoard';
import ShopStore from './components/ShopStore';
import DiscoveryFeed from './components/DiscoveryFeed';
import { Drop, Song, UserStats, TradeOffer, TriviaQuest, Rarity, Badge } from './types';

// Brooklyn Brooklyn coordinate coordinates (Coordinates where hip hop was born)
const DEFAULT_LAT = 40.6782;
const DEFAULT_LNG = -73.9442;

// Auto-seed initial list of active surrounding drops
function generateNearbyDrops(lat: number, lng: number): Drop[] {
  const genres = ['Pop', 'Hip Hop', 'Electronic', 'Rock', 'R&B/Indie'];
  const rarities: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'SHINY', 'EPIC'];
  const artistSpecific = ['Taylor Swift', 'Kendrick Lamar', 'Daft Punk', 'The Weeknd', 'Billie Eilish'];

  return Array.from({ length: 9 }).map((_, i) => {
    // Spread coordinate offsets between -0.003 and +0.003 (~300m range)
    const latOffset = (Math.random() - 0.5) * 0.006;
    const lngOffset = (Math.random() - 0.5) * 0.006;
    const genre = genres[Math.floor(Math.random() * genres.length)];
    
    // Weight rarities
    const rareRand = Math.random();
    let rarity: Rarity = 'COMMON';
    if (rareRand > 0.97) rarity = 'EPIC';
    else if (rareRand > 0.90) rarity = 'SHINY';
    else if (rareRand > 0.75) rarity = 'RARE';
    else if (rareRand > 0.50) rarity = 'UNCOMMON';

    const isArtistSpecific = Math.random() > 0.6;
    const specArtist = isArtistSpecific ? artistSpecific[Math.floor(Math.random() * artistSpecific.length)] : undefined;

    return {
      id: 'drop_' + Math.random().toString(36).substr(2, 9),
      lat: lat + latOffset,
      lng: lng + lngOffset,
      rarity,
      genre,
      artistLimit: specArtist,
      name: specArtist ? `${specArtist} Drop` : `${genre} Drop`
    };
  });
}

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'album' | 'trade' | 'quest' | 'shop' | 'discovery'>('map');
  const [deviceTime, setDeviceTime] = useState('12:00 PM');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDeviceTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // Notifications systems
  const [notifications, setNotifications] = useState<{ id: string; msg: string; type: 'streak' | 'challenge' | 'quest' }[]>([]);

  const triggerToast = (msg: string, type: 'streak' | 'challenge' | 'quest') => {
    const id = Math.random().toString();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  // Daily Challenge catalogue and current daily task selector
  const DAILY_CHALLENGES = [
    { id: 'dc_1', description: 'Collect 3 Uncommon (or higher) songs from the map', targetCount: 3, rewardCoins: 150, rewardXP: 60, progressKey: 'collect_uncommon' as const },
    { id: 'dc_2', description: 'Collect 5 songs from anywhere in the city', targetCount: 5, rewardCoins: 200, rewardXP: 80, progressKey: 'collect_any' as const },
    { id: 'dc_3', description: 'Solve 1 lyrics trivia correctly on the Quest Board', targetCount: 1, rewardCoins: 120, rewardXP: 50, progressKey: 'solve_trivia' as const },
    { id: 'dc_4', description: 'Execute a new trade bid or NPC swap', targetCount: 1, rewardCoins: 180, rewardXP: 70, progressKey: 'make_trade' as const },
    { id: 'dc_5', description: 'Collect any RARE (or higher) master track', targetCount: 1, rewardCoins: 250, rewardXP: 100, progressKey: 'collect_rare' as const }
  ];

  const getLocalDateString = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getDaysBetween = (date1Str: string, date2Str: string) => {
    const d1 = new Date(date1Str + 'T00:00:00');
    const d2 = new Date(date2Str + 'T00:00:00');
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDailyChallengeForToday = () => {
    const dateStr = getLocalDateString();
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash += dateStr.charCodeAt(i);
    }
    const idx = hash % DAILY_CHALLENGES.length;
    return DAILY_CHALLENGES[idx];
  };

  const currentChallenge = getDailyChallengeForToday();

  // Onboarding parameters
  const [username, setUsername] = useState('');
  const [favArtists, setFavArtists] = useState<string[]>([]);
  const [favGenres, setFavGenres] = useState<string[]>([]);
  const [inputArtist, setInputArtist] = useState('');

  // User details
  const [userStats, setUserStats] = useState<UserStats>({
    coins: 850,
    xp: 0,
    level: 1,
    premium: false,
    radarLevel: 1,
    favorites: { artists: [], genres: [] },
    inventory: [],
    badges: [],
    streak: 1
  });

  const [playerPos, setPlayerPos] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [drops, setDrops] = useState<Drop[]>([]);
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([]);
  
  // Custom game states
  const [openingSong, setOpeningSong] = useState<Song | null>(null);
  const [claimingDropId, setClaimingDropId] = useState<string | null>(null);
  const [isOpeningSpinner, setIsOpeningSpinner] = useState(false);
  
  // Trivia
  const [activeTrivia, setActiveTrivia] = useState<TriviaQuest | null>(null);
  const [loadingTrivia, setLoadingTrivia] = useState(false);

  // Load state on start
  useEffect(() => {
    const savedStats = localStorage.getItem('soundmap_stats');
    const savedUser = localStorage.getItem('soundmap_user');
    const savedPos = localStorage.getItem('soundmap_pos');

    if (savedUser && savedStats) {
      const parsedStats = JSON.parse(savedStats) as UserStats;
      setUserStats(parsedStats);
      setUsername(savedUser);
      setIsOnboarded(true);
    }
    if (savedPos) {
      setPlayerPos(JSON.parse(savedPos));
    }
  }, []);

  // Daily Streak & Challenge reset logic on active session sync
  useEffect(() => {
    if (!isOnboarded) return;

    const todayStr = getLocalDateString();
    let statsChanged = false;
    const updated = { ...userStats };

    // 1. Reset daily challenge progress if calendar date has advanced
    if (updated.lastChallengeDate !== todayStr) {
      updated.dailyChallengeProgress = 0;
      updated.dailyChallengeClaimed = false;
      updated.lastChallengeDate = todayStr;
      statsChanged = true;
    }

    // 2. Evaluate consecutive day logins and pay bonuses
    if (!updated.lastLoginDate) {
      updated.streak = 1;
      updated.lastLoginDate = todayStr;
      updated.coins += 50;
      updated.xp += 20;
      statsChanged = true;

      setTimeout(() => {
        triggerToast("Daily Login Streak Initialized! Welcome Bonus rewarded: +50 Coins & +20 XP 🔥", "streak");
      }, 1200);
    } else if (updated.lastLoginDate !== todayStr) {
      const elapsedDays = getDaysBetween(updated.lastLoginDate, todayStr);
      updated.lastLoginDate = todayStr;

      let goldPay = 0;
      let xpPay = 0;

      if (elapsedDays === 1) {
        updated.streak = (updated.streak || 0) + 1;
        goldPay = (updated.streak || 1) * 50;
        xpPay = (updated.streak || 1) * 20;
        updated.coins += goldPay;

        let totalXp = updated.xp + xpPay;
        const requiredXp = updated.level * 500;
        if (totalXp >= requiredXp) {
          totalXp -= requiredXp;
          updated.level += 1;
        }
        updated.xp = totalXp;
        statsChanged = true;

        const currentStreakNum = updated.streak;
        setTimeout(() => {
          triggerToast(`🔥 Login Streak multiplied: Day ${currentStreakNum}! Claimed: +${goldPay} Coins & +${xpPay} XP.`, "streak");
        }, 1200);
      } else {
        // Streak broken
        updated.streak = 1;
        goldPay = 50;
        xpPay = 20;
        updated.coins += goldPay;
        updated.xp += xpPay;
        statsChanged = true;

        setTimeout(() => {
          triggerToast("Oh no, daily streak was broken! Re-starting at Day 1. Welcome Bonus: +50 Coins & +20 XP 🔥", "streak");
        }, 1200);
      }
    }

    if (statsChanged) {
      saveUserStats(updated);
    }
  }, [isOnboarded]);

  const incrementChallengeProgress = (progressKey: string, amount: number = 1) => {
    const todayStr = getLocalDateString();
    const challenge = getDailyChallengeForToday();

    if (challenge.progressKey === progressKey) {
      const updated = { ...userStats };

      // Initialize safeguards
      if (updated.lastChallengeDate !== todayStr) {
        updated.dailyChallengeProgress = 0;
        updated.dailyChallengeClaimed = false;
        updated.lastChallengeDate = todayStr;
      }

      const prevProg = updated.dailyChallengeProgress || 0;
      if (prevProg < challenge.targetCount) {
        const nextProg = prevProg + amount;
        updated.dailyChallengeProgress = nextProg;
        saveUserStats(updated);

        if (nextProg >= challenge.targetCount) {
          triggerToast(`🎯 Daily Challenge COMPLETE! "${challenge.description}". Claim your bonuses in your Inbox channels!`, "challenge");
        } else {
          triggerToast(`🎯 Challenge progress: ${nextProg}/${challenge.targetCount} for "${challenge.description}"`, "challenge");
        }
      }
    }
  };

  const handleClaimChallengeReward = () => {
    const todayStr = getLocalDateString();
    
    if ((userStats.dailyChallengeProgress || 0) < currentChallenge.targetCount) return;
    if (userStats.dailyChallengeClaimed) return;

    let totalCoins = userStats.coins + currentChallenge.rewardCoins;
    let newXP = userStats.xp + currentChallenge.rewardXP;
    let newLevel = userStats.level;
    const xpNeeded = newLevel * 500;

    if (newXP >= xpNeeded) {
      newXP -= xpNeeded;
      newLevel += 1;
    }

    saveUserStats({
      ...userStats,
      coins: totalCoins,
      xp: newXP,
      level: newLevel,
      dailyChallengeClaimed: true
    });

    triggerToast(`🏆 Claimed Challenge: +${currentChallenge.rewardCoins} Coins & +${currentChallenge.rewardXP} XP!`, "challenge");
  };

  // Generate initial drops on position sync
  useEffect(() => {
    if (isOnboarded) {
      setDrops(generateNearbyDrops(playerPos.lat, playerPos.lng));
      localStorage.setItem('soundmap_pos', JSON.stringify(playerPos));
    }
  }, [isOnboarded]);

  // Load NPC trade offers from server on mount
  useEffect(() => {
    if (!isOnboarded) return;
    
    const fetchNPCTrades = async () => {
      try {
        const response = await fetch('/api/npc-trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userArtists: userStats.favorites.artists })
        });
        const data = await response.json();
        if (data.success) {
          setTradeOffers(data.offers);
        }
      } catch (e) {
        console.warn('Failed to load NPC trade offers:', e);
      }
    };
    fetchNPCTrades();
  }, [isOnboarded, userStats.favorites.artists]);

  // Save changes to localstorage
  const saveUserStats = (updated: UserStats) => {
    setUserStats(updated);
    localStorage.setItem('soundmap_stats', JSON.stringify(updated));
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return alert("Please enter your DJ username!");
    if (favArtists.length === 0) return alert("Select at least 1 favorite artist to populate drops!");
    if (favGenres.length === 0) return alert("Select at least 1 music genre preference!");

    const initialStats: UserStats = {
      coins: 850,
      xp: 0,
      level: 1,
      premium: false,
      radarLevel: 1,
      favorites: {
        artists: favArtists,
        genres: favGenres
      },
      inventory: [],
      badges: []
    };

    localStorage.setItem('soundmap_user', username);
    saveUserStats(initialStats);
    setIsOnboarded(true);
  };

  const addFavoriteArtist = () => {
    if (inputArtist.trim() && !favArtists.includes(inputArtist.trim())) {
      setFavArtists([...favArtists, inputArtist.trim()]);
      setInputArtist('');
    }
  };

  const toggleFavoriteGenre = (genre: string) => {
    if (favGenres.includes(genre)) {
      setFavGenres(favGenres.filter(g => g !== genre));
    } else {
      setFavGenres([...favGenres, genre]);
    }
  };

  // Sync simulated coordinate walking relocations
  const handlePlayerMove = (lat: number, lng: number) => {
    setPlayerPos({ lat, lng });

    // Spawn replacement drops if they walk far from past cluster
    if (Math.random() > 0.7) {
      setDrops(prev => {
        const kept = prev.filter(d => Math.abs(d.lat - lat) < 0.01 && Math.abs(d.lng - lng) < 0.01);
        const fresh = generateNearbyDrops(lat, lng).slice(0, 3);
        return [...kept, ...fresh];
      });
    }
  };

  // Scan and claim drop: starts gorgeous rotating record animation reward
  const handleClaimDrop = async (dropId: string) => {
    const drop = drops.find(d => d.id === dropId);
    if (!drop) return;

    setClaimingDropId(dropId);
    setIsOpeningSpinner(true);

    try {
      // Pick artist to generate track for: 70% chance of pulling favorite artist, 30% generic genre artist based on drop tags
      const pullFav = Math.random() > 0.25 && userStats.favorites.artists.length > 0;
      const targetArtist = pullFav 
        ? userStats.favorites.artists[Math.floor(Math.random() * userStats.favorites.artists.length)]
        : drop.artistLimit;

      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: targetArtist,
          genre: drop.genre,
          rarity: drop.rarity
        })
      });

      const data = await response.json();
      if (data.success) {
        setOpeningSong(data.song);
      }
    } catch (e) {
      console.error('Song generation failure:', e);
    } finally {
      setIsOpeningSpinner(false);
    }
  };

  // Keep reward track: adds coins, XP, and triggers level up animations
  const handleKeepSong = () => {
    if (!openingSong) return;

    const updatedInventory = [...userStats.inventory, openingSong];
    
    // Add rewards based on rarity
    let coinBonus = 40;
    let xpBonus = 50;

    if (openingSong.rarity === 'UNCOMMON') { coinBonus = 80; xpBonus = 80; }
    if (openingSong.rarity === 'RARE') { coinBonus = 180; xpBonus = 120; }
    if (openingSong.rarity === 'SHINY') { coinBonus = 350; xpBonus = 200; }
    if (openingSong.rarity === 'EPIC') { coinBonus = 700; xpBonus = 400; }

    let newXP = userStats.xp + xpBonus;
    let newLevel = userStats.level;
    const xpNeeded = newLevel * 500;

    if (newXP >= xpNeeded) {
      newXP -= xpNeeded;
      newLevel += 1;
    }

    // Check for standard badges unlocks based on song counts of the artist
    const matchingArtistSongs = updatedInventory.filter(s => s.artist.toLowerCase() === openingSong.artist.toLowerCase());
    const matchCount = matchingArtistSongs.length;
    let newBadges = [...userStats.badges];

    const hasBronze = newBadges.some(b => b.artist.toLowerCase() === openingSong.artist.toLowerCase() && b.tier === 'BRONZE');
    const hasSilver = newBadges.some(b => b.artist.toLowerCase() === openingSong.artist.toLowerCase() && b.tier === 'SILVER');
    const hasGold = newBadges.some(b => b.artist.toLowerCase() === openingSong.artist.toLowerCase() && b.tier === 'GOLD');

    if (matchCount >= 3 && !hasBronze) {
      newBadges.push({
        id: 'badge_' + Math.random().toString(36).substr(2, 5),
        artist: openingSong.artist,
        tier: 'BRONZE',
        icon: '🥉',
        description: `Collected 3 tracks of ${openingSong.artist}.`,
        unlockedAt: Date.now()
      });
      triggerToast(`🥉 Bronze Badge unlocked: ${openingSong.artist}!`, 'quest');
    } else if (matchCount >= 7 && !hasSilver) {
      newBadges.push({
        id: 'badge_' + Math.random().toString(36).substr(2, 5),
        artist: openingSong.artist,
        tier: 'SILVER',
        icon: '🥈',
        description: `Collected 7 tracks of ${openingSong.artist}.`,
        unlockedAt: Date.now()
      });
      triggerToast(`🥈 Silver Badge unlocked: ${openingSong.artist}!`, 'quest');
    } else if (matchCount >= 12 && !hasGold) {
      newBadges.push({
        id: 'badge_' + Math.random().toString(36).substr(2, 5),
        artist: openingSong.artist,
        tier: 'GOLD',
        icon: '🥇',
        description: `Collected 12 tracks of ${openingSong.artist}.`,
        unlockedAt: Date.now()
      });
      triggerToast(`🥇 Golden Master Badge unlocked: ${openingSong.artist}!`, 'quest');
    }

    // Track active discography quest percentage crossings (target limit 10 tracks)
    const prevCount = userStats.inventory.filter(s => s.artist.toLowerCase() === openingSong.artist.toLowerCase()).length;
    const prevPercent = (prevCount / 10) * 100;
    const curPercent = (matchCount / 10) * 100;

    if (prevPercent < 50 && curPercent >= 50) {
      triggerToast(`🏆 Discography progress: ${openingSong.artist} is 50% COMPLETE (5/10 tracks)!`, 'quest');
    } else if (prevPercent < 75 && curPercent >= 75) {
      triggerToast(`🚀 Discography progress: ${openingSong.artist} is 75% COMPLETE (8/10 tracks)!`, 'quest');
    } else if (prevPercent < 100 && curPercent >= 100) {
      triggerToast(`👑 Discography complete: 100% EXCELLENCE reaching ${openingSong.artist}!`, 'quest');
    }

    const updatedStats: UserStats = {
      ...userStats,
      coins: userStats.coins + coinBonus,
      xp: newXP,
      level: newLevel,
      inventory: updatedInventory,
      badges: newBadges
    };

    saveUserStats(updatedStats);

    // Dynamic daily challenges check triggers
    if (openingSong.rarity === 'UNCOMMON' || openingSong.rarity === 'RARE' || openingSong.rarity === 'SHINY' || openingSong.rarity === 'EPIC') {
      incrementChallengeProgress('collect_uncommon');
    }
    incrementChallengeProgress('collect_any');
    if (openingSong.rarity === 'RARE' || openingSong.rarity === 'SHINY' || openingSong.rarity === 'EPIC') {
      incrementChallengeProgress('collect_rare');
    }

    // Apply cooldown to claimed drop on the radar map
    if (claimingDropId) {
      setDrops(prev => prev.map(d => d.id === claimingDropId ? { ...d, claimedAt: Date.now() } : d));
    }

    // Close view
    setOpeningSong(null);
    setClaimingDropId(null);
  };

  // Fetch trivia question from server
  const handleLoadTrivia = async () => {
    setLoadingTrivia(true);
    try {
      const response = await fetch('/api/trivia-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favoriteArtists: userStats.favorites.artists })
      });
      const data = await response.json();
      if (data.success) {
        setActiveTrivia(data.trivia);
      }
    } catch (e) {
      console.error('Failed to generate trivia quest:', e);
    } finally {
      setLoadingTrivia(false);
    }
  };

  // Load initial trivia
  useEffect(() => {
    if (isOnboarded && activeTab === 'quest' && !activeTrivia) {
      handleLoadTrivia();
    }
  }, [isOnboarded, activeTab]);

  // Trivia validation and dynamic payouts
  const handleCheckTrivia = async (triviaId: string, idx: number): Promise<boolean> => {
    if (!activeTrivia) return false;
    const isCorrect = idx === activeTrivia.correctIndex;

    if (isCorrect) {
      let freshXP = userStats.xp + activeTrivia.xpReward;
      let freshLevel = userStats.level;
      if (freshXP >= freshLevel * 500) {
        freshXP -= freshLevel * 500;
        freshLevel += 1;
      }

      saveUserStats({
        ...userStats,
        coins: userStats.coins + activeTrivia.coinsReward,
        xp: freshXP,
        level: freshLevel
      });

      // Increment daily lyrical quest checklist progress
      incrementChallengeProgress('solve_trivia');
    }
    return isCorrect;
  };

  // Upgrades
  const handleUpgradeRadar = () => {
    const cost = userStats.radarLevel * 1000;
    if (userStats.coins < cost) return alert("Insufficient coins for sonar range tuning!");

    saveUserStats({
      ...userStats,
      coins: userStats.coins - cost,
      radarLevel: userStats.radarLevel + 1
    });
  };

  const handleUnlockPremium = () => {
    if (userStats.coins < 1500) return alert("Not enough coins to acquire Premium Pass!");

    saveUserStats({
      ...userStats,
      coins: userStats.coins - 1500,
      premium: true
    });
  };

  // Loot box opening
  const handleBuyCrate = async (genre: string, cost: number) => {
    if (userStats.coins < cost) return alert("Insufficient coins for loot casing claim!");

    setIsOpeningSpinner(true);
    try {
      // 5% shiny rate in normal crates
      const pullShiny = Math.random() > 0.85;
      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre,
          rarity: pullShiny ? 'SHINY' : 'COMMON'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Charge cost and open song opening popup
        saveUserStats({ ...userStats, coins: userStats.coins - cost });
        setOpeningSong(data.song);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsOpeningSpinner(false);
    }
  };

  // Publish offer to marketplace
  const handlePostTrade = (offered: Song[], askedCoins: number, requestedCriteria: any) => {
    // Deduct song temporarily from active inventory
    const updatedInv = userStats.inventory.filter(s => !offered.some(o => o.id === s.id));
    saveUserStats({ ...userStats, inventory: updatedInv });

    const newOffer: TradeOffer = {
      id: 'trade_user_' + Math.random().toString(36).substr(2, 5),
      senderId: 'local_user',
      senderName: 'You (Local User)',
      offeredSongs: offered,
      requestedCoins: askedCoins,
      requestedCriteria,
      status: 'OPEN',
      bids: [],
      createdAt: Date.now()
    };

    setTradeOffers([newOffer, ...tradeOffers]);

    // Simulate an NPC bid response on your trade after 12 seconds to make the marketplace feel highly dynamic and active!
    setTimeout(() => {
      setTradeOffers(prev => prev.map(offer => {
        if (offer.id === newOffer.id) {
          const npcBid = {
            id: 'bid_npc_' + Math.random().toString(36).substr(2, 5),
            bidderId: 'npc_bidder',
            bidderName: 'VinylCollector99',
            offeredCoins: askedCoins + 100,
            offeredSongs: [],
            status: 'PENDING' as const,
            createdAt: Date.now()
          };
          return { ...offer, bids: [npcBid, ...offer.bids] };
        }
        return offer;
      }));
    }, 9000);
  };

  // Bid on another trace (simulated NPC valuation negotiation!)
  const handleBidOnTrade = (offerId: string, bidCoins: number, bidSongs: Song[]) => {
    const targetOffer = tradeOffers.find(o => o.id === offerId);
    if (!targetOffer) return;

    const bidId = 'bid_user_' + Math.random().toString(36).substr(2, 5);
    const userBid = {
      id: bidId,
      bidderId: 'local_user',
      bidderName: 'You (DJs)',
      offeredCoins: bidCoins,
      offeredSongs: bidSongs,
      status: 'PENDING' as const,
      createdAt: Date.now()
    };

    // Add bid to offer
    setTradeOffers(prev => prev.map(o => o.id === offerId ? { ...o, bids: [userBid, ...o.bids] } : o));

    // NPC evaluates the bid within 2.5 seconds
    setTimeout(() => {
      setTradeOffers(prev => {
        return prev.map(o => {
          if (o.id === offerId) {
            // Valuation logic
            const totalValues = bidCoins + (bidSongs.length * 200);
            const isFair = totalValues >= o.requestedCoins * 0.9;

            if (isFair) {
              alert(`🎉 YES! ${o.senderName} accepted your trade query! "${o.offeredSongs[0].title}" has been successfully added to your Collection shelf.`);
              // Transfer ownership
              const newSongWithOwner = { ...o.offeredSongs[0], obtainedAt: Date.now() };
              saveUserStats({
                ...userStats,
                coins: userStats.coins - bidCoins,
                // Deduct any bid songs offered
                inventory: [...userStats.inventory.filter(s => !bidSongs.some(b => b.id === s.id)), newSongWithOwner]
              });

              // Increment daily trade checklist progress
              incrementChallengeProgress('make_trade');

              return { ...o, status: 'ACCEPTED' as const };
            } else {
              alert(`❌ DECLINED! ${o.senderName} says: "Your valuation of ${totalValues} values is too low for my ${o.offeredSongs[0].title}. Please up your bid!"`);
              return {
                ...o,
                bids: o.bids.map(b => b.id === bidId ? { ...b, status: 'DECLINED' as const } : b)
              };
            }
          }
          return o;
        });
      });
    }, 2000);
  };

  const handleAcceptBid = (offerId: string, bidId: string) => {
    const offer = tradeOffers.find(o => o.id === offerId);
    const bid = offer?.bids.find(b => b.id === bidId);

    if (!offer || !bid) return;

    // Gain coins & counteroffer songs
    const updatedInventory = [...userStats.inventory, ...bid.offeredSongs];
    saveUserStats({
      ...userStats,
      coins: userStats.coins + bid.offeredCoins,
      inventory: updatedInventory
    });

    // Close offer
    setTradeOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'ACCEPTED' as const } : o));
    
    // Increment daily trade checklist progress
    incrementChallengeProgress('make_trade');

    alert("Trade Accepted successfully! Check your inventory shelf and coin multipliers.");
  };

  const handleDeclineBid = (offerId: string, bidId: string) => {
    setTradeOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          bids: o.bids.map(b => b.id === bidId ? { ...b, status: 'DECLINED' as const } : b)
        };
      }
      return o;
    }));
  };

  const handleLogout = () => {
    if (confirm("Disconnect collection and clear persistence data?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Convert radar upgrade level to coordinates range limit
  const baseRange = 80; // in pixels matching radar map sizing physically
  const searchRadiusPixels = baseRange + (userStats.radarLevel - 1) * 15 + (userStats.premium ? 30 : 0);

  return (
    <div className="bg-[#070913] min-h-screen w-full flex flex-col items-center justify-center font-sans select-none relative text-slate-100 selection:bg-[#FF0080]/30 overflow-hidden p-0 md:p-6">
      
      {/* Premium laser background mesh spacing */}
      <div className="absolute inset-0 bg-[#070913] bg-[linear-gradient(to_right,#00d1ff04_1px,transparent_1px),linear-gradient(to_bottom,#00d1ff04_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF0080]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#7928CA]/5 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Desktop Workspace Title Info */}
      <div className="hidden md:flex flex-col items-center mb-4 z-10 text-center">
        <div className="flex items-center gap-2 text-white font-extrabold tracking-tight uppercase text-base">
          <span className="p-1 px-2.5 bg-gradient-to-r from-[#FF0080] to-[#7928CA] rounded-lg text-white font-black italic tracking-tighter text-[10px] mr-1 shadow-lg shadow-[#FF0080]/15">SOUNDMAP</span>
          Interactive Mobile Client
        </div>
        <p className="text-[10px] text-slate-400 font-mono mt-1">
          Currently simulating a bezel-less iOS/Android smartphone viewport. Designed for tactile click actions.
        </p>
      </div>

      {/* MOBILE DEVICE SHELL CONTAINER */}
      <div className="relative w-full max-w-[395px] h-screen md:h-[844px] bg-[#000000] border-0 md:border-[10px] border-[#1E293B] rounded-none md:rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col group transition-all duration-300 ring-0 md:ring-4 ring-[#1E293B]/20 md:scale-[0.98] lg:scale-100">
        
        {/* PHYSICAL CAMERA DYNAMIC ISLAND */}
        <div className="hidden md:flex absolute top-2 w-[110px] h-[26px] bg-black left-1/2 -translate-x-1/2 rounded-full z-50 items-center justify-center p-0.5 border border-slate-900/40 pointer-events-none">
          <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full border border-zinc-950 absolute left-4 flex items-center justify-center">
            <div className="w-1 h-1 bg-indigo-950 rounded-full" />
          </div>
          <div className="w-10 h-0.5 bg-zinc-950 rounded-full absolute top-1" />
          <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full absolute right-5" />
        </div>

        {/* NATIVE MOBILE STATUS BAR */}
        <div className="h-10 bg-[#1E293B] flex items-center justify-between px-6 shrink-0 text-white select-none z-45 border-b border-[#334155]/10 font-mono text-[10px] font-extrabold">
          <span className="text-[10px] tracking-tight">{deviceTime}</span>
          <div className="flex items-center gap-1.5">
            {/* Cellular Network Signal Bars */}
            <div className="flex items-end gap-0.5 h-2">
              <div className="w-[1.5px] h-1 bg-white rounded-full" />
              <div className="w-[1.5px] h-1.5 bg-white rounded-full" />
              <div className="w-[1.5px] h-2 bg-white rounded-full" />
              <div className="w-[1.5px] h-2.5 bg-white rounded-full animate-pulse" />
            </div>
            <span className="text-[8px] tracking-tighter opacity-90">5G</span>
            {/* Wi-Fi Wave Icon */}
            <svg className="w-3 h-3 fill-current text-slate-100" viewBox="0 0 24 24">
              <path d="M12 21a2 2 0 1 1-2-2 2 2 0 0 1 2 2zm0-5a7 7 0 0 0-7 7h2a5 5 0 0 1 5-5 5 5 0 0 1 5 5h2a7 7 0 0 0-7-7zm0-5a12 12 0 0 0-12 12h2a10 10 0 0 1 10-10 10 10 0 0 1 10 10h2a12 12 0 0 0-12-12zm0-5a17 17 0 0 0-17 17h2a15 15 0 0 1 15-15 15 15 0 0 1 15 15h2a17 17 0 0 0-17-17z"/>
            </svg>
            {/* Battery Graphics Cell */}
            <div className="flex items-center gap-1 bg-white/15 p-[1.5px] px-1 rounded-[3px] text-[8px] font-black border border-white/5 font-mono">
              <span>98%</span>
              <div className="w-3 h-1.5 bg-emerald-500 rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* SCREEN PORT CORE */}
        <div className="flex-1 min-h-0 bg-[#0F172A] text-slate-100 flex flex-col font-sans overflow-hidden relative">

          {/* DISCOVERY ACCENT OVERLAYS */}
          {openingSong && (
            <div className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-[#1E293B] border border-[#475569] rounded-3xl p-6 max-w-[310px] w-full text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
                  openingSong.rarity === 'COMMON' ? 'bg-[#00D1FF]' :
                  openingSong.rarity === 'UNCOMMON' ? 'bg-[#7928CA]' :
                  openingSong.rarity === 'RARE' ? 'bg-[#FFD700]' :
                  openingSong.rarity === 'SHINY' ? 'bg-[#FF0080]' : 'bg-[#00FF00]'
                }`} />

                <span className="inline-block text-[8px] font-mono px-2.5 py-0.5 border border-[#334155]/60 rounded-full font-bold uppercase tracking-wider bg-[#0F172A] text-[#94A3B8]">
                  🎁 Drop Discovered
                </span>

                <div className="my-6 relative flex justify-center">
                  <div className={`w-28 h-28 border-4 bg-[#0F172A] rounded-full flex items-center justify-center animate-spin duration-[6.5s] shadow-2xl ${
                    openingSong.rarity === 'COMMON' ? 'border-[#00D1FF]/40' :
                    openingSong.rarity === 'UNCOMMON' ? 'border-[#7928CA]/40' :
                    openingSong.rarity === 'RARE' ? 'border-[#FFD700]/40' :
                    openingSong.rarity === 'SHINY' ? 'border-[#FF0080]/40 shadow-[#FF0080]/15' : 'border-[#00FF00]/40 shadow-[#00FF00]/15'
                  }`}>
                    <div className="w-20 h-20 border border-[#1E293B] rounded-full flex items-center justify-center">
                      <div className="w-14 h-14 border border-[#334155]/30 rounded-full flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          openingSong.rarity === 'COMMON' ? 'bg-[#00D1FF]/10 text-[#00D1FF]' :
                          openingSong.rarity === 'UNCOMMON' ? 'bg-[#7928CA]/10 text-purple-300' :
                          openingSong.rarity === 'RARE' ? 'bg-[#FFD700]/10 text-[#FFD700]' :
                          openingSong.rarity === 'SHINY' ? 'bg-[#FF0080]/10 text-[#FF0080]' : 'bg-[#00FF00]/10 text-[#00FF00]'
                        }`}>
                          💿
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 relative z-10">
                  <span className="text-[8px] font-mono uppercase font-black text-slate-450">
                    {openingSong.rarity} TRACK #{openingSong.mintNumber}
                  </span>
                  
                  <h3 className="text-sm font-extrabold text-white font-sans tracking-tight leading-snug">
                    {openingSong.title}
                  </h3>
                  <p className="text-[11px] text-[#00D1FF] font-mono font-medium">{openingSong.artist}</p>
                  
                  <p className="text-[9px] text-[#94A3B8] font-mono pt-1">
                    Album: {openingSong.album} · Genre: {openingSong.genre}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleKeepSong}
                  className="mt-6 w-full bg-gradient-to-r from-[#FF0080] to-[#7928CA] text-white font-mono font-bold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  ✓ Claim & Add to Shelf
                </button>
              </div>
            </div>
          )}

          {isOpeningSpinner && (
            <div className="absolute inset-0 bg-[#0F172A]/85 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center">
                <Disc className="w-10 h-10 text-[#FF0080] animate-spin mx-auto mb-2" />
                <p className="text-[11px] text-[#94A3B8] font-mono">Opening Lootcase Container...</p>
                <p className="text-[9px] text-slate-500 mt-1">Spinning vinyl to find songs.</p>
              </div>
            </div>
          )}

          {/* ACTIVE ONBOARDING IN DEVICE VIEW */}
          {!isOnboarded ? (
            <div className="flex-1 flex flex-col p-5 overflow-y-auto relative bg-[#0F172A] pt-8">
              <div className="absolute top-10 left-10 w-44 h-44 bg-[#FF0080]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 right-10 w-44 h-44 bg-[#7928CA]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative text-center shrink-0 mb-6">
                <div className="inline-flex w-12 h-12 bg-gradient-to-tr from-[#FF0080] to-[#7928CA] rounded-2xl items-center justify-center font-black text-2xl italic tracking-tighter text-white shadow-lg shadow-[#FF0080]/30 animate-pulse mb-3">
                  SM
                </div>
                <h2 className="text-base font-extrabold text-white flex items-center justify-center gap-1.5 uppercase font-display tracking-tight">
                  <Sparkles className="w-4 h-4 text-[#FF0080]" />
                  Tune Your Station
                </h2>
                <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5 leading-snug">
                  Setup your sound profile to spawn nearby music notes and generate trivia.
                </p>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="space-y-4 flex-1 min-h-0 flex flex-col justify-between">
                <div className="bg-[#1E293B]/70 border border-[#334155]/40 p-4 rounded-2xl space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono text-[#94A3B8] mb-1 uppercase font-bold tracking-wider">
                      DJ Collector Name:
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. LaserVibes"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-2 pl-9 pr-3 text-[11px] font-mono text-slate-250 focus:border-[#FF0080] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-[#94A3B8] mb-1 uppercase font-bold tracking-wider">
                      Favorite Artist (Min 1):
                    </label>
                    <div className="flex gap-1.5 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. Daft Punk"
                        value={inputArtist}
                        onChange={(e) => setInputArtist(e.target.value)}
                        className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl py-1.5 px-3 text-[11px] font-mono text-slate-300 focus:border-[#FF0080] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={addFavoriteArtist}
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-slate-300 border border-[#334155] font-mono font-bold text-[10px] p-1.5 px-3 rounded-xl transition-all cursor-pointer active:scale-95"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {['Taylor Swift', 'Kendrick Lamar', 'Daft Punk', 'The Weeknd'].map((a) => {
                        const exists = favArtists.includes(a);
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => exists ? setFavArtists(favArtists.filter(item => item !== a)) : setFavArtists([...favArtists, a])}
                            className={`text-[8px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                              exists 
                                ? 'bg-[#7928CA]/30 border-[#7928CA] text-purple-300' 
                                : 'bg-[#0F172A] border-[#334155] text-[#94A3B8]'
                            }`}
                          >
                            {exists ? '✓' : '+'} {a}
                          </button>
                        );
                      })}
                    </div>

                    {favArtists.length > 0 && (
                      <div className="mt-2 bg-[#0F172A]/40 p-2 rounded-xl border border-[#334155]/40 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {favArtists.map((fArt) => (
                          <span key={fArt} className="bg-[#7928CA]/20 text-purple-300 border border-[#7928CA]/30 text-[8px] font-mono p-0.5 px-2 rounded-full">
                            {fArt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-[#94A3B8] mb-1 uppercase font-bold tracking-wider">
                      Preferred Genres:
                    </label>
                    <div className="grid grid-cols-2 gap-1 font-mono">
                      {['Pop', 'Hip Hop', 'Electronic', 'Rock', 'R&B/Indie'].map((g) => {
                        const isSelected = favGenres.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleFavoriteGenre(g)}
                            className={`py-1.5 rounded-xl text-[9px] font-mono font-bold border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-gradient-to-r from-[#FF0080] to-[#7928CA] text-white border-transparent' 
                                : 'bg-[#0F172A] border-[#334155] text-[#94A3B8]'
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#FF0080] to-[#7928CA] hover:from-[#FF0080]/95 hover:to-[#7928CA]/95 text-white font-mono font-black text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-tight"
                  >
                    Confirm & Enter Map
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ACTIVE APPLICATION CONTENT INSIDE PHONE SIMULATOR SCREEN */
            <>
              {/* PRIMARY APP HUD HEADER */}
              <header className="h-14 bg-[#1E293B] border-b border-[#334155]/60 flex items-center shrink-0 px-4 z-30 justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-tr from-[#FF0080] to-[#7928CA] rounded-xl flex items-center justify-center font-black text-sm italic tracking-tighter text-white shadow shadow-[#FF0080]/15">
                    SM
                  </div>
                  <div>
                    <h1 className="text-xs font-black tracking-tight uppercase text-white font-display">
                      Soundmap
                    </h1>
                    <p className="text-[7.5px] font-bold text-[#00D1FF] uppercase tracking-widest font-mono">
                      Mobile Client
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Streak Flame HUD */}
                  <div 
                    className="bg-[#0F172A] px-2 py-1 rounded-full border border-orange-500/30 flex items-center gap-1 font-mono font-bold text-[9px] text-orange-400 shadow-sm animate-pulse"
                    title={`Active consecutive day logins: ${userStats.streak || 1} days`}
                  >
                    <span>🔥</span>
                    <span>{userStats.streak || 1}d</span>
                  </div>

                  {/* Coin HUD */}
                  <div className="bg-[#0F172A] px-2 py-1 rounded-full border border-[#334155]/50 flex items-center gap-1 font-mono font-bold text-[10px] text-[#FFD700] shadow-sm">
                    <span>🪙</span>
                    <span>{userStats.coins}</span>
                  </div>

                  {/* Level HUD */}
                  <div className="bg-[#0F172A]/70 px-2 py-1 rounded-full border border-[#334155]/50 flex items-center gap-0.5 text-[9px] font-bold text-[#00FF00]">
                    <span className="text-[7px] uppercase text-slate-400 tracking-tight">LV</span>
                    <span className="font-mono">{userStats.level}</span>
                  </div>

                  {/* Logout session reset */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1 px-1.5 bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155]/80 rounded-full text-slate-400 hover:text-[#FF0080] transition-colors"
                    title="Reset Session Data"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              </header>

              {/* DYNAMIC VIEWPORT SCENE */}
              <div className="flex-1 min-h-0 relative flex flex-col">
                
                {activeTab === 'map' && (
                  <MusicRadarMap
                    drops={drops}
                    playerPos={playerPos}
                    onMove={handlePlayerMove}
                    onClaimDrop={handleClaimDrop}
                    radarRadius={searchRadiusPixels}
                    premium={userStats.premium}
                  />
                )}

                {activeTab === 'discovery' && (
                  <DiscoveryFeed
                    userStats={userStats}
                    djName={username}
                  />
                )}

                {activeTab === 'album' && (
                  <CollectionAlbum inventory={userStats.inventory} />
                )}

                {activeTab === 'trade' && (
                  <TradeMarketplace
                    tradeOffers={tradeOffers}
                    userStats={userStats}
                    onPostTrade={handlePostTrade}
                    onBidOnTrade={handleBidOnTrade}
                    onAcceptBid={handleAcceptBid}
                    onDeclineBid={handleDeclineBid}
                  />
                )}

                {activeTab === 'quest' && (
                  <QuestBoard
                    userStats={userStats}
                    onRefreshTrivia={handleLoadTrivia}
                    onCheckTriviaAnswer={handleCheckTrivia}
                    activeTrivia={activeTrivia}
                    loadingTrivia={loadingTrivia}
                    dailyChallenge={currentChallenge}
                    onClaimChallengeReward={handleClaimChallengeReward}
                  />
                )}

                {activeTab === 'shop' && (
                  <ShopStore
                    userStats={userStats}
                    onUpgradeRadar={handleUpgradeRadar}
                    onUnlockPremium={handleUnlockPremium}
                    onBuyCrate={handleBuyCrate}
                  />
                )}

              </div>

              {/* SLICK APP BOTTOM TAB CONTROLLER RAIL */}
              <div className="grid grid-cols-6 bg-[#1A2234] border-t border-[#334155]/50 pr-1 px-1 pt-1.5 pb-2 shrink-0 z-30 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className={`py-1 rounded-xl text-[9px] font-mono font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'map' ? 'bg-[#FF0080]/15 text-[#FF0080]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Compass className="w-4 h-4 shrink-0 transition-transform active:scale-110" />
                  <span>Map</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab('discovery')}
                  className={`py-1 rounded-xl text-[9px] font-mono font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'discovery' ? 'bg-[#00D1FF]/15 text-[#00D1FF]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Radio className="w-4 h-4 shrink-0 transition-transform active:scale-110	" />
                  <span>Feed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('album')}
                  className={`py-1 rounded-xl text-[9px] font-mono font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'album' ? 'bg-[#FFD700]/15 text-[#FFD700]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Disc className="w-4 h-4 shrink-0 transition-transform active:scale-110" />
                  <span>Shelf</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('trade')}
                  className={`py-1 rounded-xl text-[9px] font-mono font-bold transition-all flex flex-col items-center justify-center gap-1 pr-0.5 pl-0.5 relative cursor-pointer ${
                    activeTab === 'trade' ? 'bg-[#7928CA]/15 text-[#7928CA]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0 transition-transform active:scale-110" />
                  <span>Trade</span>
                  {tradeOffers.filter(o => o.senderId !== 'local_user' && o.status === 'OPEN').length > 0 && (
                    <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-[#FF0080] rounded-full ring-1 ring-zinc-950 animate-pulse" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('quest')}
                  className={`py-1 rounded-xl text-[9px] font-mono font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'quest' ? 'bg-[#00FF00]/15 text-[#00FF00]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0 transition-transform active:scale-110" />
                  <span>Quest</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('shop')}
                  className={`py-1 rounded-xl text-[9px] font-mono font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'shop' ? 'bg-amber-400/15 text-amber-400' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 shrink-0 transition-transform active:scale-110" />
                  <span>Shop</span>
                </button>
              </div>

              {/* FLOATING SYSTEM TOAST NOTIFICATIONS OVERLAY */}
              <div className="absolute top-16 left-4 right-4 z-50 flex flex-col gap-1.5 pointer-events-none">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="pointer-events-auto bg-[#0F172A]/95 backdrop-blur-md border border-[#334155] shadow-2xl p-2.5 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-4 duration-200 relative overflow-hidden"
                  >
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[#FF0080] to-[#7928CA]" />
                    <div className="text-xs shrink-0 select-none">
                      {n.type === 'streak' ? '🔥' : n.type === 'challenge' ? '🎯' : '🏆'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[7.5px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">
                        {n.type === 'streak' ? 'Streak Milestone' : n.type === 'challenge' ? 'Daily Challenge' : 'Quest Update'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-100 font-bold mt-0.5 leading-normal">
                        {n.msg}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PHYSICAL iOS BOTTOM HOME INDICATOR HANDLE BAR */}
          <div className="h-4 bg-[#1E293B]/20 w-full shrink-0 flex items-center justify-center select-none pb-0.5">
            <div className="w-28 h-1 bg-white/30 rounded-full" />
          </div>

        </div>

      </div>

    </div>
  );
}
