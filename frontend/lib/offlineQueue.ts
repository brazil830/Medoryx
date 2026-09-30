/**
 * IndexedDB Offline Mutation Queue for MedOryx-India.
 * Complies with Part J8 and Part AN.
 * Persists stock mutations during offline operations and synchronizes on reconnection.
 */

import { api } from "./api";

const DB_NAME = "MedOryxOfflineDB";
const STORE_NAME = "mutation_queue";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "mutation_id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface QueuedMutation {
  mutation_id: string;
  timestamp: string;
  entity_type: string;
  payload: {
    drug_id: string;
    batch_number: string;
    action_type: string;
    quantity: number;
    recipient_category: string;
  };
  vector_clock: number;
}

export const offlineQueue = {
  async enqueue(mutation: QueuedMutation): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(mutation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getAll(): Promise<QueuedMutation[]> {
    if (typeof window === "undefined") return [];
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  },

  async count(): Promise<number> {
    if (typeof window === "undefined") return 0;
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return 0;
    }
  },

  async clear(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async flushSync(token: string): Promise<any> {
    const items = await this.getAll();
    if (items.length === 0) return { status: "EMPTY_QUEUE" };

    const payload = {
      client_id: "pwa-offline-client-01",
      last_sync_vector_clock: 0,
      mutations: items,
    };

    const res = await api.syncInventory(payload, token);
    await this.clear();
    return res;
  },
};
