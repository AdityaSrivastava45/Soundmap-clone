import React, { useState } from 'react';
import { ShoppingBag, ArrowLeftRight, User, PlusCircle, AlertCircle, Coins, Check, X, CheckCircle } from 'lucide-react';
import { Song, TradeOffer, UserStats } from '../types';

interface TradeMarketplaceProps {
  tradeOffers: TradeOffer[];
  userStats: UserStats;
  onPostTrade: (songs: Song[], coins: number, criteria: any) => void;
  onBidOnTrade: (offerId: string, offerCoins: number, offerSongs: Song[]) => void;
  onAcceptBid: (offerId: string, bidId: string) => void;
  onDeclineBid: (offerId: string, bidId: string) => void;
}

export default function TradeMarketplace({
  tradeOffers,
  userStats,
  onPostTrade,
  onBidOnTrade,
  onAcceptBid,
  onDeclineBid
}: TradeMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'post' | 'my-trades'>('listings');
  
  // Custom states for posting new trade listings
  const [selectedInventoryForTrade, setSelectedInventoryForTrade] = useState<string[]>([]);
  const [askCoins, setAskCoins] = useState<number>(0);
  const [askArtist, setAskArtist] = useState<string>('');
  const [askRarity, setAskRarity] = useState<string>('');

  // Custom states for building a bid
  const [biddingOfferId, setBiddingOfferId] = useState<string | null>(null);
  const [bidCoins, setBidCoins] = useState<number>(0);
  const [selectedInventoryForBid, setSelectedInventoryForBid] = useState<string[]>([]);

  // Helpers
  const getSongColorClass = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return 'border-blue-900 bg-blue-950/20 text-blue-300';
      case 'UNCOMMON': return 'border-purple-900 bg-purple-950/20 text-purple-300';
      case 'RARE': return 'border-amber-900 bg-amber-950/20 text-amber-300';
      case 'SHINY': return 'border-rose-900 bg-rose-950/20 text-rose-300';
      case 'EPIC': return 'border-emerald-900 bg-emerald-950/20 text-emerald-300';
      default: return 'border-zinc-800 bg-zinc-900/40 text-zinc-400';
    }
  };

  const handlePostTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInventoryForTrade.length === 0) {
      alert("Please select at least 1 song of your own to offer in the trade!");
      return;
    }

    const songsToOffer = userStats.inventory.filter(s => selectedInventoryForTrade.includes(s.id));
    onPostTrade(
      songsToOffer,
      askCoins,
      {
        artist: askArtist || undefined,
        rarity: (askRarity as any) || undefined
      }
    );

    // Reset fields
    setSelectedInventoryForTrade([]);
    setAskCoins(0);
    setAskArtist('');
    setAskRarity('');
    setActiveTab('listings');
  };

  const submitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingOfferId) return;

    if (bidCoins > userStats.coins) {
      alert("Insufficient coin balance to propose this bid!");
      return;
    }

    const songsToBid = userStats.inventory.filter(s => selectedInventoryForBid.includes(s.id));
    onBidOnTrade(biddingOfferId, bidCoins, songsToBid);

    // Reset bidding flow
    setBiddingOfferId(null);
    setBidCoins(0);
    setSelectedInventoryForBid([]);
  };

  const toggleSelectInventoryTrade = (songId: string) => {
    if (selectedInventoryForTrade.includes(songId)) {
      setSelectedInventoryForTrade(selectedInventoryForTrade.filter(id => id !== songId));
    } else {
      setSelectedInventoryForTrade([...selectedInventoryForTrade, songId]);
    }
  };

  const toggleSelectInventoryBid = (songId: string) => {
    if (selectedInventoryForBid.includes(songId)) {
      setSelectedInventoryForBid(selectedInventoryForBid.filter(id => id !== songId));
    } else {
      setSelectedInventoryForBid([...selectedInventoryForBid, songId]);
    }
  };

  const formatTimeGap = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <div className="bg-[#1E293B] p-4 flex flex-col flex-1 min-h-0 relative h-full">
      
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-[#334155] pb-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
            <ArrowLeftRight className="w-5 h-5 text-[#7928CA]" />
            Vibe Trading Marketplace
          </h2>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Swap songs with active collectors and simulated VIP brokers.
          </p>
        </div>

        <div className="flex gap-2 bg-[#0F172A] p-1.5 rounded-xl border border-[#334155]">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'listings' ? 'bg-[#7928CA] text-white shadow-md' : 'text-[#94A3B8] hover:text-slate-200'
            }`}
          >
            Market Logs ({tradeOffers.length})
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'post' ? 'bg-[#7928CA] text-white shadow-md' : 'text-[#94A3B8] hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Publish Offer
          </button>
          <button
            onClick={() => setActiveTab('my-trades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'my-trades' ? 'bg-[#7928CA] text-white shadow-md' : 'text-[#94A3B8] hover:text-slate-200'
            }`}
          >
            Negotiations List
          </button>
        </div>
      </div>

      {/* VIEW ACTIVE MARKETPLACE LOG LINES LISTINGS */}
      {activeTab === 'listings' && (
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          
          {biddingOfferId && (
            <div className="bg-[#0F172A]/95 border border-[#334155] rounded-xl p-4 mb-4 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#FF0080] font-bold">
                  Propose Your Best Bid to {tradeOffers.find(o => o.id === biddingOfferId)?.senderName}
                </h3>
                <button
                  onClick={() => setBiddingOfferId(null)}
                  className="bg-[#1E293B] p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={submitBid} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#94A3B8] mb-1.5">
                    1. Assign Coin Valuation Bonus (Your balance: {userStats.coins} Coins):
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-2.5 w-4 h-4 text-amber-500" />
                    <input
                      type="number"
                      min="0"
                      max={userStats.coins}
                      value={bidCoins}
                      onChange={(e) => setBidCoins(Number(e.target.value))}
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-2 pl-9 pr-4 text-xs text-white font-mono focus:border-[#7928CA] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#94A3B8] mb-1.5">
                    2. Choose Song Bundle to Trade in Swap ({selectedInventoryForBid.length} Selected):
                  </label>
                  
                  {userStats.inventory.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">No songs to swap! Scan drops to find some.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {userStats.inventory.map((song) => {
                        const isSel = selectedInventoryForBid.includes(song.id);
                        return (
                          <div
                            key={song.id}
                            onClick={() => toggleSelectInventoryBid(song.id)}
                            className={`flex justify-between items-center border p-1 px-2.5 rounded-lg text-[10px] cursor-pointer transition-all ${
                              isSel ? 'border-[#7928CA] bg-[#7928CA]/25 font-bold' : 'border-[#334155] bg-[#0F172A]/40'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold text-slate-200">{song.title}</span> – <span className="text-slate-400">{song.artist}</span>
                              <div className="text-[8px] text-[#7928CA] font-mono font-bold">{song.rarity}</div>
                            </div>
                            {isSel && <Check className="w-3 h-3 text-[#7928CA] shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#7928CA] hover:bg-[#7928CA]/90 text-white font-mono font-bold text-xs py-2 rounded-xl transition-all shadow-md active:scale-[0.99]"
                >
                  Send Trade Proposal
                </button>
              </form>
            </div>
          )}

          {tradeOffers.filter(o => o.status === 'OPEN').length === 0 ? (
            <div className="text-center py-16 bg-[#0F172A]/40 border border-[#334155] rounded-2xl">
              <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-[13px] text-[#94A3B8] font-bold">Marketplace currently dry.</p>
              <p className="text-[11px] text-slate-500 mt-1">Wait for global brokers to host drops or list your own!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tradeOffers.filter(o => o.status === 'OPEN').map((offer) => {
                const song = offer.offeredSongs[0]; // soundmap usually lists singles
                if (!song) return null;

                const isNPC = offer.senderId.startsWith('npc_');

                return (
                  <div
                    key={offer.id}
                    className="bg-[#0F172A]/40 border border-[#334155] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#FF0080] transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      {/* CD Vinyl mock jacket art */}
                      <div className={`w-12 h-12 border rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${getSongColorClass(song.rarity)}`}>
                        💿
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-200 truncate">{song.title}</span>
                          <span className={`${getSongColorClass(song.rarity)} text-[9px] font-mono px-1.5 py-0.5 rounded-full uppercase border font-extrabold shrink-0`}>
                            {song.rarity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{song.artist}</p>
                        
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            Hosted: {offer.senderName} {isNPC && <span className="text-[8px] bg-[#00D1FF]/10 text-[#00D1FF] px-1 rounded border border-[#00D1FF]/40">Broker</span>}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            Index: #{song.mintNumber}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {formatTimeGap(offer.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Criteria and Action Panel */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[#334155]/60">
                      <div className="font-mono text-left sm:text-right">
                        <div className="text-[10px] text-slate-500 uppercase">Broker Asks:</div>
                        <div className="text-amber-400 text-xs font-extrabold flex items-center gap-1 sm:justify-end">
                          <Coins className="w-3.5 h-3.5" />
                          {offer.requestedCoins} Coins
                        </div>
                        {offer.requestedCriteria && (
                          <div className="text-[9px] text-[#7928CA] mt-0.5 font-bold">
                            Or swap: {offer.requestedCriteria.rarity} {offer.requestedCriteria.artist || 'Any'}
                          </div>
                        )}
                      </div>

                      {/* We disable bidding on our own listings */}
                      {offer.senderId !== 'local_user' ? (
                        <button
                          onClick={() => {
                            setBiddingOfferId(offer.id);
                            setSelectedInventoryForBid([]);
                          }}
                          className="bg-[#7928CA] hover:bg-[#7928CA]/85 text-white font-mono font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95"
                        >
                          Bid Offer
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 bg-[#0F172A] p-1.5 px-3 rounded-lg border border-[#334155]">
                          Active Listing
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* CREATE NEW MARKET TRADING CARD OFFER */}
      {activeTab === 'post' && (
        <form onSubmit={handlePostTradeSubmit} className="flex-1 flex flex-col justify-between pr-1">
          
          <div className="space-y-4 h-[330px] overflow-y-auto pr-1">
            
            {/* Step 1: select song */}
            <div>
              <label className="block text-xs font-bold text-slate-200 font-mono mb-2">
                1. Select the Track You Wish to Put Up for Trade:
              </label>

              {userStats.inventory.length === 0 ? (
                <div className="bg-[#0F172A]/40 rounded-xl p-6 text-center border border-[#334155]">
                  <p className="text-xs text-[#94A3B8]">You don't own any tracks yet! Collect drops from the Sonar radar to populate your inventory.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {userStats.inventory.map((song) => {
                    const isSelected = selectedInventoryForTrade.includes(song.id);
                    return (
                      <div
                        key={song.id}
                        onClick={() => toggleSelectInventoryTrade(song.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? 'border-[#7928CA] bg-[#7928CA]/25' : 'border-[#334155] bg-[#0F172A]/40'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[11px] font-bold text-slate-300 truncate font-sans">{song.title}</span>
                          <span className={`${getSongColorClass(song.rarity)} text-[7px] border font-bold px-1 rounded`}>
                            {song.rarity.substring(0, 4)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#94A3B8] truncate mt-0.5">{song.artist}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: request criterion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 font-mono mb-2">
                  2. Coin Valuation Ask:
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-2.5 w-4 h-4 text-amber-500" />
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter coin price (e.g. 500)"
                    value={askCoins}
                    onChange={(e) => setAskCoins(Number(e.target.value))}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-2 pl-9 pr-4 text-xs text-white font-mono focus:border-[#7928CA] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 font-mono mb-2">
                  3. Artist/Rarity Criteria Swap Ask (Optional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Daft Punk"
                    value={askArtist}
                    onChange={(e) => setAskArtist(e.target.value)}
                    className="w-1/2 bg-[#0F172A] border border-[#334155] rounded-xl py-2 px-3 text-xs text-white font-sans focus:border-[#7928CA] focus:outline-none"
                  />
                  <select
                    value={askRarity}
                    onChange={(e) => setAskRarity(e.target.value)}
                    className="w-1/2 bg-[#0F172A] border border-[#334155] rounded-xl py-2 px-3 text-xs text-[#94A3B8] font-mono focus:border-[#7928CA] focus:outline-none"
                  >
                    <option value="">Any Rarity</option>
                    <option value="COMMON">COMMON</option>
                    <option value="UNCOMMON">UNCOMMON</option>
                    <option value="RARE">RARE</option>
                    <option value="SHINY">SHINY</option>
                    <option value="EPIC">EPIC</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={selectedInventoryForTrade.length === 0}
            className="w-full bg-[#7928CA] hover:bg-[#7928CA]/90 disabled:bg-[#0F172A] disabled:text-slate-600 disabled:border-[#334155] disabled:cursor-not-allowed text-white font-mono font-bold text-xs py-3 rounded-xl transition-all shadow-md active:scale-[0.99] mt-3"
          >
            Publish Live Trade Offer to Market
          </button>

        </form>
      )}

      {/* VIEW MY TRADES AND BIDS (NEGOTIATIONS LIST) */}
      {activeTab === 'my-trades' && (
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          
          {tradeOffers.filter(o => o.senderId === 'local_user').length === 0 ? (
            <div className="text-center py-16 bg-[#0F172A]/35 border border-[#334155] rounded-2xl">
              <PlusCircle className="w-9 h-9 text-[#94A3B8]/20 mx-auto mb-2" />
              <p className="text-[12px] text-[#94A3B8] font-bold">You haven't listed any songs yet.</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">List a song in "Publish Offer" tab to receive bids from other collectors!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tradeOffers.filter(o => o.senderId === 'local_user').map((offer) => {
                const song = offer.offeredSongs[0];
                if (!song) return null;

                return (
                  <div key={offer.id} className="border border-[#334155] bg-[#0F172A]/30 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200">{song.title}</span>
                        <span className={`text-[8px] font-mono px-1 border rounded ${getSongColorClass(song.rarity)}`}>
                          {song.rarity}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-amber-500 flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        Asking: {offer.requestedCoins} Coins
                      </span>
                    </div>

                    {/* Bids received list */}
                    <div className="space-y-2 mt-2 border-t border-[#334155] pt-3">
                      <p className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider mb-1">
                        Offers Received ({offer.bids.length})
                      </p>

                      {offer.bids.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic">No counteroffers proposed yet.</p>
                      ) : (
                        offer.bids.map((bid) => (
                          <div
                            key={bid.id}
                            className="bg-[#0F172A] border border-[#334155] p-3 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                          >
                            <div>
                              <div className="text-[11px] font-bold text-[#E2E8F0]">
                                Counteroffer: <span className="text-[#00D1FF] font-mono font-bold">{bid.bidderName}</span>
                              </div>
                              
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="text-[9px] font-mono text-amber-400 flex items-center gap-0.5 font-bold">
                                  <Coins className="w-3 h-3" />
                                  +{bid.offeredCoins} Coins
                                </span>
                                
                                {bid.offeredSongs.length > 0 && (
                                  <span className="text-[9px] font-mono text-[#00D1FF] font-bold">
                                    + Swap: {bid.offeredSongs[0].title} [{bid.offeredSongs[0].rarity}]
                                  </span>
                                )}
                              </div>
                            </div>

                            {bid.status === 'PENDING' ? (
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onAcceptBid(offer.id, bid.id)}
                                  className="bg-[#00FF00] hover:bg-[#00FF00]/80 text-[#0F172A] p-1 px-3 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeclineBid(offer.id, bid.id)}
                                  className="bg-[#FF0080]/15 hover:bg-[#FF0080]/20 text-[#FF0080] border border-[#FF0080]/20 p-1 px-3 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span className="text-[9px] font-mono uppercase bg-[#1E293B] px-2 py-0.5 rounded border border-[#334155] text-slate-500">
                                {bid.status}
                              </span>
                            )}

                          </div>
                        ))
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
