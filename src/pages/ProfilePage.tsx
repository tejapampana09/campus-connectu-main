import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { updateProfile } from "@/services/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Save, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { avatarUrl } from "@/lib/avatar";
import { toast } from "@/hooks/use-toast";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { formatErrorMessage, logError } from "@/lib/errorHandler";

const BRANCHES = ["CSE", "ECE", "Mech", "Civil", "EEE", "BBA", "BCom", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const ProfilePage = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const initialLoadRef = useRef(true);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [seed, setSeed] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setBranch(profile.branch || "");
    setYear(profile.year || "");
    setBio(profile.bio || "");
    setSkills((profile.skills || []).join(", "));
    setInterests((profile.interests || []).join(", "));
    setSeed(profile.avatarSeed || user?.uid || "x");
  }, [profile, user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.uid, {
        name: name.trim().slice(0, 50),
        branch, year, bio: bio.trim().slice(0, 200),
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10),
        interests: interests.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10),
        avatarSeed: seed,
        nameLower: name.trim().toLowerCase(),
      });
      toast({ title: "Profile saved" });
    } catch (error) {
      logError("ProfilePage.save", error);
      toast({ title: "Save failed", description: formatErrorMessage(error), variant: "destructive" });
    } finally { setSaving(false); }
  };

  const reroll = () => setSeed(Math.random().toString(36).slice(2));

  if (loading && initialLoadRef.current) {
    return <ProfileSkeleton />;
  }

  initialLoadRef.current = false;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <PageHeader title="Your profile" subtitle="Let your campus know who you are" />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 mb-6 flex items-center gap-5">
        <img src={avatarUrl(seed)} alt="" className="h-20 w-20 rounded-2xl bg-secondary" />
        <div>
          <p className="font-bold text-lg">{name || user?.email?.split("@")[0]}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <Button size="sm" variant="ghost" onClick={reroll} className="mt-2 text-primary text-xs">
            <Sparkles className="h-3 w-3 mr-1" /> Reroll avatar
          </Button>
        </div>
      </motion.div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50}
            className="bg-secondary/40 border-border/50 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)}
              className="w-full h-10 rounded-xl bg-secondary/40 border border-border/50 px-3 text-sm">
              <option value="">Select…</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="w-full h-10 rounded-xl bg-secondary/40 border border-border/50 px-3 text-sm">
              <option value="">Select…</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200}
            placeholder="A line about you..." className="bg-secondary/40 border-border/50 rounded-xl" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Skills (comma separated)</label>
          <Input value={skills} onChange={(e) => setSkills(e.target.value)}
            placeholder="React, Python, Public speaking..." className="bg-secondary/40 border-border/50 rounded-xl" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Interests (comma separated)</label>
          <Input value={interests} onChange={(e) => setInterests(e.target.value)}
            placeholder="AI, Hackathons, Football..." className="bg-secondary/40 border-border/50 rounded-xl" />
        </div>
        <Button onClick={save} disabled={saving}
          className="w-full rounded-full gradient-brand border-0 text-white">
          <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </div>
  );
};
export default ProfilePage;
