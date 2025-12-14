"use server";

import { createClient } from "@/lib/supabase/server";

// 1. START GAME (Creates the session timer on the server)
export async function startDailyGame(puzzleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Login required" };

  // Check if session already exists
  const { data: existing } = await supabase
    .from('plays')
    .select('*')
    .eq('user_id', user.id)
    .eq('puzzle_id', puzzleId)
    .maybeSingle();

  if (existing) {
    // If already solved, return null (handled by page logic)
    if (existing.status === 'solved') return { success: false, message: "Already played" };
    
    // If currently 'started', return the existing start time (Resume)
    return { success: true, startTime: existing.started_at };
  }

  // Create new session
  const { data, error } = await supabase
    .from('plays')
    .insert({
      user_id: user.id,
      puzzle_id: puzzleId,
      status: 'started',
      started_at: new Date().toISOString(),
      duration_ms: 0, // placeholders
      final_score_ms: 0 
    })
    .select()
    .single();

  if (error) {
    console.error("Start Game Error:", error);
    return { success: false, message: error.message };
  }

  return { success: true, startTime: data.started_at };
}

// SUBMIT SCORE (Calculates final time based on Server Start)
export async function submitScore(puzzleId: string, clientPenalties: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false };

  // Fetch the active session to get the TRUE start time
  const { data: session } = await supabase
    .from('plays')
    .select('started_at, status')
    .eq('user_id', user.id)
    .eq('puzzle_id', puzzleId)
    .single();

  if (!session || session.status === 'solved') {
    return { success: false, message: "Invalid session" };
  }

  // SERVER-SIDE CALCULATION
  const endTime = new Date();
  const startTime = new Date(session.started_at!); // Non-null assertion
  const durationMs = endTime.getTime() - startTime.getTime();
  
  // Ensure duration isn't negative (clock skew protection)
  const finalDuration = Math.max(0, durationMs);
  const finalScore = finalDuration + clientPenalties;

  // Update the row
  const { error } = await supabase
    .from('plays')
    .update({
      status: 'solved',
      duration_ms: finalDuration,
      penalty_ms: clientPenalties,
      final_score_ms: finalScore
    })
    .eq('user_id', user.id)
    .eq('puzzle_id', puzzleId);

  if (error) return { success: false, message: error.message };

  return { success: true };
}

// Fetch Leaderboard
export async function getPuzzleLeaderboard(puzzleId: string) {
  const supabase = await createClient();

  // Query our new SQL View
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('*')
    .eq('puzzle_id', puzzleId)
    .order('rank', { ascending: true })
    .limit(10);

  if (error) {
    console.error("Leaderboard Fetch Error:", error);
    return [];
  }

  return data;
}

export async function getUserRank(puzzleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Query our View directly for this user
  const { data } = await supabase
    .from('leaderboard_entries')
    .select('rank')
    .eq('puzzle_id', puzzleId)
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.rank || null;
}