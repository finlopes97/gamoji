"use client";

import { useGameStore } from "@/lib/store/game";
import { Timer, AlertCircle } from "lucide-react";

export function TimerDisplay() {
  const elapsedTime = useGameStore((state) => state.elapsedTime);
  const penaltyTime = useGameStore((state) => state.penaltyTime);
  
  // Format MS to MM:SS:ms
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl font-mono font-bold tracking-wider tabular-nums text-gray-800 dark:text-gray-100">
        {formatTime(elapsedTime + penaltyTime)}
      </div>
      
      {/* Penalty Indicator (Only shows if there are penalties) */}
      {penaltyTime > 0 && (
        <div className="flex items-center gap-1 text-red-500 font-bold text-sm mt-1 animate-pulse">
          <AlertCircle className="h-4 w-4" />
          <span>+{(penaltyTime / 1000).toFixed(0)}s Penalty</span>
        </div>
      )}
    </div>
  );
}