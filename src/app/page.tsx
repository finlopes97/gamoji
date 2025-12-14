import { createClient } from "@/lib/supabase/server";
import { GameBoard } from "@/components/game/GameBoard";
import { DailyResult } from "@/components/game/DailyResult";
import Link from "next/link";
import { UserCircle, Archive, BarChart3 } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch Puzzle
  const { data: puzzle } = await supabase
    .from('puzzles')
    .select('*')
    .eq('game_date', today)
    .single();

  // 2. Fetch Global Stats (New!)
  const { data: rawStats } = await supabase
    .rpc('get_daily_stats', { target_date: today });

  const stats = rawStats as any;

  // Handle default values if no one has played yet
  const globalStats = stats ? {
    total_plays: stats.total_plays || 0,
    avg_time_ms: stats.avg_time_ms || 0,
    best_time_ms: stats.best_time_ms || 0
  } : { total_plays: 0, avg_time_ms: 0, best_time_ms: 0 };

  // 3. Fetch User Session
  let userScore = null;
  let activeSession: { started_at: string; penalty_ms: number } | null = null;
  
  if (user && puzzle) {
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

  // --- HEADER ---
  const Header = () => (
    <header className="p-4 border-b flex justify-between items-center bg-white dark:bg-gray-950 sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <h1 className="font-bold text-xl tracking-tighter flex items-center gap-2">
           GAMOJI
        </h1>
        <Link href="/archive" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
           <Archive className="w-4 h-4" />
           <span className="hidden sm:inline">Archive</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <Link href="/profile" className="flex items-center gap-2 text-sm font-medium hover:text-indigo-600 transition-colors">
            <UserCircle className="h-5 w-5" />
            <span className="hidden sm:inline">My Profile</span>
          </Link>
        ) : (
          <Link href="/login" className="text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1.5 rounded font-bold hover:opacity-90">
            Login
          </Link>
        )}
      </div>
    </header>
  );

  if (!puzzle) {
    return (
      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-4">
          <div className="text-6xl">😴</div>
          <h2 className="text-2xl font-bold">No Puzzle Today</h2>
          <p className="text-gray-500">The game master is sleeping. Check back tomorrow!</p>
          <Link href="/archive" className="text-indigo-600 underline">Play an old puzzle?</Link>
        </div>
      </main>
    );
  }

  const puzzleData = {
    id: puzzle.id,
    solution: puzzle.solution_name,
    emojis: puzzle.emojis,
    hints: puzzle.hints || []
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center p-4">
        {userScore ? (
          <DailyResult 
            userScore={userScore} 
            puzzleId={puzzle.id} 
            globalStats={globalStats} // <--- Pass it here!
          />
        ) : (
          <GameBoard 
            puzzleData={puzzleData} 
            existingSession={activeSession}
            globalStats={globalStats}
          />
        )}
      </div>
    </main>
  );
}