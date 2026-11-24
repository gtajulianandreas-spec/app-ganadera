import React, { createContext, useContext } from 'react';
import type { Farm } from '../types/animal';
import type { UserRole } from '../types/userRole';

export interface FarmContextValue {
  selectedFarmId: string;
  setSelectedFarmId: (id: string) => void;
  farms: Farm[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isGlobalView: boolean;
  currentFarm?: Farm;
}

const FarmContext = createContext<FarmContextValue | null>(null);

export interface FarmProviderProps {
  value: FarmContextValue;
  children: React.ReactNode;
}

export const FarmProvider: React.FC<FarmProviderProps> = ({ value, children }) => {
  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};

export function useFarmContext(): FarmContextValue {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarmContext must be used within a FarmProvider');
  }
  return context;
}
