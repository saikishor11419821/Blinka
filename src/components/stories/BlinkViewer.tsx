import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Edit, Music, Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Blink {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  music_url: string | null;
  caption: string | null;
  created_at: string;
  profiles: {
    username: string;
    profile_pic: string | null;
  };
}

interface BlinkViewerProps {
  blink: Blink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  isOwner: boolean;
}

const BlinkViewer = ({ blink, open, onOpenChange, onDelete, isOwner }: BlinkViewerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!blink) return null;

  const handleEdit = () => {
    setEditCaption(blink.caption || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("stories")
        .update({ caption: editCaption.trim() || null })
        .eq("id", blink.id);

      if (error) throw error;

      toast.success("Blink updated!");
      setIsEditing(false);
      onDelete(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to update Blink");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this Blink?")) return;

    setDeleting(true);
    try {
      // Delete from storage
      const fileName = blink.media_url.split("/stories/")[1];
      if (fileName) {
        await supabase.storage.from("stories").remove([fileName]);
      }

      // Delete music if exists
      if (blink.music_url) {
        const musicFileName = blink.music_url.split("/stories/")[1];
        if (musicFileName) {
          await supabase.storage.from("stories").remove([musicFileName]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", blink.id);

      if (error) throw error;

      toast.success("Blink deleted!");
      onOpenChange(false);
      onDelete();
    } catch (error: any) {
      toast.error("Failed to delete Blink");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 bg-background border-border overflow-hidden animate-scale-in">
        <div className="relative">
          {/* Media */}
          {blink.media_type === "video" ? (
            <video
              src={blink.media_url}
              className="w-full h-auto max-h-[80vh] object-contain bg-black"
              controls
              autoPlay
              loop
            />
          ) : (
            <img
              src={blink.media_url}
              alt={`Blink by ${blink.profiles.username}`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}

          {/* Top Bar - User Info & Actions */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-10 h-10 border-2 border-white/50 shadow-glow">
                  <AvatarImage src={blink.profiles.profile_pic || undefined} />
                  <AvatarFallback className="bg-secondary text-xs">
                    {blink.profiles.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-white drop-shadow-lg">
                  {blink.profiles.username}
                </span>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full shadow-glow bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                    onClick={handleEdit}
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="rounded-full shadow-glow"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom - Caption & Music */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {isEditing ? (
              <div className="space-y-2 animate-fade-in">
                <Textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30 rounded-xl resize-none"
                  rows={3}
                  placeholder="Add a caption..."
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="secondary"
                    className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {blink.caption && (
                  <p className="text-white text-sm mb-2 drop-shadow-lg animate-fade-in">
                    {blink.caption}
                  </p>
                )}
                {blink.music_url && (
                  <div className="flex items-center gap-2 text-white/80 animate-fade-in">
                    <Music className="w-4 h-4" />
                    <audio src={blink.music_url} controls className="flex-1 h-8" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlinkViewer;
