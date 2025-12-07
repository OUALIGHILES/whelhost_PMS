import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  let hasCookieStore = false;
  let cookieStore;

  try {
    // Attempt to get the cookie store - will only work in server components
    cookieStore = cookies();
    // Check if cookieStore has the expected methods
    hasCookieStore = typeof cookieStore.get === 'function';
  } catch (error) {
    // If cookies() is not available in current context, use fallback
    hasCookieStore = false;
  }

  if (hasCookieStore) {
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
          get: (name: string) => {
            try {
              return cookieStore.get(name)?.value;
            } catch (error) {
              return undefined;
            }
          },
          set: (name: string, value: string, options: any) => {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
          remove: (name: string, options: any) => {
            try {
              cookieStore.set(name, "", { ...options, maxAge: -1 });
            } catch (error) {
              // The `remove` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
          getAll: () => {
            try {
              return cookieStore.getAll();
            } catch (error) {
              return [];
            }
          }
        },
      }
    );
  } else {
    // Fallback for non-server component contexts
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
}
