import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  actor: {
    username: string;
    profile_pic: string;
  } | null;
  post_id: string | null;
}

export const NotificationsPanel = ({ onClose }: { onClose?: () => void }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          read,
          created_at,
          actor_id,
          post_id,
          profiles!notifications_actor_id_fkey (
            username,
            profile_pic
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedData = data.map((notif: any) => ({
        id: notif.id,
        type: notif.type,
        read: notif.read,
        created_at: notif.created_at,
        post_id: notif.post_id,
        actor: notif.profiles ? {
          username: notif.profiles.username,
          profile_pic: notif.profiles.profile_pic
        } : null
      }));

      setNotifications(formattedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    if (notification.post_id) {
      navigate('/');
      onClose?.();
    } else if (notification.type === 'follow' || notification.type === 'follow_request') {
      navigate('/profile');
      onClose?.();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-accent" fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-secondary" />;
      case 'follow':
      case 'follow_accepted':
        return <UserCheck className="w-5 h-5 text-primary" />;
      case 'follow_request':
        return <UserPlus className="w-5 h-5 text-primary" />;
      case 'post':
        return <Image className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const username = notification.actor?.username || 'Someone';
    switch (notification.type) {
      case 'like':
        return `${username} liked your post`;
      case 'comment':
        return `${username} commented on your post`;
      case 'follow':
        return `${username} started following you`;
      case 'follow_request':
        return `${username} requested to follow you`;
      case 'follow_accepted':
        return `${username} accepted your follow request`;
      case 'post':
        return `${username} shared a new post`;
      default:
        return 'New notification';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-elegant">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        {notifications.some(n => !n.read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
              await supabase
                .from('notifications')
                .update({ read: true })
                .in('id', unreadIds);
              fetchNotifications();
            }}
          >
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                <Avatar className="w-10 h-10 ring-2 ring-background">
                  <AvatarImage src={notification.actor?.profile_pic} />
                  <AvatarFallback>
                    {notification.actor?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {getNotificationIcon(notification.type)}
                    <p className="text-sm flex-1">
                      <span className="font-medium">{getNotificationText(notification)}</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
