import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, MessageCircle, Send } from "lucide-react";
import { containsBadWord } from "@/lib/badwords";

interface FriendRequest {
  id: string;
  from: string;
  fromEmail?: string;
}

interface Friend {
  id: string;
  friendId: string;
  email: string;
}

interface Msg {
  id: string;
  sender: string;
  text: string;
}

const FriendsScreen = () => {
  const { user } = useAuth();
  const userId = user!.uid;

  const [tab, setTab] = useState<"requests" | "friends">("friends");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [chatFriendId, setChatFriendId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");

  // Load friend requests
  useEffect(() => {
    const q = query(collection(db, "friendRequests"), where("to", "==", userId), where("status", "==", "pending"));
    const unsub = onSnapshot(q, async (snap) => {
      const reqs: FriendRequest[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        let fromEmail = "Anonymous";
        try {
          const uDoc = await getDoc(doc(db, "users", data.from));
          fromEmail = uDoc.data()?.email || "Campus peer";
        } catch {}
        reqs.push({ id: d.id, from: data.from, fromEmail });
      }
      setRequests(reqs);
    });
    return () => unsub();
  }, [userId]);

  // Load friends
  useEffect(() => {
    const q = query(collection(db, "friends"), where("users", "array-contains", userId));
    const unsub = onSnapshot(q, async (snap) => {
      const frs: Friend[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        const friendId = data.users.find((u: string) => u !== userId);
        let email = "Campus peer";
        try {
          const uDoc = await getDoc(doc(db, "users", friendId));
          email = uDoc.data()?.email || "Campus peer";
        } catch {}
        frs.push({ id: d.id, friendId, email });
      }
      setFriends(frs);
    });
    return () => unsub();
  }, [userId]);

  const acceptRequest = async (req: FriendRequest) => {
    await addDoc(collection(db, "friends"), {
      users: [userId, req.from],
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "friendRequests", req.id), { status: "accepted" });
  };

  const declineRequest = async (req: FriendRequest) => {
    await deleteDoc(doc(db, "friendRequests", req.id));
  };

  // Open private chat
  const openChat = async (friendId: string) => {
    setChatFriendId(friendId);
    setMessages([]);
    // Find or create private chat
    const q = query(collection(db, "privateChats"), where("users", "array-contains", userId));
    const snap = await getDocs(q);
    let existingChatId: string | null = null;
    for (const d of snap.docs) {
      const data = d.data();
      if (data.users.includes(friendId)) {
        existingChatId = d.id;
        break;
      }
    }
    if (!existingChatId) {
      const ref = await addDoc(collection(db, "privateChats"), {
        users: [userId, friendId],
        createdAt: serverTimestamp(),
      });
      existingChatId = ref.id;
    }
    setChatId(existingChatId);
  };

  // Listen to private chat messages
  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "privateChats", chatId, "messages"), orderBy("time"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs: Msg[] = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        msgs.push({ id: d.id, sender: data.sender, text: data.text });
      });
      setMessages(msgs);
    });
    return () => unsub();
  }, [chatId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !chatId) return;
    if (text.length > 300) return;
    if (containsBadWord(text)) return;
    await addDoc(collection(db, "privateChats", chatId, "messages"), {
      sender: userId, text, time: serverTimestamp(),
    });
    setInput("");
  };

  // Private chat view
  if (chatFriendId && chatId) {
    const friend = friends.find((f) => f.friendId === chatFriendId);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col max-w-md mx-auto w-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <Button variant="ghost" size="sm" onClick={() => { setChatFriendId(null); setChatId(null); }} className="text-muted-foreground">
            ←
          </Button>
          <span className="text-sm font-medium text-foreground">{friend?.email || "Friend"}</span>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.sender === userId
                    ? "ml-auto max-w-[75%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3.5 py-2 text-sm"
                    : "mr-auto max-w-[75%] rounded-2xl rounded-bl-md bg-secondary text-secondary-foreground px-3.5 py-2 text-sm"
                }
              >
                {m.text}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-3 border-t border-border/30">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
  }

  return (
    <div className="flex flex-1 flex-col max-w-md mx-auto w-full p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={tab === "friends" ? "default" : "secondary"}
          size="sm"
          onClick={() => setTab("friends")}
          className="rounded-full flex-1"
        >
          Friends
        </Button>
        <Button
          variant={tab === "requests" ? "default" : "secondary"}
          size="sm"
          onClick={() => setTab("requests")}
          className="rounded-full flex-1 relative"
        >
          Requests
          {requests.length > 0 && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {requests.length}
            </span>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          {tab === "requests" ? (
            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {requests.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-12">No pending requests</p>
              )}
              {requests.map((r) => (
                <div key={r.id} className="glass rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-foreground">{r.fromEmail}</span>
                  <div className="flex gap-1.5">
                    <Button size="icon" variant="ghost" onClick={() => acceptRequest(r)} className="h-8 w-8 text-primary">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => declineRequest(r)} className="h-8 w-8 text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {friends.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-12">No friends yet. Connect anonymously and send a friend request!</p>
              )}
              {friends.map((f) => (
                <div key={f.id} className="glass rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-foreground">{f.email}</span>
                  <Button size="icon" variant="ghost" onClick={() => openChat(f.friendId)} className="h-8 w-8 text-primary">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};

export default FriendsScreen;
