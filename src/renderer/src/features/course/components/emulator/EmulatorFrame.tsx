import React, { ReactNode, useMemo } from 'react';
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
    <div className="flex justify-center h-full max-h-[850px] w-full items-center p-8">
      <div className="relative w-[375px] h-[812px] bg-gray-900 rounded-[3rem] shadow-2xl ring-8 ring-gray-950 overflow-hidden flex flex-col select-none">
        {/* Notch/Status Bar Area */}
        <div className="absolute top-0 inset-x-0 h-8 flex justify-center z-20 pointer-events-none">
          <div className="w-40 h-[30px] bg-black rounded-b-[1.25rem] relative">
            {/* Camera/Sensor dots simulation (optional detail) */}
            <div className="absolute top-0 right-10 w-2 h-2 bg-[#1a1a1a] rounded-full mt-2 mr-2"></div>
          </div>
        </div>

        {/* Screen Content */}
        <div
          className="flex-1 w-full h-full overflow-y-auto pt-10 pb-8 scrollbar-hide bg-background text-foreground relative z-10"
          style={themeStyles}
        >
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1 inset-x-0 h-6 flex justify-center items-center pointer-events-none z-20">
          <div className="w-32 h-1 bg-gray-100/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
