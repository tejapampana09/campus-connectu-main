import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const Login = () => {
  const { loginEmail, signupEmail, loginGoogle } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const friendly = (err: any): string => {
    const code = err?.code as string | undefined;
    switch (code) {
      case "auth/invalid-email": return "Please enter a valid email address";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
      case "auth/invalid-login-credentials": return "Invalid email or password";
      case "auth/email-already-in-use": return "This email is already registered";
      case "auth/weak-password": return "Password is too weak";
      case "auth/too-many-requests": return "Too many attempts. Try again later";
      case "auth/popup-closed-by-user": return "Sign-in cancelled";
      default: return err?.message || "Authentication failed. Please try again";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      if (isSignup) await signupEmail(email, password);
      else await loginEmail(email, password);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(friendly(err));
    } finally { setLoading(false); }
  };

  const google = async () => {
    setError("");
    setLoading(true);
    try { await loginGoogle(); }
    catch (err: any) { console.error(err); setError(friendly(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong relative w-full max-w-[400px] rounded-3xl p-8 glow"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold"><span className="gradient-text">Campus Connect</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup ? "Join your campus ecosystem" : "Welcome back to campus"}
          </p>
        </div>

        <Button
          type="button" variant="secondary" onClick={google} disabled={loading}
          className="w-full mb-4 rounded-xl bg-white text-black hover:bg-white/90 font-medium"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Input type="email" placeholder="you@srmap.edu.in" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-secondary/40 border-border/50 rounded-xl h-11" />
          <Input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-secondary/40 border-border/50 rounded-xl h-11" />

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="text-sm text-destructive">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Button type="submit" disabled={loading}
            className="w-full h-11 rounded-xl gradient-brand text-white font-semibold border-0 hover:opacity-90">
            {loading ? "..." : isSignup ? "Create account" : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <button onClick={() => { setIsSignup(!isSignup); setError(""); }}
            className="text-primary hover:underline font-medium">
            {isSignup ? "Login" : "Create account"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
