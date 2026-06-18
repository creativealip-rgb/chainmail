import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Spinner } from "@ui/ui";
import { fetchMe } from "@/store/slices/authSlice";
import { clearAliases, fetchAliases } from "@/store/slices/aliasesSlice";
import { clearMessages, fetchMessages } from "@/store/slices/messagesSlice";

const SignInPage = lazy(() => import("@/routes/auth/SignInPage"));
const SignUpPage = lazy(() => import("@/routes/auth/SignUpPage"));
const WelcomePage = lazy(() => import("@/routes/auth/WelcomePage"));
const RecoveryPage = lazy(() => import("@/routes/auth/RecoveryPage"));

const VITE_DEMO = import.meta.env.VITE_DEMO === "true";

export default function AuthLayout() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, status } = useAppSelector((s) => s.auth);

  // If a token is persisted, try to hydrate the user on mount.
  useEffect(() => {
    if (isAuthenticated && status === "idle") {
      dispatch(fetchMe());
    }
  }, [dispatch, isAuthenticated, status]);

  // When signing out, clear app data.
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(clearAliases());
      dispatch(clearMessages());
    }
  }, [dispatch, isAuthenticated]);

  // Already authenticated → bypass auth pages, go to inbox.
  if (isAuthenticated) {
    return <Navigate to="/app/mailbox/inbox" replace />;
  }

  // Demo mode: skip auth pages entirely (seeded data).
  if (VITE_DEMO) {
    return <Navigate to="/app/mailbox/inbox" replace />;
  }

  return (
    <div className="auth-layout">
      <Suspense fallback={<Spinner fullscreen />}>
        <Routes>
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="sign-up" element={<SignUpPage />} />
          <Route path="welcome" element={<WelcomePage />} />
          <Route path="recovery" element={<RecoveryPage />} />
          <Route index element={<Navigate to="sign-in" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
