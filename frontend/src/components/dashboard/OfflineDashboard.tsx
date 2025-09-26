import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Clock, WifiOff, RefreshCw } from 'lucide-react';

// Define a type for cached leads
interface CachedLead {
  customerName: string;
  email?: string;
  phone?: string;
  loanType?: string;
  createdAt: string;
  synced?: boolean;
  offlineId?: string;
}

const OfflineDashboard = () => {
  const { isOffline, lastOnlineTimestamp } = useOfflineMode();
  const { user } = useAuth();
  const [offlineTime, setOfflineTime] = useState<string>('');
  const [cachedLeads, setCachedLeads] = useState<CachedLead[]>([]);

  // Format the time elapsed since going offline
  useEffect(() => {
    if (!lastOnlineTimestamp) return;
    
    const formatOfflineTime = () => {
      const now = Date.now();
      const diffMs = now - lastOnlineTimestamp;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        setOfflineTime('just now');
      } else if (diffMins === 1) {
        setOfflineTime('1 minute ago');
      } else if (diffMins < 60) {
        setOfflineTime(`${diffMins} minutes ago`);
      } else {
        const hours = Math.floor(diffMins / 60);
        if (hours === 1) {
          setOfflineTime('1 hour ago');
        } else if (hours < 24) {
          setOfflineTime(`${hours} hours ago`);
        } else {
          const days = Math.floor(hours / 24);
          setOfflineTime(`${days} day${days > 1 ? 's' : ''} ago`);
        }
      }
    };

    formatOfflineTime();
    const interval = setInterval(formatOfflineTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [lastOnlineTimestamp]);

  // Try to load cached leads from localStorage
  useEffect(() => {
    try {
      const offlineLeadsJSON = localStorage.getItem('offlineLeads');
      if (offlineLeadsJSON) {
        const offlineLeads = JSON.parse(offlineLeadsJSON);
        setCachedLeads(offlineLeads);
      }
    } catch (error) {
      console.error('Error loading cached leads:', error);
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-100 rounded-full p-2">
              <WifiOff className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-900">You're working offline</h3>
              <p className="text-amber-700 text-sm">
                Last online: {lastOnlineTimestamp ? offlineTime : 'Unknown'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="text-amber-700 border-amber-300 hover:bg-amber-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">
          Welcome, {user?.username || 'User'}
        </h1>
        <p className="text-gray-600 mb-4">
          You have limited functionality while offline.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              Available Offline
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• View cached leads</li>
              <li>• Create new leads (will sync when online)</li>
              <li>• Access your user profile</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-2 text-gray-500">Limited Features</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Lead management features</li>
              <li>• Analytics and reporting</li>
              <li>• Document uploads</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/leads/new">
              Create New Lead
            </Link>
          </Button>
        </div>
      </div>

      {cachedLeads.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Recently Created Leads</h2>
          <div className="space-y-3">
            {cachedLeads.slice(0, 5).map((lead, index) => (
              <div 
                key={index} 
                className="p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <p className="font-medium">{lead.customerName}</p>
                <p className="text-sm text-gray-600">
                  Created offline • Will sync when online
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineDashboard;