import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Alias {
  id: string;
  email: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

interface AliasesState {
  list: Alias[];
  limit: number;
  loading: boolean;
  error: string | null;
}

const initialState: AliasesState = {
  list: [],
  limit: 10,
  loading: false,
  error: null,
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(["chainmail", "access"].join("."));
}

export const fetchAliases = createAsyncThunk<Alias[], void, { rejectValue: string }>(
  "aliases/fetch",
  async (_, { rejectWithValue }) => {
    const token = getToken();
    if (!token) return rejectWithValue("not authenticated");
    const res = await fetch(import.meta.env.VITE_API_URL + "/api/aliases", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return rejectWithValue(`fetch failed (${res.status})`);
    const data = (await res.json()) as { aliases: Alias[] };
    return data.aliases;
  }
);

export const createAlias = createAsyncThunk<Alias, void, { rejectValue: string }>(
  "aliases/create",
  async (_, { rejectWithValue }) => {
    const token = getToken();
    if (!token) return rejectWithValue("not authenticated");
    const res = await fetch(import.meta.env.VITE_API_URL + "/api/aliases", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return rejectWithValue(`create failed (${res.status})`);
    const data = (await res.json()) as { alias: Alias };
    return data.alias;
  }
);

export const deleteAlias = createAsyncThunk<string, string, { rejectValue: string }>(
  "aliases/delete",
  async (id, { rejectWithValue }) => {
    const token = getToken();
    if (!token) return rejectWithValue("not authenticated");
    const res = await fetch(import.meta.env.VITE_API_URL + `/api/aliases/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return rejectWithValue(`delete failed (${res.status})`);
    return id;
  }
);

const aliasesSlice = createSlice({
  name: "aliases",
  initialState,
  reducers: {
    clearAliases: (state) => {
      state.list = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAliases.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchAliases.fulfilled, (s, a: PayloadAction<Alias[]>) => {
        s.loading = false;
        s.list = a.payload;
      })
      .addCase(fetchAliases.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload ?? "fetch failed";
      })
      .addCase(createAlias.fulfilled, (s, a: PayloadAction<Alias>) => {
        s.list.unshift(a.payload);
      })
      .addCase(deleteAlias.fulfilled, (s, a: PayloadAction<string>) => {
        s.list = s.list.filter((al) => al.id !== a.payload);
      });
  },
});

export const { clearAliases } = aliasesSlice.actions;
export default aliasesSlice.reducer;
