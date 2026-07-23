/**
 * Native IndexedDB adapter for local document revisions history.
 * Keeps data locally on the client's device to uphold the privacy doctrine.
 */

export interface Revision {
  id?: number;
  documentId: string;
  timestamp: string;
  markdown: string;
  title: string;
  wordCount: number;
  charCount: number;
}

const DB_NAME = 'seamdoc_db';
const DB_VERSION = 1;
const STORE_NAME = 'revisions';

// In-memory fallback for environments without IndexedDB (e.g. Server-Side Rendering or Node tests)
let inMemoryRevisions: Revision[] = [];
let nextInMemoryId = 1;

export function initDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Fallback if indexedDB is not available (e.g. server-side rendering or older browsers)
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (_event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('documentId', 'documentId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

function calculateStats(markdown: string) {
  const cleanText = markdown
    .replace(/[#*`_[\]()\-+]/g, ' ') // remove simple markdown chars
    .trim();
  const wordCount = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
  const charCount = markdown.length;
  return { wordCount, charCount };
}

export async function getRevisions(documentId = 'default'): Promise<Revision[]> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    const results = inMemoryRevisions.filter((r) => r.documentId === documentId);
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return results;
  }

  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('documentId');
    const request = index.getAll(IDBKeyRange.only(documentId));

    request.onerror = () => {
      reject(request.error || new Error('Failed to get revisions'));
    };

    request.onsuccess = () => {
      const results = (request.result as Revision[]) || [];
      // Sort by timestamp descending
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(results);
    };
  });
}

export async function saveRevision(
  markdown: string,
  title: string,
  documentId = 'default',
): Promise<Revision | null> {
  const { wordCount, charCount } = calculateStats(markdown);

  if (typeof window === 'undefined' || !window.indexedDB) {
    const existing = inMemoryRevisions.filter((r) => r.documentId === documentId);
    existing.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (existing.length > 0 && existing[0]?.markdown === markdown) {
      return null;
    }
    const newRevision: Revision = {
      id: nextInMemoryId++,
      documentId,
      timestamp: new Date().toISOString(),
      markdown,
      title: title || 'Untitled',
      wordCount,
      charCount,
    };
    inMemoryRevisions.push(newRevision);
    // Keep only the 50 most recent
    if (inMemoryRevisions.filter((r) => r.documentId === documentId).length > 50) {
      inMemoryRevisions.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      const keep = inMemoryRevisions.slice(0, 50);
      inMemoryRevisions = keep;
    }
    return newRevision;
  }

  const db = await initDb();

  // Get current revisions to check duplicates and limit size
  const existing = await getRevisions(documentId);

  // If identical content to the most recent one, do not save a duplicate
  if (existing.length > 0 && existing[0]?.markdown === markdown) {
    return null;
  }

  const newRevision: Revision = {
    documentId,
    timestamp: new Date().toISOString(),
    markdown,
    title: title || 'Untitled',
    wordCount,
    charCount,
  };

  const savedRevision = await new Promise<Revision>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(newRevision);

    request.onerror = () => {
      reject(request.error || new Error('Failed to save revision'));
    };

    request.onsuccess = () => {
      resolve({ ...newRevision, id: request.result as number });
    };
  });

  // Prune history to keep only the 50 most recent entries
  if (existing.length >= 50) {
    // The existing array is sorted descending, so everything from index 49 onwards needs to be pruned
    const toPrune = existing.slice(49);
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    for (const rev of toPrune) {
      if (rev.id !== undefined) {
        store.delete(rev.id);
      }
    }
  }

  return savedRevision;
}

export async function deleteRevision(id: number): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    inMemoryRevisions = inMemoryRevisions.filter((r) => r.id !== id);
    return;
  }

  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      reject(request.error || new Error('Failed to delete revision'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function clearAllRevisions(documentId = 'default'): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    inMemoryRevisions = inMemoryRevisions.filter((r) => r.documentId !== documentId);
    return;
  }

  const db = await initDb();
  const existing = await getRevisions(documentId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    for (const rev of existing) {
      if (rev.id !== undefined) {
        store.delete(rev.id);
      }
    }

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error || new Error('Failed to clear revisions'));
    };
  });
}
