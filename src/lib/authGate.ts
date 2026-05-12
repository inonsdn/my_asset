// Module-level gate so the Zustand store (non-React code) can trigger the auth modal.
// The AuthProvider registers a handler via setRequireAuth().
// When env vars are absent (offline mode) no handler is registered and all writes pass through.

type RequireAuthFn = () => Promise<boolean>;

let _handler: RequireAuthFn | null = null;

export function setRequireAuth(fn: RequireAuthFn) {
  _handler = fn;
}

/** Returns true if the user is (or becomes) authenticated, false if they cancelled. */
export async function requireAuth(): Promise<boolean> {
  if (!_handler) return true; // offline / no Supabase → allow
  return _handler();
}
