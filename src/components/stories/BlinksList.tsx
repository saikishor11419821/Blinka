import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Plus, Sparkles } from "lucide-react";
import AddBlinkDialog from "./AddBlinkDialog";
import BlinkViewer from "./BlinkViewer";

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

const BlinksList = () => {
  const [blinks, setBlinks] = useState<Blink[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedBlink, setSelectedBlink] = useState<Blink | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    fetchBlinks();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchBlinks = async () => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select(
          `
          *,
          profiles:user_id (
            username,
            profile_pic
          )
        `
        )
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlinks(data || []);
    } catch (error: any) {
      console.error("Failed to load blinks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBlink = (blink: Blink) => {
    setSelectedBlink(blink);
    setShowViewer(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto pb-4 px-4 pt-2 scrollbar-hide">
        <div className="flex gap-5 min-w-max">
          {/* Add Blink Button */}
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex flex-col items-center gap-2.5 flex-shrink-0 group relative"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-primary blur-md opacity-60 group-hover:opacity-100 animate-pulse-slow transition-opacity" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-elegant transition-all duration-300 hover:scale-110 active:scale-95 group-hover:shadow-glow">
                <div className="absolute inset-[2px] rounded-full bg-background/10 backdrop-blur-sm" />
                <Plus className="w-9 h-9 text-primary-foreground group-hover:rotate-90 transition-transform duration-500 relative z-10 drop-shadow-lg" />
                <Sparkles className="w-4 h-4 text-primary-foreground/80 absolute top-2 right-2 animate-pulse" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-all duration-300 font-semibold tracking-wide">
              Create
            </span>
          </button>

          {/* Blinks List */}
          {blinks.map((blink, index) => (
            <button
              key={blink.id}
              onClick={() => handleViewBlink(blink)}
              className="flex flex-col items-center gap-2.5 flex-shrink-0 group relative animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-primary blur-sm opacity-50 group-hover:opacity-100 transition-opacity animate-pulse-slow" />
                
                {/* Ring gradient */}
                <div className="relative w-20 h-20 rounded-full p-[3px] bg-gradient-to-br from-primary via-primary/80 to-accent shadow-elegant group-hover:shadow-glow transition-all duration-300 hover:scale-110 hover:rotate-2">
                  <div className="w-full h-full rounded-full p-[2px] bg-background">
                    <Avatar className="w-full h-full border-[3px] border-background">
                      <AvatarImage 
                        src={blink.profiles.profile_pic || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground font-bold text-lg">
                        {blink.profiles.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Media type indicator */}
                {(blink.media_type === "video" || blink.music_url) && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-glow border-2 border-background animate-bounce-soft">
                    <span className="text-xs">
                      {blink.media_type === "video" ? "🎬" : "🎵"}
                    </span>
                  </div>
                )}

                {/* New indicator */}
                {new Date().getTime() - new Date(blink.created_at).getTime() < 3600000 && (
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-accent rounded-full shadow-glow animate-pulse" />
                )}
              </div>
              
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-all duration-300 max-w-[80px] truncate font-semibold">
                {blink.profiles.username}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Blink Dialog */}
      <AddBlinkDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchBlinks}
      />

      {/* Blink Viewer */}
      <BlinkViewer
        blink={selectedBlink}
        open={showViewer}
        onOpenChange={setShowViewer}
        onDelete={fetchBlinks}
        isOwner={selectedBlink?.user_id === currentUser?.id}
      />
    </>
  );
};

export default BlinksList;
