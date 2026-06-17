import ky from "ky";
import type { SWRConfiguration } from "swr";
import {
  DEMO_MAILBOXES,
  DEMO_USER,
  DEMO_FOLDERS,
  DEMO_ALIASES,
  findDemoMessage,
} from "@/services/demo/seed";
import type { Message, Folder, User, Alias } from "@ui/shared-types";

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.atomicmail.io";
const IS_DEMO = import.meta.env.VITE_DEMO === "true";

/**
 * Returns the demo response for a given URL path, or null if the URL
 * is not demo-routable. Used by both the SWR fetcher and any direct
 * api.get() call so the entire client is demo-aware.
 */
function demoResponse(
  url: string
): { handled: boolean; data: unknown; delay?: number } {
  // normalize: strip leading slash and optional /v1/ prefix
  const path = "/" + url.replace(/^\//, "").replace(/^v1\//, "");

  // /mailboxes/:id/messages/:msgId  (message detail)
  const msgDetailMatch = path.match(/^\/mailboxes\/([^/]+)\/messages\/([^/]+)$/);
  if (msgDetailMatch && msgDetailMatch[1] && msgDetailMatch[2]) {
    const m = findDemoMessage(msgDetailMatch[2]);
    return { handled: true, data: m ?? null };
  }
  // /mailboxes/:id/messages
  const mboxMatch = path.match(/^\/mailboxes\/([^/]+)\/messages$/);
  if (mboxMatch && mboxMatch[1]) {
    return { handled: true, data: DEMO_MAILBOXES[mboxMatch[1]] ?? [] };
  }
  // /messages/:id
  const msgMatch = path.match(/^\/messages\/([^/]+)$/);
  if (msgMatch && msgMatch[1]) {
    const m = findDemoMessage(msgMatch[1]);
    return { handled: true, data: m ?? null };
  }
  // /me, /user
  if (path === "/me" || path === "/user") {
    return { handled: true, data: DEMO_USER };
  }
  // /folders
  if (path === "/folders") {
    return { handled: true, data: DEMO_FOLDERS };
  }
  // /aliases
  if (path === "/aliases") {
    return { handled: true, data: DEMO_ALIASES };
  }
  return { handled: false, data: null };
}

export const api = ky.create({
  prefixUrl: API_URL,
  credentials: "include",
  timeout: 30_000,
  retry: 3,
  hooks: {
    beforeRequest: [
      (req) => {
        const token = localStorage.getItem("session_token");
        if (token) req.headers.set("Authorization", `Bearer ${token}`);
      },
    ],
    afterResponse: [
      async (_req, _opts, res) => {
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent("auth:expired"));
        }
      },
    ],
  },
});

/**
 * Demo-aware HTTP helper. In demo mode, returns mock data for known
 * demo routes. Otherwise delegates to ky's normal `get`. Use this
 * anywhere you'd reach for `api.get(url).json<T>()`.
 */
export async function apiGet<T = unknown>(url: string): Promise<T> {
  if (IS_DEMO) {
    const hit = demoResponse(url);
    if (hit.handled) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(hit.data as T), 80)
      );
    }
  }
  return api.get(url).json<T>();
}

export const apiFetcher = <T = unknown>(url: string): Promise<T> => apiGet<T>(url);

export const apiSWRConfig: SWRConfiguration = {
  fetcher: apiFetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 2_000,
};

export const isDemoMode = (): boolean => IS_DEMO;

// Re-export demo data so other parts of the app (e.g. login form, signup)
// can render with seed values when in demo mode.
export { DEMO_USER, DEMO_FOLDERS, DEMO_ALIASES } from "@/services/demo/seed";
