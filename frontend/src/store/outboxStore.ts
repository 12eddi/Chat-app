import { create } from "zustand";

export type OutboxStatus = "queued" | "sending" | "failed";

export type OutboxItem = {
  clientId: string;
  chatId: string;
  content: string;
  image?: File | null;
  scheduledFor?: string | null;
  createdAt: number;
  status: OutboxStatus;
  error?: string | null;
  uploadProgress?: number | null;
};

type OutboxState = {
  items: OutboxItem[];
  add: (item: OutboxItem) => void;
  update: (clientId: string, patch: Partial<OutboxItem>) => void;
  remove: (clientId: string) => void;
  getForChat: (chatId: string) => OutboxItem[];
};

export const useOutboxStore = create<OutboxState>((set, get) => ({
  items: [],
  add: (item) => set((state) => ({ items: [...state.items, item] })),
  update: (clientId, patch) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.clientId === clientId ? { ...item, ...patch } : item
      ),
    })),
  remove: (clientId) =>
    set((state) => ({
      items: state.items.filter((item) => item.clientId !== clientId),
    })),
  getForChat: (chatId) => get().items.filter((item) => item.chatId === chatId),
}));

