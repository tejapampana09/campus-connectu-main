import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { Bell, UserPlus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { NavLink } from "react-router-dom";
import { avatarUrl, displayName } from "@/lib/avatar";

const Notifications = () => {
  const { user } = useAuth();
  const uid = user!.uid;
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "friendRequests"), where("to", "==", uid), where("status", "==", "pending"));
    return onSnapshot(q, async (snap) => {
      const reqs = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        let email = "Peer", name: string | undefined;
        try {
          const u = await getDoc(doc(db, "users", data.from));
          email = u.data()?.email || "Peer";
          name = u.data()?.name;
        } catch {}
        return { id: d.id, from: data.from, email, name, createdAt: data.createdAt };
      }));
      setRequests(reqs);
    });
  }, [uid]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <PageHeader title="Notifications" subtitle="Recent activity for you" />
      {requests.length === 0 ? (
        <EmptyState icon={<Bell className="h-5 w-5" />} title="You're all caught up"
          body="New friend requests, invites, and updates will show up here." />
      ) : (
        <div className="space-y-2">
          {requests.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <NavLink to="/friends" className="glass rounded-2xl p-4 flex items-center gap-3 hover:glass-strong transition-all">
                <img src={avatarUrl(r.from)} className="h-10 w-10 rounded-full bg-secondary" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{displayName(r.email, r.name)}</span>
                    <span className="text-muted-foreground"> sent you a friend request</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                </div>
                <UserPlus className="h-4 w-4 text-primary" />
              </NavLink>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Notifications;
