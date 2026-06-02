import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/types";

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const ref = doc(db, "users", user.uid);

    // Ensure base user doc exists
    setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email || "",
        avatarSeed: user.uid,
        online: true,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});

    const unsub = onSnapshot(ref, (snap) => {
      setProfile(snap.exists() ? ({ uid: user.uid, ...snap.data() } as UserProfile) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { profile, loading };
};
