import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Plus, ShoppingBag, Trash2, MessageSquare, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { MarketplaceSkeleton } from "@/components/skeletons/MarketplaceSkeleton";
import { validateMarketplaceItem } from "@/lib/validators";
import { checkContent } from "@/services/moderation";
import { formatErrorMessage, logError } from "@/lib/errorHandler";
import { toast } from "@/hooks/use-toast";
import type { MarketplaceItem } from "@/types";

const CATEGORIES: MarketplaceItem["category"][] = ["books", "notes", "electronics", "cycles", "other"];

const Marketplace = () => {
  const { user } = useAuth();
  const uid = user!.uid;
  const initialLoadRef = useRef(true);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | MarketplaceItem["category"]>("all");
  const [search, setSearch] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [cat, setCat] = useState<MarketplaceItem["category"]>("books");
  const [imageUrl, setImageUrl] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "marketplace"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      try {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceItem)));
        setInitialLoading(false);
      } catch (e) {
        logError("Marketplace.onSnapshot", e);
        setInitialLoading(false);
      }
    });
  }, []);

  const create = async () => {
    const validation = validateMarketplaceItem({ title, description: desc, price });
    if (!validation.valid) {
      toast({ title: "Validation error", description: validation.error, variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const moderation = await checkContent(title + " " + desc);
      if (!moderation.safe) {
        toast({ title: "Content blocked", description: moderation.reason || "Contains prohibited content", variant: "destructive" });
        return;
      }

      await addDoc(collection(db, "marketplace"), {
        title: title.trim().slice(0, 80),
        description: desc.trim().slice(0, 500),
        price: Number(price),
        category: cat,
        imageUrl: imageUrl.trim() || null,
        sellerId: uid,
        sellerEmail: user!.email || "",
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setDesc("");
      setPrice("");
      setImageUrl("");
      setOpen(false);
      toast({ title: "Listing posted!" });
    } catch (error) {
      logError("Marketplace.create", error);
      toast({ title: "Error", description: formatErrorMessage(error), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, "marketplace", id));
      toast({ title: "Listing deleted" });
    } catch (error) {
      logError("Marketplace.delete", error);
      toast({ title: "Error", description: formatErrorMessage(error), variant: "destructive" });
    }
  };

  const filtered = items
    .filter((i) => filter === "all" || i.category === filter)
    .filter((i) => !search || i.title.toLowerCase().includes(search.toLowerCase()));

  const refresh = async () => {
    setRefreshing(true);
    try {
      const q = query(collection(db, "marketplace"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceItem)));
    } catch (e) {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  const openChatWith = async (peerId: string) => {
    if (!uid || !peerId) return;
    const ids = [uid, peerId].sort();
    const chatId = `direct_${ids[0]}_${ids[1]}`;
    const chatRef = doc(db, "chats", chatId);
    try {
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        await setDoc(chatRef, {
          users: [uid, peerId],
          typing: { [uid]: false, [peerId]: false },
          createdAt: serverTimestamp(),
          ended: false,
        });
      }
      await setDoc(doc(db, "users", uid), { status: "chatting", chatId }, { merge: true });
      navigate("/connect");
    } catch (e) {
      // ignore
    }
  };

  if (initialLoading && initialLoadRef.current) {
    return <MarketplaceSkeleton />;
  }

  initialLoadRef.current = false;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <PageHeader title="Campus Marketplace" subtitle="Buy & sell within SRM AP"
        action={
          <Button onClick={() => setOpen(!open)} className="rounded-full gradient-brand border-0 text-white">
            {open ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {open ? "Cancel" : "Sell"}
          </Button>
        } />

      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-4 mb-6 space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <Textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Price (₹)" value={price} onChange={(e) => setPrice(e.target.value)}
              className="bg-secondary/40 border-border/50 rounded-xl" />
            <select value={cat} onChange={(e) => setCat(e.target.value as any)}
              className="h-10 rounded-xl bg-secondary/40 border border-border/50 px-3 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input placeholder="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            className="bg-secondary/40 border-border/50 rounded-xl" />
          <Button onClick={create} disabled={creating} className="rounded-full gradient-brand border-0 text-white w-full">
            {creating ? "Posting..." : "Post listing"}
          </Button>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Input placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-secondary/40 border-border/50 rounded-full" />
        <div className="flex gap-1.5 flex-wrap">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === c ? "gradient-brand text-white" : "glass text-muted-foreground hover:text-foreground"
              }`}>{c}</button>
          ))}
        </div>
        <Button onClick={refresh} disabled={refreshing} className="ml-2 rounded-full glass text-sm">
          <RefreshCw className="h-4 w-4 mr-1" /> {refreshing ? "Refreshing..." : "Reload"}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-5 w-5" />} title="No listings yet"
          body="Be the first to sell something." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it, i) => (
            <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="glass rounded-2xl overflow-hidden hover:glass-strong transition-all">
              {it.imageUrl ? (
                <img src={it.imageUrl} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 gradient-brand opacity-60 flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-white" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{it.title}</h3>
                  <span className="text-primary font-bold whitespace-nowrap">₹{it.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.description}</p>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">{it.category}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  <button onClick={() => openChatWith(it.sellerId)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <MessageSquare className="h-3 w-3" /> Chat
                  </button>
                  {it.sellerId === uid && (
                    <button onClick={() => remove(it.id)} className="text-destructive hover:opacity-80">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Marketplace;
