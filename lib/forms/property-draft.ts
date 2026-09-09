"use client";

const VALUES_KEY_PREFIX = "acheinovale:property-draft:v1";
const DATABASE_NAME = "acheinovale-property-drafts";
const STORE_NAME = "drafts";
const MEDIA_KEY_PREFIX = "property-media";

function valuesKey(ownerKey: string) { return `${VALUES_KEY_PREFIX}:${ownerKey}`; }
function mediaKey(ownerKey: string) { return `${MEDIA_KEY_PREFIX}:${ownerKey}`; }

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

export function savePropertyDraftValues(ownerKey: string, form: HTMLFormElement) {
  const draft = collectPropertyDraftValues(form);
  localStorage.setItem(valuesKey(ownerKey), JSON.stringify(draft));
  return draft;
}

export function loadPropertyDraftValues(ownerKey: string): PropertyDraftValues | null {
  try {
    const raw = localStorage.getItem(valuesKey(ownerKey));
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

export async function savePropertyDraftMedia(ownerKey: string, media: PropertyDraftMedia) {
  const database = await openDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(media, mediaKey(ownerKey));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function loadPropertyDraftMedia(ownerKey: string): Promise<PropertyDraftMedia | null> {
  const database = await openDraftDatabase();
  const media = await new Promise<PropertyDraftMedia | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(mediaKey(ownerKey));
    request.onsuccess = () => resolve((request.result as PropertyDraftMedia | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return media;
}

export async function clearPropertyDraft(ownerKey: string) {
  localStorage.removeItem(valuesKey(ownerKey));
  const database = await openDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(mediaKey(ownerKey));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
