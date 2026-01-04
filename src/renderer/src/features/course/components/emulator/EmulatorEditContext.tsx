import React, { createContext, useContext, useState, useCallback } from 'react';

type FormatType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'center'
  | 'left'
  | 'right'
  | 'justify'
  | 'color'
  | 'size';

interface EmulatorEditContextType {
  activeElementId: string | null;
  activeFormats: ActiveFormats;
  registerElement: (
    id: string,
    callbacks: { onFormat: (type: FormatType, value?: any) => void },
  ) => void;
  unregisterElement: (id: string) => void;
  setActiveElement: (id: string | null) => void;
  updateActiveFormats: (formats: ActiveFormats) => void;
  applyFormat: (type: FormatType, value?: any) => void;
}

export interface ActiveFormats {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  align: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: string;
}

const EmulatorEditContext = createContext<EmulatorEditContextType | undefined>(undefined);

export const EmulatorEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    align: 'left',
  });
  const [registry] = useState(
    new Map<string, { onFormat: (type: FormatType, value?: any) => void }>(),
  );

  const registerElement = useCallback(
    (id: string, callbacks: { onFormat: (type: FormatType, value?: any) => void }) => {
      registry.set(id, callbacks);
    },
    [registry],
  );

  const unregisterElement = useCallback(
    (id: string) => {
      registry.delete(id);
    },
    [registry],
  );

  const applyFormat = useCallback(
    (type: FormatType, value?: any) => {
      if (activeElementId && registry.has(activeElementId)) {
        registry.get(activeElementId)!.onFormat(type, value);
      }
    },
    [activeElementId, registry],
  );

  return (
    <EmulatorEditContext.Provider
      value={{
        activeElementId,
        activeFormats,
        registerElement,
        unregisterElement,
        setActiveElement: setActiveElementId,
        updateActiveFormats: setActiveFormats,
        applyFormat,
      }}
    >
      {children}
    </EmulatorEditContext.Provider>
  );
};

export const useEmulatorEdit = () => {
  const context = useContext(EmulatorEditContext);
  if (!context) {
    throw new Error('useEmulatorEdit must be used within an EmulatorEditProvider');
  }
  return context;
};
