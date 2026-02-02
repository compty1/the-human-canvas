
# Enhanced Media Favorites with Streaming Platform Links

## Overview
Add support for multiple streaming platform links per favorite, allowing you to add music (Spotify, Apple Music, YouTube Music, SoundCloud), movies/shows (Netflix, Hulu, Amazon Prime, Disney+, HBO Max, Apple TV+), and other media with direct links to each platform where available.

## Database Changes

### Add New Columns to `favorites` Table
```sql
ALTER TABLE favorites ADD COLUMN streaming_links JSONB DEFAULT '{}';
ALTER TABLE favorites ADD COLUMN media_subtype TEXT;
ALTER TABLE favorites ADD COLUMN release_year INTEGER;
ALTER TABLE favorites ADD COLUMN season_count INTEGER;
ALTER TABLE favorites ADD COLUMN album_name TEXT;
ALTER TABLE favorites ADD COLUMN artist_name TEXT;
```

**Column Details:**
- `streaming_links`: JSONB object storing platform-specific URLs:
  ```json
  {
    "spotify": "https://open.spotify.com/...",
    "apple_music": "https://music.apple.com/...",
    "youtube_music": "https://music.youtube.com/...",
    "soundcloud": "https://soundcloud.com/...",
    "netflix": "https://www.netflix.com/title/...",
    "hulu": "https://www.hulu.com/...",
    "amazon_prime": "https://www.amazon.com/...",
    "disney_plus": "https://www.disneyplus.com/...",
    "hbo_max": "https://www.max.com/...",
    "apple_tv": "https://tv.apple.com/..."
  }
  ```
- `media_subtype`: For more specific categorization (e.g., "album", "song", "playlist" for music; "movie", "series", "documentary" for film)
- `release_year`: When the media was released
- `season_count`: For TV shows
- `album_name`: For songs (to link back to album)
- `artist_name`: Alternative to creator_name, specific to music

## New Types
Update the type list to include:
- `show` (TV Shows - new)
- `podcast` (new)
- `music` (already exists)
- `movie` (already exists)

## UI Changes

### 1. Update FavoriteEditor.tsx (Admin)

#### Add Streaming Links Section
New collapsible section that shows relevant platform inputs based on type:

**For Music (`type === "music"`):**
```
┌──────────────────────────────────────────────────────────┐
│ 🎵 Music Streaming Links                                  │
├──────────────────────────────────────────────────────────┤
│ Subtype: (•) Album  ( ) Song  ( ) Playlist               │
│                                                           │
│ Artist Name: [________________________]                   │
│ Album Name:  [________________________] (if song)        │
│ Release Year: [____]                                      │
│                                                           │
│ [Spotify Icon] Spotify                                   │
│ [https://open.spotify.com/album/...            ]         │
│                                                           │
│ [Apple Icon] Apple Music                                 │
│ [https://music.apple.com/album/...             ]         │
│                                                           │
│ [YouTube Icon] YouTube Music                             │
│ [https://music.youtube.com/playlist/...        ]         │
│                                                           │
│ [SoundCloud Icon] SoundCloud                             │
│ [https://soundcloud.com/...                    ]         │
└──────────────────────────────────────────────────────────┘
```

**For Movies/Shows (`type === "movie"` or `type === "show"`):**
```
┌──────────────────────────────────────────────────────────┐
│ 🎬 Watch On                                               │
├──────────────────────────────────────────────────────────┤
│ Subtype: (•) Movie  ( ) Series  ( ) Documentary          │
│                                                           │
│ Release Year: [____]    Seasons: [__] (if series)        │
│                                                           │
│ [Netflix Icon] Netflix                                   │
│ [https://www.netflix.com/title/...             ]         │
│                                                           │
│ [Hulu Icon] Hulu                                         │
│ [https://www.hulu.com/...                      ]         │
│                                                           │
│ [Prime Icon] Amazon Prime Video                          │
│ [https://www.amazon.com/gp/video/...           ]         │
│                                                           │
│ [Disney Icon] Disney+                                    │
│ [https://www.disneyplus.com/...                ]         │
│                                                           │
│ [HBO Icon] Max (HBO)                                     │
│ [https://www.max.com/...                       ]         │
│                                                           │
│ [Apple Icon] Apple TV+                                   │
│ [https://tv.apple.com/...                      ]         │
└──────────────────────────────────────────────────────────┘
```

### 2. Update Favorites.tsx (Public Listing)
- Add streaming platform icons below each card
- Clicking icon opens the respective platform link
- Only show icons for platforms that have URLs

```
┌────────────────────────────────────┐
│ [Album Cover Image]                │
│────────────────────────────────────│
│ 🎵 MUSIC                           │
│ Album Title                        │
│ by Artist Name • 2024              │
│ "Why I love this album..."         │
│                                    │
│ Listen on:                         │
│ [🟢Spotify] [🍎Apple] [▶️YT]       │
└────────────────────────────────────┘
```

### 3. Update FavoriteDetail.tsx (Detail Page)
- Add prominent "Where to Watch/Listen" section
- Display all available platform links as branded buttons
- Add media-specific metadata (release year, seasons, etc.)

```
┌──────────────────────────────────────────────────────────┐
│ [Back to Favorites]                                       │
│                                                           │
│ 🎬 MOVIE • 2024                                          │
│ ═══════════════════════════════════════════════════      │
│ Movie Title                                               │
│ Directed by Director Name                                 │
│                                                           │
│ [Large Movie Poster]                                      │
│                                                           │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 📺 Where to Watch                                   │   │
│ │                                                      │   │
│ │ [Netflix Logo - Watch on Netflix      →]            │   │
│ │ [Prime Logo - Watch on Prime Video    →]            │   │
│ │ [Hulu Logo - Watch on Hulu            →]            │   │
│ └────────────────────────────────────────────────────┘   │
│                                                           │
│ About                                                     │
│ Description text...                                       │
│                                                           │
│ How It Affected Me                                        │
│ Impact statement...                                       │
└──────────────────────────────────────────────────────────┘
```

## Platform Icons & Branding

Create a helper for platform metadata:
```typescript
const streamingPlatforms = {
  // Music
  spotify: { 
    name: "Spotify", 
    icon: "🟢", // or custom SVG
    color: "#1DB954",
    urlPrefix: "https://open.spotify.com/"
  },
  apple_music: { 
    name: "Apple Music", 
    icon: "🍎",
    color: "#FA243C",
    urlPrefix: "https://music.apple.com/"
  },
  youtube_music: { 
    name: "YouTube Music", 
    icon: "▶️",
    color: "#FF0000",
    urlPrefix: "https://music.youtube.com/"
  },
  soundcloud: { 
    name: "SoundCloud", 
    icon: "☁️",
    color: "#FF5500",
    urlPrefix: "https://soundcloud.com/"
  },
  // Video
  netflix: { 
    name: "Netflix", 
    icon: "🎬",
    color: "#E50914",
    urlPrefix: "https://www.netflix.com/"
  },
  hulu: { 
    name: "Hulu", 
    icon: "📺",
    color: "#1CE783",
    urlPrefix: "https://www.hulu.com/"
  },
  amazon_prime: { 
    name: "Prime Video", 
    icon: "📦",
    color: "#00A8E1",
    urlPrefix: "https://www.amazon.com/"
  },
  disney_plus: { 
    name: "Disney+", 
    icon: "✨",
    color: "#113CCF",
    urlPrefix: "https://www.disneyplus.com/"
  },
  hbo_max: { 
    name: "Max", 
    icon: "🎭",
    color: "#002BE7",
    urlPrefix: "https://www.max.com/"
  },
  apple_tv: { 
    name: "Apple TV+", 
    icon: "📱",
    color: "#000000",
    urlPrefix: "https://tv.apple.com/"
  }
};
```

## Validation
- Validate URLs match expected platform format
- Warn if URL doesn't match platform prefix (but still allow saving)
- Auto-detect platform from pasted URL and populate correct field

## Files to Modify

### Database
1. **New migration**: Add columns to `favorites` table

### Frontend
2. **`src/pages/admin/FavoriteEditor.tsx`**:
   - Add streaming links section with platform-specific inputs
   - Add media_subtype radio buttons
   - Add release_year, season_count, artist_name, album_name fields
   - Conditionally show fields based on type

3. **`src/pages/Favorites.tsx`**:
   - Add streaming platform icons to cards
   - Show release year and subtype in card metadata
   - Update type filters to include "show" and "podcast"

4. **`src/pages/FavoriteDetail.tsx`**:
   - Add "Where to Watch/Listen" section with branded buttons
   - Display additional metadata (year, seasons, artist)

### Shared
5. **Create `src/lib/streamingPlatforms.ts`**:
   - Export platform configuration object
   - Helper function to get platform info from key
   - Helper to validate/detect platform URLs

## Types Update
Update `src/integrations/supabase/types.ts` will auto-update after migration.

Update local interfaces in components to include:
```typescript
interface Favorite {
  // ...existing fields
  streaming_links: Record<string, string> | null;
  media_subtype: string | null;
  release_year: number | null;
  season_count: number | null;
  album_name: string | null;
  artist_name: string | null;
}
```

## Example Data
After implementation, you could add:

**Music Example:**
- Title: "Random Access Memories"
- Type: music
- Subtype: album
- Artist: Daft Punk
- Release Year: 2013
- Streaming Links:
  - Spotify: https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa
  - Apple Music: https://music.apple.com/album/random-access-memories/617154241

**Movie Example:**
- Title: "Dune: Part Two"
- Type: movie
- Subtype: movie
- Creator: Denis Villeneuve
- Release Year: 2024
- Streaming Links:
  - Netflix: https://www.netflix.com/title/81714934
  - Prime: https://www.amazon.com/gp/video/detail/B0CV4HVJXY

**TV Show Example:**
- Title: "Severance"
- Type: show
- Subtype: series
- Creator: Dan Erickson
- Release Year: 2022
- Season Count: 2
- Streaming Links:
  - Apple TV: https://tv.apple.com/show/severance/umc.cmc.1srk2goyh2q2zdxcx605w8vtx

## Implementation Order

1. Create database migration (add new columns)
2. Create `streamingPlatforms.ts` helper
3. Update `FavoriteEditor.tsx` with streaming links UI
4. Update `Favorites.tsx` with platform icons
5. Update `FavoriteDetail.tsx` with "Where to Watch/Listen" section
6. Add "show" and "podcast" to type options
