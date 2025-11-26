import { useTheme } from '@/hooks/useTheme';
import { themes, ThemeName } from '@/lib/theme-colors';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const currentTheme = themes[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          <span className="hidden sm:inline">{currentTheme.emoji} {currentTheme.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {Object.entries(themes).map(([key, themeData]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setTheme(key as ThemeName)}
            className={`flex items-center gap-3 cursor-pointer ${
              theme === key ? 'bg-accent/10' : ''
            }`}
          >
            <span className="text-xl">{themeData.emoji}</span>
            <div className="flex-1">
              <div className="font-medium">{themeData.name}</div>
              <div className="text-xs text-muted-foreground">{themeData.useCase}</div>
            </div>
            {theme === key && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}







