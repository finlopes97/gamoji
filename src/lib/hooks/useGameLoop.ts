import { useEffect } from 'react';
import { useGameStore } from '@/lib/store/game';

export function useGameLoop() {
  const status = useGameStore((state) => state.status);
  const tick = useGameStore((state) => state.tick);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (status === 'playing') {
      // Update timer every 10ms
      intervalId = setInterval(() => {
        tick();
      }, 10);
    }

    return () => clearInterval(intervalId);
  }, [status, tick]);
}