import { useEffect, useState } from "react";

/** The time now in milliseconds, renewed every second while `on` (a running timer's clock). */
export function useTick(on: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    setNow(Date.now());
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [on]);
  return now;
}
