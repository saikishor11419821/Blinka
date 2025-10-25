import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PostCardProps {
  post: {
    id: string;
    user_id?: string;
    user: {
      username: string;
      profile_pic?: string;
    };
    image_url?: string;
    caption?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
  };
  onLike?: () => void;
  onComment?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  isLiked?: boolean;
  isOwner?: boolean;
}

const PostCard = ({ 
  post, 
  onLike, 
  onComment, 
  onDelete,
  onShare,
  isLiked = false,
  isOwner = false 
}: PostCardProps) => {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Default share behavior
      if (navigator.share) {
        navigator.share({
          title: `Post by ${post.user.username}`,
          text: post.caption || "Check out this post!",
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    if (onDelete) {
      onDelete();
    }
  };

  const captionPreview =
    post.caption && post.caption.length > 150
      ? post.caption.slice(0, 150) + "..."
      : post.caption;

  return (
    <article className="bg-card rounded-3xl shadow-card hover:shadow-hover transition-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.user.profile_pic} />
            <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{post.user.username}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isOwner && (
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media - Image or Video */}
      {post.image_url && (
        <div className="aspect-square bg-muted">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {(post as any).video_url && (
        <div className="aspect-video bg-black">
          <video
            src={(post as any).video_url}
            className="w-full h-full object-contain"
            controls
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:scale-110 transition-transform"
              onClick={onLike}
            >
              <Heart
                className={cn(
                  "w-6 h-6",
                  isLiked && "fill-red-500 text-red-500"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:scale-110 transition-transform"
              onClick={onComment}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:scale-110 transition-transform"
              onClick={handleShare}
            >
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:scale-110 transition-transform"
          >
            <Bookmark className="w-6 h-6" />
          </Button>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm">{post.likes_count} likes</p>

        {/* Caption */}
        {post.caption && (
          <div className="text-sm">
            <span className="font-semibold mr-2">{post.user.username}</span>
            <span className="text-foreground">
              {showFullCaption ? post.caption : captionPreview}
            </span>
            {post.caption.length > 150 && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-muted-foreground ml-1 hover:text-foreground"
              >
                {showFullCaption ? "less" : "more"}
              </button>
            )}
          </div>
        )}

        {/* Comments preview */}
        {post.comments_count > 0 && (
          <button
            onClick={onComment}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all {post.comments_count} comments
          </button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

export default PostCard;