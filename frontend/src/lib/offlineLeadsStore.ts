// Offline Leads Store
// Responsible for persisting unsynced leads for 'processing' role users.
// Uses localStorage (simple, sufficient for moderate volume). Could be upgraded to IndexedDB if volume grows.

export interface OfflineLeadDraft {
  id: string;              // temporary client id (uuid)
  createdAt: number;       // timestamp for ordering
  payload: any;            // form data to send to server
  retryCount: number;      // number of attempts
  lastError?: string;      // last error message if failed
}

const STORAGE_KEY = 'offline_lead_queue_v1';

function readAll(): OfflineLeadDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as OfflineLeadDraft[];
  } catch {
    return [];
  }
}

function writeAll(queue: OfflineLeadDraft[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueLead(draft: Omit<OfflineLeadDraft, 'createdAt' | 'retryCount'>) {
  const queue = readAll();
  queue.push({ ...draft, createdAt: Date.now(), retryCount: 0 });
  writeAll(queue);
}

export function listLeads(): OfflineLeadDraft[] {
  return readAll().sort((a,b) => a.createdAt - b.createdAt);
}

export function removeLead(id: string) {
  const queue = readAll().filter(l => l.id !== id);
  writeAll(queue);
}

export function updateLead(id: string, partial: Partial<OfflineLeadDraft>) {
  const queue = readAll().map(l => l.id === id ? { ...l, ...partial } : l);
  writeAll(queue);
}

export function clearAll() {
  writeAll([]);
}
