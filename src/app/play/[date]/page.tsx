import { createClient } from "@/lib/supabase/server";
import { GameBoard } from "@/components/game/GameBoard";
import { DailyResult } from "@/components/game/DailyResult";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function ArchiveGamePage({ params }: PageProps) {
  const { date } = await params; // Await params in Next.js 15
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawStats } = await supabase
    .rpc('get_daily_stats', { target_date: date });

  const globalStats = rawStats ? {
    total_plays: rawStats.total_plays || 0,
    avg_time_ms: rawStats.avg_time_ms || 0,
    best_time_ms: rawStats.best_time_ms || 0
  } : { total_plays: 0, avg_time_ms: 0, best_time_ms: 0 };

  const { data: puzzle } = await supabase
    .from('puzzles')
    .select('*')
    .eq('game_date', date)
    .single();

  if (!puzzle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Puzzle Not Found</h1>
        <Link href="/archive" className="text-indigo-600 hover:underline">
          Back to Archive
        </Link>
      </div>
    );
  }

  // 2. Fetch User Session/Score
  let userScore = null;
  let activeSession: { started_at: string; penalty_ms: number } | null = null;

  if (user) {
    const { data: playData } = await supabase
      .from('plays')
      .select('*')
      .eq('user_id', user.id)
      .eq('puzzle_id', puzzle.id)
      .maybeSingle();

    if (playData) {
      if (playData.status === 'solved') {
        userScore = playData;
      } else if (playData.status === 'started' && playData.started_at) {
        activeSession = {
          started_at: playData.started_at,
          penalty_ms: playData.penalty_ms || 0
        };
      }
    }
  }

  const puzzleData = {
    id: puzzle.id,
    solution: puzzle.solution_name,
    emojis: puzzle.emojis,
    hints: puzzle.hints || []
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Archive Header */}
      <header className="p-4 border-b flex justify-between items-center bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900">
        <div className="flex items-center gap-2">
           <Link href="/archive" className="font-bold text-amber-700 hover:underline">
             ← Archive
           </Link>
           <span className="text-amber-300">|</span>
           <span className="font-mono text-amber-800 dark:text-amber-500">{date}</span>
        </div>
        <div className="text-xs uppercase font-bold tracking-widest text-amber-600">
           Archive Mode
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4">
        {userScore ? (
          <DailyResult 
             userScore={userScore} 
             puzzleId={puzzle.id}
             globalStats={globalStats} // <--- Pass it here
          />
        ) : (
          <GameBoard 
             puzzleData={puzzleData} 
             existingSession={activeSession}
             globalStats={globalStats} // <--- Also pass to GameBoard for Archive
          />
        )}
      </div>
    </main>
  );
}