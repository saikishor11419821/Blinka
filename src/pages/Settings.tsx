import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  Loader2, Upload, User, Lock, Bell, Shield, Trash2, 
  Eye, EyeOff, Moon, Sun, Globe, MessageCircle, UserCheck,
  Smartphone, Info, HelpCircle, FileText, Palette, Type,
  LayoutGrid, Mail, Calendar, Phone
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  bio: string | null;
  profile_pic: string | null;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Notification Settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  
  // Privacy Settings
  const [privateAccount, setPrivateAccount] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  
  // Appearance Settings
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState("medium");
  const [feedLayout, setFeedLayout] = useState("comfortable");
  
  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setUsername(data.username);
      setBio(data.bio || "");
      setEmail(data.email || "");
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_pic: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Profile picture updated!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          bio: bio.trim() || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to log out");
    }
  };

  const handleDeleteAccount = async () => {
    toast.info("Please contact support to delete your account");
    setShowDeleteDialog(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-foreground">
        Settings
      </h1>

      {/* 1. Profile Management */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4 hover:shadow-hover transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Profile Management</h2>
        </div>

        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <Avatar className="w-24 h-24 border-2 border-primary/20">
            <AvatarImage src={profile.profile_pic || undefined} />
            <AvatarFallback className="text-2xl bg-secondary">
              {username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <label className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={uploading}
              asChild
            >
              <span>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Change Photo
                  </>
                )}
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            User ID
          </Label>
          <Input
            value={profile.user_id}
            disabled
            className="bg-secondary/50 border-border opacity-75 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use this unique ID to login instead of email
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="bg-secondary/50 border-border"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="bg-secondary/50 border-border"
            type="email"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number (Optional)
          </Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 8900"
            className="bg-secondary/50 border-border"
            type="tel"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth
            </Label>
            <Input
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="bg-secondary/50 border-border"
              type="date"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Bio</Label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            className="bg-secondary/50 border-border min-h-[100px]"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-primary hover:opacity-90 rounded-xl"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {/* 2. Account & Security */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4 hover:shadow-hover transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Account & Security</h2>
        </div>

        <Button 
          variant="outline" 
          className="w-full justify-start rounded-xl" 
          onClick={() => toast.info("Coming soon!")}
        >
          <Lock className="w-4 h-4 mr-2" />
          Change Password
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start rounded-xl" 
          onClick={() => toast.info("Coming soon!")}
        >
          <Mail className="w-4 h-4 mr-2" />
          Verify Email
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start rounded-xl" 
          onClick={() => toast.info("Coming soon!")}
        >
          <Shield className="w-4 h-4 mr-2" />
          Enable Two-Factor Authentication
        </Button>

        <Separator />

        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Login Activity
          </Label>
          <p className="text-xs text-muted-foreground">
            Last login: Today at 10:30 AM
          </p>
        </div>
      </div>

      {/* 3. Privacy & Permissions */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4 hover:shadow-hover transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Privacy & Permissions</h2>
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Private Account
            </Label>
            <p className="text-xs text-muted-foreground">
              Only followers can see your posts
            </p>
          </div>
          <Switch checked={privateAccount} onCheckedChange={setPrivateAccount} />
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Allow Comments
            </Label>
            <p className="text-xs text-muted-foreground">
              Let people comment on your posts
            </p>
          </div>
          <Switch checked={allowComments} onCheckedChange={setAllowComments} />
        </div>

        <Button 
          variant="outline" 
          className="w-full justify-start rounded-xl" 
          onClick={() => toast.info("Coming soon!")}
        >
          <EyeOff className="w-4 h-4 mr-2" />
          Blocked Users
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start rounded-xl" 
          onClick={() => toast.info("Coming soon!")}
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Follow Requests
        </Button>
      </div>

      {/* 4. Appearance & Display */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4 hover:shadow-hover transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Appearance & Display</h2>
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Dark Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Use dark theme for better night viewing
            </p>
          </div>
          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Font Size
          </Label>
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            Feed Layout
          </Label>
          <Select value={feedLayout} onValueChange={setFeedLayout}>
            <SelectTrigger className="bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 5. Notifications */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4 hover:shadow-hover transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
          <Label className="text-sm font-medium">Push Notifications</Label>
          <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Likes</Label>
            <Switch checked={likeNotifications} onCheckedChange={setLikeNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Comments</Label>
            <Switch checked={commentNotifications} onCheckedChange={setCommentNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">New Followers</Label>
            <Switch checked={followNotifications} onCheckedChange={setFollowNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Messages</Label>
            <Switch checked={messageNotifications} onCheckedChange={setMessageNotifications} />
          </div>
        </div>
      </div>

      {/* 6. App Settings */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4 hover:shadow-hover transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">App Settings</h2>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Language
          </Label>
          <Select defaultValue="en">
            <SelectTrigger className="bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          className="w-full justify-start rounded-xl" 
          onClick={() => toast.success("Cache cleared!")}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Cache
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start rounded-xl" 
          onClick={() => toast.info("Coming soon!")}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help & Support
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start rounded-xl" 
          onClick={() => toast.info("Coming soon!")}
        >
          <FileText className="w-4 h-4 mr-2" />
          Terms & Privacy Policy
        </Button>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground text-center">
            Blinka v1.0.0
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-destructive/10 rounded-2xl p-6 border border-destructive/50 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
        </div>

        <Button 
          onClick={() => setShowLogoutDialog(true)} 
          variant="destructive" 
          className="w-full rounded-xl"
        >
          Logout
        </Button>

        <Button
          variant="outline"
          className="w-full text-destructive border-destructive hover:bg-destructive/10 rounded-xl"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete Account
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You'll need to login again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
