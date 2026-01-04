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
  registerElement: (
    id: string,
    callbacks: { onFormat: (type: FormatType, value?: any) => void },
  ) => void;
  unregisterElement: (id: string) => void;
  setActiveElement: (id: string | null) => void;
  applyFormat: (type: FormatType, value?: any) => void;
}

const EmulatorEditContext = createContext<EmulatorEditContextType | undefined>(undefined);

export const EmulatorEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
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
      if (activeElementId === id) {
        setActiveElementId(null);
      }
    },
    [registry, activeElementId],
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
        registerElement,
        unregisterElement,
        setActiveElement: setActiveElementId,
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
