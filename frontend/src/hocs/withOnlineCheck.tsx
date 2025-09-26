import React from 'react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import OfflineFallback from '@/components/OfflineFallback';

interface WithOnlineCheckProps {
  fallback?: React.ReactNode;
  requireOnline?: boolean;
  customOfflineProps?: {
    title?: string;
    message?: string;
    actionText?: string;
    actionLink?: string;
  };
}

/**
 * Higher-order component that shows an offline fallback when the user is offline
 * and the component requires online connectivity.
 */
export function withOnlineCheck<P extends object>(
  Component: React.ComponentType<P>,
  options: WithOnlineCheckProps = {}
): React.FC<P> {
  const {
    fallback,
    requireOnline = true,
    customOfflineProps,
  } = options;

  const WrappedComponent: React.FC<P> = (props) => {
    const { isOffline } = useOfflineMode();

    if (isOffline && requireOnline) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return <OfflineFallback {...customOfflineProps} />;
    }

    return <Component {...props} />;
  };

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withOnlineCheck(${displayName})`;

  return WrappedComponent;
}