import { Search, Settings, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { NotificationButton } from "./NotificationButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TopNav = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-b border-border z-50 animate-slide-in-top">
      <div className="max-w-6xl mx-auto px-3 md:px-4 h-16 flex items-center justify-between gap-2 md:gap-4">
        <h1 
          className="text-xl md:text-2xl font-bold cursor-pointer hover:scale-105 transition-transform whitespace-nowrap flex-shrink-0"
          style={{
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
          onClick={() => navigate("/")}
        >
          Blinka
        </h1>

        <div className="flex-1 max-w-md hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search Blinka..."
              className="pl-10 rounded-full bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <NotificationButton />
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-primary/10 transition-all hover:scale-110"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-destructive/10 transition-all hover:scale-110"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;