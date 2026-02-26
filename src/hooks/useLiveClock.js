import { useState, useEffect } from 'react';

export const useLiveClock = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
      setTime(`${String(ist.getHours()).padStart(2, '0')}:${String(ist.getMinutes()).padStart(2, '0')}:${String(ist.getSeconds()).padStart(2, '0')}`);
      setDate(ist.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
      setSeconds(ist.getSeconds());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { time, date, seconds };
};
