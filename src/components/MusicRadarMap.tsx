import React, { useRef, useEffect, useState } from 'react';
import { Play, Navigation, AlertCircle, Compass, Zap, HelpCircle, Activity, Globe } from 'lucide-react';
import { Drop, Rarity } from '../types';

interface MusicRadarMapProps {
  drops: Drop[];
  playerPos: { lat: number; lng: number };
  onMove: (lat: number, lng: number) => void;
  onClaimDrop: (dropId: string) => void;
  radarRadius: number; // in simulated visual meters
  premium: boolean;
}

export default function MusicRadarMap({
  drops,
  playerPos,
  onMove,
  onClaimDrop,
  radarRadius,
  premium
}: MusicRadarMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [movementSpeed, setMovementSpeed] = useState<'walk' | 'bike' | 'drive'>('walk');
  const [useRealGPS, setUseRealGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [scanAnimation, setScanAnimation] = useState(0);
  const [autoWalk, setAutoWalk] = useState(true); // default auto-walk style to true!
  const wanderingAngleRef = useRef(Math.random() * Math.PI * 2);

  const particlesRef = useRef<{ x: number; y: number; speedX: number; speedY: number; size: number; alpha: number }[]>([]);

  // Observe container sizes to keep canvas dimensions matching layout
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize particles once
  useEffect(() => {
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 40; i++) {
        particlesRef.current.push({
          x: Math.random() * 500,
          y: Math.random() * 500,
          speedX: (Math.random() - 0.5) * 0.35,
          speedY: (Math.random() - 0.5) * 0.35,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.6 + 0.1
        });
      }
    }
  }, []);

  // Continuous Auto-Walk wander loop (mimicking walking in Pokemon Go)
  useEffect(() => {
    if (useRealGPS || !autoWalk) return;

    const interval = setInterval(() => {
      // Infuse slight random adjustments to wandering heading
      wanderingAngleRef.current += (Math.random() - 0.5) * 0.5;

      let stepDelta = 0.000015; // standard walk step size (~1.5m)
      if (movementSpeed === 'bike') stepDelta = 0.000045; // bike (~4.5m)
      if (movementSpeed === 'drive') stepDelta = 0.00015; // drive (~15m)

      const newLat = playerPos.lat + Math.cos(wanderingAngleRef.current) * stepDelta;
      const newLng = playerPos.lng + Math.sin(wanderingAngleRef.current) * stepDelta;

      onMove(newLat, newLng);
    }, 1500);

    return () => clearInterval(interval);
  }, [useRealGPS, autoWalk, movementSpeed, playerPos, onMove]);

  // Animate the radar scanning pulse sweeps
  useEffect(() => {
    let animationFrameId: number;
    const updateScan = () => {
      setScanAnimation((prev) => (prev + 1.25) % 150);
      animationFrameId = requestAnimationFrame(updateScan);
    };
    animationFrameId = requestAnimationFrame(updateScan);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Set up real GPS watching if toggled
  useEffect(() => {
    if (!useRealGPS) return;

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      setUseRealGPS(false);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      onMove(position.coords.latitude, position.coords.longitude);
      setGpsError(null);
    };

    const handleError = (error: GeolocationPositionError) => {
      setGpsError(error.message || "Failed to acquire coordinate location.");
      setUseRealGPS(false);
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [useRealGPS]);

  // Check how close we are to the nearest uncollected drop
  const getMinDistanceToUncollectedDrop = () => {
    let minDistance = Infinity;
    drops.forEach((drop) => {
      const isClaimed = !!drop.claimedAt && (Date.now() - drop.claimedAt < 90000);
      if (isClaimed) return;

      const latMeters = (drop.lat - playerPos.lat) * 111000;
      const lngMeters = (drop.lng - playerPos.lng) * 85000;
      const dist = Math.sqrt(latMeters * latMeters + lngMeters * lngMeters);
      
      if (dist < minDistance) {
        minDistance = dist;
      }
    });
    return minDistance;
  };

  const minMetersToDrop = getMinDistanceToUncollectedDrop();
  const intensity = Math.max(1.0, Math.min(8.0, 150.0 / Math.max(10.0, minMetersToDrop)));

  // Handle drawing the canvas cybersecurity aesthetic grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear background (neon cyberpunk slate matching the cards)
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines (moving relative to player location for feedback)
    ctx.strokeStyle = 'rgba(0, 209, 255, 0.04)'; // cyber cyan grid
    ctx.lineWidth = 1;
    
    const gridSpacing = 40;
    const offsetX = Math.floor((playerPos.lng * 100000) % gridSpacing);
    const offsetY = Math.floor((playerPos.lat * 100000) % gridSpacing);

    for (let x = -offsetX; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw simulated streets and features to give a geospatial feel
    ctx.strokeStyle = 'rgba(255, 0, 128, 0.03)'; // pink roads
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, centerY * 0.4);
    ctx.lineTo(width, centerY * 1.6);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.03)'; // virtual eco green parks
    ctx.fillStyle = 'rgba(0, 255, 0, 0.01)';
    ctx.beginPath();
    ctx.arc(centerX * 1.4, centerY * 0.5, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subtle particle floating animation which intensifies when close to drop
    // Intensity factor ranges from 1.0 (calm) up to 8.0 (furiously fast sparklings)

    particlesRef.current.forEach((p) => {
      // Position shifts scaled by frequency intensity
      p.x += p.speedX * intensity;
      p.y += p.speedY * intensity;

      // Wrap-around coordinate bounds
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Size swells under high energy
      const currentSize = p.size * (0.8 + intensity * 0.12);
      ctx.fillStyle = premium 
         ? `rgba(255, 0, 128, ${Math.min(1, p.alpha * (0.4 + intensity * 0.08))})`
         : `rgba(0, 209, 255, ${Math.min(1, p.alpha * (0.4 + intensity * 0.08))})`;
      
      // Render
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      ctx.fill();

      // High proximity sparkling flare lines
      if (intensity > 4 && Math.random() > 0.94) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x - 3, p.y);
        ctx.lineTo(p.x + 3, p.y);
        ctx.moveTo(p.x, p.y - 3);
        ctx.lineTo(p.x, p.y + 3);
        ctx.stroke();
      }
    });

    // Draw dynamic pulse visualizer ring (Radar scanner)
    ctx.strokeStyle = premium ? 'rgba(255, 0, 128, 0.15)' : 'rgba(0, 209, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radarRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner scanning radar sweep
    const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radarRadius);
    gradient.addColorStop(0, 'rgba(0, 209, 255, 0)');
    gradient.addColorStop(0.5, premium ? 'rgba(255, 0, 128, 0.02)' : 'rgba(0, 209, 255, 0.02)');
    gradient.addColorStop(1, premium ? 'rgba(255, 0, 128, 0.08)' : 'rgba(0, 209, 255, 0.06)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radarRadius, 0, Math.PI * 2);
    ctx.fill();

    // Moving ring animation
    ctx.strokeStyle = premium ? 'rgba(255, 0, 128, 0.3)' : 'rgba(0, 209, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, (scanAnimation / 150) * radarRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw concentric scale rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.setLineDash([4, 4]);
    [0.3, 0.6].forEach((scale) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radarRadius * scale, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw drops
    drops.forEach((drop) => {
      // Calculate delta position relative to player (co-ordinates to canvas space)
      const latDiff = drop.lat - playerPos.lat;
      const lngDiff = drop.lng - playerPos.lng;

      // Map to canvas coordinate grid (1 deg lat = 111,000 meters, we match scaling to radius)
      const scaleFactor = 40000; // factor tuning coordinate scale physically
      const dropX = centerX + (lngDiff * scaleFactor * 1.3);
      const dropY = centerY - (latDiff * scaleFactor); // Canvas y is upside down

      // Check distance in pixels
      const dx = dropX - centerX;
      const dy = dropY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isWithinRadar = dist <= radarRadius;

      // Draw drop pulse ring
      let baseColor = '#5e6880';
      let accentColor = 'rgba(94, 104, 128, 0.4)';
      let shadowSpread = 'rgba(94, 104, 128, 0.1)';

      if (drop.rarity === 'COMMON') {
        baseColor = '#3b82f6'; // Bright blue
        accentColor = 'rgba(59, 130, 246, 0.6)';
        shadowSpread = 'rgba(59, 130, 246, 0.2)';
      } else if (drop.rarity === 'UNCOMMON') {
        baseColor = '#a855f7'; // Purple
        accentColor = 'rgba(168, 85, 247, 0.6)';
        shadowSpread = 'rgba(168, 85, 247, 0.2)';
      } else if (drop.rarity === 'RARE') {
        baseColor = '#eab308'; // Amber Gold
        accentColor = 'rgba(234, 179, 8, 0.7)';
        shadowSpread = 'rgba(234, 179, 8, 0.3)';
      } else if (drop.rarity === 'SHINY') {
        baseColor = '#FF0080'; // Radiant Pink rose
        accentColor = 'rgba(255, 0, 128, 0.8)';
        shadowSpread = 'rgba(255, 0, 128, 0.4)';
      } else if (drop.rarity === 'EPIC') {
        baseColor = '#10b981'; // Vivid Emerald neon
        accentColor = 'rgba(16, 185, 129, 0.9)';
        shadowSpread = 'rgba(16, 185, 129, 0.5)';
      }

      // Check if item is already claimed
      const isClaimed = !!drop.claimedAt && (Date.now() - drop.claimedAt < 90000); // 1.5 min cooldown
      if (isClaimed) {
        baseColor = 'rgba(75, 85, 99, 0.5)';
        accentColor = 'rgba(75, 85, 99, 0.2)';
        shadowSpread = 'rgba(75, 85, 99, 0.05)';
      }

      // Draw outer glowing pulsing glow
      const pulseRadius = 7 + Math.sin(Date.now() / 200) * 3;
      ctx.fillStyle = shadowSpread;
      ctx.beginPath();
      ctx.arc(dropX, dropY, pulseRadius + 6, 0, Math.PI * 2);
      ctx.fill();

      // If within radar (collectible), draw a secondary glowing indicator line
      if (isWithinRadar && !isClaimed) {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(dropX, dropY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Main Drop Node (Musical Record Vinyl Style)
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(dropX, dropY, 9, 0, Math.PI * 2);
      ctx.fill();

      // Center vinyl color plate
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(dropX, dropY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw center needle/hole
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(dropX, dropY, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Float Name label above
      if (!isClaimed) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(drop.name, dropX, dropY - 14);

        // Subtext showing category/genre
        ctx.fillStyle = baseColor;
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillText(`${drop.rarity} [${drop.genre}]`, dropX, dropY - 6);
      } else {
        ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText("COOLDOWN", dropX, dropY - 12);
      }
    });

    // Draw Player Indicator (The Pulsing Cyber Jet/Marker)
    ctx.shadowBlur = 10;
    ctx.shadowColor = premium ? '#FF0080' : '#00D1FF';
    
    // Glowing ring round player
    ctx.fillStyle = premium ? 'rgba(255, 0, 128, 0.1)' : 'rgba(0, 209, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Central core triangle direction needle
    ctx.fillStyle = premium ? '#FF0080' : '#00D1FF';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 8);
    ctx.lineTo(centerX - 6, centerY + 6);
    ctx.lineTo(centerX, centerY + 3);
    ctx.lineTo(centerX + 6, centerY + 6);
    ctx.closePath();
    ctx.fill();

    // Small glowing pulse center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

  }, [drops, playerPos, radarRadius, premium, scanAnimation, minMetersToDrop]);

  // Check which drops are reachable (within radarRadius) in real calculations
  const getReachableDrops = () => {
    return drops.filter((drop) => {
      const isClaimed = !!drop.claimedAt && (Date.now() - drop.claimedAt < 90000);
      if (isClaimed) return false;

      const latMeters = (drop.lat - playerPos.lat) * 111000;
      const lngMeters = (drop.lng - playerPos.lng) * 85000;
      const distanceMeters = Math.sqrt(latMeters * latMeters + lngMeters * lngMeters);

      const mappedRadiusMeters = (radarRadius / 100) * 50; 
      return distanceMeters <= mappedRadiusMeters;
    });
  };

  const reachable = getReachableDrops();

  return (
    <div className="bg-[#1E293B] flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      
      {/* Dynamic Visual Canvas Display Layer */}
      <div ref={containerRef} className="relative bg-[#1E293B] h-[55%] shrink-0">
        <canvas
          id="music-sonar-canvas"
          ref={canvasRef}
          width={500}
          height={400}
          className="w-full h-full cursor-pointer border-b border-[#334155]"
          title="Telemetry Display Interface"
          onClick={(e) => {
            // Allow double-clicking on the canvas grid map to instantly drive / walk there! Double-click simulator helper.
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;

            const dx = clickX - centerX;
            const dy = centerY - clickY;

            const scaleFactor = 40000;
            const lngDiff = (dx / 1.3) / scaleFactor;
            const latDiff = dy / scaleFactor;

            onMove(playerPos.lat + latDiff, playerPos.lng + lngDiff);
          }}
        />

        {/* Floating Top Radar Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
          <div className="bg-[#0F172A]/90 backdrop-blur-md border border-[#334155] px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto shadow-md">
            <Compass className={`w-3.5 h-3.5 text-[#00D1FF] ${movementSpeed !== 'walk' ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-mono font-medium text-slate-200">
              {playerPos.lat.toFixed(5)}°N, {playerPos.lng.toFixed(5)}°W
            </span>
          </div>

          <div className="bg-[#0F172A]/90 backdrop-blur-md border border-[#334155] p-1 rounded-full flex gap-1 pointer-events-auto shadow-md">
            <button
              onClick={() => setMovementSpeed('walk')}
              className={`px-2 py-0.5 text-[9px] uppercase tracking-wide font-extrabold rounded-full transition-all cursor-pointer ${
                movementSpeed === 'walk'
                  ? 'bg-[#00D1FF] text-[#0F172A]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Walk
            </button>
            <button
              onClick={() => setMovementSpeed('bike')}
              className={`px-2 py-0.5 text-[9px] uppercase tracking-wide font-extrabold rounded-full transition-all cursor-pointer ${
                movementSpeed === 'bike'
                  ? 'bg-[#FFD700] text-[#0F172A]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Bike
            </button>
            <button
              onClick={() => setMovementSpeed('drive')}
              className={`px-2 py-0.5 text-[9px] uppercase tracking-wide font-extrabold rounded-full transition-all cursor-pointer ${
                movementSpeed === 'drive'
                  ? 'bg-[#FF0080] text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Drive
            </button>
          </div>
        </div>

        {/* Bottom instructions bar */}
        <div className="absolute bottom-4 left-4 bg-[#0F172A]/90 backdrop-blur-sm border border-[#334155] px-3 py-1 rounded-md text-[9px] font-mono text-[#94A3B8]">
          {minMetersToDrop < 60 ? (
            <span className="text-[#00FF00] font-bold animate-pulse">🔥 High proximity Sparkles active! Near drop.</span>
          ) : (
            <span>Auto wanders around areas. Tap map to leap!</span>
          )}
        </div>

        {/* GPS Active Button */}
        <button
          onClick={() => setUseRealGPS(!useRealGPS)}
          className={`absolute bottom-4 right-4 p-2.5 rounded-full border shadow-lg transition-all cursor-pointer ${
            useRealGPS 
              ? 'bg-[#00FF00] border-[#00FF00]/80 text-[#0F172A] animate-pulse font-bold'
              : 'bg-[#0F172A] border-[#334155] text-[#94A3B8] hover:text-white'
          }`}
          title={useRealGPS ? "Disconnect simulated GPS Mode" : "Connect Real Browser GPS Location"}
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>

        {gpsError && (
          <div className="absolute top-16 left-4 right-4 bg-rose-950/95 border border-rose-800 text-rose-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="truncate">{gpsError}</span>
          </div>
        )}
      </div>

      {/* SONAR EXPLORATION CONTROL DECK */}
      <div className="w-full h-[45%] bg-[#1E293B] border-t border-[#334155] p-4 flex flex-col justify-between overflow-y-auto">
        
        {/* Navigation / Simulation Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#334155] pb-2">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FF0080]" />
              Simulation Settings
            </h3>
            <span className="bg-[#00D1FF]/10 text-[#00D1FF] text-[8px] font-mono px-1.5 py-0.2 rounded border border-[#00D1FF]/20 animate-pulse">
              LIVE
            </span>
          </div>

          {/* Sparkles Intensity HUD card */}
          <div className="bg-[#0F172A]/40 border border-[#334155]/60 p-2.5 rounded-xl space-y-1.5">
            <div className="text-[9px] uppercase font-mono tracking-widest text-[#94A3B8] font-bold">
              Energy Proximity
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-300">
                {minMetersToDrop === Infinity ? 'Searching...' : `Nearest: ${minMetersToDrop.toFixed(0)}m`}
              </span>
              <span className={`text-[10px] font-mono font-bold font-extrabold ${intensity > 4 ? 'text-[#FF0080] animate-pulse' : 'text-[#00D1FF]'}`}>
                {intensity > 4 ? 'SPARKLING' : 'CALM'}
              </span>
            </div>

            {/* Sparkles intensity bar */}
            <div className="w-full bg-[#1e293b] h-1 rounded-full overflow-hidden border border-[#334155]/45">
              <div 
                className="h-full bg-gradient-to-r from-[#00D1FF] to-[#FF0080] transition-all duration-300"
                style={{ width: `${Math.min(100, (intensity / 8.0) * 100)}%` }}
              />
            </div>
            <p className="text-[8px] text-[#94A3B8] font-mono leading-tight">
              Energy particles float and sparkle faster as you wander closer to unclaimed drops.
            </p>
          </div>

          {/* Autonomous walk trigger */}
          <div className="bg-[#0F172A]/30 border border-[#334155]/50 p-2.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-mono text-slate-300 font-bold">Wander Rover</span>
              </div>
              <button
                onClick={() => setAutoWalk(!autoWalk)}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold border rounded-md transition-all cursor-pointer ${
                  autoWalk 
                    ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/35' 
                    : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {autoWalk ? 'ACTIVE' : 'STATIONARY'}
              </button>
            </div>
            <p className="text-[8px] text-[#94A3B8] font-mono leading-normal">
              Autonomous GPS walk simulator roams the city streets automatically for you. Turn off to freeze position.
            </p>
          </div>
        </div>

        {/* Active scan targets list */}
        <div className="flex-1 mt-4 font-display">
          <h4 className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider mb-2">
            Near Scan Targets ({reachable.length})
          </h4>

          {reachable.length === 0 ? (
            <div className="bg-[#0F172A]/35 rounded-xl p-3 text-center border border-[#334155]/50">
              <Compass className="w-5 h-5 text-[#94A3B8]/20 mx-auto mb-1 animate-pulse" />
              <p className="text-[10px] text-[#94A3B8] leading-tight">No active music drops in scanning zone range.</p>
              <p className="text-[8px] text-slate-500 mt-0.5">Let your rover wander a bit closer!</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {reachable.map((drop) => {
                let badgeColor = 'bg-[#3b82f6]/10 text-blue-300 border-[#3b82f6]/20';
                if (drop.rarity === 'UNCOMMON') badgeColor = 'bg-[#a855f7]/15 text-purple-300 border-[#a855f7]/20';
                if (drop.rarity === 'RARE') badgeColor = 'bg-[#eab308]/15 text-yellow-300 border-[#eab308]/20';
                if (drop.rarity === 'SHINY') badgeColor = 'bg-[#FF0080]/15 text-[#FF0080] border-[#FF0080]/20';
                if (drop.rarity === 'EPIC') badgeColor = 'bg-[#10b981]/15 text-emerald-300 border-[#10b981]/20';

                return (
                  <button
                    key={drop.id}
                    onClick={() => onClaimDrop(drop.id)}
                    className="w-full text-left bg-[#0F172A] hover:bg-[#1E293B]/60 border border-[#334155]/60 hover:border-[#FF0080] p-1.5 rounded-lg flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="min-w-0 pr-1 text-[10px]">
                      <p className="font-extrabold text-[#94A3B8] truncate group-hover:text-white">{drop.name}</p>
                      <p className="text-[8px] text-slate-500 font-mono mt-0.5 truncate">{drop.genre}</p>
                    </div>
                    <span className={`text-[7px] font-mono border rounded px-1 shrink-0 ${badgeColor}`}>
                      {drop.rarity}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
