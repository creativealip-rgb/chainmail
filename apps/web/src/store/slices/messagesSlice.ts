import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface ApiMessage {
  id: string;
  aliasId: string;
  aliasEmail: string;
  fromAddr: string;
  fromName: string | null;
  subject: string | null;
  folder: string;
  starred: boolean;
  parserKey: string | null;
  receiptId: string | null;
  parsedAt: string | null;
  readAt: string | null;
  receivedAt: string;
  labels?: ApiMessageLabel[];
}

export interface ApiMessageDetail extends ApiMessage {
  bodyText: string | null;
  bodyHtml: string | null;
  toAddrs: string[];
  encryptedBody: string | null;
  messageIdHeader: string | null;
  createdAt: string;
}

export interface ApiMessageLabel {
  id: string;
  name: string;
  color: string;
}

export interface ApiReceipt {
  id: string;
  messageId: string;
  source: string;
  type: string;
  chain: string | null;
  asset: string | null;
  amount: number | null;
  pricePerUnit: number | string | null;
  fiat: string | null;
  fiatAmount: number | string | null;
  assetPriceUsd: number | string | null;
  txHash: string | null;
  counterparty: string | null;
  confidence: number | null;
  raw: unknown;
  createdAt: string;
}

interface MessagesState {
  list: ApiMessage[];
  detail: Record<string, ApiMessageDetail>;
  labelsByMessage: Record<string, ApiMessageLabel[]>;
  loading: boolean;
  error: string | null;
  activeFolder: string;
  activeLabelId: string | null;
}

const initialState: MessagesState = {
  list: [],
  detail: {},
  labelsByMessage: {},
  loading: false,
  error: null,
  activeFolder: "inbox",
  activeLabelId: null,
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(["chainmail", "access"].join("."));
}

export const fetchMessages = createAsyncThunk<
  { messages: ApiMessage[]; folder: string; labelId: string | null },
  { folder?: string; labelId?: string; aliasId?: string; limit?: number } | void,
  { rejectValue: string }
>("messages/fetch", async (params, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return rejectWithValue("not authenticated");
  const url = new URL("/api/messages", window.location.origin);
  if (params && "folder" in params && params.folder) url.searchParams.set("folder", params.folder);
  if (params && "labelId" in params && params.labelId) url.searchParams.set("labelId", params.labelId);
  if (params && "aliasId" in params && params.aliasId) url.searchParams.set("aliasId", params.aliasId);
  if (params && "limit" in params && params.limit) url.searchParams.set("limit", String(params.limit));
  const res = await fetch(import.meta.env.VITE_API_URL + url.pathname + url.search, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return rejectWithValue(`fetch failed (${res.status})`);
  const data = (await res.json()) as { messages: ApiMessage[]; folder: string; labelId: string | null };
  return data;
});

export const fetchMessageDetail = createAsyncThunk<
  { message: ApiMessageDetail; labels: ApiMessageLabel[] },
  string,
  { rejectValue: string }
>("messages/fetchDetail", async (id, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return rejectWithValue("not authenticated");
  const res = await fetch(import.meta.env.VITE_API_URL + `/api/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return rejectWithValue(`detail failed (${res.status})`);
  const data = (await res.json()) as { message: ApiMessageDetail; labels: ApiMessageLabel[] };
  return data;
});

/** Move a message to another folder (PATCH /api/messages/:id) */
export const moveMessage = createAsyncThunk<
  { id: string; folder: string },
  { id: string; folder: string },
  { rejectValue: string }
>("messages/move", async ({ id, folder }, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return rejectWithValue("not authenticated");
  const res = await fetch(import.meta.env.VITE_API_URL + `/api/messages/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) return rejectWithValue(`move failed (${res.status})`);
  return { id, folder };
});

/** Toggle the starred flag on a message */
export const starMessage = createAsyncThunk<
  { id: string; starred: boolean },
  { id: string; starred: boolean },
  { rejectValue: string }
>("messages/star", async ({ id, starred }, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return rejectWithValue("not authenticated");
  const res = await fetch(import.meta.env.VITE_API_URL + `/api/messages/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ starred }),
  });
  if (!res.ok) return rejectWithValue(`star failed (${res.status})`);
  return { id, starred };
});

/** Mark all messages in a folder (or label) as read */
export const markAllRead = createAsyncThunk<
  { updated: number; folder: string; labelId: string | null },
  { folder?: string; labelId?: string } | void,
  { rejectValue: string }
>("messages/markAllRead", async (params, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return rejectWithValue("not authenticated");
  const url = new URL("/api/messages/mark-all-read", window.location.origin);
  if (params && "folder" in params && params.folder) url.searchParams.set("folder", params.folder);
  if (params && "labelId" in params && params.labelId) url.searchParams.set("labelId", params.labelId);
  const res = await fetch(import.meta.env.VITE_API_URL + url.pathname + url.search, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return rejectWithValue(`mark-all-read failed (${res.status})`);
  return (await res.json()) as { updated: number; folder: string; labelId: string | null };
});

/** Set labels on a message (replaces existing assignments) */
export const setMessageLabels = createAsyncThunk<
  { id: string; labels: ApiMessageLabel[] },
  { id: string; labelIds: string[] },
  { rejectValue: string }
>("messages/setLabels", async ({ id, labelIds }, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return rejectWithValue("not authenticated");
  // Apply assignment first
  const res = await fetch(import.meta.env.VITE_API_URL + `/api/messages/${id}/labels`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ labelIds }),
  });
  if (!res.ok) return rejectWithValue(`set labels failed (${res.status})`);
  // Re-fetch the resolved label list so the UI can show the correct names + colors
  const detail = await fetch(import.meta.env.VITE_API_URL + `/api/messages/${id}/labels`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!detail.ok) return rejectWithValue(`get labels failed (${detail.status})`);
  const data = (await detail.json()) as { labels: ApiMessageLabel[] };
  return { id, labels: data.labels };
});

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.list = [];
      state.detail = {};
      state.labelsByMessage = {};
      state.error = null;
      state.activeFolder = "inbox";
      state.activeLabelId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchMessages.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload.messages;
        s.activeFolder = a.payload.folder;
        s.activeLabelId = a.payload.labelId;
        // Populate per-message labels so the row picker shows current state
        for (const m of a.payload.messages) {
          if (m.labels) s.labelsByMessage[m.id] = m.labels;
        }
      })
      .addCase(fetchMessages.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload ?? "fetch failed";
      })
      .addCase(fetchMessageDetail.fulfilled, (s, a) => {
        s.detail[a.payload.message.id] = a.payload.message;
        s.labelsByMessage[a.payload.message.id] = a.payload.labels;
      })
      .addCase(moveMessage.fulfilled, (s, a) => {
        // Remove the message from the current list (it moved away)
        s.list = s.list.filter((m) => m.id !== a.payload.id);
      })
      .addCase(starMessage.fulfilled, (s, a) => {
        // Update the message in place
        const idx = s.list.findIndex((m) => m.id === a.payload.id);
        if (idx >= 0) {
          const m = s.list[idx];
          if (m) m.starred = a.payload.starred;
        }
      })
      .addCase(markAllRead.fulfilled, (s) => {
        const now = new Date().toISOString();
        s.list.forEach((m) => {
          if (!m.readAt) m.readAt = now;
        });
      })
      .addCase(setMessageLabels.fulfilled, (s, a) => {
        s.labelsByMessage[a.payload.id] = a.payload.labels;
      });
  },
});

export const { clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
