import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { containsBadWord } from "@/lib/badwords";
import {
  collection, addDoc, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
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
  const { user } = useAuth();
  const userId = user!.uid;

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
    setDoc(
      doc(db, "users", userId),
      { email: user!.email || null, status: "idle", chatId: null, lastSeen: serverTimestamp() },
      { merge: true }
    );
    const hb = setInterval(() => {
      updateDoc(doc(db, "users", userId), { lastSeen: serverTimestamp() }).catch(() => {});
    }, 15000);
    return () => clearInterval(hb);
  }, [userId]);

  // Listen for chat assignment
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", userId), (snap) => {
      const d = snap.data();
      if (d?.chatId && d.status === "chatting" && !currentChatId) {
        setCurrentChatId(d.chatId);
        setScreen("chat");
      }
    });
    return () => unsub();
  }, [userId, currentChatId]);

  // Listen to chat messages & typing
  useEffect(() => {
    if (!currentChatId) return;

    const msgUnsub = onSnapshot(
      query(collection(db, "chats", currentChatId, "messages"), orderBy("time")),
      (snap) => {
        snap.docChanges().forEach((c) => {
          if (c.type === "added") {
            const d = c.doc.data();
            setMessages((prev) => [...prev, { id: c.doc.id, sender: d.sender, text: d.text }]);
          }
        });
      }
    );

    const chatUnsub = onSnapshot(doc(db, "chats", currentChatId), async (snap) => {
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
          setMessages((prev) => [...prev, { id: "end", sender: "system", text: "Peer has left the chat" }]);
        }
        await updateDoc(doc(db, "users", userId), { status: "idle", chatId: null });
        setTimeout(() => cleanup(), 1500);
      }
    });

    unsubsRef.current = [msgUnsub, chatUnsub];
    return () => { msgUnsub(); chatUnsub(); };
  }, [currentChatId, userId]);

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
    setScreen("matching");
    // Clear old queue entries
    const old = await getDocs(collection(db, "queue"));
    for (const d of old.docs) {
      if (d.data().userId === userId) await deleteDoc(d.ref);
    }
    await updateDoc(doc(db, "users", userId), { status: "waiting" });
    await addDoc(collection(db, "queue"), { userId, joinedAt: serverTimestamp() });
    findMatch();
  };

  const findMatch = () => {
    const q = query(collection(db, "queue"), orderBy("joinedAt"));
    const unsub = onSnapshot(q, async (snapshot) => {
      const now = Date.now();
      const valid: { uid: string; ref: any }[] = [];

      for (const d of snapshot.docs) {
        const uid = d.data().userId;
        if (!uid) continue;
        try {
          const usnap = await getDoc(doc(db, "users", uid));
          const u = usnap.data();
          if (!u || u.status !== "waiting") { await deleteDoc(d.ref); continue; }
          const last = u.lastSeen?.toMillis?.() || now;
          if (now - last > 45000) { await deleteDoc(d.ref); continue; }
          valid.push({ uid, ref: d.ref });
        } catch {}
      }

      if (valid.length < 2) return;
      const [first, second] = valid;
      if (first.uid !== userId) return;

      try {
        const chatRef = await addDoc(collection(db, "chats"), {
          users: [first.uid, second.uid],
          typing: { [first.uid]: false, [second.uid]: false },
          createdAt: serverTimestamp(),
          ended: false,
        });
        await updateDoc(doc(db, "users", first.uid), { status: "chatting", chatId: chatRef.id });
        await updateDoc(doc(db, "users", second.uid), { status: "chatting", chatId: chatRef.id });
        await deleteDoc(first.ref);
        await deleteDoc(second.ref);
        unsub();
      } catch (e) {
        console.log("match error", e);
      }
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isMuted || !currentChatId) return;
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
    await updateDoc(doc(db, "chats", currentChatId), { [`typing.${userId}`]: false });
    setInput("");
  };

  const handleTyping = async () => {
    if (!currentChatId) return;
    clearTimeout(typingTimeout.current);
    await updateDoc(doc(db, "chats", currentChatId), { [`typing.${userId}`]: true });
    typingTimeout.current = setTimeout(async () => {
      await updateDoc(doc(db, "chats", currentChatId!), { [`typing.${userId}`]: false });
    }, 1200);
  };

  const endChat = async () => {
    if (!currentChatId) return;
    await updateDoc(doc(db, "chats", currentChatId), { ended: true, endedBy: userId });
  };

  const sendFriendRequest = async () => {
    if (!peerId) return;
    await addDoc(collection(db, "friendRequests"), {
      from: userId, to: peerId, status: "pending", createdAt: serverTimestamp(),
    });
    setFriendReqSent(true);
  };

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
