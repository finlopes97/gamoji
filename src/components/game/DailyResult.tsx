"use client";

import { useEffect, useState } from "react";
import { getPuzzleLeaderboard, getUserRank } from "@/app/actions/score"; // <--- Import getUserRank
import { CalendarCheck, Users, Clock, Trophy, Loader2, Share2 } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface DailyResultProps {
  userScore: any;
  puzzleId: string;
  globalStats?: { // <--- Add this prop
    total_plays: number;
    avg_time_ms: number;
    best_time_ms: number;
  };
}

export function DailyResult({ userScore, puzzleId, globalStats }: DailyResultProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    // 1. Load Top 10
    getPuzzleLeaderboard(puzzleId).then(setLeaderboard);
    
    // 2. Load MY specific Rank
    getUserRank(puzzleId).then(setUserRank);
  }, [puzzleId]);

  return (
    <div className="max-w-md mx-auto w-full p-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-indigo-600 p-8 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-indigo-200" />
            <h2 className="text-2xl font-bold">Puzzle Complete!</h2>
            <p className="text-indigo-100 opacity-80 mt-1">Great job. See you tomorrow?</p>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        {/* YOUR SCORE CARD */}
        <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Your Time</div>
          
          <div className="text-5xl font-mono font-bold text-gray-800 dark:text-gray-100 tracking-tight">
             {formatTime(userScore.final_score_ms)}
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-3 text-sm">
             <span className="text-gray-500">Global Rank:</span>
             {userRank ? (
               <span className="font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                 #{userRank}
               </span>
             ) : (
               <span className="text-gray-400 italic flex items-center">
                 <Loader2 className="w-3 h-3 animate-spin mr-1" /> Calculating...
               </span>
             )}
          </div>
        </div>

        {/* GLOBAL STATS (New Section) */}
        {globalStats && (
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/30">
            <div className="p-4 flex flex-col items-center">
               <div className="text-xs text-gray-400 uppercase font-bold mb-1">Plays</div>
               <div className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                 <Users className="w-3 h-3 text-blue-500" />
                 {globalStats.total_plays}
               </div>
            </div>
            <div className="p-4 flex flex-col items-center">
               <div className="text-xs text-gray-400 uppercase font-bold mb-1">Avg</div>
               <div className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                 <Clock className="w-3 h-3 text-green-500" />
                 {globalStats.avg_time_ms > 0 ? formatTime(globalStats.avg_time_ms).split('.')[0] : '--:--'}
               </div>
            </div>
            <div className="p-4 flex flex-col items-center">
               <div className="text-xs text-gray-400 uppercase font-bold mb-1">Best</div>
               <div className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                 <Trophy className="w-3 h-3 text-yellow-500" />
                 {globalStats.best_time_ms > 0 ? formatTime(globalStats.best_time_ms) : '--:--'}
               </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD SNIPPET */}
        <div className="p-6">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider">Today's Top 5</h3>
           </div>
           
           <div className="space-y-2">
             {leaderboard.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-2">Loading leaderboard...</div>
             ) : (
               leaderboard.slice(0, 5).map((entry) => (
                 <div key={entry.play_id} className={`flex justify-between text-sm p-2 rounded ${entry.user_id === userScore.user_id ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800' : ''}`}>
                    <div className="flex gap-3">
                      <span className={`font-mono font-bold w-6 text-center ${
                          entry.rank === 1 ? 'text-yellow-500' : 
                          entry.rank === 2 ? 'text-gray-400' : 
                          entry.rank === 3 ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        #{entry.rank}
                      </span>
                      <span className="font-medium truncate max-w-[120px]">
                        {entry.username || 'Anonymous'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-gray-600 dark:text-gray-400">
                      {formatTime(entry.final_score_ms)}
                    </span>
                 </div>
               ))
             )}
           </div>
        </div>

      </div>
    </div>
  );
}