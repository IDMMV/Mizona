import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ThemeProvider({ children }) {
  const { theme } = useApp();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
}
