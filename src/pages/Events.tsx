import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Plus, Calendar, MapPin, Users, Trash2, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import type { EventItem } from "@/types";

const CATS: EventItem["category"][] = ["workshop", "hackathon", "club", "other"];

const Events = () => {
  const { user } = useAuth();
  const uid = user!.uid;
  const [events, setEvents] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | EventItem["category"]>("all");

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<EventItem["category"]>("workshop");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, registered: [], ...d.data() } as EventItem)));
    });
  }, []);

  const create = async () => {
    if (!title.trim() || !date) return;
    await addDoc(collection(db, "events"), {
      title: title.trim().slice(0, 80), description: desc.trim().slice(0, 500),
      category: cat, date, location: location.trim().slice(0, 80) || "TBA",
      hostId: uid, hostEmail: user!.email || "", registered: [],
      createdAt: serverTimestamp(),
    });
    setTitle(""); setDesc(""); setDate(""); setLocation(""); setOpen(false);
  };
  const toggleRegister = (ev: EventItem) => {
    const ref = doc(db, "events", ev.id);
    const isReg = ev.registered?.includes(uid);
    return updateDoc(ref, { registered: isReg ? arrayRemove(uid) : arrayUnion(uid) });
  };
  const remove = (id: string) => deleteDoc(doc(db, "events", id));

  const filtered = events.filter((e) => filter === "all" || e.category === filter);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <PageHeader title="Events Hub" subtitle="Workshops, hackathons & club activities"
        action={
          <Button onClick={() => setOpen(!open)} className="rounded-full gradient-brand border-0 text-white">
            {open ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {open ? "Cancel" : "Host event"}
          </Button>
        } />

      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-4 mb-6 space-y-3">
          <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <Textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-secondary/40 border-border/50 rounded-xl" />
            <select value={cat} onChange={(e) => setCat(e.target.value as any)}
              className="h-10 rounded-xl bg-secondary/40 border border-border/50 px-3 text-sm">
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <Button onClick={create} className="rounded-full gradient-brand border-0 text-white w-full">Publish event</Button>
        </motion.div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", ...CATS] as const).map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
              filter === c ? "gradient-brand text-white" : "glass text-muted-foreground"
            }`}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Calendar className="h-5 w-5" />} title="No events yet" body="Be the first to host." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ev, i) => {
            const isReg = ev.registered?.includes(uid);
            const when = ev.date ? new Date(ev.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "TBA";
            return (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="glass rounded-2xl p-5 hover:glass-strong transition-all">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full gradient-brand text-white">
                  {ev.category}
                </span>
                <h3 className="font-bold text-lg mt-3">{ev.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
                <div className="space-y-1 mt-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {when}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {ev.location}</p>
                  <p className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {ev.registered?.length || 0} registered</p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                  <Button size="sm" onClick={() => toggleRegister(ev)}
                    className={`rounded-full text-xs ${isReg ? "bg-secondary text-foreground" : "gradient-brand text-white border-0"}`}>
                    {isReg ? "Registered ✓" : "Register"}
                  </Button>
                  {ev.hostId === uid && (
                    <button onClick={() => remove(ev.id)} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default Events;
