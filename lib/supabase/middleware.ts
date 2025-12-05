import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
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
              return request.cookies.get(name)?.value
            } catch {
              return undefined
            }
          },
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Supabase auth error:", userError)
      // If there's an auth error, allow public access but redirect protected routes
      if (request.nextUrl.pathname.startsWith("/dashboard") ||
          request.nextUrl.pathname.startsWith("/api/protected")) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // If user is not authenticated, allow public access but redirect protected routes
    if (!user) {
      // Redirect dashboard and other protected routes to login
      if (request.nextUrl.pathname.startsWith("/dashboard") ||
          request.nextUrl.pathname.startsWith("/api/protected")) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // Protect dashboard routes (only for authenticated users)
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      try {
        // Check if user has premium access for PMS features
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_premium, premium_expires_at")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Profile fetch error:", profileError)
          // If there's an error fetching profile, redirect to upgrade page as safety measure
          const url = request.nextUrl.clone()
          url.pathname = "/dashboard/upgrade"
          return NextResponse.redirect(url)
        }

        // If accessing the upgrade page, allow access regardless of premium status
        if (request.nextUrl.pathname.startsWith("/dashboard/upgrade")) {
          return supabaseResponse;
        }

        const isPremiumExpired = profile?.premium_expires_at ? new Date(profile.premium_expires_at) < new Date() : true

        if (!profile?.is_premium || isPremiumExpired) {
          // Redirect non-premium users to upgrade page (except when already on upgrade page)
          const url = request.nextUrl.clone()
          url.pathname = "/dashboard/upgrade"
          return NextResponse.redirect(url)
        }
      } catch (profileFetchError) {
        console.error("Profile fetch error:", profileFetchError)
        // If there's an error fetching profile, redirect to upgrade page as safety measure
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard/upgrade"
        return NextResponse.redirect(url)
      }
    }

    // Redirect authenticated users away from auth pages
    if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error("Supabase middleware error:", error)
    // If there's any error in the middleware, allow the request to continue
    // but log the error for debugging
  }

  return supabaseResponse
}
