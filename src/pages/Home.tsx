import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PostCard from "@/components/post/PostCard";
import BlinksList from "@/components/stories/BlinksList";
import { Loader2 } from "lucide-react";

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: {
    username: string;
    profile_pic: string | null;
  };
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchUserLikes();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:user_id (
            username,
            profile_pic
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast.error("Failed to load posts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserLikes(new Set(data.map((like) => like.post_id)));
    } catch (error) {
      console.error("Failed to fetch user likes:", error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const isLiked = userLikes.has(postId);

      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;

        setUserLikes((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;

        setUserLikes((prev) => new Set(prev).add(postId));
      }

      // Refresh posts to get updated counts
      fetchPosts();
    } catch (error: any) {
      toast.error("Failed to update like");
      console.error(error);
    }
  };

  const handleDeletePost = async (postId: string, userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || userId !== user.id) {
      toast.error("You can only delete your own posts");
      return;
    }
    
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);
    
    if (error) {
      toast.error("Failed to delete post");
    } else {
      toast.success("Post deleted successfully");
      fetchPosts();
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Blinks Section */}
      <div className="bg-card border-b border-border">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-foreground">
            Blinks ✨
          </h2>
        </div>
        <BlinksList />
      </div>

      {/* Posts Section */}
      <div className="p-4 space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                user_id: post.user_id,
                user: {
                  username: post.profiles.username,
                  profile_pic: post.profiles.profile_pic || undefined,
                },
                image_url: post.image_url || undefined,
                caption: post.caption || undefined,
                likes_count: post.likes_count,
                comments_count: post.comments_count,
                created_at: post.created_at,
              }}
              onLike={() => handleLike(post.id)}
              onComment={() => toast.info("Comments coming soon!")}
              onDelete={() => handleDeletePost(post.id, post.user_id)}
              isLiked={userLikes.has(post.id)}
              isOwner={post.user_id === currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;