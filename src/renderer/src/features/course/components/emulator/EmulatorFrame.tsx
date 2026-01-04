import React, { ReactNode, useMemo } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { EmulatorEditProvider, useEmulatorEdit } from './EmulatorEditContext';
import DefaultDark from '../../../../assets/themes/DefaultDark.json';
import SoftTeal from '../../../../assets/themes/SoftTeal.json';

// Helper to convert hex to HSL for Tailwind CSS variables
const hexToHsl = (hex: string): string => {
  let c = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  const r = parseInt(c.slice(0, 2).join(''), 16) / 255;
  const g = parseInt(c.slice(2, 4).join(''), 16) / 255;
  const b = parseInt(c.slice(4, 6).join(''), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const THEMES = {
  DefaultDark,
  SoftTeal,
};

interface EmulatorFrameProps {
  children: ReactNode;
  theme?: keyof typeof THEMES;
}

const EmulatorToolbar = () => {
  const { applyFormat } = useEmulatorEdit();

  const ToolbarSeparator = () => <div className="w-px h-6 bg-border mx-2" />;

  const ToolbarButton = ({ icon: Icon, onClick }: { icon: any; onClick?: () => void }) => (
    <button
      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none focus:ring-1 focus:ring-ring"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="flex items-center p-2 rounded-lg bg-background border border-border shadow-sm">
      <div className="flex items-center space-x-0.5">
        <ToolbarButton icon={Bold} onClick={() => applyFormat('bold')} />
        <ToolbarButton icon={Italic} onClick={() => applyFormat('italic')} />
        <ToolbarButton icon={Underline} onClick={() => applyFormat('underline')} />
      </div>

      <ToolbarSeparator />

      <div className="flex items-center space-x-0.5">
        <ToolbarButton icon={Palette} onClick={() => console.log('Palette clicked')} />
      </div>

      <ToolbarSeparator />

      <div className="flex items-center space-x-0.5">
        <ToolbarButton icon={Type} onClick={() => console.log('Type clicked')} />
      </div>

      <ToolbarSeparator />

      <div className="flex items-center space-x-0.5">
        <ToolbarButton icon={AlignLeft} onClick={() => applyFormat('left')} />
        <ToolbarButton icon={AlignCenter} onClick={() => applyFormat('center')} />
        <ToolbarButton icon={AlignRight} onClick={() => applyFormat('right')} />
      </div>
    </div>
  );
};

export const EmulatorFrame: React.FC<EmulatorFrameProps> = ({ children, theme = 'SoftTeal' }) => {
  const themeStyles = useMemo(() => {
    const currentTheme = THEMES[theme];
    const colors = currentTheme.colors;

    return {
      '--background': hexToHsl(colors.background),
      '--foreground': hexToHsl(colors.textPrimary),
      '--card': hexToHsl(colors.cardBackground),
      '--card-foreground': hexToHsl(colors.textPrimary),
      '--popover': hexToHsl(colors.cardBackground),
      '--popover-foreground': hexToHsl(colors.textPrimary),
      '--primary': hexToHsl(colors.primary),
      '--primary-foreground': hexToHsl(colors.buttonText),
      '--secondary': hexToHsl(colors.buttonSecondBg),
      '--secondary-foreground': hexToHsl(colors.textPrimary),
      '--muted': hexToHsl(colors.sidebarBackground), // using sidebar as muted background
      '--muted-foreground': hexToHsl(colors.textSecondary),
      '--accent': hexToHsl(colors.buttonBgHover),
      '--accent-foreground': hexToHsl(colors.buttonText),
      '--destructive': '0 72.2% 50.6%', // Default destructive red
      '--destructive-foreground': '210 40% 98%',
      '--border': hexToHsl(colors.border),
      '--input': hexToHsl(colors.inputBorderDefault),
      '--ring': hexToHsl(colors.primary),
    } as React.CSSProperties;
  }, [theme]);

  return (
    <EmulatorEditProvider>
      <div className="flex flex-col h-full max-h-[900px] w-full items-center p-8 gap-6">
        <div
          className="relative w-[375px] h-[812px] bg-background border border-border overflow-hidden flex flex-col select-none rounded-md shadow-xl"
          style={themeStyles}
        >
          {/* Screen Content */}
          <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-background text-foreground relative z-10 ">
            {children}
          </div>
        </div>

        {/* Formatting Toolbar */}
        <EmulatorToolbar />
      </div>
    </EmulatorEditProvider>
  );
};
