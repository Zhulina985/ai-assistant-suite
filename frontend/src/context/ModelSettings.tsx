import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "useAiModel";

interface ModelSettingsContextValue {
  useModel: boolean;
  setUseModel: (value: boolean) => void;
  llmAvailable: boolean;
  backendConnected: boolean;
}

const ModelSettingsContext = createContext<ModelSettingsContextValue | null>(null);

export function ModelSettingsProvider({
  children,
  llmAvailable,
  backendConnected,
}: {
  children: ReactNode;
  llmAvailable: boolean;
  backendConnected: boolean;
}) {
  const [useModel, setUseModelState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === "true";
    return llmAvailable;
  });

  useEffect(() => {
    if (llmAvailable) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === null) setUseModelState(true);
    } else {
      setUseModelState(false);
    }
  }, [llmAvailable]);

  const setUseModel = (value: boolean) => {
    setUseModelState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  return (
    <ModelSettingsContext.Provider value={{ useModel, setUseModel, llmAvailable, backendConnected }}>
      {children}
    </ModelSettingsContext.Provider>
  );
}

export function useModelSettings() {
  const ctx = useContext(ModelSettingsContext);
  if (!ctx) throw new Error("useModelSettings must be used within ModelSettingsProvider");
  return ctx;
}
