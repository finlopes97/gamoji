import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PuzzleForm } from "@/components/admin/PuzzleForm";

export default async function AdminDashboard() {
  // 1. Server-Side Protection
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check role strictly
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Access Denied.
      </div>
    );
  }

  // 2. Fetch existing puzzles to list them (Future step)
  const { data: puzzles } = await supabase
    .from("puzzles")
    .select("*")
    .order("game_date", { ascending: false });

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🧩 Gamoji Admin</h1>
        <div className="text-sm text-gray-500">Welcome, {profile.role}</div>
      </div>
      
      {/* 1. THE INTERACTIVE FORM */}
      <div className="mb-12">
        <PuzzleForm />
      </div>

      {/* 2. THE SCHEDULE LIST */}
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Scheduled Games</h2>
      <div className="space-y-3">
        {puzzles?.map((p) => (
          <div key={p.id} className="p-4 bg-white dark:bg-gray-900 border rounded flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm font-mono font-bold">
                {p.game_date}
              </div>
              <div>
                <div className="font-bold text-lg">{p.solution_name}</div>
                <div className="text-gray-500 text-sm">
                  {p.emojis.join(" ")}
                </div>
              </div>
            </div>
            {/* Show hint count badge */}
            {p.hints && p.hints.length > 0 && (
               <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                 {p.hints.length} Hints
               </span>
            )}
          </div>
        ))}
        {(!puzzles || puzzles.length === 0) && (
          <p className="text-gray-500 italic">No puzzles scheduled yet.</p>
        )}
      </div>
    </div>
  );
}