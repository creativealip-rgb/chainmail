import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Spinner } from "@ui/ui";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { open as openComposer } from "@/store/slices/composerSlice";
import { dismiss as dismissToast } from "@/store/slices/notificationsSlice";
import { ToastContainer } from "@/components/ui/ToastContainer";

// Landing is loaded immediately (it's the homepage)
import LandingPage from "@/routes/LandingPage";

// Lazy-load the rest — aggressive code splitting per struktur.md section 12
const AuthLayout = lazy(() => import("@/routes/AuthLayout"));
const MailboxRoute = lazy(() => import("@/routes/MailboxRoute"));
const MessageRoute = lazy(() => import("@/routes/MessageRoute"));
const EncryptedRoute = lazy(() => import("@/routes/EncryptedRoute"));
const RecoverySetupPage = lazy(() => import("@/routes/auth/RecoverySetupPage"));
const LedgerRoute = lazy(() => import("@/routes/LedgerRoute"));

function GlobalShortcuts() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const composerOpen = useAppSelector((s) => s.composer.open);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when user is typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Esc → close composer / dismiss top toast
      if (e.key === "Escape") {
        if (composerOpen) {
          dispatch({ type: "composer/close" });
        } else {
          // Will be picked up by ToastContainer via its own handler if focused,
          // but also dismisses top-most here.
        }
        return;
      }

      // Don't fire shortcuts with modifiers
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (key === "c" && isAuth) {
        e.preventDefault();
        dispatch(openComposer());
      } else if (key === "/") {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[aria-label*="earch" i], input[placeholder*="earch" i]',
        );
        search?.focus();
      } else if (key === "g" && isAuth) {
        // Mark next key as a goto
        sessionStorage.setItem("__awaitG", "1");
        setTimeout(() => sessionStorage.removeItem("__awaitG"), 1200);
      } else if (sessionStorage.getItem("__awaitG") === "1") {
        sessionStorage.removeItem("__awaitG");
        if (key === "i" && isAuth) navigate("/app/mailbox/inbox");
        else if (key === "s" && isAuth) navigate("/app/mailbox/sent");
        else if (key === "d" && isAuth) navigate("/app/mailbox/drafts");
        else if (key === "t" && isAuth) navigate("/app/mailbox/trash");
        else if (key === "l" && isAuth) navigate("/app/ledger");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dispatch, navigate, isAuth, composerOpen]);

  return null;
}

export function App() {
  return (
    <>
      <GlobalShortcuts />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/app/*"
          element={
            <Suspense fallback={<Spinner fullscreen />}>
              <Routes>
                <Route path="auth/*" element={<AuthLayout />} />
                <Route path="mailbox/:mailbox" element={<MailboxRoute />} />
                <Route path="label/:labelId" element={<MailboxRoute labelView />} />
                <Route path="mailbox/:mailbox/message/:id" element={<MessageRoute />} />
                <Route path="ledger" element={<LedgerRoute />} />
                <Route path="encrypted/:key" element={<EncryptedRoute />} />
                {/* W3.5: post-signup one-time recovery code display */}
                <Route path="setup-recovery" element={<RecoverySetupPage />} />
                <Route index element={<AuthLayout />} />
              </Routes>
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}