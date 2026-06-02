import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import AppShell from "@/layouts/AppShell";
import Dashboard from "@/pages/Dashboard";
import Connect from "@/pages/Connect";
import FriendsPage from "@/pages/FriendsPage";
import GroupsPage from "@/pages/GroupsPage";
import Marketplace from "@/pages/Marketplace";
import LostFound from "@/pages/LostFound";
import Events from "@/pages/Events";
import Communities from "@/pages/Communities";
import Notifications from "@/pages/Notifications";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/connect" element={<Connect />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/lost-found" element={<LostFound />} />
                <Route path="/events" element={<Events />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
