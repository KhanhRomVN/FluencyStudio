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
  onChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);

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
        if (onChange) {
          subscriptionRef.current = editorInstance.current.onDidChangeModelContent(() => {
            const value = editorInstance.current.getValue();
            onChange(value);
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

  // Update value
  useEffect(() => {
    if (editorInstance.current && editorInstance.current.getValue() !== code) {
      editorInstance.current.setValue(code);
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
