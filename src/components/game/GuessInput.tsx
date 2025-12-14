"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useGameStore } from "@/lib/store/game";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { searchGamesPublic } from "@/app/actions/game";
import { Search, Send } from "lucide-react";

export function GuessInput() {
  const submitGuess = useGameStore((state) => state.submitGuess);
  const status = useGameStore((state) => state.status);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, startTransition] = useTransition();
  
  const [shake, setShake] = useState(false);
  const [feedback, setFeedback] = useState(""); 

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- SEARCH ---
  useEffect(() => {
    if (debouncedQuery.length > 1 && showDropdown) {
      startTransition(async () => {
        const games = await searchGamesPublic(debouncedQuery);
        setResults(games);
        setFocusedIndex(-1);
      });
    } else {
      setResults([]);
    }
  }, [debouncedQuery, showDropdown]);

  // --- SUBMISSION LOGIC ---
  const triggerSubmit = (guess: string) => {
    if (!guess) return;

    const isCorrect = submitGuess(guess);

    if (isCorrect) {
      setFeedback("Correct!");
      setShowDropdown(false);
      setQuery(guess); // Ensure display shows the winning name
    } else {
      setShake(true);
      setFeedback("Wrong!"); // No penalty text anymore
      setQuery(""); 
      setShowDropdown(false); // Hide dropdown on wrong guess to clear view
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setFeedback(""), 2000);
    }
  };

  // --- HANDLERS ---

  // 1. AUTO-SUBMIT ON SELECTION
  const handleSelect = (gameName: string) => {
    triggerSubmit(gameName);
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    triggerSubmit(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) {
        setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        setShowDropdown(true);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      // If dropdown is open and we have a focused item, select AND submit it
      if (showDropdown && focusedIndex >= 0 && results[focusedIndex]) {
        handleSelect(results[focusedIndex].name);
      } else {
        // Otherwise submit raw text
        handleManualSubmit();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  if (status !== 'playing') return null;

  return (
    <div className="w-full max-w-md mx-auto relative">
      <form onSubmit={handleManualSubmit} className={`relative flex gap-2 ${shake ? 'animate-shake' : ''}`}>
        
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type game title..."
            className="w-full px-4 py-3 pl-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-0 bg-white dark:bg-gray-800 transition-colors shadow-sm outline-none"
            autoComplete="off"
          />
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
        </div>

        <button
          type="submit"
          disabled={!query}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {feedback && (
        <div className="absolute -bottom-8 left-0 right-0 text-center text-red-500 font-bold text-sm animate-pulse">
          {feedback}
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <ul className="absolute bottom-full mb-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-60 overflow-y-auto z-50">
          {results.map((game, index) => (
            <li
              key={game.id}
              onClick={() => handleSelect(game.name)} // Clicking now submits!
              className={`px-4 py-3 cursor-pointer flex items-center justify-between border-b last:border-0 border-gray-50 dark:border-gray-700
                ${index === focusedIndex ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
            >
              <span className="font-medium">{game.name}</span>
              {game.year && <span className="text-xs text-gray-400">{game.year}</span>}
            </li>
          ))}
        </ul>
      )}
      
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}