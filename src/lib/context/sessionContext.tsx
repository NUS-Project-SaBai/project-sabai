import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface SessionContextType {
  session: Session | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * SessionProvider — global auth session provider for the React tree.
 *
 * This component initializes the Supabase session on mount and subscribes to
 * authentication state changes so descendants always receive the latest
 * `session` and `loading` values through {@link useSession}.
 *
 * @remarks
 * - Calls `supabase.auth.getSession()` once to resolve the initial state.
 * - Registers `supabase.auth.onAuthStateChange` and unsubscribes on unmount.
 * - Exposes `{ session, loading }` via React context.
 *
 * @param props.children React subtree that consumes session state.
 * @returns A context provider wrapping the app subtree.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
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

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
