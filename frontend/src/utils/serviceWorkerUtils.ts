/**
 * Service worker communication utilities for offline support
 */

// Check if the app is online by trying to communicate with the service worker
export const checkOnlineStatus = async (): Promise<boolean> => {
  // First check navigator.onLine (fast but not always accurate)
  if (!navigator.onLine) {
    return false;
  }
  
  // If service worker isn't supported or registered, rely on navigator.onLine
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return navigator.onLine;
  }
  
  try {
    // Try to communicate with service worker for a more accurate check
    const messageChannel = new MessageChannel();
    
    // Create promise to wait for response
    const onlineStatusPromise = new Promise<boolean>((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.online ?? navigator.onLine);
      };
    });
    
    // Send message to service worker
    navigator.serviceWorker.controller.postMessage(
      'isOnline',
      [messageChannel.port2]
    );
    
    // Set timeout in case service worker doesn't respond
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(navigator.onLine), 3000);
    });
    
    // Race the response against timeout
    return await Promise.race([onlineStatusPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error checking online status:', error);
    return navigator.onLine;
  }
};

// Listen for online/offline events from service worker
export const subscribeToConnectivityChanges = (callback: (isOnline: boolean) => void): (() => void) => {
  const handleStatusChange = () => {
    callback(navigator.onLine);
  };
  
  // Listen for browser online/offline events
  window.addEventListener('online', handleStatusChange);
  window.addEventListener('offline', handleStatusChange);
  
  // Listen for service worker messages
  const handleSWMessage = (event: MessageEvent) => {
    if (event.data?.type === 'online') {
      callback(true);
    } else if (event.data?.type === 'offline') {
      callback(false);
    }
  };
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleSWMessage);
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleStatusChange);
    window.removeEventListener('offline', handleStatusChange);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    }
  };
};

// Get the timestamp when the app went offline
export const getOfflineTimestamp = (): number | null => {
  const timestamp = localStorage.getItem('sw_wentOfflineAt');
  return timestamp ? parseInt(timestamp, 10) : null;
};