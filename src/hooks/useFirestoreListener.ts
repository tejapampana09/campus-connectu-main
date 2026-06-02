import { useEffect } from 'react';
import type { Query, QuerySnapshot } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';

export const useFirestoreListener = (
  query: Query | null,
  callback: (snapshot: QuerySnapshot) => void
) => {
  useEffect(() => {
    if (!query) return;

    const unsubscribe = onSnapshot(query, callback);
    return unsubscribe; // React auto-calls on unmount
  }, [query, callback]);
};
