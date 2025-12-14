"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store/game";
import { useGameLoop } from "@/lib/hooks/useGameLoop";
import { TimerDisplay } from "./TimerDisplay";
import { WinModal } from "./WinModal";
import { GuessInput } from "./GuessInput";
import { Lightbulb, Play, Loader2 } from "lucide-react";
import { startDailyGame, submitScore } from "@/app/actions/score"; 
import { formatTime } from "@/lib/utils";
import { Users, Clock, Trophy } from "lucide-react";

interface GameBoardProps {
  puzzleData: any;
  existingSession?: { started_at: string; penalty_ms: number } | null;
  globalStats?: {
    total_plays: number;
    avg_time_ms: number;
    best_time_ms: number;
  };
}

export function GameBoard({ puzzleData, existingSession, globalStats }: GameBoardProps) {
  const initGame = useGameStore((state) => state.initGame);
  const startGame = useGameStore((state) => state.startGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const revealHint = useGameStore((state) => state.revealHint);
  const status = useGameStore((state) => state.status);
  const hintsRevealed = useGameStore((state) => state.hintsRevealed);
  const penaltyTime = useGameStore((state) => state.penaltyTime);
  const getNextHintCost = useGameStore((state) => state.getNextHintCost);
  const nextCost = getNextHintCost();

  const [isStarting, setIsStarting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useGameLoop();

  // 1. Init Logic
  useEffect(() => {
    initGame(puzzleData);
    
    // IF WE HAVE AN ACTIVE SESSION, RESUME IMMEDIATELY
    if (existingSession?.started_at) {
      resumeGame(existingSession.started_at, existingSession.penalty_ms || 0);
    }
  }, [puzzleData, existingSession]);

  // 2. Secure Start Handler
  const handleStart = async () => {
    setIsStarting(true);
    
    try {
      const result = await startDailyGame(puzzleData.id);

      if (result.success) {
        if(result.startTime) {
          resumeGame(result.startTime);
        } else {
          startGame();
        }
      } else {
        alert("Error starting game:" + result.message);
        setIsStarting(false);
      }
    } catch (e) {
      console.error(e);
      setIsStarting(false);
    }
  };

  // 3. Secure Submit Handler
  useEffect(() => {
    if (status === 'won' && !hasSubmitted) {
      setHasSubmitted(true);
      submitScore(puzzleData.id, penaltyTime);
    }
  }, [status, hasSubmitted, puzzleData.id, penaltyTime]);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8 relative min-h-[500px] flex flex-col justify-center">
      {/* --- START SCREEN OVERLAY --- */}
      {status === 'idle' && (
        <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-gray-950/95 backdrop-blur-md transition-opacity duration-500`}>
          <div className="w-full max-w-sm space-y-8 animate-in zoom-in-50 duration-500 text-center">
            
            {/* Logo/Icon */}
            <div>
              <div className="text-6xl mb-2 hover:scale-110 transition-transform cursor-default">🎮</div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                GAMOJI
              </h2>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-1">
                Daily Challenge
              </p>
            </div>

            {/* GLOBAL STATS BAR */}
            {globalStats && (
              <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <Users className="w-4 h-4 text-blue-500 mb-1" />
                  <div className="font-bold text-lg leading-none">{globalStats.total_plays}</div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold">Played</div>
                </div>
                <div className="flex flex-col items-center border-l border-gray-300 dark:border-gray-800">
                  <Clock className="w-4 h-4 text-green-500 mb-1" />
                  <div className="font-bold text-lg leading-none">
                    {globalStats.avg_time_ms > 0 ? formatTime(globalStats.avg_time_ms).split('.')[0] : '--:--'}
                  </div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold">Avg Time</div>
                </div>
                <div className="flex flex-col items-center border-l border-gray-300 dark:border-gray-800">
                  <Trophy className="w-4 h-4 text-yellow-500 mb-1" />
                  <div className="font-bold text-lg leading-none">
                    {globalStats.best_time_ms > 0 ? formatTime(globalStats.best_time_ms) : '--:--'}
                  </div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold">Best</div>
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="space-y-3">
              <button 
                onClick={handleStart}
                disabled={isStarting}
                className="w-full group relative flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:scale-[1.02] hover:shadow-xl disabled:opacity-80 disabled:cursor-wait"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    SYNCING...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    START PUZZLE
                  </>
                )}
              </button>
              <p className="text-xs text-gray-400">
                Guess the game title from the emojis. Speed matters.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN GAME INTERFACE --- */}
      <div className={`transition-all duration-700 ${status === 'idle' ? 'opacity-0 filter blur-lg scale-95' : 'opacity-100 filter-none scale-100'}`}>
        
        {/* 1. EMOJI CLUES */}
        <div className="text-center py-8">
          <div className="flex justify-center gap-4 text-6xl md:text-8xl">
            {puzzleData.emojis.map((emoji: string, idx: number) => (
              <span 
                key={idx} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>

        {/* 2. TIMER & STATUS */}
        <div className="flex flex-col items-center justify-center space-y-4 mb-8">
           <TimerDisplay />
           {status === 'won' && (
             <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold animate-bounce">
               🎉 Correct!
             </div>
           )}
        </div>

        {/* 3. CONTROLS (Only visible if game is playing) */}
        {status !== 'won' && (
          <div className="space-y-6">
            
            {/* HINTS */}
            <div className="flex justify-center">
              <button 
                onClick={revealHint}
                disabled={hintsRevealed >= 3 || status !== 'playing'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Lightbulb className="h-5 w-5" />
                <span className="font-semibold text-sm">
                  {hintsRevealed >= 3 
                    ? "No Hints Left" 
                    : `Hint (+${nextCost / 1000}s)`}
                </span>
                {hintsRevealed < 3 && (
                   <span className="ml-1 bg-yellow-200 px-2 py-0.5 rounded-full text-xs">
                     {3 - hintsRevealed} left
                   </span>
                )}
              </button>
            </div>

            {/* Active Hints Display */}
            {hintsRevealed > 0 && (
               <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/30 space-y-2 animate-in fade-in slide-in-from-top-2">
                  {puzzleData.hints.slice(0, hintsRevealed).map((hint: string, i: number) => (
                    <div key={i} className="flex gap-3 items-start text-sm text-yellow-800 dark:text-yellow-200">
                      <span className="font-bold whitespace-nowrap">Hint {i + 1}:</span>
                      <span>{hint}</span>
                    </div>
                  ))}
               </div>
            )}

            {/* GUESS INPUT */}
            <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500 delay-300">
               <GuessInput />
            </div>
            
          </div>
        )}
      </div>

       {status === 'won' && (
        <WinModal 
           puzzleId={puzzleData.id}
           playTimeMs={useGameStore.getState().elapsedTime} 
           penaltyMs={penaltyTime}
           finalScoreMs={useGameStore.getState().elapsedTime + penaltyTime}
        />
      )}
    </div>
  );
}