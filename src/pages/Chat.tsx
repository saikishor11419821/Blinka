import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ChatUser {
  id: string;
  username: string;
  profile_pic: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  read: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchMessages(selectedUser.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser]);

  const initChat = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Fetch users the current user is following
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followsError) throw followsError;

      const followingIds = followsData?.map((f) => f.following_id) || [];

      if (followingIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, profile_pic")
        .in("id", followingIds);

      if (profilesError) throw profilesError;

      setUsers(profilesData || []);
    } catch (error: any) {
      toast.error("Failed to load chats");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver_id", currentUserId)
        .eq("sender_id", userId)
        .eq("read", false);
    } catch (error: any) {
      toast.error("Failed to load messages");
      console.error(error);
    }
  };

  const handleSelectUser = (user: ChatUser) => {
    if (isMobile) {
      navigate(`/chat/${user.id}`);
    } else {
      setSelectedUser(user);
      fetchMessages(user.id);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedUser) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: selectedUser.id,
        text: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedUser.id);
    } catch (error: any) {
      toast.error("Failed to send message");
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
    <div className="max-w-6xl mx-auto p-2 md:p-4 h-[calc(100vh-8rem)] animate-fade-in">
      <div className="flex gap-0 md:gap-4 h-full bg-card rounded-3xl shadow-card overflow-hidden hover:shadow-hover transition-shadow">
        {/* Users List - Hidden on mobile when chat is selected */}
        <div className={`${isMobile ? 'w-full' : 'w-80'} ${isMobile && selectedUser ? 'hidden' : ''} border-r border-border flex flex-col`}>
          <div className="p-4 border-b border-border flex-shrink-0">
            <h2 className="font-bold text-xl text-foreground">Messages</h2>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Follow someone to start chatting!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-y-auto flex-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                    selectedUser?.id === user.id && !isMobile ? "bg-muted" : ""
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={user.profile_pic || undefined} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold truncate">{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area - Only shown on desktop OR when user selected on mobile */}
        {(!isMobile || selectedUser) && (
          <div className="flex-1 flex flex-col min-w-0">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3 flex-shrink-0">
                  <Avatar>
                    <AvatarImage src={selectedUser.profile_pic || undefined} />
                    <AvatarFallback>
                      {selectedUser.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">{selectedUser.username}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === currentUserId
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] md:max-w-[70%] rounded-2xl px-4 py-2 break-words ${
                          message.sender_id === currentUserId
                            ? "bg-gradient-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_id === currentUserId
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 md:p-4 border-t border-border flex gap-2 flex-shrink-0"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="rounded-full"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-gradient-primary hover:opacity-90 flex-shrink-0"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Select a chat to start messaging</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;