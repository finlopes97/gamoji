"use server";

import { searchIGDB } from "@/lib/igdb";

export async function searchGamesPublic(query: string) {
  // This is safe to expose because searchIGDB is server-side 
  // and hides your API keys.
  return await searchIGDB(query);
}