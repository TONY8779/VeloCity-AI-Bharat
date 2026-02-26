import { useState, useEffect, useRef } from 'react';

export const useAnimatedCounter = (target, duration = 1500, decimals = 0) => {
  const [value, setValue] = useState(0);
  const startTime = useRef(null);
  const startValue = useRef(0);
  const rafId = useRef(null);

  useEffect(() => {
    startValue.current = value;
    startTime.current = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue.current + (target - startValue.current) * eased;
      setValue(Number(current.toFixed(decimals)));
      if (progress < 1) rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [target, duration, decimals]);

  return value;
};
