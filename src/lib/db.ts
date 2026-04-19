export interface Project {
  id: string;
  title: string;
  description: string;
  aspectRatio: '16:9' | '9:16';
  imageSize: '1K' | '2K' | '4K';
  imageOptions: { base64: string; mimeType: string; url: string }[];
  selectedImageIndex: number | null;
  videoBlob: Blob | null;
  updatedAt: number;
  editHistory?: number[];
  historyPointer?: number;
}

const DB_NAME = 'solodesign_db';
const STORE_NAME = 'projects';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(project);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getProjects(): Promise<Project[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      // Sort by updatedAt descending
      const sorted = (req.result as Project[]).sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(sorted);
    };
    req.onerror = () => reject(tx.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
