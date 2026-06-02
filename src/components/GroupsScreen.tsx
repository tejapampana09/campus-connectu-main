import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, doc, getDoc, getDocs, onSnapshot,
  query, where, orderBy, serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, ArrowLeft, UserPlus } from "lucide-react";
import { containsBadWord } from "@/lib/badwords";

interface Group {
  id: string;
  name: string;
  members: string[];
}

interface Msg {
  id: string;
  sender: string;
  senderEmail?: string;
  text: string;
}

interface Friend {
  id: string;
  friendId: string;
  email: string;
}

const GroupsScreen = () => {
  const { user } = useAuth();
  const userId = user!.uid;

  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);

  // Load groups
  useEffect(() => {
    const q = query(collection(db, "groups"), where("members", "array-contains", userId));
    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)));
    });
    return () => unsub();
  }, [userId]);

  // Load friends for invite
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

  const createGroup = async () => {
    const name = newName.trim();
    if (!name) return;
    await addDoc(collection(db, "groups"), {
      name,
      members: [userId],
      createdBy: userId,
      createdAt: serverTimestamp(),
    });
    setNewName("");
    setShowCreate(false);
  };

  const openGroup = (g: Group) => {
    setActiveGroup(g);
    setMessages([]);
    setShowInvite(false);
  };

  // Listen to group messages
  useEffect(() => {
    if (!activeGroup) return;
    const q = query(collection(db, "groups", activeGroup.id, "messages"), orderBy("time"));
    const unsub = onSnapshot(q, async (snap) => {
      const msgs: Msg[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        let senderEmail = "Peer";
        try {
          const uDoc = await getDoc(doc(db, "users", data.sender));
          senderEmail = uDoc.data()?.email?.split("@")[0] || "Peer";
        } catch {}
        msgs.push({ id: d.id, sender: data.sender, senderEmail, text: data.text });
      }
      setMessages(msgs);
    });
    return () => unsub();
  }, [activeGroup]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activeGroup) return;
    if (text.length > 300) return;
    if (containsBadWord(text)) return;
    await addDoc(collection(db, "groups", activeGroup.id, "messages"), {
      sender: userId, text, time: serverTimestamp(),
    });
    setInput("");
  };

  const inviteFriend = async (friendId: string) => {
    if (!activeGroup) return;
    const groupRef = doc(db, "groups", activeGroup.id);
    await import("firebase/firestore").then(({ updateDoc, arrayUnion }) => {
      return updateDoc(groupRef, { members: arrayUnion(friendId) });
    });
  };

  // Group chat view
  if (activeGroup) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col max-w-md mx-auto w-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <Button variant="ghost" size="sm" onClick={() => setActiveGroup(null)} className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground flex-1">{activeGroup.name}</span>
          <Button variant="ghost" size="icon" onClick={() => setShowInvite(!showInvite)} className="h-8 w-8 text-primary">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>

        {showInvite && (
          <div className="p-3 border-b border-border/30 space-y-2">
            <p className="text-xs text-muted-foreground">Invite a friend:</p>
            {friends.filter((f) => !activeGroup.members.includes(f.friendId)).map((f) => (
              <div key={f.id} className="flex items-center justify-between glass rounded-lg p-2">
                <span className="text-xs text-foreground">{f.email}</span>
                <Button size="sm" variant="ghost" onClick={() => inviteFriend(f.friendId)} className="text-primary text-xs h-7">
                  Invite
                </Button>
              </div>
            ))}
            {friends.filter((f) => !activeGroup.members.includes(f.friendId)).length === 0 && (
              <p className="text-xs text-muted-foreground">No friends to invite</p>
            )}
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id}>
                {m.sender !== userId && (
                  <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{m.senderEmail}</p>
                )}
                <div
                  className={
                    m.sender === userId
                      ? "ml-auto max-w-[75%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3.5 py-2 text-sm"
                      : "mr-auto max-w-[75%] rounded-2xl rounded-bl-md bg-secondary text-secondary-foreground px-3.5 py-2 text-sm"
                  }
                >
                  {m.text}
                </div>
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Groups</h2>
        <Button size="sm" variant="ghost" onClick={() => setShowCreate(!showCreate)} className="text-primary">
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4">
            <div className="glass rounded-xl p-3 flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Group name"
                className="flex-1 bg-secondary/50 border-none rounded-full"
                onKeyDown={(e) => e.key === "Enter" && createGroup()}
              />
              <Button onClick={createGroup} size="sm" className="rounded-full bg-primary">
                Create
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {groups.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">No groups yet. Create one to get started!</p>
          )}
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => openGroup(g)}
              className="glass rounded-xl p-3 w-full text-left hover:bg-secondary/30 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{g.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{g.members.length} members</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default GroupsScreen;
