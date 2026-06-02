import { MessageCircle, Users, UsersRound, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Tab = "chat" | "friends" | "groups";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "friends", label: "Friends", icon: Users },
  { id: "groups", label: "Groups", icon: UsersRound },
];

const BottomNav = ({ active, onChange }: BottomNavProps) => {
  const { logout } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors",
              active === t.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t.label}</span>
          </button>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[11px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
