import { useState } from "react";

const DEMO_MSG_KEY = "mystoria-demo-msg-count";
export const DEMO_LIMIT = 6;

export function useDemoLimit() {
  const [count, setCount] = useState<number>(() => {
    const stored = localStorage.getItem(DEMO_MSG_KEY);
    return stored ? parseInt(stored, 10) || 0 : 0;
  });

  const limitReached = count >= DEMO_LIMIT;

  const increment = () => {
    setCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(DEMO_MSG_KEY, String(next));
      return next;
    });
  };

  return { count, limitReached, increment };
}
