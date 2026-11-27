// Ordem das mídias de um anúncio. A capa é sempre a primeira foto; por isso, mover um item
// pode trocar a capa, e um vídeo nunca pode ficar na frente (o servidor recusa).

type MediaKey<T> = { key: (item: T) => string; isImage: (item: T) => boolean };

function keepsPhotoFirst<T>(list: readonly T[], { isImage }: MediaKey<T>) {
  return !list.length || !list.some(isImage) || isImage(list[0]);
}

export function moveMediaItem<T>(list: readonly T[], id: string, direction: -1 | 1, helpers: MediaKey<T>): T[] {
  const index = list.findIndex(item => helpers.key(item) === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return keepsPhotoFirst(next, helpers) ? next : [...list];
}

export function reorderMediaItem<T>(list: readonly T[], sourceId: string, targetId: string, helpers: MediaKey<T>): T[] {
  const source = list.findIndex(item => helpers.key(item) === sourceId);
  const target = list.findIndex(item => helpers.key(item) === targetId);
  if (source < 0 || target < 0 || source === target) return [...list];
  const next = [...list];
  next.splice(target, 0, next.splice(source, 1)[0]);
  return keepsPhotoFirst(next, helpers) ? next : [...list];
}

export function firstPhoto<T>(list: readonly T[], helpers: MediaKey<T>): T | undefined {
  return list.find(helpers.isImage);
}
