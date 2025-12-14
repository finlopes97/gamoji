"use client";

import { useEffect, useState } from "react";
import { getPuzzleLeaderboard } from "@/app/actions/score";
import { Trophy, Clock, Share2, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface WinModalProps {
  puzzleId: string;
  finalScoreMs: number;
  penaltyMs: number;
  playTimeMs: number;
}

export function WinModal({ puzzleId, finalScoreMs, penaltyMs, playTimeMs }: WinModalProps) {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to format time (e.g. "01:23.45")
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    // This manually triggers the refresh we disabled on the server
    // causing the page to switch to the DailyResult view
    router.refresh(); 
  };

  useEffect(() => {
    async function loadData() {
      const data = await getPuzzleLeaderboard(puzzleId);
      setLeaderboard(data);
      setLoading(false);
    }
    loadData();
  }, [puzzleId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
        
        {/* HEADER: USER STATS */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-yellow-300" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Puzzle Solved!</h2>
          <div className="text-5xl font-mono font-bold tracking-tight my-4">
            {formatTime(finalScoreMs)}
          </div>
          <div className="flex justify-center gap-4 text-sm text-indigo-100 opacity-80">
            <span>Time: {formatTime(playTimeMs)}</span>
            <span>•</span>
            <span>Penalty: +{(penaltyMs / 1000).toFixed(0)}s</span>
          </div>
        </div>

        {/* LEADERBOARD LIST */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Daily Top 10
          </h3>
          
          <div className="space-y-3 min-h-[200px]">
            {loading ? (
              <div className="flex flex-col gap-2">
                 {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Be the first to set a score!</p>
            ) : (
              leaderboard.map((entry) => (
                <div key={entry.play_id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`
                      font-mono font-bold w-6 text-center
                      ${entry.rank === 1 ? 'text-yellow-500' : ''}
                      ${entry.rank === 2 ? 'text-gray-400' : ''}
                      ${entry.rank === 3 ? 'text-amber-600' : ''}
                      ${entry.rank > 3 ? 'text-gray-400' : ''}
                    `}>
                      #{entry.rank}
                    </span>
                    <div className="flex items-center gap-2">
                       {/* Avatar Fallback */}
                       <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                         <User className="w-3 h-3 text-indigo-600" />
                       </div>
                       <span className="font-medium text-sm truncate max-w-[120px]">
                         {entry.username || "Anonymous"}
                       </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                    {formatTime(entry.final_score_ms)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-gray-50 dark:bg-gray-950 border-t dark:border-gray-800 flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors">
            <Share2 className="h-4 w-4" />
              Share
          </button>

          <button 
            onClick={handleContinue}
            className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}