import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Sparkles, Users, UsersRound, ShoppingBag,
  Search, Calendar, BookOpen, Bell, User as UserIcon, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { avatarUrl, displayName } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/connect", label: "Connect", icon: Sparkles },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/groups", label: "Groups", icon: UsersRound },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { to: "/lost-found", label: "Lost & Found", icon: Search },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/communities", label: "Communities", icon: BookOpen },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

const AppSidebar = () => {
  const { logout, user } = useAuth();
  const { profile } = useProfile();
  const seed = profile?.avatarSeed || user?.uid || "x";

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col glass-strong border-r border-border/40">
      <div className="p-5 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight"><span className="gradient-text">Campus Connect</span></h1>
            <p className="text-[10px] text-muted-foreground">2.0 · SRM AP</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive
                ? "gradient-brand text-white shadow-lg"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border/30">
        <NavLink to="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 transition-colors">
          <img src={avatarUrl(seed)} alt="" className="h-9 w-9 rounded-full bg-secondary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName(user?.email, profile?.name)}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </NavLink>
        <button onClick={logout}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
