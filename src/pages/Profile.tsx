import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Grid, Loader2, Settings, Clock, UserCheck } from "lucide-react";
import { FollowRequestsPanel } from "@/components/profile/FollowRequestsPanel";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  bio: string | null;
  profile_pic: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_private: boolean;
}

interface Post {
  id: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
}

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequestStatus, setFollowRequestStatus] = useState<'none' | 'pending' | 'sent'>('none');

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // If no userId provided, show current user's profile
      const profileUserId = userId || user.id;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq(userId ? "user_id" : "id", profileUserId)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      setIsOwnProfile(profileData.id === user.id);

      // Fetch user's posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, image_url, likes_count, comments_count")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Check if following
      if (!isOwnProfile) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", profileData.id)
          .single();

        setIsFollowing(!!followData);

        // Check follow request status
        if (!followData && profileData.is_private) {
          const { data: requestData } = await supabase
            .from("follow_requests")
            .select("status")
            .eq("requester_id", user.id)
            .eq("target_id", profileData.id)
            .eq("status", "pending")
            .single();

          setFollowRequestStatus(requestData ? 'pending' : 'none');
        }
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !profile) return;

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed");
      } else {
        // Check if profile is private
        if (profile.is_private && followRequestStatus === 'none') {
          // Send follow request
          const { error } = await supabase
            .from("follow_requests")
            .insert({
              requester_id: user.id,
              target_id: profile.id
            });

          if (error) throw error;

          // Create notification
          await supabase.rpc('create_notification', {
            p_user_id: profile.id,
            p_type: 'follow_request',
            p_actor_id: user.id
          });

          setFollowRequestStatus('pending');
          toast.success("Follow request sent");
        } else if (!profile.is_private) {
          // Directly follow public profile
          const { error } = await supabase
            .from("follows")
            .insert({ follower_id: user.id, following_id: profile.id });

          if (error) throw error;
          setIsFollowing(true);
          toast.success("Following");
        }
      }

      fetchProfile();
    } catch (error: any) {
      toast.error("Failed to update follow status");
      console.error(error);
    }
  };

  const getFollowButtonText = () => {
    if (isFollowing) return "Following";
    if (followRequestStatus === 'pending') return "Requested";
    return "Follow";
  };

  const getFollowButtonIcon = () => {
    if (followRequestStatus === 'pending') return <Clock className="w-4 h-4 mr-2" />;
    if (isFollowing) return <UserCheck className="w-4 h-4 mr-2" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
      {/* Follow Requests Panel (only for own profile) */}
      {isOwnProfile && <FollowRequestsPanel />}

      {/* Profile Header */}
      <div className="bg-card rounded-3xl shadow-card p-6 mb-6 hover:shadow-hover transition-shadow animate-scale-in">
        <div className="flex items-start gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile.profile_pic || undefined} />
            <AvatarFallback className="text-2xl">
              {profile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold">{profile.username}</h2>
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  className={
                    isFollowing || followRequestStatus === 'pending'
                      ? "rounded-xl"
                      : "rounded-xl bg-gradient-primary hover:opacity-90"
                  }
                  variant={isFollowing || followRequestStatus === 'pending' ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={followRequestStatus === 'pending'}
                >
                  {getFollowButtonIcon()}
                  {getFollowButtonText()}
                </Button>
              )}
            </div>

            <div className="flex gap-8 mb-4">
              <div className="text-center">
                <p className="font-bold text-lg">{profile.posts_count}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{profile.followers_count}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{profile.following_count}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ID: {profile.user_id}</p>
              {profile.bio && <p className="text-sm">{profile.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="bg-card rounded-3xl shadow-card p-6 hover:shadow-hover transition-shadow animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-2 mb-4">
          <Grid className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Posts</h3>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="aspect-square bg-muted rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-all hover:scale-105 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;