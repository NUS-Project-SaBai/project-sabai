import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session } from "@supabase/supabase-js";

/**
 * useSession — React hook for managing Supabase authentication state (client-side).
 *
 * This hook retrieves the initial Supabase session, subscribes to auth state changes,
 * and exposes a minimal public API for components to react to authentication state.
 *
 * @remarks
 * - On mount, the hook fetches the current session via `supabase.auth.getSession()`.
 * - It subscribes to `supabase.auth.onAuthStateChange` to keep `session` up to date.
 * - The subscription is cleaned up on unmount.
 * - The hook updates a `loading` flag until the initial session is resolved.
 *
 * @returns {{
 *   session: Session | null;
 *   loading: boolean;
 * }} An object containing the current Supabase session (or null) and a loading flag.
 *
 * @example
 * ```tsx
 * const { session, loading } = useSession();
 * if (loading) return <Loading />;
 * if (!session) return <LoginPrompt />;
 * return <AuthenticatedApp />;
 * ```
 *
 * @see {@link https://supabase.com/docs/guides/auth} for Supabase auth details.
 * @since 1.0.0
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export function withSession<P extends object>(
  WrappedComponent: React.ComponentType<P>,
) {
  return function ProtectedRoute(props: P) {
    const { session, loading } = useSession();

    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <svg
            className="animate-spin h-8 w-8 text-slate-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      );
    }

    if (!session) {
      return null; // proxy should prevent this and redirect to login
    }

    return <WrappedComponent {...props} session={session} />;
  };
}
