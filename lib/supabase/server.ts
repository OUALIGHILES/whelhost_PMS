import { createServerClient } from "@supabase/ssr";

export function createClient() {
  // Create a Supabase client with minimal cookie interface to prevent errors in all contexts
  // Session persistence between requests isn't critical for all use cases
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'Cache-Control': 'no-cache'
        }
      },
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
        getAll: () => [],
      },
    }
  );
}
