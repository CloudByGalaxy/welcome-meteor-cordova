import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    // @ts-ignore
    window.setMode = (mode) => {
      if (mode === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
  }, []);

  return { darkMode, toggleDarkMode };
}
