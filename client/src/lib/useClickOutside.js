import { useEffect } from 'react';

export default function useClickOutside(ref, handler) {
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    const onKey = (e) => e.key === 'Escape' && handler();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, handler]);
}
