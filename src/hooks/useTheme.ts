import { useEffect, useState } from 'react';
import { ThemeName, defaultTheme } from '@/lib/theme-colors';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    // Get theme from localStorage or use default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vairify-theme');
      if (stored && ['ocean', 'emerald', 'midnight', 'crimson', 'sunset', 'obsidian', 'rose', 'tangerine'].includes(stored)) {
        return stored as ThemeName;
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove(
      'theme-ocean',
      'theme-emerald',
      'theme-midnight',
      'theme-crimson',
      'theme-sunset',
      'theme-obsidian',
      'theme-rose',
      'theme-tangerine'
    );
    
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    
    // Save to localStorage
    localStorage.setItem('vairify-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}







