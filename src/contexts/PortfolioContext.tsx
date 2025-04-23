import React, { createContext, useState, useContext } from 'react';

type PortfolioContextType = {
  shouldRefetchPortfolios: boolean;
  triggerPortfolioRefetch: () => void;
  resetPortfolioRefetch: () => void;
  newPortfolioId: string | null;
  setNewPortfolioId: (id: string | null) => void;
};

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldRefetchPortfolios, setShouldRefetchPortfolios] = useState(false);
  const [newPortfolioId, setNewPortfolioId] = useState<string | null>(null);

  const triggerPortfolioRefetch = () => {
    setShouldRefetchPortfolios(true);
  };

  const resetPortfolioRefetch = () => {
    setShouldRefetchPortfolios(false);
  };

  return (
    <PortfolioContext.Provider 
      value={{ 
        shouldRefetchPortfolios, 
        triggerPortfolioRefetch, 
        resetPortfolioRefetch,
        newPortfolioId,
        setNewPortfolioId
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolioContext = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolioContext must be used within a PortfolioProvider');
  }
  return context;
};