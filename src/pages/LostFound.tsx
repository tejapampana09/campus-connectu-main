import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Plus, Search, Mail, CheckCircle2, Trash2, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import type { LostFoundItem } from "@/types";

const LostFound = () => {
  const { user } = useAuth();
  const uid = user!.uid;
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");

  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const q = query(collection(db, "lostFound"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LostFoundItem)));
    });
  }, []);

  const create = async () => {
    if (!title.trim() || !location.trim()) return;
    await addDoc(collection(db, "lostFound"), {
      type, title: title.trim().slice(0, 80), description: desc.trim().slice(0, 500),
      location: location.trim().slice(0, 80), imageUrl: imageUrl.trim() || null,
      status: "open", ownerId: uid, ownerEmail: user!.email || "",
      createdAt: serverTimestamp(),
    });
    setTitle(""); setDesc(""); setLocation(""); setImageUrl(""); setOpen(false);
  };
  const resolve = (id: string) => updateDoc(doc(db, "lostFound", id), { status: "resolved" });
  const remove = (id: string) => deleteDoc(doc(db, "lostFound", id));

  const filtered = items.filter((i) => filter === "all" || i.type === filter);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <PageHeader title="Lost & Found" subtitle="Recover what's missing on campus"
        action={
          <Button onClick={() => setOpen(!open)} className="rounded-full gradient-brand border-0 text-white">
            {open ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {open ? "Cancel" : "Report"}
          </Button>
        } />

      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex gap-2">
            {(["lost", "found"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                  type === t ? "gradient-brand text-white" : "glass text-muted-foreground"
                }`}>I {t === "lost" ? "lost" : "found"} something</button>
            ))}
          </div>
          <Input placeholder="Item title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <Textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <Input placeholder="Location (e.g. Library)" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <Input placeholder="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <Button onClick={create} className="rounded-full gradient-brand border-0 text-white w-full">Post</Button>
        </motion.div>
      )}

      <div className="flex gap-2 mb-4">
        {(["all", "lost", "found"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize ${
              filter === f ? "gradient-brand text-white" : "glass text-muted-foreground"
            }`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Search className="h-5 w-5" />} title="Nothing reported" body="Help your campus by posting." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it, i) => (
            <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="glass rounded-2xl p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                  it.type === "lost" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
                }`}>{it.type}</span>
                {it.status === "resolved" && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />}
              <h3 className="font-semibold">{it.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.description}</p>
              <p className="text-xs text-muted-foreground mt-2">📍 {it.location}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                <a href={`mailto:${it.ownerEmail}`} className="text-xs text-primary flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Contact
                </a>
                {it.ownerId === uid && (
                  <div className="flex gap-2">
                    {it.status === "open" && (
                      <button onClick={() => resolve(it.id)} className="text-xs text-primary hover:underline">Mark resolved</button>
                    )}
                    <button onClick={() => remove(it.id)} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
export default LostFound;
