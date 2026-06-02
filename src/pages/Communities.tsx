import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, orderBy,
  query, serverTimestamp, setDoc, updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft, Send, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { containsBadWord } from "@/lib/badwords";
import { avatarUrl, displayName } from "@/lib/avatar";

const SEED = [
  { id: "programming", name: "Programming", description: "Daily coding discussions", category: "code", icon: "💻" },
  { id: "dsa", name: "DSA", description: "Data structures & algorithms", category: "code", icon: "🧮" },
  { id: "aws", name: "AWS Cloud", description: "Cloud architecture & certs", category: "cloud", icon: "☁️" },
  { id: "ai", name: "AI & ML", description: "Models, papers, projects", category: "ai", icon: "🤖" },
  { id: "placement", name: "Placement Prep", description: "Interviews, OAs, referrals", category: "career", icon: "💼" },
  { id: "design", name: "Design", description: "UI/UX, Figma & visual design", category: "design", icon: "🎨" },
];

const Communities = () => {
  const { user } = useAuth();
  const uid = user!.uid;
  const [communities, setCommunities] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  // Seed any missing
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "communities"));
      const existing = new Set(snap.docs.map((d) => d.id));
      await Promise.all(
        SEED.filter((s) => !existing.has(s.id)).map((s) =>
          setDoc(doc(db, "communities", s.id), {
            ...s, members: [], createdAt: serverTimestamp(),
          })
        )
      );
    })().catch(console.error);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "communities"));
    return onSnapshot(q, (snap) => {
      setCommunities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    const q = query(collection(db, "communities", active.id, "messages"), orderBy("time"));
    return onSnapshot(q, async (snap) => {
      const msgs = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        let senderName = "Peer";
        try {
          const us = await getDoc(doc(db, "users", data.sender));
          const email = us.data()?.email || "";
          senderName = us.data()?.name || email.split("@")[0] || "Peer";
        } catch {}
        return { id: d.id, ...data, senderName };
      }));
      setMessages(msgs);
    });
  }, [active]);

  const join = (c: any) => updateDoc(doc(db, "communities", c.id), { members: arrayUnion(uid) });
  const leave = (c: any) => updateDoc(doc(db, "communities", c.id), { members: arrayRemove(uid) });
  const send = async () => {
    const text = input.trim();
    if (!text || !active || text.length > 300 || containsBadWord(text)) return;
    await addDoc(collection(db, "communities", active.id, "messages"), {
      sender: uid, text, time: serverTimestamp(),
    });
    setInput("");
  };

  if (active) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 h-full flex flex-col">
        <div className="glass-strong rounded-3xl flex-1 flex flex-col overflow-hidden min-h-[70vh]">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <Button variant="ghost" size="icon" onClick={() => setActive(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="text-2xl">{active.icon}</div>
            <div>
              <p className="font-semibold">{active.name}</p>
              <p className="text-[10px] text-muted-foreground">{active.members?.length || 0} members</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && <p className="text-center text-xs text-muted-foreground py-12">Start the conversation 🚀</p>}
            {messages.map((m: any) => (
              <div key={m.id} className={m.sender === uid ? "ml-auto max-w-[75%]" : "mr-auto max-w-[75%]"}>
                {m.sender !== uid && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <img src={avatarUrl(m.sender)} className="h-4 w-4 rounded-full" alt="" />
                    <p className="text-[10px] text-muted-foreground">{m.senderName}</p>
                  </div>
                )}
                <div className={`rounded-2xl px-3.5 py-2 text-sm ${
                  m.sender === uid ? "rounded-br-md gradient-brand text-white" : "rounded-bl-md bg-secondary"
                }`}>{m.text}</div>
              </div>
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
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <PageHeader title="Study Communities" subtitle="Topic-based hubs for learning together" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {communities.map((c, i) => {
          const joined = c.members?.includes(uid);
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass rounded-2xl p-5 hover:glass-strong transition-all">
              <div className="text-3xl mb-2">{c.icon}</div>
              <h3 className="font-bold text-lg">{c.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <Users className="h-3 w-3" /> {c.members?.length || 0} members
              </p>
              <div className="flex gap-2 mt-4">
                {joined ? (
                  <>
                    <Button size="sm" onClick={() => setActive(c)} className="flex-1 rounded-full gradient-brand text-white border-0">Open</Button>
                    <Button size="sm" variant="ghost" onClick={() => leave(c)} className="text-muted-foreground">Leave</Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => join(c)} className="w-full rounded-full gradient-brand text-white border-0">Join</Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      {communities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Loading communities...</p>
        </div>
      )}
    </div>
  );
};
export default Communities;
