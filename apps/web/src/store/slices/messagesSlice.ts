import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface ApiMessage {
  id: string;
  aliasId: string;
  aliasEmail: string;
  fromAddr: string;
  fromName: string | null;
  subject: string | null;
  parserKey: string | null;
  receiptId: string | null;
  parsedAt: string | null;
  readAt: string | null;
  receivedAt: string;
}

export interface ApiMessageDetail extends ApiMessage {
  bodyText: string | null;
  bodyHtml: string | null;
  toAddrs: string[];
  encryptedBody: string | null;
  messageIdHeader: string | null;
  createdAt: string;
}

export interface ApiReceipt {
  id: string;
  messageId: string;
  source: string;
  type: string;
  chain: string | null;
  asset: string | null;
  amount: number | null;
  pricePerUnit: number | null;
  fiat: string | null;
  fiatAmount: number | null;
  txHash: string | null;
  counterparty: string | null;
  confidence: number | null;
  raw: unknown;
  createdAt: string;
}

interface MessagesState {
  list: ApiMessage[];
  detail: Record<string, ApiMessageDetail>;
  loading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  list: [],
  detail: {},
  loading: false,
  error: null,
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(["chainmail", "access"].join("."));
}

export const fetchMessages = createAsyncThunk<
  ApiMessage[],
  { aliasId?: string; limit?: number } | void,
  { rejectValue: string }
>("messages/fetch", async (params, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return rejectWithValue("not authenticated");
  const url = new URL("/api/messages", window.location.origin);
  if (params && "aliasId" in params && params.aliasId) url.searchParams.set("aliasId", params.aliasId);
  if (params && "limit" in params && params.limit) url.searchParams.set("limit", String(params.limit));
  const res = await fetch(import.meta.env.VITE_API_URL + url.pathname + url.search, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return rejectWithValue(`fetch failed (${res.status})`);
  const data = (await res.json()) as { messages: ApiMessage[] };
  return data.messages;
});

export const fetchMessageDetail = createAsyncThunk<
  ApiMessageDetail,
  string,
  { rejectValue: string }
>("messages/fetchDetail", async (id, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return rejectWithValue("not authenticated");
  const res = await fetch(import.meta.env.VITE_API_URL + `/api/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return rejectWithValue(`detail failed (${res.status})`);
  const data = (await res.json()) as { message: ApiMessageDetail };
  return data.message;
});

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.list = [];
      state.detail = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchMessages.fulfilled, (s, a: PayloadAction<ApiMessage[]>) => {
        s.loading = false;
        s.list = a.payload;
      })
      .addCase(fetchMessages.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload ?? "fetch failed";
      })
      .addCase(fetchMessageDetail.fulfilled, (s, a: PayloadAction<ApiMessageDetail>) => {
        s.detail[a.payload.id] = a.payload;
      });
  },
});

export const { clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
