import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface FollowRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    profile_pic: string | null;
  };
}

export const FollowRequestsPanel = () => {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('follow-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follow_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('follow_requests')
        .select(`
          id,
          requester_id,
          profiles!follow_requests_requester_id_fkey (
            id,
            username,
            profile_pic
          )
        `)
        .eq('target_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const formattedRequests = data.map((req: any) => ({
        id: req.id,
        requester: {
          id: req.profiles.id,
          username: req.profiles.username,
          profile_pic: req.profiles.profile_pic
        }
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, requesterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update request status
      const { error: updateError } = await supabase
        .from('follow_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create follow relationship
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: requesterId,
          following_id: user.id
        });

      if (followError) throw followError;

      // Create notification
      await supabase.rpc('create_notification', {
        p_user_id: requesterId,
        p_type: 'follow_accepted',
        p_actor_id: user.id
      });

      toast.success('Follow request accepted');
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('follow_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Follow request declined');
      fetchRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    }
  };

  if (loading) return null;

  if (requests.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl shadow-card p-4 mb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Follow Requests</h3>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={request.requester.profile_pic || undefined} />
                <AvatarFallback>
                  {request.requester.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{request.requester.username}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                className="bg-primary hover:bg-primary/90 rounded-full h-8 px-3"
                onClick={() => handleAccept(request.id, request.requester.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full h-8 px-3"
                onClick={() => handleDecline(request.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
