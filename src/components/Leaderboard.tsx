import React from 'react';
import { Trophy, Shield, Music, Coins, HelpCircle, Star, Zap, User } from 'lucide-react';
import { LeaderboardEntry, UserStats } from '../types';

interface LeaderboardProps {
  userStats: UserStats;
}

export default function Leaderboard({ userStats }: LeaderboardProps) {
  
  // Calculate self statistics
  const selfSongCount = userStats.inventory.length;
  const selfRareCount = userStats.inventory.filter(s => ['RARE', 'SHINY', 'EPIC'].includes(s.rarity)).length;

  const leaderboardData: LeaderboardEntry[] = [
    { username: 'LootDiscGamer', avatarUrl: '🎤', xp: 12500, level: 18, songCount: 142, rareCount: 41 },
    { username: 'SwiftyGoddess', avatarUrl: '💃', xp: 10400, level: 16, songCount: 111, rareCount: 29 },
    { username: 'VinylBroker_NJ', avatarUrl: '🕶️', xp: 8700, level: 12, songCount: 89, rareCount: 21 },
    { username: `${userStats.favorites.artists[0] || 'Local'}Fanboy`, avatarUrl: '🎧', xp: 6200, level: 9, songCount: 52, rareCount: 12 },
    // Self position added dynamically based on active player statistics
    {
      username: 'You (Local Collector)',
      avatarUrl: '⚡',
      xp: userStats.xp,
      level: userStats.level,
      songCount: selfSongCount,
      rareCount: selfRareCount,
      isSelf: true
    },
    { username: 'HipHopPlugs', avatarUrl: '🔥', xp: 3200, level: 5, songCount: 25, rareCount: 5 },
    { username: 'MelodyRookie', avatarUrl: '🎵', xp: 1800, level: 3, songCount: 11, rareCount: 1 },
    { username: 'NewcomerVibe', avatarUrl: '🌱', xp: 450, level: 1, songCount: 4, rareCount: 0 }
  ];

  // Sort by XP descending
  const sorted = [...leaderboardData].sort((a, b) => b.xp - a.xp);

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col h-[550px]">
      
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Global Soundmap Leaderboard
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Rise through ranks. Compare collection sizes, badges, and levels with worldwide DJs.
          </p>
        </div>
      </div>

      {/* Ranks list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {sorted.map((entry, index) => {
          const rank = index + 1;
          
          let rankBadge = `${rank}`;
          let rowStyle = 'border-zinc-900 bg-zinc-900/10 hover:border-zinc-800';
          let numStyle = 'text-zinc-500';

          if (rank === 1) {
            rankBadge = '👑';
            rowStyle = 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50';
            numStyle = 'text-amber-500 font-bold';
          } else if (rank === 2) {
            rankBadge = '🥈';
            rowStyle = 'border-zinc-400/20 bg-zinc-400/5 hover:border-zinc-400/35';
            numStyle = 'text-zinc-300 font-bold';
          } else if (rank === 3) {
            rankBadge = '🥉';
            rowStyle = 'border-amber-700/20 bg-amber-700/5 hover:border-amber-700/35';
            numStyle = 'text-amber-700 font-bold';
          }

          if (entry.isSelf) {
            rowStyle = 'border-sky-500 bg-sky-950/15 shadow-md shadow-sky-500/2 shadow-inner';
          }

          return (
            <div
              key={entry.username}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${rowStyle}`}
            >
              
              <div className="flex items-center gap-3.5 min-w-0">
                <span className={`text-xs font-mono w-5 text-center ${numStyle}`}>
                  {rankBadge}
                </span>

                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg shadow-inner">
                  {entry.avatarUrl}
                </div>

                <div className="truncate">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                    {entry.username}
                    {entry.isSelf && <span className="text-[7px] uppercase font-mono px-1 bg-sky-950 text-sky-400 border border-sky-900 rounded font-bold">You</span>}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Level {entry.level} DJ · {entry.xp.toLocaleString()} XP
                  </p>
                </div>
              </div>

              {/* Counts panel */}
              <div className="flex items-center gap-5 shrink-0 font-mono">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-500">Inventory:</div>
                  <div className="text-zinc-300 text-xs font-bold flex items-center gap-1 justify-end">
                    <Music className="w-3.5 h-3.5 text-zinc-500" />
                    {entry.songCount} songs
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-zinc-500">Premium Highs:</div>
                  <div className="text-amber-400 text-xs font-bold flex items-center gap-1 justify-end">
                    <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {entry.rareCount} rares
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Footer tips */}
      <div className="mt-4 p-4 border border-zinc-900 bg-zinc-950 rounded-2xl flex items-center gap-3">
        <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
        <p className="text-[10px] text-zinc-500 font-mono leading-normal">
          XP rewards are earned by claiming active drops, solving artist trivia questionnaires on the logic quest card, and validating high-level song swaps.
        </p>
      </div>

    </div>
  );
}
