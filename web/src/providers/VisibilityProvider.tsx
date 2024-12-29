import React, {
  Context,
  createContext,
  useContext,
  useState,
  useEffect
} from "react";
import { useNuiEvent } from "../hooks/useNuiEvent";

const VisibilityCtx = createContext<VisibilityProviderValue | null>(null);

interface VisibilityProviderValue {
  setVisible: (visible: boolean) => void;
  visible: boolean;
}

export const VisibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  useNuiEvent<boolean>("setVisible", setVisible);

  useEffect(() => {
    if (visible) {
      setIsHidden(false);
    } else {
      const timeout = setTimeout(() => {
        setIsHidden(true);
      }, 300); 
      
      return () => clearTimeout(timeout);
    }
  }, [visible]);
  
  return (
    <VisibilityCtx.Provider
      value={{
        visible,
        setVisible,
      }}
    >
      <div
        className={`transition-opacity duration-300 ${
          visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ 
          height: "100%",
          display: isHidden ? 'none' : 'block'
        }}
      >
        {children}
      </div>
    </VisibilityCtx.Provider>
  );
};

export const useVisibility = () =>
  useContext<VisibilityProviderValue>(
    VisibilityCtx as Context<VisibilityProviderValue>
  );