"use client";

const VALUES_KEY = "acheinovale:property-draft:v1";
const DATABASE_NAME = "acheinovale-property-drafts";
const STORE_NAME = "drafts";
const MEDIA_KEY = "property-media";

export type PropertyDraftValues = {
  values: Record<string, string>;
  updatedAt: string;
};

export type PropertyDraftMedia = {
  photos: Array<{ id: string; file: File }>;
  video: { id: string; file: File } | null;
  mediaOrder: string[];
  coverPhotoId: string | null;
};

const ignoredFields = new Set(["imageKeys", "videoKey", "mediaOrder", "neighborhoodId"]);

export function collectPropertyDraftValues(form: HTMLFormElement): PropertyDraftValues {
  const values: Record<string, string> = {};
  new FormData(form).forEach((value, name) => {
    if (typeof value === "string" && !ignoredFields.has(name)) values[name] = value;
  });
  return { values, updatedAt: new Date().toISOString() };
}

export function savePropertyDraftValues(form: HTMLFormElement) {
  const draft = collectPropertyDraftValues(form);
  localStorage.setItem(VALUES_KEY, JSON.stringify(draft));
  return draft;
}

export function loadPropertyDraftValues(): PropertyDraftValues | null {
  try {
    const raw = localStorage.getItem(VALUES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PropertyDraftValues;
    return parsed?.values && parsed.updatedAt ? parsed : null;
  } catch {
    return null;
  }
}

function openDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePropertyDraftMedia(media: PropertyDraftMedia) {
  const database = await openDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(media, MEDIA_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function loadPropertyDraftMedia(): Promise<PropertyDraftMedia | null> {
  const database = await openDraftDatabase();
  const media = await new Promise<PropertyDraftMedia | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(MEDIA_KEY);
    request.onsuccess = () => resolve((request.result as PropertyDraftMedia | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return media;
}

export async function clearPropertyDraft() {
  localStorage.removeItem(VALUES_KEY);
  const database = await openDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(MEDIA_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
