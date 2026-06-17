import React from 'react';
import { Coins, Zap, ShieldAlert, Sparkles, Navigation, ArrowUpCircle, ShoppingBag, Check } from 'lucide-react';
import { UserStats } from '../types';

interface ShopStoreProps {
  userStats: UserStats;
  onUpgradeRadar: () => void;
  onUnlockPremium: () => void;
  onBuyCrate: (genre: string, cost: number) => void;
}

export default function ShopStore({
  userStats,
  onUpgradeRadar,
  onUnlockPremium,
  onBuyCrate
}: ShopStoreProps) {
  
  // Upgrade costs config
  const radarCost = userStats.radarLevel * 1000;
  const radarLevelLabel = [
    'Eco Probe (50m scan)',
    'Sound Wave Pulse (65m scan)',
    'Acoustic Ping (80m scan)',
    'Sub-Bass Sonar (95m scan)',
    'Tuning Fork Satellite (110m scan)'
  ][Math.min(4, userStats.radarLevel - 1)];

  return (
    <div className="bg-[#0F172A] p-4 flex flex-col flex-1 min-h-0 relative h-full">
      
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-[#334155] pb-4 mb-5 shrink-0">
        <div>
          <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 uppercase tracking-tight">
            <ShoppingBag className="w-5 h-5 text-[#FF0080]" />
            SOUNDMAP SHOP STORE
          </h2>
          <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
            Optimize your map collection efficiency. Exchange coins for sonar range upgrades and vinyl cases.
          </p>
        </div>

        {/* Counter */}
        <div className="bg-[#0F172A] border border-[#334155] p-2 py-2.5 px-4 rounded-xl flex items-center gap-2 text-amber-400 text-xs font-bold font-mono shadow">
          <Coins className="w-4 h-4 text-amber-500 animate-pulse" />
          {userStats.coins.toLocaleString()} Coins
        </div>
      </div>

      {/* Main product catalog scroll view */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* CARD 1: VIP PLATINUM PASS */}
          <div className="border border-[#FF0080]/30 bg-[#FF0080]/5 hover:border-[#FF0080]/60 transition-all p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 w-20 h-20 bg-[#FF0080]/15 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] uppercase font-mono bg-[#FF0080]/20 text-[#FF0080] border border-[#FF0080]/30 px-2 py-0.5 rounded-full font-bold">
                  Exclusive Privilege
                </span>
                <Sparkles className="w-4 h-4 text-[#FF0080] shrink-0" />
              </div>

              <h3 className="text-xs font-bold text-slate-100 font-sans tracking-tight uppercase">
                Premium Platinum Pass
              </h3>
              
              <ul className="text-[10px] font-mono text-[#94A3B8] mt-2.5 space-y-1.5 list-none">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#FF0080]" />
                  Permanent +30m Sonar Search range
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#FF0080]" />
                  Chance of pulling Shiny series tracks doubled
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#FF0080]" />
                  Exclusive Epic item drop eligibility
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#FF0080]" />
                  VIP neon pink search waves style
                </li>
              </ul>
            </div>

            <div className="mt-5 border-t border-[#334155]/60 pt-3 flex justify-between items-center">
              <div className="font-mono">
                <div className="text-[8px] text-[#FF0080] font-bold uppercase">Membership:</div>
                <div className="text-slate-200 text-[11px] font-extrabold pb-0.5">1,500 Coins (one-time)</div>
              </div>

              {userStats.premium ? (
                <span className="bg-[#00FF00]/10 text-[#00FF00] text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl border border-[#00FF00]/20 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Premium VIP
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onUnlockPremium}
                  className="bg-[#FF0080] hover:bg-[#FF0080]/90 text-white font-mono font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Buy Pass
                </button>
              )}
            </div>
          </div>

          {/* CARD 2: RADAR RANGE UPGRADE */}
          <div className="border border-[#334155] bg-[#0F172A]/30 hover:border-[#00D1FF] transition-all p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] uppercase font-mono bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20 px-2 py-0.5 rounded-full font-bold">
                  Scanner Tuning
                </span>
                <Navigation className="w-4 h-4 text-[#00D1FF]" />
              </div>

              <h3 className="text-xs font-bold text-slate-100 font-sans tracking-tight uppercase flex items-center gap-1.5">
                Sonar Wave Amplification
                <span className="text-[9px] bg-[#0F172A] text-[#00D1FF] border border-[#334155] p-0.5 px-1.5 rounded-md font-mono">
                  Level {userStats.radarLevel}
                </span>
              </h3>

              <p className="text-[10px] font-mono text-[#94A3B8] mt-2">
                Increases search radius around user permanently. Grab distant vinyl drops without leaving your seat!
              </p>

              <div className="text-[10px] font-mono text-slate-400 mt-2.5">
                Current: <span className="text-[#00D1FF] font-bold">{radarLevelLabel}</span>
              </div>
            </div>

            <div className="mt-5 border-t border-[#334155]/60 pt-3 flex justify-between items-center">
              <div className="font-mono">
                <div className="text-[8px] text-[#00D1FF] uppercase font-bold">Upgrade Cost:</div>
                <div className="text-amber-400 text-xs font-bold flex items-center gap-0.5">
                  <Coins className="w-3.5 h-3.5" />
                  {userStats.radarLevel >= 5 ? 'MAXED OUT' : `${radarCost.toLocaleString()} Coins`}
                </div>
              </div>

              {userStats.radarLevel >= 5 ? (
                <span className="text-slate-500 text-[10px] font-mono border border-[#334155] bg-[#0F172A] px-3 py-1.5 rounded-xl">
                  Max Radius
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onUpgradeRadar}
                  className="bg-[#7928CA] hover:bg-[#7928CA]/90 text-white font-mono font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Boost Wave
                </button>
              )}
            </div>
          </div>

        </div>

        {/* CHESTS & LOOT BAG CASES */}
        <h3 className="text-xs font-bold text-[#E2E8F0] font-mono uppercase tracking-widest pt-2 flex items-center gap-1.5 border-t border-[#334155]/60 mt-3 pt-3">
          <Sparkles className="w-4 h-4 text-[#FF0080]" />
          Specialist Genre Loot Cases
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* CRATE 1: RAP CAVIAR */}
          <div className="border border-[#334155] bg-[#0F172A]/30 hover:border-[#7928CA] transition-all p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-2">🔥</div>
              <h4 className="text-xs font-bold text-slate-200">Hip Hop Gold Drop Case</h4>
              <p className="text-[9px] font-mono text-[#94A3B8] mt-1 leading-normal">
                Guaranteed popular Rap/HipHop track of artists like Kendrick Lamar or Drake.
              </p>
            </div>
            
            <div className="mt-3.5 pt-2.5 border-t border-[#334155]/60 flex justify-between items-center">
              <span className="text-amber-400 text-[11px] font-mono font-bold flex items-center gap-0.5">
                <Coins className="w-3.5 h-3.5 animate-pulse" />
                600
              </span>
              <button
                type="button"
                onClick={() => onBuyCrate('Hip Hop', 600)}
                className="bg-[#0f172a] text-[#7928CA] hover:bg-[#7928CA] hover:text-white border border-[#334155] hover:border-[#7928CA] text-[10px] font-mono font-bold px-3 py-1 rounded-lg transition-all cursor-pointer"
              >
                Crate Claim
              </button>
            </div>
          </div>

          {/* CRATE 2: GLOW POP */}
          <div className="border border-[#334155] bg-[#0F172A]/30 hover:border-[#FF0080] transition-all p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-2">🍭</div>
              <h4 className="text-xs font-bold text-slate-200">Bubble Pop Deluxe Case</h4>
              <p className="text-[9px] font-mono text-[#94A3B8] mt-1 leading-normal">
                Unlocks premium pop files from legends like Taylor Swift or Billie Eilish.
              </p>
            </div>
            
            <div className="mt-3.5 pt-2.5 border-t border-[#334155]/60 flex justify-between items-center">
              <span className="text-amber-400 text-[11px] font-mono font-bold flex items-center gap-0.5">
                <Coins className="w-3.5 h-3.5 animate-pulse" />
                450
              </span>
              <button
                type="button"
                onClick={() => onBuyCrate('Pop', 450)}
                className="bg-[#0f172a] text-[#FF0080] hover:bg-[#FF0080] hover:text-white border border-[#334155] hover:border-[#FF0080] text-[10px] font-mono font-bold px-3 py-1 rounded-lg transition-all cursor-pointer"
              >
                Crate Claim
              </button>
            </div>
          </div>

          {/* CRATE 3: SUB DANCE */}
          <div className="border border-[#334155] bg-[#0F172A]/30 hover:border-[#00D1FF] transition-all p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="text-xs font-bold text-slate-200">Neon Electronic Wavepack</h4>
              <p className="text-[9px] font-mono text-[#94A3B8] mt-1 leading-normal">
                Synthesized electronic drops from Daft Punk, Fred again... or Avicii.
              </p>
            </div>
            
            <div className="mt-3.5 pt-2.5 border-t border-[#334155]/60 flex justify-between items-center">
              <span className="text-amber-400 text-[11px] font-mono font-bold flex items-center gap-0.5">
                <Coins className="w-3.5 h-3.5 animate-pulse" />
                500
              </span>
              <button
                type="button"
                onClick={() => onBuyCrate('Electronic', 500)}
                className="bg-[#0f172a] text-[#00D1FF] hover:bg-[#00D1FF] hover:text-white border border-[#334155] hover:border-[#00D1FF] text-[10px] font-mono font-bold px-3 py-1 rounded-lg transition-all cursor-pointer"
              >
                Crate Claim
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
