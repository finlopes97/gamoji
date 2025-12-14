import { create } from 'zustand';

interface GameState {
  status: 'idle' | 'playing' | 'won'; // Removed 'paused'
  elapsedTime: number;
  penaltyTime: number;
  hintsRevealed: number;
  startTime: number | null;
  
  puzzle: any;

  initGame: (puzzleData: any) => void;
  startGame: () => void;
  resumeGame: (serverStartTimeISO: string, currentPenalties?: number) => void; 
  
  revealHint: () => void;
  submitGuess: (guess: string) => boolean;
  tick: () => void;
  getNextHintCost: () => number;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  elapsedTime: 0,
  penaltyTime: 0,
  hintsRevealed: 0,
  startTime: null,
  puzzle: null,

  initGame: (puzzleData) => set({ 
    puzzle: puzzleData,
    status: 'idle',
    elapsedTime: 0,
    penaltyTime: 0,
    hintsRevealed: 0,
    startTime: null
  }),

  startGame: () => set({ 
    status: 'playing', 
    startTime: Date.now() 
  }),

  resumeGame: (serverStartTimeISO, currentPenalties = 0) => {
    const start = new Date(serverStartTimeISO).getTime();
    const now = Date.now();
    const elapsed = now - start;

    set({
      status: 'playing',
      startTime: start,
      elapsedTime: elapsed,
      penaltyTime: currentPenalties
    });
  },
  
  getNextHintCost: () => {
    const { hintsRevealed } = get();
    if (hintsRevealed === 0) return 2000;  // 1st Hint: 2s
    if (hintsRevealed === 1) return 5000;  // 2nd Hint: 5s
    if (hintsRevealed === 2) return 10000; // 3rd Hint: 10s
    return 0;
  },

  revealHint: () => {
    const { hintsRevealed, penaltyTime, getNextHintCost } = get();
    if (hintsRevealed < 3) {
      const cost = getNextHintCost();
      set({ 
        hintsRevealed: hintsRevealed + 1,
        penaltyTime: penaltyTime + cost 
      });
    }
  },

  submitGuess: (guessName: string) => {
    const { puzzle, status } = get();
    if (status !== 'playing' || !puzzle) return false;

    // Normalize strings
    const cleanGuess = guessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSolution = puzzle.solution.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleanGuess === cleanSolution) {
      set({ status: 'won' });
      return true;
    } else {
      // WRONG GUESS: No penalty anymore, just return false
      return false;
    }
  },

  tick: () => {
    const { status, startTime } = get();
    if (status === 'playing' && startTime) {
      // Always calculate delta from Start Time, never trust increments
      const now = Date.now();
      set({ elapsedTime: now - startTime });
    }
  },
}));