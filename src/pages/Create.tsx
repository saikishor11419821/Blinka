import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Label } from "@/components/ui/label";

const Create = () => {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [music, setMusic] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImage(file);
      setVideo(null);
      setVideoPreview(null);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video must be less than 50MB");
        return;
      }
      setVideo(file);
      setImage(null);
      setImagePreview(null);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Music file must be less than 10MB");
        return;
      }
      setMusic(file);
    }
  };

  const handleRemoveMedia = () => {
    setImage(null);
    setVideo(null);
    setImagePreview(null);
    setVideoPreview(null);
  };

  const handleRemoveMusic = () => {
    setMusic(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caption.trim() && !image && !video) {
      toast.error("Please add a caption, image, or video");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = null;
      let videoUrl = null;
      let musicUrl = null;

      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      if (video) {
        const fileExt = video.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(fileName, video);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(fileName);

        videoUrl = publicUrl;
      }

      if (music) {
        const fileExt = music.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(fileName, music);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(fileName);

        musicUrl = publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        caption: caption.trim() || null,
        image_url: imageUrl,
        video_url: videoUrl,
        music_url: musicUrl,
      });

      if (error) throw error;

      toast.success("Post created successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in">
      <div className="bg-card rounded-3xl shadow-card p-6 hover:shadow-hover transition-shadow">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Create Post</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Upload - Image or Video */}
          <div className="space-y-2">
            <Label>Image or Video</Label>
            {imagePreview || videoPreview ? (
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={videoPreview || undefined}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 rounded-full shadow-lg"
                  onClick={handleRemoveMedia}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer bg-gradient-to-br from-primary/5 to-accent/5">
                  <ImagePlus className="w-10 h-10 text-primary mb-2" />
                  <span className="text-sm font-medium">Image</span>
                  <span className="text-xs text-muted-foreground mt-1">Max 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-border hover:border-secondary transition-colors cursor-pointer bg-gradient-to-br from-secondary/5 to-primary/5">
                  <svg className="w-10 h-10 text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Video</span>
                  <span className="text-xs text-muted-foreground mt-1">Max 50MB</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Music Upload (optional) */}
          <div className="space-y-2">
            <Label>Background Music (Optional)</Label>
            {music ? (
              <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-2xl border border-secondary/20">
                <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
                <span className="flex-1 text-sm font-medium truncate">{music.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveMusic}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-border hover:border-secondary transition-colors cursor-pointer bg-gradient-to-r from-secondary/5 to-accent/5">
                <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
                <div className="flex-1">
                  <span className="text-sm font-medium">Add music</span>
                  <p className="text-xs text-muted-foreground">Max 10MB (MP3, WAV)</p>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleMusicChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a caption... ✨"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="rounded-2xl resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/2200 characters
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-2xl bg-gradient-primary hover:opacity-90 transition-all shadow-glow hover:shadow-glow-accent h-12 text-base font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Share Post
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Create;