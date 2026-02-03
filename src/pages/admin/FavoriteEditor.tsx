import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Save, ArrowLeft, Loader2, Link as LinkIcon, Plus, X, Music, Film, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { 
  streamingPlatforms, 
  musicPlatforms, 
  videoPlatforms,
  podcastPlatforms,
  musicSubtypes,
  videoSubtypes,
  podcastSubtypes,
  detectPlatformFromUrl,
  getPlatformsForType
} from "@/lib/streamingPlatforms";

const types = [
  { value: "art", label: "Art" },
  { value: "music", label: "Music" },
  { value: "movie", label: "Movie" },
  { value: "show", label: "TV Show" },
  { value: "book", label: "Book" },
  { value: "article", label: "Article" },
  { value: "research", label: "Research" },
  { value: "podcast", label: "Podcast" },
  { value: "creator", label: "Creator" },
  { value: "other", label: "Other" },
];

interface StreamingLinks {
  [key: string]: string;
}

const FavoriteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "",
    type: "art" as string,
    source_url: "",
    image_url: "",
    creator_name: "",
    creator_url: "",
    creator_location: "",
    description: "",
    impact_statement: "",
    is_current: false,
    discovered_date: "",
    tags: [] as string[],
    // Streaming fields
    streaming_links: {} as StreamingLinks,
    media_subtype: "",
    release_year: null as number | null,
    season_count: null as number | null,
    album_name: "",
    artist_name: "",
    // Childhood roots fields
    is_childhood_root: false,
    childhood_age_range: "",
    childhood_impact: "",
  });

  const [newTag, setNewTag] = useState("");
  const [importing, setImporting] = useState(false);
  const [streamingOpen, setStreamingOpen] = useState(true);

  // Undo/Redo
  const [historyStack, setHistoryStack] = useState<typeof form[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const pushToHistory = (newForm: typeof form) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newForm);
    if (newStack.length > 50) newStack.shift();
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const undo = () => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      setForm(historyStack[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      setForm(historyStack[historyIndex + 1]);
    }
  };

  const updateForm = (updates: Partial<typeof form>) => {
    const newForm = { ...form, ...updates };
    setForm(newForm);
    pushToHistory(newForm);
  };

  const { data: favorite, isLoading } = useQuery({
    queryKey: ["favorite-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (favorite) {
      setForm({
        title: favorite.title || "",
        type: favorite.type || "art",
        source_url: favorite.source_url || "",
        image_url: favorite.image_url || "",
        creator_name: favorite.creator_name || "",
        creator_url: favorite.creator_url || "",
        creator_location: favorite.creator_location || "",
        description: favorite.description || "",
        impact_statement: favorite.impact_statement || "",
        is_current: favorite.is_current || false,
        discovered_date: favorite.discovered_date || "",
        tags: favorite.tags || [],
        streaming_links: (favorite.streaming_links as StreamingLinks) || {},
        media_subtype: favorite.media_subtype || "",
        release_year: favorite.release_year || null,
        season_count: favorite.season_count || null,
        album_name: favorite.album_name || "",
        artist_name: favorite.artist_name || "",
        is_childhood_root: (favorite as Record<string, unknown>).is_childhood_root as boolean || false,
        childhood_age_range: (favorite as Record<string, unknown>).childhood_age_range as string || "",
        childhood_impact: (favorite as Record<string, unknown>).childhood_impact as string || "",
      });
    }
  }, [favorite]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        source_url: form.source_url || null,
        image_url: form.image_url || null,
        creator_name: form.creator_name || null,
        creator_url: form.creator_url || null,
        creator_location: form.creator_location || null,
        description: form.description || null,
        impact_statement: form.impact_statement || null,
        discovered_date: form.discovered_date || null,
        streaming_links: Object.keys(form.streaming_links).length > 0 ? form.streaming_links : null,
        media_subtype: form.media_subtype || null,
        release_year: form.release_year || null,
        season_count: form.season_count || null,
        album_name: form.album_name || null,
        artist_name: form.artist_name || null,
        childhood_age_range: form.childhood_age_range || null,
        childhood_impact: form.childhood_impact || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("favorites")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-favorites"] });
      toast.success(isEditing ? "Favorite updated" : "Favorite added");
      navigate("/admin/favorites");
    },
    onError: (error) => {
      toast.error("Failed to save");
      console.error(error);
    },
  });

  const importFromUrl = async () => {
    if (!form.source_url) {
      toast.error("Enter a URL first");
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-site", {
        body: { url: form.source_url },
      });

      if (error) throw error;

      if (data) {
        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          image_url: data.og_image || prev.image_url,
        }));
        toast.success("Imported metadata from URL");
      }
    } catch (error) {
      toast.error("Failed to import from URL");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const addTag = () => {
    if (newTag && !form.tags.includes(newTag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag("");
    }
  };

  const updateStreamingLink = (platform: string, url: string) => {
    setForm(prev => ({
      ...prev,
      streaming_links: {
        ...prev.streaming_links,
        [platform]: url
      }
    }));
  };

  // Auto-detect platform and populate field when URL is pasted
  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedUrl = e.clipboardData.getData('text');
    const detectedPlatform = detectPlatformFromUrl(pastedUrl);
    
    if (detectedPlatform) {
      // Check if this platform is relevant to the current media type
      const relevantPlatforms = getPlatformsForType(form.type);
      if (relevantPlatforms.includes(detectedPlatform)) {
        e.preventDefault();
        updateStreamingLink(detectedPlatform, pastedUrl);
        toast.success(`Detected ${streamingPlatforms[detectedPlatform].name} link`);
      }
    }
  };

  const isMediaType = form.type === "music" || form.type === "movie" || form.type === "show" || form.type === "podcast";
  const isMusicType = form.type === "music";
  const isVideoType = form.type === "movie" || form.type === "show";
  const isPodcastType = form.type === "podcast";

  const getCurrentSubtypes = () => {
    if (isMusicType) return musicSubtypes;
    if (isVideoType) return videoSubtypes;
    if (isPodcastType) return podcastSubtypes;
    return [];
  };

  const getCurrentPlatforms = () => {
    if (isMusicType) return musicPlatforms;
    if (isVideoType) return videoPlatforms;
    if (isPodcastType) return podcastPlatforms;
    return [];
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/favorites")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-grow">
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Favorite" : "Add Favorite"}
            </h1>
          </div>
          <UndoRedoControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
        </div>

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="favorite"
          onImport={(data) => {
            if (data.title) setForm(prev => ({ ...prev, title: String(data.title) }));
            if (data.description) setForm(prev => ({ ...prev, description: String(data.description) }));
            if (data.impact_statement) setForm(prev => ({ ...prev, impact_statement: String(data.impact_statement) }));
            if (data.creator_name) setForm(prev => ({ ...prev, creator_name: String(data.creator_name) }));
            if (data.type) setForm(prev => ({ ...prev, type: String(data.type) }));
            if (data.tags) setForm(prev => ({ ...prev, tags: Array.isArray(data.tags) ? data.tags : [] }));
          }}
        />

        {/* Import from URL */}
        <ComicPanel className="p-6 bg-pop-cyan/10">
          <h2 className="text-xl font-display mb-4">Import from URL</h2>
          <div className="flex gap-2">
            <Input
              value={form.source_url}
              onChange={(e) => setForm(prev => ({ ...prev, source_url: e.target.value }))}
              placeholder="https://example.com/content"
            />
            <PopButton onClick={importFromUrl} disabled={importing}>
              {importing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4 mr-2" />
              )}
              Import
            </PopButton>
          </div>
        </ComicPanel>

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Content Details</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value, media_subtype: "" }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="impact">How it affected me</Label>
              <Textarea
                id="impact"
                value={form.impact_statement}
                onChange={(e) => setForm(prev => ({ ...prev, impact_statement: e.target.value }))}
                rows={4}
                placeholder="Describe how this content impacted or inspired you..."
              />
            </div>

            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              label="Image"
              folder="favorites"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_current"
                checked={form.is_current}
                onChange={(e) => setForm(prev => ({ ...prev, is_current: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_current">Currently enjoying this</Label>
            </div>

            <div>
              <Label htmlFor="discovered_date">When I discovered it</Label>
              <Input
                id="discovered_date"
                type="date"
                value={form.discovered_date}
                onChange={(e) => setForm(prev => ({ ...prev, discovered_date: e.target.value }))}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Streaming Links - Show for music, movies, shows */}
        {isMediaType && (
          <Collapsible open={streamingOpen} onOpenChange={setStreamingOpen}>
            <ComicPanel className="p-6">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className="text-xl font-display flex items-center gap-2">
                  {isMusicType ? <Music className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                  {isMusicType ? "Music Streaming Links" : isPodcastType ? "Podcast Platforms" : "Where to Watch"}
                </h2>
                <ChevronDown className={`w-5 h-5 transition-transform ${streamingOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid gap-4">
                  {/* Auto-detect URL input */}
                  <div className="p-3 bg-muted/50 rounded border-2 border-dashed">
                    <Label className="text-sm text-muted-foreground">Paste any streaming URL to auto-detect platform</Label>
                    <Input
                      placeholder="Paste Spotify, Netflix, Apple Podcasts URL..."
                      className="mt-2"
                      onPaste={handleUrlPaste}
                    />
                  </div>

                  {/* Media Subtype */}
                  <div>
                    <Label>Subtype</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getCurrentSubtypes().map((subtype) => (
                        <button
                          key={subtype}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, media_subtype: subtype }))}
                          className={`px-3 py-1 border-2 font-bold text-sm capitalize ${
                            form.media_subtype === subtype
                              ? 'bg-foreground text-background border-foreground'
                              : 'border-foreground hover:bg-muted'
                          }`}
                        >
                          {subtype}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Music-specific fields */}
                  {isMusicType && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="artist_name">Artist Name</Label>
                        <Input
                          id="artist_name"
                          value={form.artist_name}
                          onChange={(e) => setForm(prev => ({ ...prev, artist_name: e.target.value }))}
                          placeholder="e.g., Daft Punk"
                        />
                      </div>
                      {form.media_subtype === 'song' && (
                        <div>
                          <Label htmlFor="album_name">Album Name</Label>
                          <Input
                            id="album_name"
                            value={form.album_name}
                            onChange={(e) => setForm(prev => ({ ...prev, album_name: e.target.value }))}
                            placeholder="e.g., Random Access Memories"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Release Year and Season Count */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="release_year">Release Year</Label>
                      <Input
                        id="release_year"
                        type="number"
                        min="1900"
                        max="2099"
                        value={form.release_year || ""}
                        onChange={(e) => setForm(prev => ({ 
                          ...prev, 
                          release_year: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                        placeholder="e.g., 2024"
                      />
                    </div>
                    {(form.type === 'show' || form.media_subtype === 'series' || isPodcastType) && (
                      <div>
                        <Label htmlFor="season_count">{isPodcastType ? "Number of Episodes" : "Number of Seasons"}</Label>
                        <Input
                          id="season_count"
                          type="number"
                          min="1"
                          value={form.season_count || ""}
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            season_count: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                          placeholder={isPodcastType ? "e.g., 50" : "e.g., 2"}
                        />
                      </div>
                    )}
                  </div>

                  {/* Platform Links */}
                  <div className="space-y-3 mt-2">
                    <Label>Streaming Platform Links</Label>
                    {getCurrentPlatforms().map((platformKey) => {
                      const platform = streamingPlatforms[platformKey];
                      return (
                        <div key={platformKey} className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 flex items-center justify-center text-xl rounded border-2"
                            style={{ borderColor: platform.color }}
                          >
                            {platform.icon}
                          </div>
                          <div className="flex-1">
                            <Input
                              value={form.streaming_links[platformKey] || ""}
                              onChange={(e) => updateStreamingLink(platformKey, e.target.value)}
                              placeholder={`${platform.urlPrefix}...`}
                            />
                          </div>
                          {form.streaming_links[platformKey] && (
                            <a 
                              href={form.streaming_links[platformKey]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-muted rounded"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </ComicPanel>
          </Collapsible>
        )}

        {/* Creator Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Creator Information</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creator_name">Creator Name</Label>
                <Input
                  id="creator_name"
                  value={form.creator_name}
                  onChange={(e) => setForm(prev => ({ ...prev, creator_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="creator_location">Location (continent/country)</Label>
                <Input
                  id="creator_location"
                  value={form.creator_location}
                  onChange={(e) => setForm(prev => ({ ...prev, creator_location: e.target.value }))}
                  placeholder="e.g., Europe, Japan, USA"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="creator_url">Creator URL</Label>
              <Input
                id="creator_url"
                value={form.creator_url}
                onChange={(e) => setForm(prev => ({ ...prev, creator_url: e.target.value }))}
                placeholder="https://creator-website.com"
              />
            </div>
          </div>
        </ComicPanel>

        {/* Tags */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-muted border-2 border-foreground font-bold text-sm">
                {tag}
                <button onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <button onClick={addTag} className="p-2 bg-muted hover:bg-accent border-2 border-foreground">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </ComicPanel>

        {/* Save */}
        <div className="flex justify-end">
          <PopButton onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Update" : "Save"} Favorite
          </PopButton>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FavoriteEditor;
