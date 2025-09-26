import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getDrafts, putDraft, deleteDraft, updateDraft, DraftRecord } from '@/lib/idb';
import apiClient from '@/services/api';

interface UseOfflineLeadSyncOptions {
  role: string | undefined;
  apiUrl: string; // e.g. 'http://localhost:5000/api/leads/sync'
  autoSyncDelay?: number; // ms delay after coming online
  maxRetries?: number;
}

interface SyncStats {
  processing: boolean;
  pending: number;
  lastSyncAt?: number;
  lastError?: string;
}

export interface LeadDraftPayload {
  customerName: string;
  phone: string;
  email: string;
  productType: string;
  loanAmount?: string;
  customerAge: number;  // Changed to number to match online submission
  customerOccupation?: string;
  customerIncome?: string;
  region?: string;
  notes?: string;
  savedOfflineAt: string;
  status: string;      // Added to match online submission
  
  // Required fields for backend validation
  creditScore: number;  
  salary: number;       
}

const LOCAL_STORAGE_KEY = 'offline_lead_queue_v1';

async function migrateLocalStorageToIDB() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || !arr.length) return;
    for (const legacy of arr) {
      await putDraft<LeadDraftPayload>({
        id: legacy.id || crypto.randomUUID(),
        createdAt: legacy.createdAt || Date.now(),
        payload: legacy.payload || legacy, // fallback
        retryCount: legacy.retryCount || 0,
        lastError: legacy.lastError
      });
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.success('Migrated offline drafts to secure storage');
  } catch {
    // silent fail
  }
}

export function useOfflineLeadSync({ role, apiUrl, autoSyncDelay = 800, maxRetries = 3 }: UseOfflineLeadSyncOptions) {
  const [queue, setQueue] = useState<DraftRecord<LeadDraftPayload>[]>([]);
  const [processing, setProcessing] = useState(false);
  const onlineRef = useRef<boolean>(navigator.onLine);
  const loadingRef = useRef(false);

  const loadQueue = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const drafts = await getDrafts<LeadDraftPayload>();
    drafts.sort((a,b) => a.createdAt - b.createdAt);
    setQueue(drafts);
    loadingRef.current = false;
  }, []);

  useEffect(() => { migrateLocalStorageToIDB().then(loadQueue); }, [loadQueue]);

  const enqueue = useCallback(async (payload: LeadDraftPayload) => {
    if (role !== 'processing') {
      toast.error('Offline save only allowed for Processing role');
      return;
    }
    const record: DraftRecord<LeadDraftPayload> = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      payload,
      retryCount: 0
    };
    await putDraft(record);
    await loadQueue();
    toast.success('Lead saved offline');
  }, [role, loadQueue]);

  const attemptSync = useCallback(async () => {
    if (processing) return;
    if (!navigator.onLine) return;
    if (role !== 'processing') return;
    const current = await getDrafts<LeadDraftPayload>();
    if (!current.length) return;

    setProcessing(true);
    let successCount = 0;
    let transientNetworkFailure = false;

    for (const draft of current) {
      try {
        // Validate the payload before attempting to sync
        const { customerName, phone, email, productType, creditScore, salary, customerAge } = draft.payload;
        
        // Validate required fields
        if (!customerName || !phone || !email || !productType) {
          throw new Error('Missing required fields: customer information');
        }
        
        // Validate creditScore and salary
        if (typeof creditScore !== 'number' || isNaN(creditScore) || creditScore < 300 || creditScore > 850) {
          throw new Error('Invalid credit score: must be a number between 300-850');
        }
        
        if (typeof salary !== 'number' || isNaN(salary) || salary <= 0) {
          throw new Error('Invalid salary: must be a positive number');
        }
        
        if (typeof customerAge !== 'number' || isNaN(customerAge) || customerAge < 18) {
          throw new Error('Invalid age: must be at least 18');
        }
        
        // Use apiClient which automatically handles auth tokens via interceptors
        const endpoint = apiUrl.startsWith('http') 
          ? apiUrl.replace(/^http:\/\/localhost:5000\/api/, '') // Convert full URL to relative path
          : apiUrl; // Already a relative path
        
        // Check if required fields are present and log for debugging
        console.log('Syncing lead with payload:', {
          creditScore: draft.payload.creditScore,
          salary: draft.payload.salary,
          name: draft.payload.customerName,
          age: draft.payload.customerAge
        });
          
        const res = await apiClient.post(endpoint, draft.payload);
        
        // apiClient automatically throws for non-2xx responses
        await deleteDraft(draft.id);
        successCount++;
        toast.success('Synced offline lead');
      } catch (e) {
        // Use more specific type for axios errors
        const err = e as Error & { 
          isAxiosError?: boolean;
          response?: {
            status: number;
            data?: {
              message?: string;
              details?: string[];
            }
          }
        };
        // Enhanced error handling for axios errors
        let errorMessage = 'Unknown error';
        let isNetworkLike = false;
        
        if (err.isAxiosError) {
          // Handle axios specific errors
          if (!err.response) {
            // Network error (no response received)
            isNetworkLike = true;
            errorMessage = 'Network error - Unable to reach server';
          } else {
            // Server returned an error response
            const status = err.response.status;
            const data = err.response.data;
            
            if (status === 401) {
              errorMessage = 'Authentication failed - Please log in again';
              // No need to retry auth failures
              await deleteDraft(draft.id);
              toast.error(errorMessage);
              continue;
            } else if (status === 403) {
              errorMessage = 'Permission denied - Your role cannot submit leads';
              // No need to retry permission failures
              await deleteDraft(draft.id);
              toast.error(errorMessage);
              continue;
            } else if (status === 400 && data?.details) {
              // Validation error with details
              errorMessage = `Validation error: ${data.details.join(', ')}`;
            } else {
              errorMessage = data?.message || `Error ${status}: ${err.message}`;
            }
          }
        } else {
          // Non-axios error
          errorMessage = err.message || 'Unknown error occurred';
          isNetworkLike = err.name === 'TypeError' || /Failed to fetch|NetworkError|CORS/i.test(errorMessage);
        }
        
        if (isNetworkLike) {
          // Treat as transient; do not increment retry count this round
          transientNetworkFailure = true;
          toast.message('Network unavailable during sync; will retry later');
          continue; // Skip to next draft; keep it intact
        }
        
        const nextRetry = draft.retryCount + 1;
        if (nextRetry >= maxRetries) {
          await updateDraft(draft.id, { retryCount: nextRetry, lastError: errorMessage });
          toast.error(`Permanent failure syncing lead: ${errorMessage}`);
        } else {
          await updateDraft(draft.id, { retryCount: nextRetry, lastError: errorMessage });
          toast.error(`Sync failed (retry ${nextRetry}/${maxRetries})`);
        }
      }
    }

    setProcessing(false);
    await loadQueue();
    if (successCount) {
      toast.success(`Offline sync complete: ${successCount} uploaded`);
    } else if (transientNetworkFailure) {
      // Optional: schedule a gentle retry
      setTimeout(() => { if (navigator.onLine) attemptSync(); }, 4000);
    }
  }, [apiUrl, maxRetries, processing, role, loadQueue]);

  // Listen to online/offline transitions
  useEffect(() => {
    const handleOnline = () => {
      onlineRef.current = true;
      // small delay to allow backend to be reachable
      setTimeout(() => attemptSync(), autoSyncDelay);
    };
    const handleOffline = () => { onlineRef.current = false; };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptSync, autoSyncDelay]);

  const manualSync = useCallback(() => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline');
      return;
    }
    attemptSync();
  }, [attemptSync]);

  const stats: SyncStats = {
    processing,
    pending: queue.length,
  };

  return { queue, enqueue, manualSync, attemptSync, stats, isOnline: navigator.onLine };
}
