import { NavLink } from "react-router-dom";
import { LayoutDashboard, Sparkles, Users, ShoppingBag, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/connect", label: "Connect", icon: Sparkles },
  { to: "/friends", label: "Social", icon: Users },
  { to: "/marketplace", label: "Market", icon: ShoppingBag },
  { to: "/notifications", label: "Alerts", icon: Bell },
];

const MobileNav = () => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-border/40 pb-[env(safe-area-inset-bottom)]">
    <div className="flex items-center justify-around py-1.5">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.to === "/"}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]",
            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}>
          <it.icon className="h-5 w-5" />
          <span className="text-[10px] font-medium">{it.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
export default MobileNav;
