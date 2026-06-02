import { useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import { Outlet } from "react-router-dom";

const RequireAuth = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    );
  }
  if (!user) return <Login />;
  return <Outlet />;
};
export default RequireAuth;
