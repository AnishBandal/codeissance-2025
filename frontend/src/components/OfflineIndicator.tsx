import { useState } from 'react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator = ({ className = '' }: OfflineIndicatorProps) => {
  const { isOffline, checkConnection } = useOfflineMode();
  const [isChecking, setIsChecking] = useState(false);

  // Don't show anything when online
  if (!isOffline) {
    return null;
  }

  const handleCheckConnection = async () => {
    setIsChecking(true);
    await checkConnection();
    setTimeout(() => setIsChecking(false), 1000);
  };

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-100 border border-amber-300 rounded-md px-4 py-2 shadow-md ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <span className="text-amber-800 font-medium">
            You're offline. Limited functionality available.
          </span>
        </div>
        
        <button 
          onClick={handleCheckConnection}
          disabled={isChecking}
          className="p-1 rounded hover:bg-amber-200 text-amber-700"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default OfflineIndicator;