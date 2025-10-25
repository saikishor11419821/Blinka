import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus, Music, Loader2, X, Upload, Video, Sparkles, Camera } from "lucide-react";

interface AddBlinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddBlinkDialog = ({ open, onOpenChange, onSuccess }: AddBlinkDialogProps) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Media must be less than 50MB");
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Music must be less than 10MB");
        return;
      }
      setMusicFile(file);
      toast.success("Music added!");
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleRemoveMusic = () => {
    setMusicFile(null);
  };

  const handleSubmit = async () => {
    if (!mediaFile) {
      toast.error("Please add a photo or video");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload media
      const fileExt = mediaFile.name.split(".").pop();
      const mediaFileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(mediaFileName, mediaFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl: mediaUrl } } = supabase.storage
        .from("stories")
        .getPublicUrl(mediaFileName);

      // Upload music if present
      let musicUrl = null;
      if (musicFile) {
        const musicExt = musicFile.name.split(".").pop();
        const musicFileName = `${user.id}/music/${Date.now()}.${musicExt}`;
        
        const { error: musicUploadError } = await supabase.storage
          .from("stories")
          .upload(musicFileName, musicFile);

        if (musicUploadError) throw musicUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("stories")
          .getPublicUrl(musicFileName);
        
        musicUrl = publicUrl;
      }

      // Create story
      const mediaType = mediaFile.type.startsWith("video") ? "video" : "image";
      
      const { error: insertError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          music_url: musicUrl,
          caption: caption.trim() || null,
        });

      if (insertError) throw insertError;

      toast.success("Blink posted! 🎉");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setMediaFile(null);
      setMediaPreview(null);
      setMusicFile(null);
      setCaption("");
    } catch (error: any) {
      toast.error(error.message || "Failed to post Blink");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in border-primary/20">
        <DialogHeader className="sticky top-0 bg-card z-10 pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            Create Your Blink
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pb-2">
          {/* Media Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Photo or Video *
            </Label>
            {mediaPreview ? (
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-muted shadow-elegant group">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                {mediaFile?.type.startsWith("video") ? (
                  <video
                    src={mediaPreview}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 rounded-full shadow-glow z-20 hover:scale-110 transition-transform"
                  onClick={handleRemoveMedia}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="group relative flex flex-col items-center justify-center aspect-[9/16] rounded-2xl border-2 border-dashed border-border hover:border-primary transition-all duration-300 cursor-pointer bg-gradient-to-br from-muted/30 to-muted/50 hover:from-muted/50 hover:to-muted/70 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className="flex flex-col items-center justify-center relative z-10">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Upload className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <p className="mb-2 text-base font-semibold text-foreground">
                    Click to upload
                  </p>
                  <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full">
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>Image</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full">
                        <Video className="w-3.5 h-3.5" />
                        <span>Video</span>
                      </div>
                    </div>
                    <span className="text-muted-foreground/70">Max 50MB</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Music Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Music className="w-4 h-4 text-primary animate-pulse" />
              Background Music (optional)
            </Label>
            {musicFile ? (
              <div className="flex items-center gap-4 px-5 py-4 border border-primary/30 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 shadow-elegant">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-slow">
                  <Music className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{musicFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(musicFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleRemoveMusic}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="group flex items-center gap-4 w-full px-5 py-4 border-2 border-dashed border-border hover:border-primary rounded-xl cursor-pointer bg-gradient-to-r from-muted/30 to-muted/50 hover:from-muted/50 hover:to-muted/70 transition-all duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Add soundtrack</p>
                  <p className="text-xs text-muted-foreground">MP3, WAV, OGG (Max 10MB)</p>
                </div>
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
          <div className="space-y-3">
            <Label htmlFor="caption" className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Caption (optional)
            </Label>
            <Textarea
              id="caption"
              placeholder="Share your thoughts..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="rounded-xl resize-none min-h-[100px] border-2 focus-visible:border-primary/50 bg-muted/30 transition-all"
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length} characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-card pt-4 pb-2 -mb-2">
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-[1.02] active:scale-95"
              disabled={loading || !mediaFile}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating your Blink...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Post Blink
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBlinkDialog;
