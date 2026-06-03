import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { containsBadWord } from "@/lib/badwords";
import {
  collection, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, runTransaction, limit, where,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, UserPlus, Send } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  text: string;
}

const ChatScreen = () => {
  const { user, loading } = useAuth();
  const userId = user?.uid;

  const [screen, setScreen] = useState<"welcome" | "matching" | "chat">("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [muteMsg, setMuteMsg] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [friendReqSent, setFriendReqSent] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const unsubsRef = useRef<(() => void)[]>([]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  // Init user doc & heartbeat
  useEffect(() => {
    if (!userId || !user) return;
    setDoc(
      doc(db, "users", userId),
      { email: user.email || null, status: "idle", chatId: null, lastSeen: serverTimestamp() },
      { merge: true }
    );
    const hb = setInterval(() => {
      setDoc(doc(db, "users", userId), { lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
    }, 15000);
    return () => clearInterval(hb);
  }, [userId, user]);

  // Listen for chat assignment
  useEffect(() => {
    if (!userId) return;

    const unsubUser = onSnapshot(doc(db, "users", userId), (snap) => {
      const d = snap.data();
      if (d?.chatId && d.status === "chatting" && !currentChatId) {
        setCurrentChatId(d.chatId);
        setScreen("chat");
      }
    });

    const chatsQuery = query(
      collection(db, "chats"),
      where("users", "array-contains", userId),
      orderBy("createdAt", "desc")
    );
    const unsubChats = onSnapshot(chatsQuery, (snap) => {
      snap.docs.forEach((d) => {
        const data = d.data();
        if (!data || data.ended) return;
        if (!currentChatId) {
          setCurrentChatId(d.id);
          setScreen("chat");
        }
      });
    });

    return () => {
      unsubUser();
      unsubChats();
    };
  }, [userId, currentChatId]);

  // Listen to chat messages & typing
  useEffect(() => {
    if (!currentChatId || !userId) return;

    const msgUnsub = onSnapshot(
      query(collection(db, "chats", currentChatId, "messages"), orderBy("time")),
      (snap) => {
        snap.docChanges().forEach((c) => {
          if (c.type === "added") {
            const d = c.doc.data();
            setMessages((prev) => {
              if (prev.some((m) => m.id === c.doc.id)) return prev;
              return [...prev, { id: c.doc.id, sender: d.sender, text: d.text }];
            });
          }
        });
      }
    );

    const chatUnsub = onSnapshot(doc(db, "chats", currentChatId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      // Find peer
      const users = data.users || [];
      const peer = users.find((u: string) => u !== userId);
      if (peer) setPeerId(peer);

      // Typing
      const typing = data.typing || {};
      const otherTyping = Object.entries(typing).some(([uid, val]) => uid !== userId && val === true);
      setPeerTyping(otherTyping);

      // Ended
      if (data.ended) {
        if (data.endedBy !== userId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === "end")) return prev;
            return [...prev, { id: "end", sender: "system", text: "Peer has left the chat" }];
          });
        }
        setDoc(doc(db, "users", userId), { status: "idle", chatId: null }, { merge: true }).catch(() => {});
        setTimeout(() => cleanup(), 1500);
      }
    });

    const activeUnsubs = [msgUnsub, chatUnsub];
    unsubsRef.current = [...unsubsRef.current, ...activeUnsubs];
    return () => {
      msgUnsub();
      chatUnsub();
    };
  }, [currentChatId, userId]);

  // Cleanup matching status when leaving screen/unmounting
  useEffect(() => {
    return () => {
      if (userId) {
        deleteDoc(doc(db, "queue", userId)).catch(() => {});
        setDoc(doc(db, "users", userId), { status: "idle", chatId: null }, { merge: true }).catch(() => {});
      }
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [];
    };
  }, []);

  const cleanup = () => {
    unsubsRef.current.forEach((u) => u());
    unsubsRef.current = [];
    setCurrentChatId(null);
    setMessages([]);
    setPeerId(null);
    setFriendReqSent(false);
    setPeerTyping(false);
    setScreen("welcome");
  };

  const connect = async () => {
    if (!userId) return;
    setScreen("matching");

    // Remove old queue entry (using userId as key ensures single entry)
    const myQueueRef = doc(db, "queue", userId);
    await deleteDoc(myQueueRef).catch(() => {});

    await setDoc(doc(db, "users", userId), { status: "waiting" }, { merge: true });
    await setDoc(myQueueRef, { userId, status: "waiting", joinedAt: serverTimestamp() }, { merge: true });

    findMatch();
  };

  const findMatch = () => {
    if (!userId) return;

    const myQueueRef = doc(db, "queue", userId);

    // Listen for queue updates on our own document to see if peer matched us
    const unsubMyQueue = onSnapshot(myQueueRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === "matched" && data.chatId) {
          setDoc(doc(db, "users", userId), { status: "chatting", chatId: data.chatId }, { merge: true }).catch(() => {});
          deleteDoc(myQueueRef).catch(() => {});
          unsubMyQueue();
        }
      }
    });

    // Scan for potential matches
    const q = query(
      collection(db, "queue"),
      where("status", "==", "waiting"),
      orderBy("joinedAt"),
      limit(10)
    );

    const unsubQueue = onSnapshot(q, async (snapshot) => {
      const now = Date.now();
      const candidates: { uid: string; ref: any }[] = [];

      for (const d of snapshot.docs) {
        const peerUid = d.id;
        if (peerUid === userId) continue;
        const pData = d.data();
        if (!pData || pData.status !== "waiting") continue;

        try {
          const usnap = await getDoc(doc(db, "users", peerUid));
          const u = usnap.data();
          if (!u || u.status !== "waiting") {
            // Clean up dead queue reference if user is no longer waiting
            const last = u?.lastSeen?.toMillis?.() || now;
            if (now - last > 45000) {
              deleteDoc(doc(db, "queue", peerUid)).catch(() => {});
            }
            continue;
          }
          const last = u.lastSeen?.toMillis?.() || now;
          if (now - last > 45000) continue; // Peer seems offline, skip
          candidates.push({ uid: peerUid, ref: d.ref });
        } catch {}
      }

      if (candidates.length === 0) return;
      const peer = candidates[0]; // Choose the oldest waiting peer

      try {
        const chatId = [userId, peer.uid].sort().join('_');
        const chatRef = doc(db, "chats", chatId);
        await runTransaction(db, async (tx) => {
          const existing = await tx.get(chatRef);
          if (existing.exists()) {
            throw new Error("already-matched");
          }

          const myQueueSnap = await tx.get(myQueueRef);
          const peerQueueSnap = await tx.get(peer.ref);
          const myUserSnap = await tx.get(doc(db, "users", userId));
          const peerUserSnap = await tx.get(doc(db, "users", peer.uid));

          if (!myQueueSnap.exists() || !peerQueueSnap.exists() || !myUserSnap.exists() || !peerUserSnap.exists()) {
            throw new Error("missing-documents");
          }

          const myQ = myQueueSnap.data();
          const peerQ = peerQueueSnap.data();
          const myU = myUserSnap.data();
          const peerU = peerUserSnap.data();

          if (
            myQ.status !== "waiting" ||
            peerQ.status !== "waiting" ||
            myU.status !== "waiting" ||
            peerU.status !== "waiting"
          ) {
            throw new Error("not-waiting");
          }

          // Create matching chat document
          tx.set(chatRef, {
            users: [userId, peer.uid],
            typing: { [userId]: false, [peer.uid]: false },
            createdAt: serverTimestamp(),
            ended: false,
          });

          // Atomically update queue documents to matched
          tx.update(myQueueRef, { status: "matched", peerId: peer.uid, chatId: chatRef.id });
          tx.update(peer.ref, { status: "matched", peerId: userId, chatId: chatRef.id });
        });

        // Set status to chatting
        await setDoc(doc(db, "users", userId), { status: "chatting", chatId: chatRef.id }, { merge: true });
        await deleteDoc(myQueueRef).catch(() => {});

        unsubQueue();
        unsubMyQueue();
      } catch (e) {
        console.log("Match transaction failed:", e);
      }
    });

    unsubsRef.current.push(unsubQueue, unsubMyQueue);
  };

  const sendMessage = async () => {
    if (!userId || !currentChatId) return;
    const text = input.trim();
    if (!text || isMuted) return;
    if (text.length > 300) return;

    if (containsBadWord(text)) {
      setIsMuted(true);
      setMuteMsg(true);
      setInput("");
      setTimeout(() => { setIsMuted(false); setMuteMsg(false); }, 30000);
      return;
    }

    await addDoc(collection(db, "chats", currentChatId, "messages"), {
      sender: userId, text, time: serverTimestamp(),
    });
    await setDoc(doc(db, "chats", currentChatId), { typing: { [userId]: false } }, { merge: true });
    setInput("");
  };

  const handleTyping = async () => {
    if (!currentChatId || !userId) return;
    clearTimeout(typingTimeout.current);
    await setDoc(doc(db, "chats", currentChatId), { typing: { [userId]: true } }, { merge: true });
    typingTimeout.current = setTimeout(async () => {
      await setDoc(doc(db, "chats", currentChatId), { typing: { [userId]: false } }, { merge: true });
    }, 1200);
  };

  const endChat = async () => {
    if (!currentChatId || !userId) return;
    await setDoc(doc(db, "chats", currentChatId), { ended: true, endedBy: userId }, { merge: true });
  };

  const sendFriendRequest = async () => {
    if (!peerId || !userId) return;
    // Deterministic ID for uniqueness constraint: from_to
    const docId = `${userId}_${peerId}`;
    await setDoc(
      doc(db, "friendRequests", docId),
      {
        from: userId,
        to: peerId,
        status: "pending",
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    setFriendReqSent(true);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user || !userId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-muted-foreground text-center">
        Please log in to start chatting.
      </div>
    );
  }

  // Welcome
  if (screen === "welcome") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Campus Connect</h2>
          <p className="text-muted-foreground text-sm mb-8">A safe way to start conversations on your campus</p>
          <Button onClick={connect} className="rounded-full px-8 py-3 text-base font-semibold bg-primary hover:bg-primary/90">
            Connect
          </Button>
        </motion.div>
      </div>
    );
  }

  // Matching
  if (screen === "matching") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="mx-auto mb-6 h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
          <p className="text-muted-foreground">Finding a campus peer…</p>
        </motion.div>
      </div>
    );
  }

  // Chat
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <span className="text-sm font-medium text-foreground">Campus Peer</span>
        <div className="flex gap-2">
          {peerId && !friendReqSent && (
            <Button variant="ghost" size="icon" onClick={sendFriendRequest} className="h-8 w-8 text-primary">
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
          {friendReqSent && <span className="text-xs text-primary">Request sent</span>}
          <Button variant="ghost" size="icon" onClick={endChat} className="h-8 w-8 text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={
                m.sender === "system"
                  ? "text-center text-xs text-destructive/80 bg-destructive/10 rounded-xl py-1.5 px-3 mx-auto w-fit"
                  : m.sender === userId
                  ? "ml-auto max-w-[75%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3.5 py-2 text-sm"
                  : "mr-auto max-w-[75%] rounded-2xl rounded-bl-md bg-secondary text-secondary-foreground px-3.5 py-2 text-sm"
              }
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {peerTyping && (
          <div className="mr-auto bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5 w-fit flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Mute warning */}
      {muteMsg && (
        <div className="mx-4 mb-1 rounded-xl bg-destructive/10 px-3 py-1.5 text-center text-xs text-destructive">
          Please keep the conversation respectful 🌱 You can send messages again shortly.
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-border/30">
        <Input
          value={input}
          onChange={(e) => { setInput(e.target.value); handleTyping(); }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-secondary/50 border-none rounded-full"
          maxLength={300}
        />
        <Button onClick={sendMessage} size="icon" className="rounded-full bg-primary h-10 w-10 shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ChatScreen;
