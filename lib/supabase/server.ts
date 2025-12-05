import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Add timeout and retry options to handle fetch errors
        headers: {
          'Cache-Control': 'no-cache'
        }
      },
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value
          } catch {
            // If cookies.get is not available in this context, return undefined
            return undefined
          }
        },
        getAll() {
          try {
            // Use the cookies().getAll() method which should be available in Next.js
            return cookieStore.getAll()
          } catch {
            // If getAll is not available in this context, return empty array
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Server Component - ignore
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: -1 })
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
