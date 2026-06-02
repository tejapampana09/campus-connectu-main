import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Users, ShoppingBag, Search, Calendar, BookOpen, MessageCircle, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { avatarUrl, displayName } from "@/lib/avatar";
import PageHeader from "@/components/PageHeader";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

const cards = [
  { to: "/connect", title: "Anonymous Connect", desc: "Meet a random campus peer", icon: Sparkles, gradient: "from-purple-500 to-pink-500" },
  { to: "/friends", title: "Friends", desc: "Chat with your circle", icon: Users, gradient: "from-pink-500 to-rose-500" },
  { to: "/groups", title: "Groups", desc: "Talk together", icon: MessageCircle, gradient: "from-blue-500 to-purple-500" },
  { to: "/marketplace", title: "Marketplace", desc: "Buy & sell on campus", icon: ShoppingBag, gradient: "from-purple-500 to-blue-500" },
  { to: "/lost-found", title: "Lost & Found", desc: "Recover what's missing", icon: Search, gradient: "from-pink-500 to-purple-500" },
  { to: "/events", title: "Events", desc: "Hackathons, workshops, clubs", icon: Calendar, gradient: "from-blue-500 to-pink-500" },
  { to: "/communities", title: "Study Hubs", desc: "DSA, AI, AWS & more", icon: BookOpen, gradient: "from-purple-500 to-pink-500" },
  { to: "/notifications", title: "Notifications", desc: "Activity & invites", icon: Bell, gradient: "from-pink-500 to-blue-500" },
];

const trending = ["#Hackathon2026", "#PlacementPrep", "#OpenSource", "#AIClub", "#CampusFest"];

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const initialLoadRef = useRef(true);

  if (loading && initialLoadRef.current) {
    return <DashboardSkeleton />;
  }

  initialLoadRef.current = false;

  const name = displayName(user?.email, profile?.name);
  const seed = profile?.avatarSeed || user?.uid || "x";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full gradient-brand opacity-20 blur-3xl" />
        <div className="relative flex items-center gap-4 md:gap-6">
          <img src={avatarUrl(seed)} alt="" className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-secondary" />
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl md:text-4xl font-bold truncate">
              Hey, <span className="gradient-text">{name}</span> 👋
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {profile?.branch && profile?.year ? `${profile.branch} · ${profile.year}` : "Complete your profile to personalize your experience"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Trending */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Trending on campus</p>
        <div className="flex flex-wrap gap-2">
          {trending.map((t) => (
            <span key={t} className="glass px-3 py-1.5 rounded-full text-xs font-medium text-foreground/90">{t}</span>
          ))}
        </div>
      </div>

      {/* Quick nav */}
      <PageHeader title="Quick navigation" subtitle="Jump anywhere in your campus" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <NavLink to={c.to}
              className="group block glass hover:glass-strong rounded-2xl p-4 md:p-5 transition-all hover:-translate-y-1 hover:glow">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-3`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm md:text-base">{c.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
            </NavLink>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default Dashboard;
