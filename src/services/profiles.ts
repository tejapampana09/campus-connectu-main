import { doc, updateDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";

export const updateProfile = (uid: string, data: Partial<UserProfile>) =>
  updateDoc(doc(db, "users", uid), { ...data });

export const searchStudents = async (term: string, currentUid: string): Promise<UserProfile[]> => {
  const t = term.trim().toLowerCase();
  if (!t) return [];

  try {
    // Try optimized search with nameLower if available
    const snap = await getDocs(
      query(
        collection(db, "users"),
        where("nameLower", ">=", t),
        where("nameLower", "<=", t + "\uf8ff"),
        limit(20)
      )
    );

    if (snap.docs.length > 0) {
      return snap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter((u) => u.uid !== currentUid);
    }
  } catch (e) {
    // Fall back to client-side filtering for users without nameLower
  }

  // Fallback: client-side filter (Firestore lacks substring search)
  const snap = await getDocs(query(collection(db, "users"), limit(50)));
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
    .filter((u) => u.uid !== currentUid)
    .filter((u) =>
      !t ||
      u.email?.toLowerCase().includes(t) ||
      u.name?.toLowerCase().includes(t) ||
      u.branch?.toLowerCase().includes(t)
    )
    .slice(0, 20);
};

