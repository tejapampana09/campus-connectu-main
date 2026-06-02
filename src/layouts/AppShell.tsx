import { Outlet, useLocation, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Bell, Sparkles } from "lucide-react";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { avatarUrl } from "@/lib/avatar";
import { useState } from "react";
import { navItems } from "./AppSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const AppShell = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const seed = profile?.avatarSeed || user?.uid || "x";

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden sticky top-0 z-40 glass-strong border-b border-border/40 px-4 py-2.5 flex items-center justify-between">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar p-0 w-72 border-sidebar-border">
              <div className="p-5 border-b border-border/30 flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-base font-bold gradient-text">Campus Connect</h1>
              </div>
              <nav className="p-3 space-y-1">
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive ? "gradient-brand text-white" : "text-muted-foreground hover:bg-secondary/60"
                      }`}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
                <button onClick={() => { setOpen(false); logout(); }}
                  className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10">
                  Logout
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <NavLink to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm gradient-text">Campus Connect</span>
          </NavLink>

          <NavLink to="/profile">
            <img src={avatarUrl(seed)} alt="" className="h-8 w-8 rounded-full bg-secondary" />
          </NavLink>
        </header>

        <main className="flex-1 pb-20 md:pb-0 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileNav />
      </div>
    </div>
  );
};
export default AppShell;
