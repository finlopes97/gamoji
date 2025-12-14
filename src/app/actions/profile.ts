"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache"; // <--- Needed for username update
import { redirect } from "next/navigation";

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch History directly from the Leaderboard View
  // This gives us the Rank automatically!
  const { data: history } = await supabase
    .from("leaderboard_entries")
    .select(`
      *,
      puzzles ( solution_name, game_date )
    `)
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  const validHistory = history || [];

  // 3. Calculate New Stats
  const totalGames = validHistory.length;
  
  // Calculate Average Time
  const totalTime = validHistory.reduce((acc, curr) => acc + curr.final_score_ms, 0);
  const avgTimeMs = totalGames > 0 ? totalTime / totalGames : 0;

  // Calculate Average Rank
  const totalRank = validHistory.reduce((acc, curr) => acc + curr.rank, 0);
  const avgRank = totalGames > 0 ? Math.round((totalRank / totalGames) * 10) / 10 : 0; // Round to 1 decimal

  // Find Best Rank
  const bestRank = validHistory.length > 0 
    ? Math.min(...validHistory.map(h => h.rank)) 
    : 0;

  return {
    profile,
    stats: {
      totalGames,
      avgRank,  // <--- Replaces Win Rate
      avgTimeMs,
      bestRank  // <--- Replaces Total Wins
    },
    history: validHistory
  };
}

// --- NEW ACTION: UPDATE USERNAME ---
export async function updateUsername(newUsername: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not logged in" };

  if (newUsername.length < 3) {
    return { success: false, message: "Username must be at least 3 characters." };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') { // Postgres Unique Violation code
      return { success: false, message: "Username already taken." };
    }
    return { success: false, message: error.message };
  }

  revalidatePath('/profile'); // Refresh the page to show new name
  return { success: true };
}