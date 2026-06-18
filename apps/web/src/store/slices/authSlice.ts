import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  demoMode: boolean;
}

const TOKEN_KEY = "chainmail.access";
const REFRESH_KEY = "chainmail.refresh";

function readPersisted(): { access: string | null; refresh: string | null } {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: localStorage.getItem(TOKEN_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  };
}

function persist(access: string | null, refresh: string | null) {
  if (typeof window === "undefined") return;
  if (access) localStorage.setItem(TOKEN_KEY, access);
  else localStorage.removeItem(TOKEN_KEY);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  else localStorage.removeItem(REFRESH_KEY);
}

export const signUp = createAsyncThunk<
  { user: User; accessToken: string; refreshToken: string },
  { email: string; password: string },
  { rejectValue: string }
>("auth/signUp", async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await fetch(import.meta.env.VITE_API_URL + "/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return rejectWithValue(body?.error ?? `sign-up failed (${res.status})`);
    }
    const data = (await res.json()) as { user: User; accessToken: string; refreshToken: string };
    persist(data.accessToken, data.refreshToken);
    return data;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : "network error");
  }
});

export const signIn = createAsyncThunk<
  { user: User; accessToken: string; refreshToken: string },
  { email: string; password: string },
  { rejectValue: string }
>("auth/signIn", async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await fetch(import.meta.env.VITE_API_URL + "/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return rejectWithValue(body?.error ?? `sign-in failed (${res.status})`);
    }
    const data = (await res.json()) as { user: User; accessToken: string; refreshToken: string };
    persist(data.accessToken, data.refreshToken);
    return data;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : "network error");
  }
});

export const fetchMe = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    const token = readPersisted().access;
    if (!token) return rejectWithValue("no token");
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return rejectWithValue(`me failed (${res.status})`);
      const data = (await res.json()) as { user: User };
      return data.user;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : "network error");
    }
  }
);

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  status: "idle",
  error: null,
  demoMode: false,
};

const { access, refresh } = readPersisted();
if (access) {
  initialState.isAuthenticated = true;
  initialState.accessToken = access;
  initialState.refreshToken = refresh;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signOut: (state) => {
      persist(null, null);
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "idle";
      state.error = null;
    },
    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.demoMode = action.payload;
    },
    /** Demo-only: fake an authenticated session without API call. */
    signInSuccess: (state, action: PayloadAction<{ email: string; token: string }>) => {
      state.isAuthenticated = true;
      state.user = { id: "demo", email: action.payload.email, createdAt: new Date().toISOString() };
      state.accessToken = action.payload.token;
      state.refreshToken = null;
      state.demoMode = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUp.pending, (s) => {
        s.status = "loading";
        s.error = null;
      })
      .addCase(signUp.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.isAuthenticated = true;
        s.user = a.payload.user;
        s.accessToken = a.payload.accessToken;
        s.refreshToken = a.payload.refreshToken;
        s.demoMode = false;
      })
      .addCase(signUp.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? a.error.message ?? "sign-up failed";
      })
      .addCase(signIn.pending, (s) => {
        s.status = "loading";
        s.error = null;
      })
      .addCase(signIn.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.isAuthenticated = true;
        s.user = a.payload.user;
        s.accessToken = a.payload.accessToken;
        s.refreshToken = a.payload.refreshToken;
        s.demoMode = false;
      })
      .addCase(signIn.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? a.error.message ?? "sign-in failed";
      })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.user = a.payload;
        s.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (s) => {
        persist(null, null);
        s.isAuthenticated = false;
        s.user = null;
        s.accessToken = null;
        s.refreshToken = null;
      });
  },
});

export const { signOut, setDemoMode, signInSuccess } = authSlice.actions;
export default authSlice.reducer;
