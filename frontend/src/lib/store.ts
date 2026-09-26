import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "./format";
import { briefFromText, computeEstimate, type Brief, type Estimate } from "./construction/estimate";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  estimate?: Estimate;
  createdAt: number;
};

export type Project = {
  id: string;
  name: string;
  brief: Brief;
  estimate: Estimate;
  doneTasks: string[];
  notes: string;
  createdAt: number;
};

export type CartLine = { productId: string; qty: number };

export type Booking = {
  id: string;
  expertId: string;
  name: string;
  phone: string;
  city: string;
  message: string;
  createdAt: number;
};

type State = {
  premium: boolean;
  chatRevision: number;
  messages: ChatMessage[];
  project: Project | null;
  cart: CartLine[];
  bookings: Booking[];
  setPremium: (v: boolean) => void;
  addMessage: (m: Omit<ChatMessage, "id" | "createdAt">) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearChat: () => void;
  upsertProjectFromBrief: (brief: Brief, name?: string) => Project;
  toggleTask: (taskKey: string) => void;
  setNotes: (notes: string) => void;
  addToCart: (productId: string, qty?: number) => void;
  setCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  addBooking: (b: Omit<Booking, "id" | "createdAt">) => void;
  loadMaterialsIntoCart: (estimate: Estimate) => void;
};

const seedBrief = briefFromText("Nataka kujenga nyumba ya vyumba 3 Dodoma");

if (typeof window !== "undefined") {
  window.localStorage.removeItem("jengaai-v1");
}

export const useJenga = create<State>()(
  persist(
    (set, get) => ({
      premium: false,
      chatRevision: 0,
      messages: [],
      project: null,
      cart: [],
      bookings: [],
      setPremium: (v) => set({ premium: v }),
      addMessage: (m) =>
        set({
          messages: [
            ...get().messages,
            { ...m, id: uid("msg"), createdAt: Date.now() },
          ].slice(-40),
        }),
      setMessages: (messages) => set({ messages: messages.slice(-200) }),
      clearChat: () => set((state) => ({ messages: [], project: null, chatRevision: (state.chatRevision ?? 0) + 1 })),
      upsertProjectFromBrief: (brief, name) => {
        const estimate = computeEstimate(brief);
        const existing = get().project;
        const project: Project = {
          id: existing?.id ?? uid("prj"),
          name: name ?? existing?.name ?? `Nyumba · ${brief.region}`,
          brief,
          estimate,
          doneTasks: existing?.doneTasks ?? [],
          notes: existing?.notes ?? "",
          createdAt: existing?.createdAt ?? Date.now(),
        };
        set({ project });
        return project;
      },
      toggleTask: (taskKey) => {
        const p = get().project;
        if (!p) return;
        const done = p.doneTasks.includes(taskKey)
          ? p.doneTasks.filter((t) => t !== taskKey)
          : [...p.doneTasks, taskKey];
        set({ project: { ...p, doneTasks: done } });
      },
      setNotes: (notes) => {
        const p = get().project;
        if (!p) return;
        set({ project: { ...p, notes } });
      },
      addToCart: (productId, qty = 1) => {
        const cart = [...get().cart];
        const i = cart.findIndex((c) => c.productId === productId);
        if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + qty };
        else cart.push({ productId, qty });
        set({ cart });
      },
      setCartQty: (productId, qty) => {
        if (qty <= 0) set({ cart: get().cart.filter((c) => c.productId !== productId) });
        else
          set({
            cart: get().cart.map((c) => (c.productId === productId ? { ...c, qty } : c)),
          });
      },
      clearCart: () => set({ cart: [] }),
      addBooking: (b) =>
        set({
          bookings: [{ ...b, id: uid("bk"), createdAt: Date.now() }, ...get().bookings],
        }),
      loadMaterialsIntoCart: (estimate) => {
        const map: Record<string, string> = {
          cement: "cement-simba",
          rebar: "rebar-12",
          sand: "sand",
          agg: "aggregate",
          sheets: "sheet-28",
          blocks: "block-6",
          paint: "paint-goldstar",
        };
        const cart: CartLine[] = [];
        for (const m of estimate.materials) {
          const id = map[m.key];
          if (!id) continue;
          const qty =
            m.key === "paint" ? Math.ceil(m.qty / 20) : Math.max(1, Math.round(m.qty));
          cart.push({ productId: id, qty });
        }
        set({ cart });
      },
    }),
    {
      name: "jengaai-v2",
      partialize: (state) => {
        const { messages: _messages, chatRevision: _chatRevision, ...savedState } = state;
        return savedState;
      },
    },
  ),
);

export { seedBrief };
