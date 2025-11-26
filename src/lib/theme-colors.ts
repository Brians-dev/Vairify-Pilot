// Theme color definitions
// All colors converted from hex to HSL format

export type ThemeName = 'ocean' | 'emerald' | 'midnight' | 'crimson' | 'sunset' | 'obsidian' | 'rose' | 'tangerine';

export interface ThemeColors {
  primary: string; // HSL format: "h s% l%"
  secondary: string;
  accent: string;
  name: string;
  emoji: string;
  useCase: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  ocean: {
    primary: '204 52% 21%', // #1a3a52
    secondary: '172 70% 50%', // #2dd4bf
    accent: '188 91% 43%', // #06b6d4
    name: 'Ocean',
    emoji: '🔵',
    useCase: 'Trust, security, professionalism'
  },
  emerald: {
    primary: '162 85% 16%', // #064e3b
    secondary: '160 84% 39%', // #10b981
    accent: '158 64% 52%', // #34d399
    name: 'Emerald',
    emoji: '🟢',
    useCase: 'Growth, wellness, fresh start'
  },
  midnight: {
    primary: '243 48% 34%', // #312e81
    secondary: '258 90% 66%', // #8b5cf6
    accent: '258 92% 76%', // #a78bfa
    name: 'Midnight',
    emoji: '🟣',
    useCase: 'Luxury, mystery, exclusivity'
  },
  crimson: {
    primary: '0 63% 30%', // #7f1d1d
    secondary: '0 84% 60%', // #ef4444
    accent: '0 90% 71%', // #f87171
    name: 'Crimson',
    emoji: '🔴',
    useCase: 'Passion, energy, boldness'
  },
  sunset: {
    primary: '15 73% 28%', // #7c2d12
    secondary: '38 92% 50%', // #f59e0b
    accent: '43 96% 56%', // #fbbf24
    name: 'Sunset',
    emoji: '🟡',
    useCase: 'Warmth, optimism, excitement'
  },
  obsidian: {
    primary: '20 10% 4%', // #0c0a09
    secondary: '30 6% 25%', // #44403c
    accent: '30 6% 47%', // #78716c
    name: 'Obsidian',
    emoji: '⚫',
    useCase: 'Sophistication, power, OLED-friendly'
  },
  rose: {
    primary: '343 78% 30%', // #881337
    secondary: '347 87% 61%', // #f43f5e
    accent: '349 94% 72%', // #fb7185
    name: 'Rose',
    emoji: '🩷',
    useCase: 'Romance, elegance, femininity'
  },
  tangerine: {
    primary: '15 73% 28%', // #7c2d12 (same as sunset primary)
    secondary: '25 94% 53%', // #f97316
    accent: '25 95% 64%', // #fb923c
    name: 'Tangerine',
    emoji: '🟠',
    useCase: 'Energy, creativity, playfulness'
  }
};

export const defaultTheme: ThemeName = 'ocean';

/**
 * Convert HSL color string to hex
 * @param hsl - HSL color string in format "h s% l%" (e.g., "217 91% 60%")
 * @returns Hex color string (e.g., "#2563EB")
 */
export function hslToHex(hsl: string): string {
  const parts = hsl.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (!parts) {
    console.warn(`Invalid HSL format: ${hsl}`);
    return '#000000';
  }

  const h = parseFloat(parts[1]) / 360;
  const s = parseFloat(parts[2]) / 100;
  const l = parseFloat(parts[3]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Get theme by ID
 * @param id - Theme name identifier
 * @returns ThemeColors object
 */
export function getThemeById(id: ThemeName): ThemeColors {
  return themes[id];
}

/**
 * Get hex color for a theme color property
 * @param themeId - Theme name identifier
 * @param colorKey - Color property name ('primary', 'secondary', 'accent')
 * @returns Hex color string
 */
export function getThemeHexColor(themeId: ThemeName, colorKey: 'primary' | 'secondary' | 'accent'): string {
  const theme = getThemeById(themeId);
  return hslToHex(theme[colorKey]);
}

