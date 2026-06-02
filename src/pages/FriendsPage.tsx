import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  addDoc, collection, doc, getDoc, onSnapshot, query, where,
  serverTimestamp, updateDoc, deleteDoc, getDocs, orderBy,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, MessageCircle, Send, Search, ArrowLeft, UserPlus, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { avatarUrl, displayName } from "@/lib/avatar";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { searchStudents } from "@/services/profiles";
import { checkContent } from "@/services/moderation";
import { validateMessage } from "@/lib/validators";
import { formatErrorMessage, logError } from "@/lib/errorHandler";
import { toast } from "@/hooks/use-toast";
import { FriendsSkeleton } from "@/components/skeletons/FriendsSkeleton";
import type { UserProfile } from "@/types";

type Tab = "friends" | "requests" | "search";

const FriendsPage = () => {
  const { user } = useAuth();
  const uid = user!.uid;
  const initialLoadRef = useRef(true);
  const [tab, setTab] = useState<Tab>("friends");
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [chatFriend, setChatFriend] = useState<any | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Requests
  useEffect(() => {
    const q = query(collection(db, "friendRequests"), where("to", "==", uid), where("status", "==", "pending"));
    return onSnapshot(q, async (snap) => {
      try {
        const reqs = await Promise.all(snap.docs.map(async (d) => {
          const data = d.data();
          let email = "Peer", name: string | undefined;
          try {
            const u = await getDoc(doc(db, "users", data.from));
            email = u.data()?.email || "Peer";
            name = u.data()?.name;
          } catch (e) {
            logError("FriendsPage.getRequest", e);
          }
          return { id: d.id, from: data.from, email, name };
        }));
        setRequests(reqs);
        setInitialLoading(false);
      } catch (e) {
        logError("FriendsPage.onRequestsSnapshot", e);
        setInitialLoading(false);
      }
    });
  }, [uid]);

  // Friends
  useEffect(() => {
    const q = query(collection(db, "friends"), where("users", "array-contains", uid));
    return onSnapshot(q, async (snap) => {
      try {
        const frs = await Promise.all(snap.docs.map(async (d) => {
          const data = d.data();
          const friendId = data.users.find((u: string) => u !== uid);
          let email = "Peer", name: string | undefined;
          try {
            const u = await getDoc(doc(db, "users", friendId));
            email = u.data()?.email || "Peer";
            name = u.data()?.name;
          } catch (e) {
            logError("FriendsPage.getFriend", e);
          }
          return { id: d.id, friendId, email, name };
        }));
        setFriends(frs);
        setInitialLoading(false);
      } catch (e) {
        logError("FriendsPage.onFriendsSnapshot", e);
        setInitialLoading(false);
      }
    });
  }, [uid]);

  const accept = async (r: any) => {
    try {
      await addDoc(collection(db, "friends"), { users: [uid, r.from], createdAt: serverTimestamp() });
      await updateDoc(doc(db, "friendRequests", r.id), { status: "accepted" });
      toast({ title: "Friend added!" });
    } catch (error) {
      logError("FriendsPage.accept", error);
      toast({ title: "Error", description: formatErrorMessage(error), variant: "destructive" });
    }
  };

  const decline = async (r: any) => {
    try {
      await deleteDoc(doc(db, "friendRequests", r.id));
      toast({ title: "Request declined" });
    } catch (error) {
      logError("FriendsPage.decline", error);
      toast({ title: "Error", description: formatErrorMessage(error), variant: "destructive" });
    }
  };

  const sendFriendRequest = async (toId: string) => {
    try {
      await addDoc(collection(db, "friendRequests"), {
        from: uid, to: toId, status: "pending", createdAt: serverTimestamp(),
      });
      toast({ title: "Friend request sent" });
    } catch (error) {
      logError("FriendsPage.sendFriendRequest", error);
      toast({ title: "Error", description: formatErrorMessage(error), variant: "destructive" });
    }
  };

  const doSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchStudents(searchTerm, uid));
    } catch (error) {
      logError("FriendsPage.doSearch", error);
      toast({ title: "Search failed", description: formatErrorMessage(error), variant: "destructive" });
    } finally { setSearching(false); }
  };

  const openChat = async (friend: any) => {
    setChatFriend(friend);
    setMessages([]);
    try {
      const snap = await getDocs(query(collection(db, "privateChats"), where("users", "array-contains", uid)));
      let id: string | null = null;
      for (const d of snap.docs) {
        if (d.data().users.includes(friend.friendId)) { id = d.id; break; }
      }
      if (!id) {
        const ref = await addDoc(collection(db, "privateChats"), { users: [uid, friend.friendId], createdAt: serverTimestamp() });
        id = ref.id;
      }
      setChatId(id);
    } catch (error) {
      logError("FriendsPage.openChat", error);
      toast({ title: "Error", description: formatErrorMessage(error), variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "privateChats", chatId, "messages"), orderBy("time"));
    return onSnapshot(q, (snap) => {
      try {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        logError("FriendsPage.onMessagesSnapshot", e);
      }
    });
  }, [chatId]);

  const send = async () => {
    const validation = validateMessage(input);
    if (!validation.valid) {
      toast({ title: "Invalid message", description: validation.error, variant: "destructive" });
      return;
    }

    if (!chatId) return;

    try {
      const moderation = await checkContent(input);
      if (!moderation.safe) {
        toast({ title: "Message blocked", description: moderation.reason || "Contains prohibited content", variant: "destructive" });
        return;
      }

      await addDoc(collection(db, "privateChats", chatId, "messages"), {
        sender: uid, text: input.trim(), time: serverTimestamp(),
      });
      setInput("");
    } catch (error) {
      logError("FriendsPage.send", error);
      toast({ title: "Failed to send", description: formatErrorMessage(error), variant: "destructive" });
    }
  };

  if (initialLoading && initialLoadRef.current) {
    return <FriendsSkeleton />;
  }

  initialLoadRef.current = false;

  // Chat view
  if (chatFriend && chatId) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 h-full flex flex-col">
        <div className="glass-strong rounded-3xl flex-1 flex flex-col overflow-hidden min-h-[70vh]">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <Button variant="ghost" size="icon" onClick={() => { setChatFriend(null); setChatId(null); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={avatarUrl(chatFriend.friendId)} className="h-9 w-9 rounded-full bg-secondary" alt="" />
            <div>
              <p className="text-sm font-semibold">{displayName(chatFriend.email, chatFriend.name)}</p>
              <p className="text-[10px] text-muted-foreground">{chatFriend.email}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && <p className="text-center text-xs text-muted-foreground py-12">Say hi 👋</p>}
            {messages.map((m: any) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={m.sender === uid
                  ? "ml-auto max-w-[75%] rounded-2xl rounded-br-md gradient-brand text-white px-3.5 py-2 text-sm"
                  : "mr-auto max-w-[75%] rounded-2xl rounded-bl-md bg-secondary text-secondary-foreground px-3.5 py-2 text-sm"}>
                {m.text}
              </motion.div>
            ))}
          </div>
          <div className="flex gap-2 p-3 border-t border-border/30">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message..." maxLength={300}
              className="flex-1 bg-secondary/40 border-none rounded-full" />
            <Button onClick={send} size="icon" className="rounded-full gradient-brand text-white border-0 h-10 w-10 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <PageHeader title="Friends" subtitle="Your campus network" />

      <div className="flex gap-2 mb-5">
        {(["friends", "requests", "search"] as Tab[]).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "secondary"}
            onClick={() => setTab(t)}
            className={`rounded-full flex-1 md:flex-none md:px-6 ${tab === t ? "gradient-brand border-0 text-white" : ""}`}>
            {t === "friends" && `Friends (${friends.length})`}
            {t === "requests" && `Requests${requests.length ? ` (${requests.length})` : ""}`}
            {t === "search" && "Search"}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "friends" && (
          <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {friends.length === 0 ? (
              <EmptyState icon={<Users className="h-5 w-5" />} title="No friends yet"
                body="Connect anonymously and send a friend request, or search for students." />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {friends.map((f) => (
                  <div key={f.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                    <img src={avatarUrl(f.friendId)} className="h-11 w-11 rounded-full bg-secondary" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{displayName(f.email, f.name)}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => openChat(f)} className="text-primary">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "requests" && (
          <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {requests.length === 0 ? (
              <EmptyState icon={<UserPlus className="h-5 w-5" />} title="No pending requests" />
            ) : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                    <img src={avatarUrl(r.from)} className="h-10 w-10 rounded-full bg-secondary" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{displayName(r.email, r.name)}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => accept(r)} className="text-primary">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => decline(r)} className="text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "search" && (
          <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-2 mb-4">
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Search by name, email or branch..."
                className="bg-secondary/40 rounded-full border-border/50" />
              <Button onClick={doSearch} className="rounded-full gradient-brand border-0 text-white">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {searching && <p className="text-center text-sm text-muted-foreground">Searching...</p>}
            {!searching && results.length === 0 && (
              <EmptyState icon={<Search className="h-5 w-5" />} title="Search the campus"
                body="Find students by name, email or branch." />
            )}
            <div className="space-y-2">
              {results.map((p) => (
                <div key={p.uid} className="glass rounded-2xl p-3 flex items-center gap-3">
                  <img src={avatarUrl(p.avatarSeed || p.uid)} className="h-10 w-10 rounded-full bg-secondary" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{displayName(p.email, p.name)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.branch || ""}{p.branch && p.year ? " · " : ""}{p.year || ""}{!p.branch && !p.year ? p.email : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => sendFriendRequest(p.uid)} className="text-primary">
                    <UserPlus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendsPage;

