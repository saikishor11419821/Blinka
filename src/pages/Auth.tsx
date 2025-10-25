import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Check if email input is actually a user_id (6+ digits)
        const isUserId = /^\d{6,}$/.test(email);

        if (isUserId) {
          // Login with user_id: fetch the email from profiles
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("email")
            .eq("user_id", email)
            .single();

          if (profileError || !profile) {
            throw new Error("User ID not found");
          }

          // Sign in with the fetched email
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password,
          });

          if (signInError) throw signInError;
        } else {
          // Normal email login
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
        }
        
        toast.success("Welcome back to Blinka!");
        navigate("/");
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        // Fetch the generated user_id and show it to the user
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("id", data.user.id)
            .single();

          if (profile?.user_id) {
            toast.success(`Account created! Your User ID is: ${profile.user_id}`, {
              duration: 10000,
            });
          } else {
            toast.success("Welcome to Blinka! Your account has been created.");
          }
        }
        
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-hover">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Blinka
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? "Welcome back!" : "Join the community"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{isLogin ? "Email or User ID" : "Email"}</Label>
              <Input
                id="email"
                type={isLogin ? "text" : "email"}
                placeholder={isLogin ? "Email or User ID" : "your@email.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>{isLogin ? "Sign In" : "Sign Up"}</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;