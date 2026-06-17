import React, { useState } from 'react';
import { Search, ListFilter, Calendar, Music, Sparkles, Disc, Activity, AlertCircle, ArrowUpDown, PieChart } from 'lucide-react';
import { Song, Rarity } from '../types';

interface CollectionAlbumProps {
  inventory: Song[];
}

export default function CollectionAlbum({ inventory }: CollectionAlbumProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'rarity' | 'artist' | 'date'>('date');
  const [viewMode, setViewMode] = useState<'shelf' | 'stats'>('shelf');
  const [selectedSongDetails, setSelectedSongDetails] = useState<Song | null>(null);

  const getSongColorClass = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return 'border-blue-900 bg-blue-950/20 text-blue-300';
      case 'UNCOMMON': return 'border-purple-900 bg-purple-950/20 text-purple-300';
      case 'RARE': return 'border-amber-900 bg-amber-950/20 text-amber-300';
      case 'SHINY': return 'border-rose-900 bg-rose-950/20 text-rose-300 shadow-md';
      case 'EPIC': return 'border-emerald-950 bg-emerald-900/10 text-emerald-300 shadow-lg';
      default: return 'border-zinc-800 bg-zinc-900/40 text-zinc-400';
    }
  };

  // Filter matching
  const filtered = inventory.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.album.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRarity = rarityFilter === 'ALL' || s.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  // Sort matching
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'artist') {
      return a.artist.localeCompare(b.artist);
    } else if (sortBy === 'rarity') {
      const rarityRank = { EPIC: 5, SHINY: 4, RARE: 3, UNCOMMON: 2, COMMON: 1 };
      return (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0);
    } else {
      // date desc (newest first)
      return b.obtainedAt - a.obtainedAt;
    }
  });

  // Calculate statistics
  const countRarities = (rarity: Rarity) => inventory.filter(s => s.rarity === rarity).length;

  // Genre analysis for the pie chart
  const genresList = ['Pop', 'Hip Hop', 'Electronic', 'Rock', 'R&B/Indie'];
  const genreCounts: Record<string, number> = {};
  genresList.forEach(g => { genreCounts[g] = 0; });
  
  inventory.forEach(s => {
    const g = s.genre || 'Other';
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });

  const totalTracks = inventory.length;
  const genreData = Object.entries(genreCounts).map(([genre, count]) => ({
    genre,
    count,
    percentage: totalTracks > 0 ? (count / totalTracks) * 100 : 0
  }));

  const missingGenres = genresList.filter(g => genreCounts[g] === 0);

  // SVG Pie (Donut) Chart parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  const genreColors: Record<string, string> = {
    'Pop': '#FF0080',        // Vibrant pink
    'Hip Hop': '#FFD700',    // Gold
    'Electronic': '#00D1FF', // Cyan
    'Rock': '#a855f7',       // Purple
    'R&B/Indie': '#10b981',  // Emerald
    'Other': '#64748b'
  };

  let accumulatedCircumference = 0;
  const donutSegments = genreData
    .filter(g => g.count > 0)
    .map((g) => {
      const strokeLength = (g.count / totalTracks) * circumference;
      const strokeOffset = circumference - accumulatedCircumference;
      accumulatedCircumference += strokeLength;
      return {
        ...g,
        color: genreColors[g.genre] || '#64748b',
        strokeDasharray: `${strokeLength} ${circumference}`,
        strokeDashoffset: strokeOffset
      };
    });

  return (
    <div className="bg-[#1E293B] p-4 flex flex-col flex-1 min-h-0 relative h-full">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#334155] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Disc className="w-5 h-5 text-[#00D1FF] animate-spin" />
              Music Collection Shelf ({inventory.length} Tracks)
            </h2>
            <div className="flex bg-[#0F172A] p-0.5 rounded-lg border border-[#334155]">
              <button
                type="button"
                onClick={() => setViewMode('shelf')}
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'shelf' ? 'bg-[#7928CA] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Shelf
              </button>
              <button
                type="button"
                onClick={() => setViewMode('stats')}
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'stats' ? 'bg-[#7928CA] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Insights
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
            View gathered artist items, rarity distributions, or genre metrics.
          </p>
        </div>

        {/* Dashboard quick counts */}
        <div className="flex gap-1 flex-wrap justify-end">
          <span className="bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md">
            C: {countRarities('COMMON')}
          </span>
          <span className="bg-[#7928CA]/15 text-purple-300 border border-[#7928CA]/20 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md">
            U: {countRarities('UNCOMMON')}
          </span>
          <span className="bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/20 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md">
            R: {countRarities('RARE')}
          </span>
          <span className="bg-[#FF0080]/15 text-[#FF0080] border border-[#FF0080]/20 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md">
            S: {countRarities('SHINY')}
          </span>
          <span className="bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/20 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md">
            E: {countRarities('EPIC')}
          </span>
        </div>
      </div>

      {viewMode === 'shelf' ? (
        <>
          {/* SEARCH AND FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3 shrink-0">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog title, artist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155]/60 rounded-xl py-1.5 pl-8 pr-3 text-[11px] text-slate-100 focus:border-[#FF0080] focus:outline-none font-mono"
              />
            </div>

            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155]/60 rounded-xl py-1.5 px-2 text-[10px] text-slate-300 font-mono focus:border-[#FF0080] focus:outline-none"
            >
              <option value="ALL">All Rarities</option>
              <option value="COMMON">COMMON Only</option>
              <option value="UNCOMMON">UNCOMMON Only</option>
              <option value="RARE">RARE Only</option>
              <option value="SHINY">SHINY Only</option>
              <option value="EPIC">EPIC Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rarity' | 'artist' | 'date')}
              className="bg-[#0F172A] border border-[#334155]/60 rounded-xl py-1.5 px-2 text-[10px] text-[#00D1FF] font-mono focus:border-[#FF0080] focus:outline-none"
            >
              <option value="date">Sort: Recent</option>
              <option value="rarity">Sort: Rarity</option>
              <option value="artist">Sort: Artist</option>
            </select>
          </div>

          {/* MAIN CAROUSEL / GRID SHELF VIEW */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
            
            {/* Songs List */}
            <div className="flex-1 overflow-y-auto pr-1">
              {sorted.length === 0 ? (
                <div className="text-center py-12 bg-[#0F172A]/40 border border-[#334155]/40 rounded-2xl flex flex-col justify-center items-center h-full">
                  <Music className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-[11px] text-[#94A3B8] font-medium font-mono">No matching tracks in inventory.</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Adjust filter tags or roam the area!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {sorted.map((song) => {
                    const isActive = selectedSongDetails?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => setSelectedSongDetails(song)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 group ${
                          isActive ? 'border-[#00D1FF] bg-[#00D1FF]/10' : 'border-[#334155]/40 bg-[#0F172A]/40 hover:border-[#FF0080]'
                        }`}
                      >
                        <div className="min-w-0 pr-1 flex items-center gap-2">
                          <div className={`w-8 h-8 border rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${getSongColorClass(song.rarity)}`}>
                            💿
                          </div>
                          <div className="truncate">
                            <h4 className="text-[11px] font-extrabold text-slate-200 group-hover:text-[#00D1FF] truncate">
                              {song.title}
                            </h4>
                            <p className="text-[9px] text-[#94A3B8] truncate mt-0.5">{song.artist}</p>
                          </div>
                        </div>

                        <span className={`text-[8px] font-mono font-black border rounded-full px-1.5 py-0.2 shrink-0 select-none uppercase ${getSongColorClass(song.rarity)}`}>
                          {song.rarity.substring(0, 4)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detailed Inspection sidebar card */}
            <div className="w-full md:w-[150px] border-t md:border-t-0 md:border-l border-[#334155]/40 pt-3 md:pt-0 md:pl-3.5 flex flex-col justify-between shrink-0 mb-0.5">
              {selectedSongDetails ? (
                <div className="bg-[#0F172A] border border-[#334155]/60 rounded-xl p-3 flex-1 flex flex-col justify-between relative overflow-hidden h-full">
                  <div className="absolute right-0 top-0 -mr-8 -mt-8 w-20 h-20 bg-[#00D1FF]/5 rounded-full blur-xl pointer-events-none" />

                  <div>
                    <span className={`inline-block text-[8px] font-mono px-1.5 py-0.2 rounded-md border mb-2 font-black uppercase ${getSongColorClass(selectedSongDetails.rarity)}`}>
                      {selectedSongDetails.rarity}
                    </span>

                    <div className="space-y-2">
                      <div>
                        <h3 className="text-[11px] font-black text-white font-sans tracking-tight leading-snug">
                          {selectedSongDetails.title}
                        </h3>
                        <p className="text-[9px] font-mono text-[#94A3B8] mt-0.5">By <span className="text-[#00D1FF] font-bold">{selectedSongDetails.artist}</span></p>
                      </div>

                      <div className="border-t border-[#334155]/40 pt-2 space-y-1 text-[9px] font-mono text-[#94A3B8]">
                        <div className="truncate"><span className="text-slate-400 font-sans">Album:</span> {selectedSongDetails.album}</div>
                        <div><span className="text-slate-400 font-sans">Genre:</span> {selectedSongDetails.genre}</div>
                        <div><span className="text-slate-400 font-sans">Mint:</span> <span className="text-[#00D1FF] font-bold">#{selectedSongDetails.mintNumber}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#334155]/40 pt-2 mt-2 flex flex-col gap-1 text-[8px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(selectedSongDetails.obtainedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5" />
                      ID: {selectedSongDetails.id.split('_')[1] || 'S01'}
                    </span>
                  </div>

                </div>
              ) : (
                <div className="bg-[#0F172A]/20 border border-dashed border-[#334155]/40 rounded-xl p-3 text-center flex flex-col justify-center items-center flex-1 h-full">
                  <Sparkles className="w-5 h-5 text-[#94A3B8]/20 mb-1" />
                  <h4 className="text-[10px] font-bold text-slate-400 font-mono">Select Track</h4>
                  <p className="text-[8px] text-[#94A3B8]/85 font-mono mt-0.5 leading-normal">
                    Click any music record to inspect metadata.
                  </p>
                </div>
              )}
            </div>

          </div>
        </>
      ) : (
        /* GENRE SUMMARY VISUALIZER PIE CHART INSIGHTS */
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div className="bg-[#0F172A]/40 border border-[#334155]/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
            
            {/* Pie Chart display svg */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              {totalTracks === 0 ? (
                <div className="text-center text-[10px] font-mono text-slate-500">
                  No data
                </div>
              ) : (
                <>
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    {/* Background grey ring */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke="#1e293b"
                      strokeWidth="12"
                    />
                    
                    {/* Colored genre sectors */}
                    {donutSegments.map((segment, idx) => (
                      <circle
                        key={idx}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth="12"
                        strokeDasharray={segment.strokeDasharray}
                        strokeDashoffset={segment.strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-300 hover:stroke-[14px] cursor-pointer"
                        title={`${segment.genre}: ${segment.count} (${segment.percentage.toFixed(1)}%)`}
                      />
                    ))}
                  </svg>
                  
                  {/* Center metrics overlay label */}
                  <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-lg font-black text-white font-mono leading-none">{totalTracks}</span>
                    <span className="text-[7.5px] uppercase font-mono tracking-wider text-slate-400 font-bold">Tracks</span>
                  </div>
                </>
              )}
            </div>

            {/* Legends list */}
            <div className="flex-1 space-y-2 w-full font-mono">
              <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Distribution breakdown
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {genreData.map((d) => (
                  <div key={d.genre} className="flex items-center justify-between p-1.5 bg-[#0F172A]/40 border border-[#334155]/20 rounded-lg">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: genreColors[d.genre] || '#64748b' }} />
                      <span className="text-slate-300 truncate text-[10px]">{d.genre}</span>
                    </div>
                    <span className="text-[#00D1FF] font-bold font-mono text-[10px]">
                      {d.count} <span className="text-slate-500 font-normal text-[8px]">({d.percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* MISSING GENRES HIGHLIGHTING SECTION */}
          <div className="bg-[#0F172A]/30 border border-[#475569]/20 p-3.5 rounded-2xl">
            <h3 className="text-xs font-extrabold text-[#94A3B8] flex items-center gap-2 mb-2 uppercase font-mono tracking-tight">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Catalogue Gaps & Missing Genres ({missingGenres.length})
            </h3>

            {missingGenres.length === 0 ? (
              <div className="bg-[#10b981]/10 border border-[#10b981]/20 p-3 rounded-xl text-[10px] text-emerald-400 font-mono">
                🎉 Perfect harmony! You have represented every genre in your library shelf! Your musical breadth is immaculate.
              </div>
            ) : (
              <div className="space-y-1.5 font-mono">
                {missingGenres.map((g) => {
                  let rec = "Collect Cyan sonar nodes on the map.";
                  if (g === 'Pop') rec = "Seek Pink/Rose nodes to generate Daft Swift or Billie items.";
                  if (g === 'Hip Hop') rec = "Scavenge Amber/Gold nodes for Kendrick or Weeknd vocals.";
                  if (g === 'Electronic') rec = "Sweep standard nodes to trigger techno loops.";
                  if (g === 'Rock') rec = "Prowl classic Purple nodes for high-voltage anthems.";
                  if (g === 'R&B/Indie') rec = "Roam Emerald nodes for lo-fi acoustic vinyls.";
                  
                  return (
                    <div key={g} className="p-2.5 bg-rose-950/10 border border-rose-950/20 rounded-xl flex items-start gap-2 text-[10px]">
                      <span className="text-rose-450 shrink-0 text-xs">⚠️</span>
                      <div>
                        <p className="text-rose-200 font-extrabold">Missing {g.toUpperCase()}</p>
                        <p className="text-slate-400 text-[9.5px] mt-0.5">{rec}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
