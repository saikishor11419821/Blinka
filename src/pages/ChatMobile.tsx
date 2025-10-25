import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
}

interface ChatUser {
  id: string;
  username: string;
  profile_pic: string | null;
}

const ChatMobile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);

  useEffect(() => {
    if (userId) {
      initChat();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("mobile-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const initChat = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !userId) return;

      setCurrentUserId(user.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, profile_pic")
        .eq("id", userId)
        .single();

      if (profileData) {
        setChatUser(profileData);
        fetchMessages();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async () => {
    if (!currentUserId || !userId) return;

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

      await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver_id", currentUserId)
        .eq("sender_id", userId)
        .eq("read", false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !userId) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: userId,
        text: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      fetchMessages();
    } catch (error: any) {
      toast.error("Failed to send message");
      console.error(error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border p-4 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-primary/10 flex-shrink-0"
          onClick={() => navigate("/chat")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={chatUser?.profile_pic || undefined} />
          <AvatarFallback>
            {chatUser?.username?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold truncate">{chatUser?.username}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === currentUserId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 break-words ${
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

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-border bg-card/80 backdrop-blur-lg flex gap-2 sticky bottom-0"
      >
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="rounded-full flex-1"
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
    </div>
  );
};

export default ChatMobile;
