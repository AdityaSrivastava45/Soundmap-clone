import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy global AI client setup
let _ai: any = null;
function getAIClient() {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      _ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return _ai;
}

// Fallback high-quality static list of tracks of famous artists in case Gemini is offline/no key
const FALLBACK_TRACKS: Record<string, string[]> = {
  'Taylor Swift': ['Cruel Summer', 'Blank Space', 'Anti-Hero', 'Cardigan', 'Love Story', 'Fortnight', 'Willow', 'Shake It Off', 'Style', 'Lover'],
  'Daft Punk': ['Get Lucky', 'One More Time', 'Harder, Better, Faster, Stronger', 'Around the World', 'Instant Crush', 'Lose Yourself to Dance', 'Something About Us', 'Technologic'],
  'Kendrick Lamar': ['HUMBLE.', 'Alright', 'Not Like Us', 'DNA.', 'Money Trees', 'Swimming Pools (Drank)', 'Bitch, Don\'t Kill My Vibe', 'King Kunta', 'm.A.A.d city'],
  'The Weeknd': ['Blinding Lights', 'Starboy', 'Save Your Tears', 'The Hills', 'Can\'t Feel My Face', 'After Hours', 'Die For You', 'I Feel It Coming'],
  'Billie Eilish': ['Bad Guy', 'Lunch', 'ocean eyes', 'What Was I Made For?', 'Everything I Wanted', 'Bury a Friend', 'Birds of a Feather', 'Lovely'],
  'Dua Lipa': ['Levitating', 'Don\'t Start Now', 'Houdini', 'Training Season', 'Dance the Night', 'Physical', 'New Rules', 'Break My Heart'],
  'Drake': ['God\'s Plan', 'Hotline Bling', 'Nice For What', 'One Dance', 'Passionfruit', 'Rich Baby Daddy', 'In My Feelings'],
  'Post Malone': ['Circles', 'Sunflower', 'Congratulations', 'Rockstar', 'Chemical', 'I Fall Apart', 'Better Now', 'White Iverson'],
  'Radiohead': ['Creep', 'Karma Police', 'No Surprises', 'Karma Police', 'Paranoid Android', 'High and Dry', 'Fake Plastic Trees'],
  'Queen': ['Bohemian Rhapsody', 'Don\'t Stop Me Now', 'Another One Bites the Dust', 'We Will Rock You', 'Under Pressure', 'Radio Ga Ga']
};

const STATS_BY_GENRE: Record<string, string[]> = {
  'Pop': ['Taylor Swift', 'The Weeknd', 'Billie Eilish', 'Dua Lipa', 'Ariana Grande', 'Olivia Rodrigo'],
  'Hip Hop': ['Kendrick Lamar', 'Drake', 'Travis Scott', 'Kanye West', 'Post Malone', 'Eminem'],
  'Electronic': ['Daft Punk', 'Fred again..', 'Skrillex', 'Disclosure', 'Calvin Harris', 'Avicii'],
  'Rock': ['Queen', 'Radiohead', 'Nirvana', 'Pink Floyd', 'Arctic Monkeys', 'The Beatles'],
  'R&B/Indie': ['Frank Ocean', 'Tame Impala', 'SZA', 'Steve Lacy', 'Mitski', 'Mac DeMarco']
};

// Generates simulated NPCs
const NPC_NAMES = [
  'VinylCollector99', 'BeatDrop_Max', 'SonicExplorer', 'RapCaviarPlug', 
  'HyperpopGhost', 'DaftFanatic82', 'SwiftiePrimary', 'Synthwave_Sam', 
  'MelodyHunter', 'ChordsAndCoffee', 'BasslineBiker', 'LofiLoverBot'
];

// Helper to determine sound metadata properties
function getRandomMint() {
  return Math.floor(Math.random() * 9500) + 1;
}

// 1. Endpoint: AI Song Drop Generator
app.post('/api/generate-song', async (req, res) => {
  const { artist, genre, rarity } = req.body;
  const userArtist = artist || 'Taylor Swift';
  const userGenre = genre || 'Pop';
  const targetRarity = rarity || 'COMMON';

  const ai = getAIClient();
  if (ai) {
    try {
      // Formulate request the modern @google/genai way
      const prompt = `Return a single real music track of the artist/genre specified:
Artist: "${userArtist}"
Suggested Genre: "${userGenre}"

Ensure it is a genuine real song by them. Return a custom JSON object in the following format:
{
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name Name",
  "genre": "Genre"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a professional music archive database. You only output valid JSON with track, artist, album and genre.'
        }
      });

      const text = response.text || '';
      const data = JSON.parse(text.trim());
      
      res.json({
        success: true,
        song: {
          id: 'song_' + Math.random().toString(36).substr(2, 9),
          title: data.title || 'Dynamic Beat',
          artist: data.artist || userArtist,
          album: data.album || 'Single/Release',
          genre: data.genre || userGenre,
          rarity: targetRarity,
          mintNumber: getRandomMint(),
          obtainedAt: Date.now()
        }
      });
      return;
    } catch (e: any) {
      console.warn('Gemini song generation failed, falling back to database:', e.message);
    }
  }

  // Fallback engine
  const artistPool = userArtist && FALLBACK_TRACKS[userArtist] ? [userArtist] : Object.keys(FALLBACK_TRACKS);
  const selectedArtist = artistPool[Math.floor(Math.random() * artistPool.length)];
  const trackList = FALLBACK_TRACKS[selectedArtist] || ['Unknown Symphony'];
  const trackTitle = trackList[Math.floor(Math.random() * trackList.length)];
  
  res.json({
    success: true,
    song: {
      id: 'song_' + Math.random().toString(36).substr(2, 9),
      title: trackTitle,
      artist: selectedArtist,
      album: 'Soundmap Deluxe Edition',
      genre: userGenre,
      rarity: targetRarity,
      mintNumber: getRandomMint(),
      obtainedAt: Date.now()
    }
  });
});

// 2. Endpoint: Generate Daily Trivia Quest custom to favorite artists
app.post('/api/trivia-quest', async (req, res) => {
  const { favoriteArtists } = req.body;
  const artists = (favoriteArtists && favoriteArtists.length > 0) ? favoriteArtists : ['Taylor Swift', 'Daft Punk', 'Kendrick Lamar'];
  const selectedArtist = artists[Math.floor(Math.random() * artists.length)];

  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `Create a multiple-choice trivia challenge for music artist: "${selectedArtist}".
Format your output as a single clean JSON matching:
{
  "artist": "${selectedArtist}",
  "question": "A specific interesting trivia question about their albums, lyrics or history.",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an adaptive trivia master. Always return exactly the properties: artist, question, options (array of exactly 4 strings), and correctIndex (0-3).'
        }
      });

      const text = response.text || '';
      const data = JSON.parse(text.trim());

      res.json({
        success: true,
        trivia: {
          id: 'trivia_' + Math.random().toString(36).substr(2, 9),
          ...data,
          coinsReward: 350,
          xpReward: 150
        }
      });
      return;
    } catch (e: any) {
      console.warn('Gemini trivia failed, falling back:', e.message);
    }
  }

  // Fallback trivia
  const defaultTrivia: Record<string, any[]> = {
    'Taylor Swift': [
      {
        question: "Which music video features Taylor Swift playing a male character named 'The Man'?",
        options: ["Look What You Made Me Do", "The Man", "Bad Blood", "Shake It Off"],
        correctIndex: 1
      },
      {
        question: "What is the name of Taylor Swift's first official pop album released in 2014?",
        options: ["Red", "Fearless", "Reputation", "1989"],
        correctIndex: 3
      }
    ],
    'Daft Punk': [
      {
        question: "In what year did French electronic duo Daft Punk officially announce their split?",
        options: ["2018", "2020", "2021", "2023"],
        correctIndex: 2
      },
      {
        question: "Which legendary musician co-wrote and provided vocals for 'Get Lucky'?",
        options: ["Pharrell Williams", "Nile Rodgers", "Giorgio Moroder", "Julian Casablancas"],
        correctIndex: 0
      }
    ],
    'Kendrick Lamar': [
      {
        question: "Which of Kendrick Lamar's albums was awarded the prestigious Pulitzer Prize for Music in 2018?",
        options: ["DAMN.", "To Pimp a Butterfly", "good kid, m.A.A.d city", "Mr. Morale & the Big Steppers"],
        correctIndex: 0
      }
    ]
  };

  const pool = defaultTrivia[selectedArtist] || [
    {
      question: `Which artist gained massive popularity with music hits featuring ${selectedArtist}?`,
      options: ["The Weeknd", "Dua Lipa", "Kendrick Lamar", "Taylor Swift"],
      correctIndex: 0
    }
  ];
  const triviaSample = pool[Math.floor(Math.random() * pool.length)];

  res.json({
    success: true,
    trivia: {
      id: 'trivia_' + Math.random().toString(36).substr(2, 9),
      artist: selectedArtist,
      ...triviaSample,
      coinsReward: 350,
      xpReward: 150
    }
  });
});

// 3. Endpoint: Retrieve dynamic NPC marketplace trades matching player preference
app.post('/api/npc-trades', (req, res) => {
  const { userArtists } = req.body;
  const artists = (userArtists && userArtists.length > 0) ? userArtists : ['Taylor Swift', 'Kendrick Lamar', 'Daft Punk', 'The Weeknd'];

  // Generate 4 dynamic simulated trade structures
  const offers = Array.from({ length: 6 }).map((_, i) => {
    const artist = artists[Math.floor(Math.random() * artists.length)];
    const tracks = FALLBACK_TRACKS[artist] || ['Symphonic Release'];
    const track = tracks[Math.floor(Math.random() * tracks.length)];
    const rarities: ('COMMON' | 'UNCOMMON' | 'RARE' | 'SHINY' | 'EPIC')[] = ['COMMON', 'UNCOMMON', 'RARE', 'SHINY', 'EPIC'];
    
    // Weighted rarity
    const rarityRand = Math.random();
    let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'SHINY' | 'EPIC' = 'COMMON';
    if (rarityRand > 0.95) rarity = 'EPIC';
    else if (rarityRand > 0.85) rarity = 'SHINY';
    else if (rarityRand > 0.65) rarity = 'RARE';
    else if (rarityRand > 0.40) rarity = 'UNCOMMON';

    const npcName = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];

    return {
      id: 'trade_' + i + '_' + Math.random().toString(36).substr(2, 5),
      senderId: 'npc_' + i,
      senderName: npcName,
      offeredSongs: [{
        id: 'song_npc_' + Math.random().toString(36).substr(2, 6),
        title: track,
        artist: artist,
        album: 'Album Edition',
        genre: 'Pop/Rap',
        rarity: rarity,
        mintNumber: getRandomMint(),
        obtainedAt: Date.now() - (360000 * i)
      }],
      requestedCoins: rarity === 'EPIC' ? 8500 : rarity === 'SHINY' ? 4500 : rarity === 'RARE' ? 1200 : rarity === 'UNCOMMON' ? 500 : 150,
      requestedCriteria: {
        rarity: rarity,
        artist: artist,
        genre: 'Any'
      },
      status: 'OPEN',
      bids: [],
      createdAt: Date.now() - (600000 * i)
    };
  });

  res.json({
    success: true,
    offers
  });
});

// --- DISCOVERY FEED & SOCIAL CORE DATA STORE ---
let statefulDiscoveries: any[] = [
  {
    id: "disc_1",
    collectorName: "BeatDrift_NYC",
    collectorAvatar: "🎧",
    isFriend: true,
    distanceMeters: 45,
    song: {
      id: "song_feed_1",
      title: "Not Like Us",
      artist: "Kendrick Lamar",
      album: "GNX Season",
      genre: "Hip Hop",
      rarity: "SHINY",
      mintNumber: 1542,
      obtainedAt: Date.now() - 1800000 // 30 mins ago
    },
    likes: 12,
    likedByMe: false,
    comments: [
      {
        id: "comm_1",
        authorName: "SwiftiePrimary",
        avatarUrl: "💅",
        text: "OMG! A Shiny Kendrick track!? That is so rare, congrats!",
        timestamp: Date.now() - 1500000
      },
      {
        id: "comm_2",
        authorName: "Synthwave_Sam",
        avatarUrl: "🕹️",
        text: "Location drops around Brooklyn are crazy today. I grabbed a common nearby Drake drop 10m away.",
        timestamp: Date.now() - 1200000
      }
    ],
    collectedAt: Date.now() - 1800000
  },
  {
    id: "disc_2",
    collectorName: "SwiftiePrimary",
    collectorAvatar: "💅",
    isFriend: true,
    distanceMeters: 120,
    song: {
      id: "song_feed_2",
      title: "Cruel Summer",
      artist: "Taylor Swift",
      album: "Lover",
      genre: "Pop",
      rarity: "RARE",
      mintNumber: 849,
      obtainedAt: Date.now() - 3600000 // 1 hour ago
    },
    likes: 8,
    likedByMe: false,
    comments: [
      {
        id: "comm_3",
        authorName: "BeatDrift_NYC",
        avatarUrl: "🎧",
        text: "Wow! Nice pull! Lover is a total pop masterwork.",
        timestamp: Date.now() - 3300000
      }
    ],
    collectedAt: Date.now() - 3600000
  },
  {
    id: "disc_3",
    collectorName: "DaftFanatic82",
    collectorAvatar: "🤖",
    isFriend: false,
    distanceMeters: 380,
    song: {
      id: "song_feed_3",
      title: "Instant Crush",
      artist: "Daft Punk",
      album: "Random Access Memories",
      genre: "Electronic",
      rarity: "EPIC",
      mintNumber: 42,
      obtainedAt: Date.now() - 7200000 // 2 hours ago
    },
    likes: 27,
    likedByMe: false,
    comments: [
      {
        id: "comm_4",
        authorName: "HyperpopGhost",
        avatarUrl: "👻",
        text: "MINT #42 EPIC DAFT PUNK?? Put it on the trade market immediately, I have 10,000 coins!",
        timestamp: Date.now() - 7000000
      }
    ],
    collectedAt: Date.now() - 7200000
  },
  {
    id: "disc_4",
    collectorName: "LofiLoverBot",
    collectorAvatar: "☕",
    isFriend: false,
    distanceMeters: 890,
    song: {
      id: "song_feed_4",
      title: "Birds of a Feather",
      artist: "Billie Eilish",
      album: "HIT ME HARD AND SOFT",
      genre: "Pop",
      rarity: "COMMON",
      mintNumber: 4901,
      obtainedAt: Date.now() - 14400000 // 4 hours ago
    },
    likes: 3,
    likedByMe: false,
    comments: [],
    collectedAt: Date.now() - 14400000
  }
];

const FALLBACK_ARTIST_INFO: Record<string, any> = {
  'Taylor Swift': {
    artist: 'Taylor Swift',
    bio: 'Taylor Swift is a genre-defining singer-songwriter who has scaled country, pop, and indie-folk heights with unparalleled chart success and lyric depth.',
    genre: 'Pop, Country, Synth-Pop, Folk',
    keyAlbums: ['1989', 'Red', 'Folklore', 'Midnights'],
    currentVibe: 'Stadium-scale storytelling paired with massive pop elegance and a loyal global fanbase.',
    funFact: 'Taylor Swift wrote single-handedly every song on her third studio album, "Speak Now," at age 20 to prove her songwriting capabilities.',
    suggestedDropZone: 'Cozy boutique bakeries, scenic city parks, or brightly lit campus bookstores.'
  },
  'Kendrick Lamar': {
    artist: 'Kendrick Lamar',
    bio: 'Widely heralded as one of the greatest lyricists in hip-hop history, Kendrick Lamar blends deep socio-political insights, jazz fusion elements, and unmatched delivery.',
    genre: 'Hip Hop, Conscious Rap, Jazz-Rap',
    keyAlbums: ['good kid, m.A.A.d city', 'To Pimp a Butterfly', 'DAMN.', 'GNX'],
    currentVibe: 'Compelling poetic narratives, raw West Coast energy, and profound sonic experimentation.',
    funFact: 'Kendrick Lamar is the first and only non-classical, non-jazz musician to receive the prestigious Pulitzer prize in Music for his "DAMN." album.',
    suggestedDropZone: 'Vibrant basketball courts, vinyl stores, or active industrial neighborhood hubs.'
  },
  'Daft Punk': {
    artist: 'Daft Punk',
    bio: 'Daft Punk are the pioneering French electronic music duo who set the gold standard for house, techno, and electro-pop using their iconic helmet personae.',
    genre: 'Electronic, French House, Synth-Pop, Disco',
    keyAlbums: ['Discovery', 'Homework', 'Random Access Memories'],
    currentVibe: 'Vocoder melodies, infectious dance floor groove patterns, and pristine retro-futurism.',
    funFact: 'Daft Punk wore their famous custom metallic robot helmets in public for over two decades to separate their music art from their personal celebrity lives.',
    suggestedDropZone: 'Retro arcades, electric subway pathways, or underground late-night warehouse clubs.'
  }
};

// 4. Endpoint: Retrieve Discovery Feed List
app.get('/api/discoveries', (req, res) => {
  res.json({
    success: true,
    discoveries: statefulDiscoveries
  });
});

// 5. Endpoint: Like or Unlike a Discovery
app.post('/api/discoveries/like', (req, res) => {
  const { discoveryId } = req.body;
  const discoveryIndex = statefulDiscoveries.findIndex(d => d.id === discoveryId);
  
  if (discoveryIndex === -1) {
    return res.status(404).json({ success: false, error: 'Discovery item not found' });
  }

  const discovery = statefulDiscoveries[discoveryIndex];
  discovery.likedByMe = !discovery.likedByMe;
  if (discovery.likedByMe) {
    discovery.likes += 1;
  } else {
    discovery.likes = Math.max(0, discovery.likes - 1);
  }

  res.json({
    success: true,
    discovery
  });
});

// 6. Endpoint: Post Comment to a Discovery
app.post('/api/discoveries/comment', async (req, res) => {
  const { discoveryId, authorName, text, avatarUrl } = req.body;
  
  const discoveryIndex = statefulDiscoveries.findIndex(d => d.id === discoveryId);
  if (discoveryIndex === -1) {
    return res.status(404).json({ success: false, error: 'Discovery item not found' });
  }

  const discovery = statefulDiscoveries[discoveryIndex];
  
  const newComment = {
    id: 'comm_' + Math.random().toString(36).substr(2, 9),
    authorName: authorName || 'AnonymousDJ',
    avatarUrl: avatarUrl || '🎧',
    text: text || '',
    timestamp: Date.now()
  };

  discovery.comments.push(newComment);

  // Trigger simulated chatbot replies using Gemini for dynamic conversation!
  const ai = getAIClient();
  let botReply: any = null;

  if (ai) {
    try {
      const prompt = `We have a location-based music collection game.
User "${authorName}" just commented on another player's discovered song:
Collector: "${discovery.collectorName}"
Song: "${discovery.song.title}" by "${discovery.song.artist}" (Rarity: ${discovery.song.rarity})
User's comment text: "${text}"

Reply to the user's comment in character of either the original collector ("${discovery.collectorName}") or another local enthusiast. 
Keep the reply extremely brief (1 short sentence), casual, natural, enthusiastic about music, and using conversational slang.
Return a clean JSON:
{
  "authorName": "The reply username (either "${discovery.collectorName}" or a mutual buddy like "Synthwave_Sam" or "LofiLoverBot")",
  "avatarUrl": "Single emoji avatar",
  "text": "The comment body"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a lively simulated music DJ collector. Keep responses matching standard social media comments: casual, short, authentic.'
        }
      });

      const responseText = response.text || '';
      const replyData = JSON.parse(responseText.trim());

      botReply = {
        id: 'comm_bot_' + Math.random().toString(36).substr(2, 9),
        authorName: replyData.authorName || discovery.collectorName,
        avatarUrl: replyData.avatarUrl || '🎵',
        text: replyData.text || 'Awesome! Thanks for checking it out.',
        timestamp: Date.now() + 1000 // slightly after
      };

      discovery.comments.push(botReply);
    } catch (e) {
      console.warn("Failed generating automated Gemini reaction comment:", e);
    }
  }

  // Fallback bot comment if Gemini not initialized
  if (!botReply && Math.random() > 0.3) {
    botReply = {
      id: 'comm_bot_fallback_' + Math.random().toString(36).substr(2, 9),
      authorName: discovery.collectorName,
      avatarUrl: discovery.collectorAvatar,
      text: "Appreciate it! Brooklyn is loaded with good drops today.",
      timestamp: Date.now() + 1000
    };
    discovery.comments.push(botReply);
  }

  res.json({
    success: true,
    comments: discovery.comments
  });
});

// 7. Endpoint: Dynamic AI Artist Information
app.post('/api/artist-info', async (req, res) => {
  const { artist } = req.body;
  const artistName = artist || 'Taylor Swift';

  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `Provide Detailed Music Analysis and Collector Info for the musical artist: "${artistName}".
Format your output as a single clean JSON matching EXACTLY this schema:
{
  "artist": "${artistName}",
  "bio": "A succinct, high-quality 2-3 sentence biography of the artist.",
  "genre": "Main music genres of this artist.",
  "keyAlbums": ["Album A", "Album B", "Album C"],
  "currentVibe": "Describe their style, cultural impact, and typical sound in one short sentence.",
  "funFact": "An interesting trivia or background fact about their lyrics, name, songwriting, or career.",
  "suggestedDropZone": "A brief creative suggestion of where to look on the map for their vinyl drops (e.g. cozy coffee shops, vinyl shops, neon clubs)."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an elite music historian and vinyl collectors adviser. Always output high-fidelity authentic facts with correct spacing and typography.'
        }
      });

      const responseText = response.text || '';
      const data = JSON.parse(responseText.trim());

      return res.json({
        success: true,
        info: data
      });
    } catch (e: any) {
      console.warn(`Gemini artist retrieval for "${artistName}" failed, falling back to static schema:`, e.message);
    }
  }

  // Fallback to static records
  const fallback = FALLBACK_ARTIST_INFO[artistName] || {
    artist: artistName,
    bio: `${artistName} is a celebrated musical artist with phenomenal records loved by fans and collectors worldwide.`,
    genre: 'Pop / Contemporary Wave',
    keyAlbums: ['Essential Hits', 'Live Recordings', 'Acoustic Sessions'],
    currentVibe: 'Eclectic tunes that are highly coveted on the Soundmap trading market!',
    funFact: `Fans often organize location gathering drops specifically to trade exclusive shiny editions of ${artistName}.`,
    suggestedDropZone: 'Local parks, vibrant downtown intersections, or indie coffee places.'
  };

  res.json({
    success: true,
    info: fallback
  });
});

// 8. Endpoint: Generate custom discoverable items with Proximity Radar Spark
app.post('/api/discoveries/generate', async (req, res) => {
  const { userArtists, userGenres } = req.body;
  const preferredArtists = (userArtists && userArtists.length > 0) ? userArtists : ['Kendrick Lamar', 'Taylor Swift', 'Daft Punk', 'Billie Eilish'];
  const preferredGenres = (userGenres && userGenres.length > 0) ? userGenres : ['Pop', 'Hip Hop', 'Electronic'];

  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `Formulate a random nearby music discovery for a location-based game called Soundmap.
The current player prefers these genres: ${preferredGenres.join(', ')} and artists: ${preferredArtists.join(', ')}.
Choose one of these artists, or another massive charting star (e.g., Drake, Dua Lipa, Fred again..).
Generate a song they recently obtained.
Assign a mock passionate discoverer details. Make it realistic. Proximity should be between 10 meters and 1000 meters.
Return your output as custom JSON with properties:
{
  "collectorName": "fandom_or_cyber_username",
  "collectorAvatar": "A music/aesthetic emoji matching their vibe",
  "isFriend": false,
  "distanceMeters": 150,
  "song": {
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "genre": "Genre",
    "rarity": "COMMON" // Pick from COMMON, UNCOMMON, RARE, SHINY, EPIC
  },
  "initialComment": "A spontaneous, natural social comment expressing their thrill or reaction to pulling this song."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an interactive environment director. Create believable social feeds of nearby collectors. Make rare, shiny, and epic drops feel special.'
        }
      });

      const textVal = response.text || '';
      const data = JSON.parse(textVal.trim());

      const dynamicItem = {
        id: 'disc_' + Math.random().toString(36).substr(2, 9),
        collectorName: data.collectorName || 'SonicExplorer',
        collectorAvatar: data.collectorAvatar || '🎵',
        isFriend: data.isFriend !== undefined ? data.isFriend : Math.random() > 0.6,
        distanceMeters: data.distanceMeters || Math.floor(Math.random() * 950) + 20,
        song: {
          id: 'song_gen_' + Math.random().toString(36).substr(2, 9),
          title: data.song?.title || 'Dynamic Rhythm',
          artist: data.song?.artist || preferredArtists[0],
          album: data.song?.album || 'Soundmap Session',
          genre: data.song?.genre || preferredGenres[0],
          rarity: data.song?.rarity || (Math.random() > 0.85 ? 'RARE' : Math.random() > 0.6 ? 'UNCOMMON' : 'COMMON'),
          mintNumber: getRandomMint(),
          obtainedAt: Date.now()
        },
        likes: Math.floor(Math.random() * 5),
        likedByMe: false,
        comments: data.initialComment ? [
          {
            id: 'comm_gen_' + Math.random().toString(36).substr(2, 9),
            authorName: data.collectorName || 'SonicExplorer',
            avatarUrl: data.collectorAvatar || '🎵',
            text: data.initialComment,
            timestamp: Date.now() - 1000
          }
        ] : [],
        collectedAt: Date.now()
      };

      statefulDiscoveries.unshift(dynamicItem);
      return res.json({
        success: true,
        discovery: dynamicItem
      });
    } catch (e: any) {
      console.warn("Gemini dynamic discovery failed, using standard generator:", e.message);
    }
  }

  // Fallback random generator
  const randomArtist = preferredArtists[Math.floor(Math.random() * preferredArtists.length)];
  const randomTracks = FALLBACK_TRACKS[randomArtist] || ['Unknown Beat'];
  const track = randomTracks[Math.floor(Math.random() * randomTracks.length)];
  const raritiesVal: ('COMMON' | 'UNCOMMON' | 'RARE' | 'SHINY' | 'EPIC')[] = ['COMMON', 'UNCOMMON', 'RARE', 'SHINY', 'EPIC'];
  const index = Math.random() > 0.9 ? 3 : Math.random() > 0.7 ? 2 : Math.random() > 0.4 ? 1 : 0;
  const pickedRarity = raritiesVal[index];

  const collector = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
  const fallbackItem = {
    id: 'disc_fb_' + Math.random().toString(36).substr(2, 9),
    collectorName: collector,
    collectorAvatar: '💿',
    isFriend: Math.random() > 0.5,
    distanceMeters: Math.floor(Math.random() * 850) + 30,
    song: {
      id: 'song_gen_' + Math.random().toString(36).substr(2, 9),
      title: track,
      artist: randomArtist,
      album: 'Fandom Edition',
      genre: preferredGenres[0] || 'Pop',
      rarity: pickedRarity,
      mintNumber: getRandomMint(),
      obtainedAt: Date.now()
    },
    likes: 0,
    likedByMe: false,
    comments: [],
    collectedAt: Date.now()
  };

  statefulDiscoveries.unshift(fallbackItem);
  res.json({
    success: true,
    discovery: fallbackItem
  });
});

// Vite Server initialization helper
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Soundmap server running on port ${PORT}`);
  });
}

startServer();
