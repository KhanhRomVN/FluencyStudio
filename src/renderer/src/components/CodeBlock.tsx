import React, { useEffect, useRef } from 'react';

// Define Window interface to include require for AMD loader
declare global {
  interface Window {
    require: any;
    monaco: any;
    monacoLoadingPromise?: Promise<void>;
  }
}

export interface CodeBlockThemeRule {
  token: string;
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

export interface CodeBlockThemeConfig {
  background?: string;
  foreground?: string;
  rules?: CodeBlockThemeRule[];
}

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  themeConfig?: CodeBlockThemeConfig;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  readOnly?: boolean;
  highlightText?: string | null;
  onChange?: (value: string) => void;
}

const FLUENCY_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '#61afef' }, // Blue for keys
    { token: 'string.value.json', foreground: '#9cdcfe' }, // Light Blue for string values
    { token: 'number', foreground: '#56b6c2' }, // Cyan for numbers
    { token: 'keyword.json', foreground: '#c678dd' }, // Purple for booleans/null
    { token: 'delimiter', foreground: '#abb2bf' }, // White/Grey for braces
  ],
  colors: {
    'editor.background': '#020617', // Very dark/slate-950 background to match UI
    'editor.foreground': '#abb2bf',
  },
};

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'json',
  className,
  themeConfig,
  wordWrap = 'on',
  readOnly = true,
  highlightText,
  onChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let mounted = true;

    const initMonaco = () => {
      if (!editorRef.current) return;

      try {
        if (editorInstance.current) {
          editorInstance.current.dispose();
        }

        let themeName = 'fluency-dark';

        // Always define our custom theme
        if (window.monaco) {
          const customRules =
            themeConfig?.rules?.map((r) => ({
              token: r.token,
              foreground: r.foreground?.replace('#', ''),
              background: r.background?.replace('#', ''),
              fontStyle: r.fontStyle,
            })) || [];

          window.monaco.editor.defineTheme(themeName, {
            ...FLUENCY_THEME,
            rules: [...FLUENCY_THEME.rules, ...customRules], // Allow overrides
            colors: {
              ...FLUENCY_THEME.colors,
              ...(themeConfig?.background ? { 'editor.background': themeConfig.background } : {}),
              ...(themeConfig?.foreground ? { 'editor.foreground': themeConfig.foreground } : {}),
            },
          });
        }

        editorInstance.current = window.monaco.editor.create(editorRef.current, {
          value: code,
          language: language,
          theme: themeName,
          readOnly: readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          wordWrap: wordWrap,
        });

        // Trigger change on edit
        if (onChangeRef.current) {
          subscriptionRef.current = editorInstance.current.onDidChangeModelContent(() => {
            // Avoid triggering onChange if the change was API-driven (like setValue)
            // However, setValue DOES trigger this.
            // But we only care that we call the LATEST onChange handler.
            const value = editorInstance.current.getValue();
            onChangeRef.current?.(value);
          });
        }
      } catch (error) {
        console.error('Failed to create monaco editor instance:', error);
      }
    };

    const loadMonaco = () => {
      if (window.monaco) {
        initMonaco();
        return;
      }

      // Check global loading state to prevent race conditions
      if (!window.monacoLoadingPromise) {
        window.monacoLoadingPromise = new Promise((resolve) => {
          // If loader script is already in DOM but we don't have the promise (e.g. from server-side or previous run), find it
          const existingScript = document.querySelector('script[src*="vscode/loader.js"]');
          if (existingScript || window.require) {
            // Wait for window.require if it's not ready, then config
            const waitForRequire = setInterval(() => {
              if (window.require) {
                clearInterval(waitForRequire);
                resolve();
              }
            }, 50);
            return;
          }

          const script = document.createElement('script');
          // Use absolute path from public root
          script.src = '/monaco/vs/loader.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = (e) => console.error('Failed to load Monaco loader:', e);
          document.body.appendChild(script);
        });
      }

      // Wait for loader to be ready
      window.monacoLoadingPromise
        .then(() => {
          if (window.require) {
            window.require.config({ paths: { vs: '/monaco/vs' } });
            window.require(
              ['vs/editor/editor.main'],
              () => {
                if (mounted) initMonaco();
              },
              (err: any) => {
                console.error('Failed to load monaco editor modules:', err);
              },
            );
          }
        })
        .catch((err) => {
          console.warn('Monaco loading promise failed or cancelled:', err);
        });
    };

    loadMonaco();

    return () => {
      mounted = false;
      if (editorInstance.current) {
        editorInstance.current.dispose();
      }
    };
  }, [JSON.stringify(themeConfig), wordWrap, language, readOnly]);

  // Highlight Text Effect
  useEffect(() => {
    if (!editorInstance.current || !window.monaco) return;

    if (!highlightText) {
      // Clear decorations if no text to highlight
      const model = editorInstance.current.getModel();
      if (model) {
        editorInstance.current.deltaDecorations(
          editorInstance.current
            .getModel()
            .getAllDecorations()
            .filter((d: any) => d.options.className === 'code-highlight-line')
            .map((d: any) => d.id),
          [],
        );
      }
      return;
    }

    const model = editorInstance.current.getModel();
    if (!model) return;

    // Normalize text for search (escape special chars if needed, but simple string search might suffice)
    // We are searching for the string representation in the JSON, so we need to be careful.
    // If highlightText is "Hello", in JSON it appears as "Hello".
    // We might need to handle newlines or extensive formatting differences.
    // For now, let's try a simple search.

    // Better strategy: try to find the exact string occurrence.
    // Since `highlightText` might contain HTML tags (from RichTextParser),
    // it depends on what `activeElementContent` actually is.
    // In `RichTextParser`, `fullText` is passed. This is the raw HTML content of the paragraph.
    // In the JSON, it might be escaped. e.g. "<p>..." -> "\u003Cp\u003E..." or just "<p>..." depending on JSON.
    // `JSON.stringify` usually keeps "<p>" as "<p>" but escapes quotes.

    // Let's try to match the content. Only strictly match if we can find it.

    // We expect the JSON value to contain the text.
    const matches = model.findMatches(highlightText, false, false, false, null, true);

    if (matches && matches.length > 0) {
      // Highlight the first match for now, or all? Usually the specific one focused.
      // But finding the *exact* one corresponding to the emulator node is hard without ID mapping.
      // We will highlight all matches or just the first. Let's start with all.

      const newDecorations = matches.map((match: { range: any }) => ({
        range: match.range,
        options: {
          isWholeLine: false,
          className: 'code-highlight-line',
          glyphMarginClassName: 'code-highlight-glyph',
        },
      }));

      // We need to keep track of old decorations to remove them.
      // Since we don't have a ref for old decorations here easily without refactoring state,
      // we can clear all with specific class or just assume we clear previous.

      // Actually, simple way: remove all previous highlight decorations.
      const currentDecorations = model.getAllDecorations();
      const oldIds = currentDecorations
        .filter((d: any) => d.options.className === 'code-highlight-line')
        .map((d: any) => d.id);

      editorInstance.current.deltaDecorations(oldIds, newDecorations);

      // Reveal the first match
      if (matches[0]) {
        editorInstance.current.revealLineInCenter(matches[0].range.startLineNumber);
      }
    }
  }, [highlightText, code]); // Re-run if text or code changes

  // Update value
  useEffect(() => {
    if (editorInstance.current && editorInstance.current.getValue() !== code) {
      // Save cursor position and selection before updating
      const position = editorInstance.current.getPosition();
      const selection = editorInstance.current.getSelection();

      // Update the value
      editorInstance.current.setValue(code);

      // Restore cursor position and selection
      if (position) {
        editorInstance.current.setPosition(position);
      }
      if (selection) {
        editorInstance.current.setSelection(selection);
      }
    }
  }, [code]);

  // Update word wrap dynamically
  useEffect(() => {
    if (editorInstance.current) {
      editorInstance.current.updateOptions({ wordWrap });
    }
  }, [wordWrap]);

  return <div ref={editorRef} className={`w-full h-full min-h-[200px] ${className || ''}`} />;
};

export { CodeBlock };

// Add basic styles for the highlight
const style = document.createElement('style');
style.innerHTML = `
  .code-highlight-line {
    background-color: rgba(255, 255, 0, 0.3); /* Yellow highlight */
    border-radius: 2px;
  }
`;
document.head.appendChild(style);
