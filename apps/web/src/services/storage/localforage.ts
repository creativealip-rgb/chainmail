import localforage from "localforage";

// Encrypted message cache + keypair blob
const mainStore = localforage.createInstance({
  name: "ChainmailDB",
  storeName: "keyvaluepairs",
  description: "Encrypted message cache + keypair blob",
});

export const storage = {
  get: <T>(key: string) => mainStore.getItem<T>(key),
  set: <T>(key: string, value: T) => mainStore.setItem<T>(key, value),
  remove: (key: string) => mainStore.removeItem(key),
  clear: () => mainStore.clear(),
};

export const StorageKeys = {
  KEYPAIR_ENCRYPTED: "keypair_encrypted",
  ENCRYPTED_SEED: "encrypted_seed_phrase",
  MESSAGE_CACHE: "message_cache",
  DRAFT: "draft",
} as const;
