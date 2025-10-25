import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  bio: string | null;
  profile_pic: string | null;
  followers_count: number;
}

const Explore = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get users the current user is already following
      const { data: followingData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = new Set(
        followingData?.map((f) => f.following_id) || []
      );
      setFollowing(followingIds);

      // Get suggested users (exclude current user and those already following)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .limit(20);

      if (error) throw error;

      // Filter out users already following
      const suggestedUsers = data?.filter((p) => !followingIds.has(p.id)) || [];
      setProfiles(suggestedUsers);
    } catch (error: any) {
      toast.error("Failed to load suggested users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (profileId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: profileId });

      if (error) throw error;

      setFollowing((prev) => new Set(prev).add(profileId));
      toast.success("Following user");
    } catch (error: any) {
      toast.error("Failed to follow user");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
      <div className="bg-card rounded-3xl shadow-card p-6 hover:shadow-hover transition-shadow">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Discover People</h2>

        {profiles.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">
              No suggestions available right now
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-all hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => navigate(`/profile/${profile.user_id}`)}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profile.profile_pic || undefined} />
                    <AvatarFallback>
                      {profile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{profile.username}</p>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground truncate">
                        {profile.bio}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {profile.followers_count} followers
                    </p>
                  </div>
                </div>
                <Button
                  className="rounded-xl bg-gradient-primary hover:opacity-90"
                  onClick={() => handleFollow(profile.id)}
                  disabled={following.has(profile.id)}
                >
                  {following.has(profile.id) ? "Following" : "Follow"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;