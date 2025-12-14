// src/app/actions/admin.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { searchIGDB } from "@/lib/igdb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 1. Verify Admin Status
// We use this to protect the actions
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/"); // Kick them out if not admin
  }
  
  return supabase;
}

// 2. Search Wrapper
export async function searchGamesAction(query: string) {
  await requireAdmin(); // Security check
  return await searchIGDB(query);
}

// 3. Create Puzzle Action
export async function createPuzzleAction(formData: FormData) {
  const supabase = await requireAdmin();

  const gameDate = formData.get("gameDate") as string;
  const gameId = formData.get("gameId") as string;
  const gameName = formData.get("gameName") as string;
  const emojiString = formData.get("emojis") as string;
  
  // Extract hints from form data
  // We expect inputs named hint_0, hint_1, hint_2
  const hints = [
    formData.get("hint_0") as string,
    formData.get("hint_1") as string,
    formData.get("hint_2") as string,
  ].filter(Boolean); // Remove empty hints if any are blank

  const emojis = emojiString.split(",").map((e) => e.trim());

  const { error } = await supabase.from("puzzles").insert({
    game_date: gameDate,
    igdb_game_id: parseInt(gameId),
    solution_name: gameName,
    emojis: emojis,
    hints: hints, // <--- Added this
  });

  if (error) {
    console.error("Failed to create puzzle:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true, message: "Puzzle Created!" };
}