import { useContext } from 'react';
import { OfflineModeContext } from '../contexts/OfflineModeContext';

export function useOfflineMode() {
  return useContext(OfflineModeContext);
}