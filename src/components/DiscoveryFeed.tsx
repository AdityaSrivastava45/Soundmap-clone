import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, Users, MapPin, Sparkles, RefreshCw, 
  Disc, Award, Calendar, ChevronRight, Music, Send, Eye, X, BookOpen, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, DiscoveryItem, UserStats } from '../types';

interface DiscoveryFeedProps {
  userStats: UserStats;
  djName: string;
}

interface ArtistInfo {
  artist: string;
  bio: string;
  genre: string;
  keyAlbums: string[];
  currentVibe: string;
  funFact: string;
  suggestedDropZone: string;
}

export default function DiscoveryFeed({ userStats, djName }: DiscoveryFeedProps) {
  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>([]);
  const [activeSegment, setActiveSegment] = useState<'all' | 'friends'>('all');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  // Comment box inputs mapping item.id to text string
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentingItemId, setCommentingItemId] = useState<string | null>(null);

  // Artist info drawer/modal state
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null);
  const [loadingArtist, setLoadingArtist] = useState(false);

  // Song details view
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  // Load discoveries on start
  useEffect(() => {
    fetchDiscoveries();
  }, []);

  const fetchDiscoveries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/discoveries');
      const data = await response.json();
      if (data.success) {
        setDiscoveries(data.discoveries);
      }
    } catch (e) {
      console.warn('Failed to fetch discoveries:', e);
    } finally {
      setLoading(false);
    }
  };

  // Like discovery toggle
  const handleLike = async (itemId: string) => {
    // Optimistic local state update
    setDiscoveries(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const isLiking = !item.likedByMe;
          return {
            ...item,
            likedByMe: isLiking,
            likes: isLiking ? item.likes + 1 : Math.max(0, item.likes - 1)
          };
        }
        return item;
      })
    );

    try {
      await fetch('/api/discoveries/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discoveryId: itemId })
      });
    } catch (e) {
      console.warn('Failed to persist like:', e);
    }
  };

  // Submit comment
  const handlePostComment = async (e: React.FormEvent, itemId: string) => {
    e.preventDefault();
    const commentText = commentInputs[itemId]?.trim();
    if (!commentText) return;

    // Clear input
    setCommentInputs(prev => ({ ...prev, [itemId]: '' }));

    try {
      const response = await fetch('/api/discoveries/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discoveryId: itemId,
          authorName: djName || 'SonicDisciple',
          avatarUrl: '🎧',
          text: commentText
        })
      });
      const data = await response.json();
      if (data.success) {
        // Update comments for this specific item
        setDiscoveries(prev =>
          prev.map(item => {
            if (item.id === itemId) {
              return { ...item, comments: data.comments };
            }
            return item;
          })
        );
      }
    } catch (e) {
      console.warn('Failed to submit comment:', e);
    }
  };

  // Scan proximity spark using Gemini generator
  const handleRadarScanSparks = async () => {
    setScanning(true);
    try {
      const response = await fetch('/api/discoveries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userArtists: userStats.favorites.artists,
          userGenres: userStats.favorites.genres
        })
      });
      const data = await response.json();
      if (data.success) {
        // Prepend generator outcome
        setDiscoveries(prev => [data.discovery, ...prev]);
      }
    } catch (e) {
      console.warn('Failed to spark scan:', e);
    } finally {
      // Small timeout for dramatic scanning radar sweep effect
      setTimeout(() => {
        setScanning(false);
      }, 900);
    }
  };

  // View Artist Info Factbook from Gemini
  const handleViewArtistDetails = async (artistName: string) => {
    setSelectedArtist(artistName);
    setArtistInfo(null);
    setLoadingArtist(true);

    try {
      const response = await fetch('/api/artist-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: artistName })
      });
      const data = await response.json();
      if (data.success) {
        setArtistInfo(data.info);
      }
    } catch (e) {
      console.warn('Failed to pull artist facts:', e);
    } finally {
      setLoadingArtist(false);
    }
  };

  // Filter list based on segments
  const filteredList = discoveries.filter(item => {
    if (activeSegment === 'friends') {
      return item.isFriend;
    }
    return true;
  });

  return (
    <div className="bg-[#0F172A] p-4 flex flex-col flex-1 min-h-0 animate-fade-in relative overflow-hidden">
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#334155] pb-4 mb-4 shrink-0 gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 uppercase tracking-tight">
            <Sparkles className="w-5 h-5 text-[#FF0080]" />
            PROXIMITY DISCOVERY FEED
          </h2>
          <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
            Realtime activity of collectors and friends within your local coordinates.
          </p>
        </div>
        
        {/* Actions bar header */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-[#0F172A]/70 p-1 rounded-xl border border-[#334155] justify-around flex-1 sm:flex-none">
            <button
              onClick={() => setActiveSegment('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black transition-all uppercase whitespace-nowrap cursor-pointer ${
                activeSegment === 'all' ? 'bg-[#7928CA] text-white shadow' : 'text-[#94A3B8] hover:text-slate-200'
              }`}
            >
              All Neighbors
            </button>
            <button
              onClick={() => setActiveSegment('friends')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black transition-all uppercase whitespace-nowrap cursor-pointer ${
                activeSegment === 'friends' ? 'bg-[#7928CA] text-white shadow' : 'text-[#94A3B8] hover:text-slate-200'
              }`}
            >
              Friends Only
            </button>
          </div>

          <button
            onClick={handleRadarScanSparks}
            disabled={scanning || loading}
            className="p-2.5 bg-gradient-to-r from-[#FF0080] to-[#7928CA] hover:from-[#FF0080]/90 hover:to-[#7928CA]/90 active:scale-95 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer shadow flex items-center gap-1 text-xs font-mono font-bold"
            title="Scan proximity radar for live-collected songs"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sparks Scan</span>
          </button>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <RefreshCw className="w-8 h-8 text-[#00D1FF] animate-spin mb-2" />
            <p className="text-xs text-[#94A3B8] font-mono">Synchronizing coordinates sound feeds...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-6 h-full border border-dashed border-[#334155] rounded-2xl">
            <MapPin className="w-8 h-8 text-[#94A3B8] mb-3 opacity-40 animate-bounce" />
            <p className="text-xs text-slate-300 font-mono font-semibold">No recent neighborhood scans detected.</p>
            <p className="text-[10px] text-[#94A3B8] max-w-sm mt-1 leading-normal">
              Click the <span className="text-[#FF0080] font-bold">Sparks Scan</span> radar button to emit coordinate pulses and locate audio collections nearby player avatars now!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredList.map((item) => {
              // Get rarity colors matching Soundmap layout
              const chipRarityClass = 
                item.song.rarity === 'COMMON' ? 'bg-[#00D1FF]/10 text-[#00D1FF] border-[#00D1FF]/25' :
                item.song.rarity === 'UNCOMMON' ? 'bg-[#7928CA]/10 text-purple-300 border-[#7928CA]/25' :
                item.song.rarity === 'RARE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                item.song.rarity === 'SHINY' ? 'bg-[#FF0080]/10 text-[#FF0080] border-[#FF0080]/25 font-extrabold' :
                'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-black';

              const shadowClass = 
                item.song.rarity === 'SHINY' ? 'shadow-[0_0_15px_rgba(255,0,128,0.08)]' :
                item.song.rarity === 'EPIC' ? 'shadow-[0_0_15px_rgba(16,185,129,0.08)]' :
                '';

              return (
                <div 
                  key={item.id} 
                  className={`bg-[#0F172A]/40 border border-[#334155]/60 rounded-xl p-4 transition-all hover:border-[#334155] relative flex flex-col gap-3 ${shadowClass}`}
                >
                  {/* Top user bar who collected the track */}
                  <div className="flex justify-between items-center bg-[#0F172A]/75 p-2 rounded-xl border border-[#334155]/40 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none" role="img" aria-label="collector">
                        {item.collectorAvatar || '🎧'}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-100">{item.collectorName}</span>
                          {item.isFriend && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#7928CA]/25 text-white border border-[#7928CA]/40 rounded-md font-bold uppercase scale-90">
                              Friend
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-[#94A3B8] font-mono mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-[#00D1FF]" />
                          Coordinates Proximity: {item.distanceMeters}m away
                        </p>
                      </div>
                    </div>

                    <span className="text-[9px] text-[#94A3B8] font-mono">
                      {new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Mid Segment: Discovered track graphics */}
                  <div className="flex gap-3.5 items-center">
                    
                    {/* Tiny spinning mini-vinyl decoration */}
                    <div className="relative group shrink-0">
                      <div className={`w-14 h-14 bg-slate-900 border-2 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                        item.song.rarity === 'SHINY' || item.song.rarity === 'EPIC' ? 'animate-spin' : ''
                      }`}
                        style={{ animationDuration: '6s' }}
                      >
                        <div className="w-10 h-10 border border-[#334155]/20 rounded-full flex items-center justify-center">
                          <span className="text-xs">💿</span>
                        </div>
                      </div>
                    </div>

                    {/* Track Titles */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span 
                          onClick={() => setSelectedSong(item.song)}
                          className="font-extrabold text-xs text-white truncate hover:text-[#00D1FF] transition-colors cursor-pointer"
                        >
                          {item.song.title}
                        </span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 border rounded-full uppercase truncate ${chipRarityClass}`}>
                          {item.song.rarity}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                        <p className="text-[11px] text-[#94A3B8] truncate">
                          by <span 
                                onClick={() => handleViewArtistDetails(item.song.artist)}
                                className="font-bold text-slate-200 hover:text-[#FF0080] hover:underline cursor-pointer transition-colors"
                              >
                                {item.song.artist}
                              </span>
                        </p>
                        <span className="text-[9px] text-slate-500 font-mono truncate">
                          · {item.song.album}
                        </span>
                      </div>
                    </div>

                    {/* Quick Insight Eye action */}
                    <div className="flex flex-col gap-1.5">
                      <button 
                        type="button"
                        onClick={() => handleViewArtistDetails(item.song.artist)}
                        className="p-1 px-2 border border-[#334155] bg-[#0F172A]/40 text-[#FF0080] hover:bg-[#FF0080]/10 text-[9px] font-mono font-extrabold rounded-lg hover:border-[#FF0080]/50 transition-all flex items-center gap-1 cursor-pointer"
                        title="Display full artist insight bio"
                      >
                        <Award className="w-3 h-3" />
                        Artist Factbook
                      </button>

                      <button 
                        type="button"
                        onClick={() => setSelectedSong(item.song)}
                        className="p-1 px-2 border border-[#334155] bg-[#0F172A]/40 text-[#00D1FF] hover:bg-[#00D1FF]/10 text-[9px] font-mono font-extrabold rounded-lg hover:border-[#00D1FF]/50 transition-all flex items-center gap-1 cursor-pointer"
                        title="Visualise vinyl case details"
                      >
                        <Eye className="w-3 h-3" />
                        Song Mint
                      </button>
                    </div>

                  </div>

                  {/* Interactive response actions bar */}
                  <div className="flex items-center gap-4 border-t border-[#334155]/40 pt-2.5">
                    <button
                      type="button"
                      onClick={() => handleLike(item.id)}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                        item.likedByMe 
                          ? 'text-[#FF0080] bg-[#FF0080]/10 border border-[#FF0080]/30' 
                          : 'text-[#94A3B8] hover:text-[#FF0080] border border-transparent'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${item.likedByMe ? 'fill-current animate-pulse' : ''}`} />
                      {item.likes} Likes
                    </button>

                    <button
                      type="button"
                      onClick={() => setCommentingItemId(commentingItemId === item.id ? null : item.id)}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition-all border cursor-pointer ${
                        commentingItemId === item.id
                          ? 'text-[#00D1FF] bg-[#00D1FF]/10 border-[#00D1FF]/30'
                          : 'text-[#94A3B8] hover:text-white border-transparent'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {item.comments.length} Comments
                    </button>
                  </div>

                  {/* Toggle Comment stream section */}
                  {commentingItemId === item.id && (
                    <div className="mt-2 border-t border-[#334155]/40 pt-3 space-y-2 animate-fade-in">
                      
                      {/* Past Comments */}
                      {item.comments.length > 0 ? (
                        <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                          {item.comments.map((comm) => (
                            <div key={comm.id} className="text-[10px] bg-[#0F172A] p-2 rounded-lg border border-[#334155]/30">
                              <div className="flex justify-between items-center text-slate-400 font-mono text-[9px] mb-1">
                                <span className="font-extrabold flex items-center gap-1">
                                  <span>{comm.avatarUrl || '💬'}</span>
                                  <span className="text-slate-200">{comm.authorName}</span>
                                </span>
                                <span>{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-300 leading-normal font-sans italic">"{comm.text}"</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-[#94A3B8] italic font-mono py-1">No listener commentary on this track drop yet. Be the first to express your vibe!</p>
                      )}

                      {/* Comment Input form */}
                      <form onSubmit={(e) => handlePostComment(e, item.id)} className="flex gap-2">
                        <input
                          type="text"
                          value={commentInputs[item.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Rate this vinyl drop or lyric review..."
                          maxLength={120}
                          className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7928CA]"
                        />
                        <button
                          type="submit"
                          disabled={!commentInputs[item.id]?.trim()}
                          className="p-1 px-2.5 bg-[#7928CA] disabled:bg-[#0F172A] disabled:border-[#334155] disabled:text-slate-500 border border-transparent rounded-xl text-white transition-all cursor-pointer flex items-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER METRIC NOTE */}
      <div className="mt-3 text-center shrink-0 border-t border-[#334155]/60 pt-2.5">
        <p className="text-[9px] font-mono text-[#94A3B8]">
          ✨ Scanning nearby spots utilizes localized satellite coordinate meshes to sync active feeds in Brookhaven coordinates!
        </p>
      </div>

      {/* --- MODAL DIALOGS AND OVERLAYS --- */}
      
      {/* 1. ARTIST INSIGHTS FACTBOOK MODAL FROM GEMINI */}
      <AnimatePresence>
        {selectedArtist && (
          <div className="absolute inset-0 bg-[#0F172A]/85 backdrop-blur-md z-40 p-5 flex flex-col justify-center animate-fade-in">
            <div className="bg-[#0F172A] border border-[#FF0080]/40 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90%] overflow-hidden">
              
              {/* Modal header */}
              <div className="flex justify-between items-start border-b border-[#334155] pb-2 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#FF0080] animate-pulse" />
                  <h3 className="text-xs uppercase font-mono font-black text-[#FF0080]">Artist Insight Factbook</h3>
                </div>
                <button
                  onClick={() => { setSelectedArtist(null); setArtistInfo(null); }}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Modal Content */}
              {loadingArtist ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-[#FF0080] animate-spin mb-3" />
                  <p className="text-xs text-[#94A3B8] font-mono">Querying musical historical registers via Gemini...</p>
                  <p className="text-[9px] text-slate-500 mt-1 font-mono">Formulating artist aesthetic briefs, discographies & vinyl locations.</p>
                </div>
              ) : artistInfo ? (
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
                  
                  {/* Biography */}
                  <div>
                    <h4 className="font-mono text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Overview Bio</h4>
                    <p className="font-sans text-slate-100 text-[11px] leading-relaxed bg-[#0F172A]/60 p-2.5 rounded-xl border border-[#334155]/20">
                      {artistInfo.bio}
                    </p>
                  </div>

                  {/* Core Genre & Vibe */}
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="border border-[#334155]/40 bg-[#0F172A]/50 p-2 rounded-xl">
                      <span className="text-[8px] text-[#94A3B8] uppercase font-bold">Genre Profile</span>
                      <p className="text-[10px] text-slate-200 mt-0.5 truncate font-extrabold">{artistInfo.genre}</p>
                    </div>
                    <div className="border border-[#334155]/40 bg-[#0F172A]/50 p-2 rounded-xl">
                      <span className="text-[8px] text-[#94A3B8] uppercase font-bold">Aesthetic Vibe</span>
                      <p className="text-[10px] text-[#00D1FF] mt-0.5 truncate font-extrabold">{artistInfo.currentVibe}</p>
                    </div>
                  </div>

                  {/* Key Album Tracks */}
                  <div>
                    <h4 className="font-mono text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1 flex items-center gap-1">
                      <Disc className="w-3 h-3 text-[#00D1FF]" />
                      Core Essential Albums
                    </h4>
                    <div className="flex flex-wrap gap-1.5 font-mono">
                      {artistInfo.keyAlbums?.map((alb, index) => (
                        <span key={index} className="text-[9px] bg-[#0F172A] text-slate-200 border border-[#334155]/60 p-1 px-2.5 rounded-lg font-bold">
                          💿 {alb}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Anecdote Fun Fact */}
                  <div className="bg-[#7928CA]/5 border border-[#7928CA]/30 p-2.5 rounded-xl font-sans">
                    <span className="text-[8px] uppercase text-[#7928CA] font-mono font-black flex items-center gap-1">
                      <Award className="w-3 h-3" /> Historical trivia
                    </span>
                    <p className="text-[10px] text-purple-300 italic mt-1 leading-relaxed">
                      "{artistInfo.funFact}"
                    </p>
                  </div>

                  {/* Map Hotspots Drop Zone Advice */}
                  <div className="bg-[#00D1FF]/5 border border-[#00D1FF]/25 p-2.5 rounded-xl font-sans">
                    <span className="text-[8px] uppercase text-[#00D1FF] font-mono font-black flex items-center gap-1">
                      <Map className="w-3 h-3" /> MAP DROPS HOTZONE GUIDANCE
                    </span>
                    <p className="text-[10px] text-[#00D1FF] mt-1 font-mono">
                      ✨ Check surrounding locations like: {artistInfo.suggestedDropZone}
                    </p>
                  </div>

                </div>
              ) : (
                <div className="font-mono text-center text-xs py-8 text-rose-400">
                  Failed rendering. Gemini offline. Please retry scan.
                </div>
              )}

              {/* Close footer */}
              <button
                onClick={() => { setSelectedArtist(null); setArtistInfo(null); }}
                className="mt-4 w-full bg-[#0F172A] hover:bg-[#334155]/20 text-[#FF0080] border border-[#FF0080]/40 font-mono font-black text-[10px] uppercase py-2 rounded-xl transition-all shadow cursor-pointer active:scale-95"
              >
                Close Biography insights
              </button>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SONG MINT INFO VIEW REVEAL MODAL */}
      <AnimatePresence>
        {selectedSong && (
          <div className="absolute inset-0 bg-[#0F172A]/85 backdrop-blur-md z-40 p-5 flex flex-col justify-center animate-fade-in">
            <div className="bg-[#0F172A] border border-[#00D1FF]/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
              
              <span className="text-[8px] font-mono uppercase bg-[#00D1FF]/20 text-[#00D1FF] px-3 py-1 border border-[#00D1FF]/30 rounded-full font-black animate-pulse">
                🔍 Soundmap Registry file
              </span>

              {/* Holographic Spinning Album graphic */}
              <div className="flex justify-center py-4 relative">
                <div className="absolute inset-0 bg-[#00D1FF]/5 rounded-full blur-2xl pointer-events-none" />
                <div className="w-24 h-24 bg-slate-900 border-4 border-double border-[#00D1FF]/40 rounded-full flex items-center justify-center animate-spin"
                  style={{ animationDuration: '8s' }}
                >
                  <div className="w-16 h-16 border border-[#334155]/30 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-black text-sm text-white font-sans">{selectedSong.title}</h3>
                <p className="text-xs text-[#00D1FF] font-mono mt-0.5">{selectedSong.artist}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-y border-[#334155]/55 py-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[#94A3B8]">Album Core:</span>
                  <p className="text-slate-100 font-black truncate">{selectedSong.album}</p>
                </div>
                <div className="text-left space-y-0.5">
                  <span className="text-[#94A3B8]">Genre Tag:</span>
                  <p className="text-slate-100 font-black truncate">{selectedSong.genre}</p>
                </div>
                <div className="text-left space-y-0.5 mt-2">
                  <span className="text-[#94A3B8]">Serial Mint Number:</span>
                  <p className="text-slate-100 font-black">#{selectedSong.mintNumber}</p>
                </div>
                <div className="text-left space-y-0.5 mt-2">
                  <span className="text-[#94A3B8]">Rarity:</span>
                  <p className={`font-black ${
                    selectedSong.rarity === 'COMMON' ? 'text-[#00D1FF]' :
                    selectedSong.rarity === 'UNCOMMON' ? 'text-purple-300' :
                    selectedSong.rarity === 'RARE' ? 'text-amber-400' :
                    selectedSong.rarity === 'SHINY' ? 'text-[#FF0080]' : 'text-emerald-400'
                  }`}>{selectedSong.rarity}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSong(null)}
                className="w-full bg-[#0F172A] hover:bg-[#334155]/20 text-[#00D1FF] border border-[#00D1FF]/40 font-mono font-black text-[10px] uppercase py-2 rounded-xl transition-all shadow cursor-pointer active:scale-95"
              >
                Return to discover panel
              </button>

            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
