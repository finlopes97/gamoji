import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, CheckCircle, Circle, Clock } from "lucide-react";

export default async function ArchivePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch ALL past puzzles
  const { data: puzzles } = await supabase
    .from('puzzles')
    .select('id, game_date, solution_name')
    .lt('game_date', today) // Less than today
    .order('game_date', { ascending: false });

  // 2. Fetch User's Solved List (if logged in)
  let solvedIds = new Set();
  if (user) {
    const { data: userPlays } = await supabase
      .from('plays')
      .select('puzzle_id')
      .eq('user_id', user.id)
      .eq('status', 'solved');
    
    if (userPlays) {
      solvedIds = new Set(userPlays.map(p => p.puzzle_id));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Puzzle Archive</h1>
            <p className="text-gray-500">Play past games for fun.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
            Back to Today
          </Link>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {puzzles?.map((puzzle) => {
            const isSolved = solvedIds.has(puzzle.id);
            
            return (
              <Link 
                key={puzzle.id} 
                href={`/play/${puzzle.game_date}`}
                className={`
                  group relative p-6 rounded-xl border transition-all duration-200
                  ${isSolved 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30' 
                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md dark:bg-gray-900 dark:border-gray-800'
                  }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-sm font-mono text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {puzzle.game_date}
                  </div>
                  {isSolved ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 group-hover:text-indigo-400" />
                  )}
                </div>

                <h3 className={`font-bold text-lg ${isSolved ? 'text-green-800 dark:text-green-300' : 'text-gray-800 dark:text-gray-100'}`}>
                  {isSolved ? puzzle.solution_name : "Hidden Game"}
                </h3>
                
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-400">
                   {isSolved ? (
                     <span>Completed</span> 
                   ) : (
                     <span className="group-hover:text-indigo-500 flex items-center gap-1">
                       <Clock className="w-3 h-3" /> Play Now
                     </span>
                   )}
                </div>
              </Link>
            );
          })}

          {(!puzzles || puzzles.length === 0) && (
            <div className="col-span-full text-center py-12 text-gray-500 italic">
              No archived puzzles found.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}