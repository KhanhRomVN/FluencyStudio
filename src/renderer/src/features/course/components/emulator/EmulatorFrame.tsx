import React, { ReactNode, useMemo } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
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

const COLORS = ['primary', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'gray'];

const EmulatorToolbar = () => {
  const { applyFormat, activeFormats } = useEmulatorEdit();
  const [showColors, setShowColors] = React.useState(false);

  const ToolbarSeparator = () => <div className="w-px h-6 bg-border mx-2" />;

  const ToolbarButton = ({
    icon: Icon,
    onClick,
    isActive,
    label,
  }: {
    icon?: any;
    onClick?: () => void;
    isActive?: boolean;
    label?: string;
  }) => (
    <button
      className={`p-2 rounded transition-colors outline-none focus:ring-1 focus:ring-ring flex items-center justify-center min-w-[32px]
        ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
    >
      {Icon ? <Icon size={18} /> : <span className="text-sm font-bold">{label}</span>}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center p-2 rounded-lg bg-background border border-border shadow-sm">
        <div className="flex items-center space-x-0.5">
          <ToolbarButton
            icon={Bold}
            onClick={() => applyFormat('bold')}
            isActive={activeFormats.isBold}
            label="Bold (Ctrl+B)"
          />
          <ToolbarButton
            icon={Italic}
            onClick={() => applyFormat('italic')}
            isActive={activeFormats.isItalic}
            label="Italic (Ctrl+I)"
          />
          <ToolbarButton
            icon={Underline}
            onClick={() => applyFormat('underline')}
            isActive={activeFormats.isUnderline}
            label="Underline (Ctrl+U)"
          />
        </div>

        <ToolbarSeparator />

        <div className="flex items-center space-x-0.5">
          <ToolbarButton
            icon={Palette}
            onClick={() => setShowColors(!showColors)} // Toggle
            isActive={!!activeFormats.color || showColors}
            label="Color"
          />
        </div>

        <ToolbarSeparator />

        <div className="flex items-center space-x-0.5">
          <div className="relative flex items-center border border-border rounded overflow-hidden">
            <div className="w-12 py-1 pl-2 text-sm bg-transparent outline-none text-center select-none flex items-center justify-center font-medium">
              {parseInt(activeFormats.fontSize || '14')}
            </div>
            <div className="flex flex-col border-l border-border">
              <button
                className="px-1 h-[14px] flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const current = parseInt(activeFormats.fontSize || '14');
                  applyFormat('size', `${Math.min(40, current + 1)}px`);
                }}
              >
                <ChevronUp size={10} strokeWidth={3} />
              </button>
              <button
                className="px-1 h-[14px] flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-primary transition-colors border-t border-border"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const current = parseInt(activeFormats.fontSize || '14');
                  applyFormat('size', `${Math.max(10, current - 1)}px`);
                }}
              >
                <ChevronDown size={10} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        <ToolbarSeparator />

        <div className="flex items-center space-x-0.5">
          <ToolbarButton
            icon={AlignLeft}
            onClick={() => applyFormat('left')}
            isActive={activeFormats.align === 'left'}
          />
          <ToolbarButton
            icon={AlignCenter}
            onClick={() => applyFormat('center')}
            isActive={activeFormats.align === 'center'}
          />
          <ToolbarButton
            icon={AlignRight}
            onClick={() => applyFormat('right')}
            isActive={activeFormats.align === 'right'}
          />
        </div>
      </div>

      {/* Color Picker placed below */}
      {showColors && (
        <div className="flex items-center p-2 rounded-lg bg-background border border-border shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center space-x-1">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border border-border transition-transform hover:scale-110 ${activeFormats.color === color ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                style={{ backgroundColor: color === 'primary' ? 'hsl(var(--primary))' : color }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  applyFormat('color', color);
                  // Optional: setShowColors(false); if we want to close on selection
                }}
              />
            ))}
            <button
              className="ml-2 text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => applyFormat('color', undefined)} // Reset
              onMouseDown={(e) => e.preventDefault()}
            >
              Reset
            </button>
          </div>
        </div>
      )}
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
  );
};
