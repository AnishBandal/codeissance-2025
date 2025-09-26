import React, { createContext, useEffect, useState } from 'react';
import { 
  checkOnlineStatus, 
  subscribeToConnectivityChanges,
  getOfflineTimestamp
} from '@/utils/serviceWorkerUtils';

interface OfflineModeContextType {
  isOffline: boolean;
  lastOnlineTimestamp: number | null;
  checkConnection: () => Promise<boolean>;
}

export const OfflineModeContext = createContext<OfflineModeContextType>({
  isOffline: !navigator.onLine,
  lastOnlineTimestamp: navigator.onLine ? Date.now() : null,
  checkConnection: async () => navigator.onLine
});

export function OfflineModeProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastOnlineTimestamp, setLastOnlineTimestamp] = useState<number | null>(() => {
    // First check service worker stored timestamp
    const swTimestamp = getOfflineTimestamp();
    if (swTimestamp) return swTimestamp;
    
    // Fallback to our own stored timestamp
    const stored = localStorage.getItem('lastOnlineTimestamp');
    return navigator.onLine 
      ? Date.now() 
      : (stored ? parseInt(stored, 10) : null);
  });

  // Function to check connection status using service worker
  const checkConnection = async (): Promise<boolean> => {
    const online = await checkOnlineStatus();
    setIsOffline(!online);
    
    if (online) {
      setLastOnlineTimestamp(Date.now());
    }
    
    return online;
  };

  // Setup online/offline event handling
  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Subscribe to connectivity changes
    const unsubscribe = subscribeToConnectivityChanges((online) => {
      setIsOffline(!online);
      if (online) {
        setLastOnlineTimestamp(Date.now());
      }
    });
    
    // Periodically check connectivity
    const intervalId = setInterval(async () => {
      await checkConnection();
    }, 30000); // Check every 30 seconds
    
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  // Save last online timestamp to localStorage whenever it changes
  useEffect(() => {
    if (lastOnlineTimestamp) {
      localStorage.setItem('lastOnlineTimestamp', lastOnlineTimestamp.toString());
    }
  }, [lastOnlineTimestamp]);

  return (
    <OfflineModeContext.Provider value={{ isOffline, lastOnlineTimestamp, checkConnection }}>
      {children}
    </OfflineModeContext.Provider>
  );
}