import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const supabase = await createClient();

  // Try to get user with error handling for fetch failures
  let user;
  let userError;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    userError = result.error;
  } catch (error) {
    console.error("Supabase auth fetch error in requireAuth:", error);
    // Redirect to login on any auth error
    redirect("/login");
  }

  if (!user || userError) {
    redirect("/login");
  }

  // Get user profile data with error handling
  let profile;
  try {
    const profileResult = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    profile = profileResult.data;
  } catch (profileError) {
    console.error("Profile fetch error:", profileError);
    // Continue with user data even if profile fetch fails
    profile = null;
  }

  // Combine user data with profile data
  const userData = {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      full_name: profile?.full_name || user.user_metadata?.full_name,
      role: profile?.role || user.user_metadata?.role,
    }
  };

  return userData;
}