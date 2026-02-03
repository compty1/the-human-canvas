export interface StreamingPlatform {
  name: string;
  icon: string;
  color: string;
  urlPrefix: string | string[];
  category: 'music' | 'video' | 'podcast';
}

export const streamingPlatforms: Record<string, StreamingPlatform> = {
  // Music Platforms
  spotify: {
    name: "Spotify",
    icon: "🟢",
    color: "#1DB954",
    urlPrefix: "https://open.spotify.com/",
    category: 'music'
  },
  apple_music: {
    name: "Apple Music",
    icon: "🍎",
    color: "#FA243C",
    urlPrefix: "https://music.apple.com/",
    category: 'music'
  },
  youtube_music: {
    name: "YouTube Music",
    icon: "▶️",
    color: "#FF0000",
    urlPrefix: "https://music.youtube.com/",
    category: 'music'
  },
  soundcloud: {
    name: "SoundCloud",
    icon: "☁️",
    color: "#FF5500",
    urlPrefix: "https://soundcloud.com/",
    category: 'music'
  },
  // Video Platforms
  netflix: {
    name: "Netflix",
    icon: "🎬",
    color: "#E50914",
    urlPrefix: "https://www.netflix.com/",
    category: 'video'
  },
  hulu: {
    name: "Hulu",
    icon: "📺",
    color: "#1CE783",
    urlPrefix: "https://www.hulu.com/",
    category: 'video'
  },
  amazon_prime: {
    name: "Prime Video",
    icon: "📦",
    color: "#00A8E1",
    urlPrefix: ["https://www.amazon.com/", "https://www.primevideo.com/"],
    category: 'video'
  },
  prime_video: {
    name: "Prime Video",
    icon: "📦",
    color: "#00A8E1",
    urlPrefix: ["https://www.amazon.com/gp/video/", "https://www.primevideo.com/"],
    category: 'video'
  },
  disney_plus: {
    name: "Disney+",
    icon: "✨",
    color: "#113CCF",
    urlPrefix: "https://www.disneyplus.com/",
    category: 'video'
  },
  hbo_max: {
    name: "Max",
    icon: "🎭",
    color: "#002BE7",
    urlPrefix: "https://www.max.com/",
    category: 'video'
  },
  max: {
    name: "Max",
    icon: "🎭",
    color: "#002BE7",
    urlPrefix: "https://www.max.com/",
    category: 'video'
  },
  apple_tv: {
    name: "Apple TV+",
    icon: "📱",
    color: "#000000",
    urlPrefix: "https://tv.apple.com/",
    category: 'video'
  },
  youtube: {
    name: "YouTube",
    icon: "▶️",
    color: "#FF0000",
    urlPrefix: ["https://www.youtube.com/", "https://youtube.com/"],
    category: 'video'
  },
  // Podcast Platforms
  apple_podcasts: {
    name: "Apple Podcasts",
    icon: "🎙️",
    color: "#9933CC",
    urlPrefix: "https://podcasts.apple.com/",
    category: 'podcast'
  },
  spotify_podcasts: {
    name: "Spotify",
    icon: "🟢",
    color: "#1DB954",
    urlPrefix: ["https://open.spotify.com/show/", "https://open.spotify.com/episode/"],
    category: 'podcast'
  },
  google_podcasts: {
    name: "Google Podcasts",
    icon: "🎧",
    color: "#4285F4",
    urlPrefix: "https://podcasts.google.com/",
    category: 'podcast'
  },
  youtube_podcast: {
    name: "YouTube",
    icon: "▶️",
    color: "#FF0000",
    urlPrefix: ["https://www.youtube.com/", "https://youtube.com/"],
    category: 'podcast'
  },
  overcast: {
    name: "Overcast",
    icon: "🔶",
    color: "#FC7E0F",
    urlPrefix: "https://overcast.fm/",
    category: 'podcast'
  },
  pocket_casts: {
    name: "Pocket Casts",
    icon: "🎧",
    color: "#F43E37",
    urlPrefix: "https://pca.st/",
    category: 'podcast'
  }
};

export const musicPlatforms = Object.entries(streamingPlatforms)
  .filter(([_, p]) => p.category === 'music')
  .map(([key]) => key);

export const videoPlatforms = Object.entries(streamingPlatforms)
  .filter(([_, p]) => p.category === 'video')
  .map(([key]) => key);

export const podcastPlatforms = Object.entries(streamingPlatforms)
  .filter(([_, p]) => p.category === 'podcast')
  .map(([key]) => key);

export const getPlatformInfo = (key: string): StreamingPlatform | undefined => {
  return streamingPlatforms[key];
};

export const getAvailableStreamingLinks = (
  links: Record<string, string> | null | undefined
): { key: string; url: string; platform: StreamingPlatform }[] => {
  if (!links) return [];
  
  return Object.entries(links)
    .filter(([_, url]) => url && url.trim() !== '')
    .map(([key, url]) => ({
      key,
      url,
      platform: streamingPlatforms[key]
    }))
    .filter(item => item.platform);
};

// Auto-detect platform from URL
export const detectPlatformFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  const normalizedUrl = url.toLowerCase().trim();
  
  for (const [key, platform] of Object.entries(streamingPlatforms)) {
    const prefixes = Array.isArray(platform.urlPrefix) 
      ? platform.urlPrefix 
      : [platform.urlPrefix];
    
    for (const prefix of prefixes) {
      if (normalizedUrl.startsWith(prefix.toLowerCase())) {
        return key;
      }
    }
  }
  
  return null;
};

// Get platforms by media type
export const getPlatformsForType = (type: string): string[] => {
  switch (type) {
    case 'music':
      return musicPlatforms;
    case 'movie':
    case 'show':
      return videoPlatforms;
    case 'podcast':
      return podcastPlatforms;
    default:
      return [];
  }
};

export const musicSubtypes = ['album', 'song', 'playlist', 'artist'] as const;
export const videoSubtypes = ['movie', 'series', 'documentary', 'short'] as const;
export const podcastSubtypes = ['show', 'episode', 'network'] as const;

export type MusicSubtype = typeof musicSubtypes[number];
export type VideoSubtype = typeof videoSubtypes[number];
export type PodcastSubtype = typeof podcastSubtypes[number];
