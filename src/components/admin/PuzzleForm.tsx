"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { searchGamesAction, createPuzzleAction } from "@/app/actions/admin";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Search, Calendar, Save, X, Gamepad2, Lightbulb, Loader2 } from "lucide-react";

type GameResult = {
  id: number;
  name: string;
  coverUrl: string | null;
  year: number | string;
};

export function PuzzleForm() {
  // --- STATE ---
  const [query, setQuery] = useState("");
  // OPTIMIZATION: Lowered to 300ms for snappier feel
  const debouncedQuery = useDebounce(query, 300); 

  const [results, setResults] = useState<GameResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null);
  
  // Keyboard Navigation State
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const resultsRef = useRef<HTMLUListElement>(null);

  // Form Fields
  const [date, setDate] = useState("");
  const [emojis, setEmojis] = useState("");
  const [hints, setHints] = useState(["", "", ""]);

  // Transitions & Feedback
  const [isSearching, startSearchTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- EFFECTS ---

  // Trigger Search
  useEffect(() => {
    if (debouncedQuery.length > 2 && !selectedGame) {
      startSearchTransition(async () => {
        const games = await searchGamesAction(debouncedQuery);
        setResults(games);
        setFocusedIndex(-1); // Reset focus when new results arrive
      });
    } else if (debouncedQuery.length === 0) {
      setResults([]);
    }
  }, [debouncedQuery, selectedGame]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && resultsRef.current) {
      const activeItem = resultsRef.current.children[focusedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  // --- HANDLERS ---

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const selectGame = (game: GameResult) => {
    setSelectedGame(game);
    setQuery("");
    setResults([]);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && results[focusedIndex]) {
        selectGame(results[focusedIndex]);
      }
    } else if (e.key === "Escape") {
      setResults([]);
    }
  };

  const updateHint = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedGame || !date || !emojis) {
      setMessage({ type: 'error', text: "Please fill in all required fields." });
      return;
    }

    startSubmitTransition(async () => {
      const formData = new FormData();
      formData.append("gameId", selectedGame.id.toString());
      formData.append("gameName", selectedGame.name);
      formData.append("gameDate", date);
      formData.append("emojis", emojis);
      formData.append("hint_0", hints[0]);
      formData.append("hint_1", hints[1]);
      formData.append("hint_2", hints[2]);

      const result = await createPuzzleAction(formData);

      if (result.success) {
        setMessage({ type: 'success', text: "Puzzle created successfully!" });
        setSelectedGame(null);
        setEmojis("");
        setHints(["", "", ""]);
        setDate("");
      } else {
        setMessage({ type: 'error', text: result.message || "Failed to create puzzle." });
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border dark:border-gray-800">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Gamepad2 className="text-indigo-500" />
        Create New Puzzle
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* DATE & EMOJIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Puzzle Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium mb-1">Emojis</label>
              <input 
                type="text" 
                placeholder="🔫, 🐕, 👻"
                value={emojis}
                onChange={(e) => setEmojis(e.target.value)}
                className="w-full p-2 border rounded text-lg dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
        </div>

        {/* GAME SEARCH */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Find Game (IGDB)</label>
          
          {!selectedGame ? (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Type to search..."
                value={query}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown} // <--- Hooked up keyboard here
                className="pl-10 w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              
              {/* Spinner */}
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                   <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                </div>
              )}

              {/* Dropdown Results */}
              {results.length > 0 && (
                <ul 
                    ref={resultsRef}
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded shadow-lg max-h-60 overflow-y-auto"
                >
                  {results.map((game, index) => (
                    <li 
                      key={game.id}
                      onClick={() => selectGame(game)}
                      // Conditional styling for keyboard focus
                      className={`p-3 cursor-pointer flex items-center gap-3 border-b last:border-0 transition-colors
                        ${index === focusedIndex ? 'bg-indigo-100 dark:bg-indigo-900' : 'hover:bg-indigo-50 dark:hover:bg-gray-700'}
                      `}
                    >
                      {game.coverUrl ? (
                        <img src={game.coverUrl} alt="cover" className="w-8 h-10 object-cover rounded" />
                      ) : (
                         <div className="w-8 h-10 bg-gray-200 rounded" />
                      )}
                      <div>
                        <div className="font-semibold text-sm">{game.name}</div>
                        <div className="text-xs text-gray-500">{game.year}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            // SELECTED GAME CARD
            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 rounded">
              <div className="flex items-center gap-3">
                {selectedGame.coverUrl && (
                  <img src={selectedGame.coverUrl} alt="cover" className="w-10 h-14 object-cover rounded shadow" />
                )}
                <div>
                  <div className="font-bold text-indigo-700 dark:text-indigo-300">{selectedGame.name}</div>
                  <div className="text-xs text-indigo-500">{selectedGame.year}</div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedGame(null)}
                className="p-1 hover:bg-indigo-200 rounded-full"
              >
                <X className="h-5 w-5 text-indigo-600" />
              </button>
            </div>
          )}
        </div>

        {/* HINTS */}
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-100 dark:border-gray-800">
          <label className="block text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Hints
          </label>
          {hints.map((hint, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`Hint #${idx + 1}`}
              value={hint}
              onChange={(e) => updateHint(idx, e.target.value)}
              className="w-full p-2 border rounded text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          ))}
        </div>

        {/* SUBMIT */}
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting || !selectedGame}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded font-medium disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Creating..." : (
              <>
                <Save className="h-4 w-4" />
                Create Puzzle
              </>
            )}
          </button>
        </div>
        
        {/* MESSAGE */}
        {message && (
          <div className={`p-3 rounded text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}