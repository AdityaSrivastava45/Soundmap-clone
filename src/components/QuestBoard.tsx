import React, { useState } from 'react';
import { Award, BookOpen, Compass, Trophy, HelpCircle, CheckCircle, Flame, RefreshCw, AlertCircle, Coins, Target } from 'lucide-react';
import { TriviaQuest, UserStats, Badge } from '../types';

export interface DailyChallengeInfo {
  id: string;
  description: string;
  targetCount: number;
  rewardCoins: number;
  rewardXP: number;
}

interface QuestBoardProps {
  userStats: UserStats;
  onRefreshTrivia: () => void;
  onCheckTriviaAnswer: (triviaId: string, answerIndex: number) => Promise<boolean>;
  activeTrivia: TriviaQuest | null;
  loadingTrivia: boolean;
  dailyChallenge: DailyChallengeInfo;
  onClaimChallengeReward: () => void;
}

export default function QuestBoard({
  userStats,
  onRefreshTrivia,
  onCheckTriviaAnswer,
  activeTrivia,
  loadingTrivia,
  dailyChallenge,
  onClaimChallengeReward
}: QuestBoardProps) {
  const [activeSegment, setActiveSegment] = useState<'trivia' | 'quests' | 'badges'>('quests'); // Default to quests & challenges tab!
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeringStatus, setAnsweringStatus] = useState<'idle' | 'checking' | 'correct' | 'wrong' | 'timesup'>('idle');
  const [correctIndexToShow, setCorrectIndexToShow] = useState<number | null>(null);

  // Calculate badge milestones for specified artists
  const getArtistProgress = (artist: string) => {
    const count = userStats.inventory.filter(s => s.artist.toLowerCase() === artist.toLowerCase()).length;
    let badgeTier: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'NONE';
    let nextMilestone = 3;
    let label = 'Bronze Badge';

    if (count >= 20) {
      badgeTier = 'PLATINUM';
      nextMilestone = 20;
      label = 'Maximum Master Tier!';
    } else if (count >= 12) {
      badgeTier = 'GOLD';
      nextMilestone = 20;
      label = 'Platinum Disc';
    } else if (count >= 7) {
      badgeTier = 'SILVER';
      nextMilestone = 12;
      label = 'Gold Disc';
    } else if (count >= 3) {
      badgeTier = 'BRONZE';
      nextMilestone = 7;
      label = 'Silver Disc';
    }

    return {
      count,
      badgeTier,
      nextMilestone,
      percent: Math.min(100, (count / nextMilestone) * 100),
      label
    };
  };

  // Artist discography quest progress (target 10 tracks)
  const getArtistQuestProgress = (artist: string) => {
    const count = userStats.inventory.filter(s => s.artist.toLowerCase() === artist.toLowerCase()).length;
    const goal = 10;
    const percent = Math.min(100, (count / goal) * 100);
    return {
      count,
      goal,
      percent,
      completed50: count >= 5,
      completed75: count >= 8,
      completed100: count >= 10
    };
  };

  const handleTriviaSubmit = async () => {
    if (selectedOption === null || !activeTrivia || answeringStatus !== 'idle') return;

    setAnsweringStatus('checking');
    const isCorrect = await onCheckTriviaAnswer(activeTrivia.id, selectedOption);

    if (isCorrect) {
      setAnsweringStatus('correct');
    } else {
      setAnsweringStatus('wrong');
      setCorrectIndexToShow(activeTrivia.correctIndex);
    }
  };

  const handleResetQuest = () => {
    setSelectedOption(null);
    setAnsweringStatus('idle');
    setCorrectIndexToShow(null);
    onRefreshTrivia();
  };

  // Featured and favorited artists list
  const featuredArtists = Array.from(new Set([
    ...userStats.favorites.artists,
    'Taylor Swift',
    'Kendrick Lamar',
    'Daft Punk',
    'The Weeknd'
  ]));

  const challengeProgress = userStats.dailyChallengeProgress || 0;
  const isChallengeCompleted = challengeProgress >= dailyChallenge.targetCount;
  const isChallengeClaimed = userStats.dailyChallengeClaimed || false;

  return (
    <div className="bg-[#0F172A] p-4 flex flex-col flex-1 min-h-0 relative h-full">
      
      {/* Tab Segment select */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#334155] pb-4 mb-4 shrink-0">
        <div>
          <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
            <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
            QUEST BOARD & CHANNELS
          </h2>
          <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
            Collect special discographies, complete daily challenges, and earn badges.
          </p>
        </div>

        <div className="flex bg-[#0F172A]/80 p-0.5 rounded-xl border border-[#334155]/60 flex-wrap gap-0.5">
          <button
            type="button"
            onClick={() => setActiveSegment('quests')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
              activeSegment === 'quests' ? 'bg-[#7928CA] text-white shadow-md' : 'text-[#94A3B8] hover:text-slate-200'
            }`}
          >
            Daily Mission
          </button>
          <button
            type="button"
            onClick={() => setActiveSegment('trivia')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
              activeSegment === 'trivia' ? 'bg-[#7928CA] text-white shadow-md' : 'text-[#94A3B8] hover:text-slate-200'
            }`}
          >
            Lyrical Quest
          </button>
          <button
            type="button"
            onClick={() => setActiveSegment('badges')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
              activeSegment === 'badges' ? 'bg-[#7928CA] text-white shadow-md' : 'text-[#94A3B8] hover:text-slate-200'
            }`}
          >
            Badges Exhibit
          </button>
        </div>
      </div>

      {/* DAILY CHALLENGES AND ACTIVE QUESTS TAB */}
      {activeSegment === 'quests' && (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 min-h-0">
          
          {/* DAILY CHALLENGE TARGET */}
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-[#334155]/80 rounded-2xl p-4 relative overflow-hidden shrink-0 shadow-lg">
            
            {/* Visual element */}
            <div className="absolute right-0 top-0 -mr-4 -mt-4 w-24 h-24 bg-[#FFD700]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-[#FFD700]/10 p-1.5 rounded-lg border border-[#FFD700]/30 text-[#FFD700]">
                  <Target className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black font-mono text-slate-100 uppercase tracking-wider">
                    Today's Hot Challenge
                  </h3>
                  <p className="text-[9px] text-[#94A3B8] font-mono">Resets automatically every day</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[9px] font-mono font-extrabold text-[#FFD700]">
                <Coins className="w-3.5 h-3.5" />
                <span>+{dailyChallenge.rewardCoins}</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-[#00D1FF]">+{dailyChallenge.rewardXP} XP</span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-semibold bg-[#0F172A]/50 p-2.5 rounded-xl border border-[#334155]/40 mt-2 mb-3">
              "{dailyChallenge.description}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
              <div className="sm:col-span-2">
                <div className="flex justify-between mb-1 text-[9px] font-mono text-[#94A3B8]">
                  <span>Progress tracking</span>
                  <span className="text-white font-bold">{challengeProgress} / {dailyChallenge.targetCount}</span>
                </div>
                <div className="w-full bg-[#0F172A] h-2 rounded-full overflow-hidden border border-[#334155]/60">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFD700] to-[#00D1FF] transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, (challengeProgress / dailyChallenge.targetCount) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-right">
                {isChallengeClaimed ? (
                  <span className="inline-block text-[9px] font-mono font-bold uppercase text-emerald-400 bg-emerald-900/10 border border-emerald-800/40 px-3 py-1.5 rounded-xl w-full text-center">
                    Claimed ✓
                  </span>
                ) : isChallengeCompleted ? (
                  <button
                    type="button"
                    onClick={onClaimChallengeReward}
                    className="w-full bg-[#10b981] hover:bg-[#10b981]/90 text-white font-mono font-extrabold text-[10px] py-1.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 animate-pulse"
                  >
                    Claim Reward!
                  </button>
                ) : (
                  <span className="inline-block text-[9px] font-mono font-bold uppercase text-[#94A3B8] bg-[#0F172A] border border-[#334155] px-3 py-1.5 rounded-xl w-full text-center">
                    In Progress...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE DISCOGRAPHY QUESTS SECTION */}
          <div className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider mb-2 font-black flex items-center gap-1">
              <Award className="w-4 h-4 text-purple-400" />
              Active Discography Quests (Goal: 10 tracks)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto flex-1 pr-0.5">
              {featuredArtists.map((artist) => {
                const { count, goal, percent, completed50, completed75, completed100 } = getArtistQuestProgress(artist);
                return (
                  <div key={artist} className="bg-[#0F172A]/40 border border-[#334155]/50 rounded-xl p-3 flex flex-col justify-between hover:bg-[#0F172A]/80 transition-all">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-black text-slate-200 truncate">{artist}</span>
                        <span className="text-[9px] font-mono font-bold text-slate-400">{count}/{goal}</span>
                      </div>
                      
                      {/* Milestones markers */}
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        <span className={`text-[7px] font-mono px-1 rounded ${completed100 ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : completed75 ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/60' : completed50 ? 'bg-purple-950 text-purple-300 border border-purple-900/40' : 'bg-[#0F172A] text-slate-500 border border-[#334155]/50'}`}>
                          50% {completed50 ? '✓' : ''}
                        </span>
                        <span className={`text-[7px] font-mono px-1 rounded ${completed100 ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : completed75 ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/60' : 'bg-[#0F172A] text-slate-500 border border-[#334155]/50'}`}>
                          75% {completed75 ? '✓' : ''}
                        </span>
                        <span className={`text-[7px] font-mono px-1 rounded ${completed100 ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-[#0F172A] text-slate-500 border border-[#334155]/50'}`}>
                          100% {completed100 ? '✓' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      {/* mini progress slider bar */}
                      <div className="w-full bg-[#0F172A] h-1.5 rounded-full overflow-hidden border border-[#334155]/40 mb-1">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${completed100 ? 'bg-emerald-500' : completed75 ? 'bg-[#FF0080]' : completed50 ? 'bg-[#00D1FF]' : 'bg-[#7928CA]'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[7.5px] font-mono text-[#94A3B8]">
                        <span>Quest Completion</span>
                        <span>{percent.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* DYNAMIC METRIC TRIVIA ASSIGNMENT */}
      {activeSegment === 'trivia' && (
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
          
          <div className="bg-[#0F172A]/40 border border-[#334155]/60 rounded-2xl p-5 mb-4 relative overflow-hidden flex-1 flex flex-col justify-center">
            
            {/* Background design accents */}
            <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-[#7928CA]/5 rounded-full blur-xl pointer-events-none" />

            {loadingTrivia ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-[#FF0080] animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-300 font-mono">Generating fresh artist trivia challenge via Gemini...</p>
                <p className="text-[10px] text-[#94A3B8] mt-1 font-mono">Scurrying lyrics archives for your favorite singer.</p>
              </div>
            ) : activeTrivia ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#0F172A] p-2.5 rounded-xl border border-[#334155]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF0080] animate-pulse" />
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8]">
                      Subject: <span className="text-slate-200 font-bold">{activeTrivia.artist}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono font-extrabold text-amber-400">
                    <span className="flex items-center gap-0.5"><Coins className="w-3 h-3 text-amber-500" /> +{activeTrivia.coinsReward}</span>
                    <span className="text-[#00D1FF]">+{activeTrivia.xpReward} XP</span>
                  </div>
                </div>

                <h3 className="text-xs font-medium text-slate-200 leading-relaxed font-sans">
                  "{activeTrivia.question}"
                </h3>

                {/* Multiple choices options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {activeTrivia.options.map((opt, idx) => {
                    let btnStyle = 'border-[#334155]/60 bg-[#0F172A]/40 text-slate-300 hover:bg-[#0F172A]';
                    if (selectedOption === idx) {
                      btnStyle = 'border-[#7928CA] bg-[#7928CA]/15 text-[#00D1FF]';
                    }

                    // Answer reveal colors
                    if (answeringStatus === 'correct' && selectedOption === idx) {
                      btnStyle = 'border-[#00FF00]/60 bg-[#00FF00]/10 text-[#00FF00]';
                    }
                    if (answeringStatus === 'wrong') {
                      if (selectedOption === idx) {
                        btnStyle = 'border-[#FF0080]/60 bg-[#FF0080]/10 text-[#FF0080]';
                      }
                      if (correctIndexToShow === idx) {
                        btnStyle = 'border-[#00FF00]/60 bg-[#00FF00]/10 text-[#00FF00]';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={answeringStatus !== 'idle'}
                        onClick={() => setSelectedOption(idx)}
                        className={`text-left p-2.5 border rounded-xl text-[11px] font-mono transition-all font-semibold cursor-pointer ${btnStyle}`}
                      >
                        <span className="text-[9px] text-slate-500 mr-1.5 uppercase">{['A', 'B', 'C', 'D'][idx]}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {answeringStatus === 'correct' && (
                  <div className="bg-[#00FF00]/10 border border-[#00FF00]/20 text-[#00FF00] p-2.5 rounded-xl text-[10px] flex items-center gap-2 font-mono">
                    <CheckCircle className="w-3.5 h-3.5 text-[#00FF00] shrink-0" />
                    <span>Incredible knowledge! You successfully claimed +{activeTrivia.coinsReward} Coins and +{activeTrivia.xpReward} XP.</span>
                  </div>
                )}

                {answeringStatus === 'wrong' && (
                  <div className="bg-[#FF0080]/10 border border-[#FF0080]/20 text-[#FF0080] p-2.5 rounded-xl text-[10px] flex items-center gap-2 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 text-[#FF0080] shrink-0" />
                    <span>Whoops, wrong answer! The correct choice was option {['A', 'B', 'C', 'D'][activeTrivia.correctIndex]}. Try next time!</span>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-6">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                <p className="text-xs text-slate-400 font-mono">No active lyrics trivia loaded.</p>
                <button
                  type="button"
                  onClick={onRefreshTrivia}
                  className="mt-2.5 bg-[#7928CA] hover:bg-[#7928CA]/90 text-white font-mono font-bold text-xs py-1.5 px-4 rounded-xl cursor-pointer transition-all shadow"
                >
                  Generate Quest Now
                </button>
              </div>
            )}

          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetQuest}
              disabled={loadingTrivia}
              className="flex-1 bg-[#0F172A] hover:bg-[#0F172A]/85 border border-[#334155]/60 font-mono text-[#94A3B8] text-[10px] py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Skip or request another artist question"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Swap Question Artist
            </button>

            {answeringStatus === 'idle' && activeTrivia && (
              <button
                type="button"
                onClick={handleTriviaSubmit}
                disabled={selectedOption === null}
                className="flex-[2] bg-[#7928CA] hover:bg-[#7928CA]/90 disabled:bg-[#0F172A] disabled:text-slate-600 disabled:border-[#334155]/50 disabled:cursor-not-allowed text-white font-mono font-bold text-[10px] py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Submit Answer Sheet
              </button>
            )}

            {answeringStatus !== 'idle' && (
              <button
                type="button"
                onClick={handleResetQuest}
                className="flex-[2] bg-[#7928CA] hover:bg-[#7928CA]/90 text-white font-mono font-bold text-[10px] py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Generate Next Lyric Quest
              </button>
            )}
          </div>

        </div>
      )}

      {/* DISPLAY UNLOCKED DISCOGRAPHY BADGES PROGRESS */}
      {activeSegment === 'badges' && (
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featuredArtists.map((artist) => {
              const { count, badgeTier, nextMilestone, percent, label } = getArtistProgress(artist);
              
              let tierColor = 'text-slate-400 font-mono';
              let badgeSymbol = '💿';
              let borderCol = 'border-[#334155]/60 bg-[#0F172A]/35';

              if (badgeTier === 'BRONZE') {
                tierColor = 'text-amber-600 font-bold font-mono';
                badgeSymbol = '🥉';
                borderCol = 'border-amber-900/60 bg-amber-955/10';
              } else if (badgeTier === 'SILVER') {
                tierColor = 'text-[#00D1FF] font-bold font-mono';
                badgeSymbol = '🥈';
                borderCol = 'border-[#00D1FF]/40 bg-[#00D1FF]/5';
              } else if (badgeTier === 'GOLD') {
                tierColor = 'text-amber-400 font-extrabold font-mono';
                badgeSymbol = '🥇';
                borderCol = 'border-amber-400/40 bg-[#7928CA]/10 shadow-lg';
              } else if (badgeTier === 'PLATINUM') {
                tierColor = 'text-[#FF0080] font-extrabold font-mono';
                badgeSymbol = '🏆';
                borderCol = 'border-[#FF0080]/40 bg-[#FF0080]/10 shadow-lg';
              }

              return (
                <div
                  key={artist}
                  className={`border rounded-xl p-3 flex gap-3 items-center transition-all hover:bg-[#0F172A] ${borderCol}`}
                >
                  <div className="text-2xl shrink-0 animate-pulse">
                    {badgeSymbol}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-200 truncate">{artist}</span>
                      <span className={`text-[7.5px] tracking-widest uppercase ${tierColor}`}>
                        {badgeTier === 'NONE' ? 'Unearned' : `${badgeTier}`}
                      </span>
                    </div>

                    <p className="text-[9px] text-[#94A3B8] mt-0.5 font-mono">
                      Collected: {count} / {nextMilestone} tracks
                    </p>

                    {/* Progress slider bar */}
                    <div className="w-full bg-[#0F172A] h-1.5 rounded-full overflow-hidden mt-1.5 border border-[#334155]/40">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badgeTier === 'NONE' ? 'bg-[#334155]' :
                          badgeTier === 'BRONZE' ? 'bg-amber-700' :
                          badgeTier === 'SILVER' ? 'bg-[#00D1FF]' :
                          badgeTier === 'GOLD' ? 'bg-[#7928CA]' : 'bg-[#FF0080]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-[7.5px] font-mono text-[#94A3B8] mt-0.5 flex justify-between">
                      <span>Progress</span>
                      <span>{label}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3.5 bg-[#0F172A]/40 rounded-xl border border-[#334155]/60 flex gap-3 items-center">
            <Flame className="w-5 h-5 text-[#FF0080] animate-pulse shrink-0" />
            <div>
              <h4 className="text-[10px] font-bold text-slate-200 font-mono uppercase tracking-wider">Unlock Collection Milestone Benefits:</h4>
              <p className="text-[9px] text-[#94A3B8] mt-0.5 leading-normal">
                Silver Badges grant +5% scanning speed, Golden Master Badges award exclusive catalog drops! Complete collection quests to unlock them.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
