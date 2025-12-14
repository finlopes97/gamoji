"use server";

async function getTwitchToken() {
  console.log("🔐 Requesting Twitch Token...");
  
  // DEBUG: Check if ENV vars are loaded (Don't log the full secret!)
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    console.error("❌ MISSING ENV VARS: TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is undefined.");
    return null;
  }

  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Token Error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    console.log("✅ Token received successfully.");
    return data.access_token;
  } catch (error) {
    console.error("❌ Network Error fetching token:", error);
    return null;
  }
}

export async function searchIGDB(query: string) {
  if (!query) return [];
  console.log(`🔎 Searching IGDB for: "${query}"`);

  const token = await getTwitchToken();
  if (!token) return [];

  try {
    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      // IMPORTANT: Prevent Next.js from caching search results
      cache: "no-store", 
      
      // Simplify the query: Remove the 'where' clause for now
      body: `search "${query}"; fields name, cover.url, first_release_date; limit 10;`
    });

    if (!response.ok) {
      console.error(`❌ IGDB Error:`, await response.text());
      return [];
    }

    const games = await response.json();
    console.log(`✅ IGDB Found ${games.length} results.`);

    return games.map((game: any) => ({
      id: game.id,
      name: game.name,
      coverUrl: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
      year: game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : "Unknown",
    }));

  } catch (error) {
    console.error("❌ Search Exception:", error);
    return [];
  }
}