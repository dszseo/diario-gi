import { db } from './db'
import type { FavoriteMeal, MealItem } from './types'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'f-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function listFavorites(): Promise<FavoriteMeal[]> {
  return db.favoriteMeals.orderBy('name').toArray()
}

export async function createFavorite(name: string, items: MealItem[]): Promise<string> {
  const fav: FavoriteMeal = {
    id: uuid(),
    name: name.trim(),
    items: items.filter((i) => i.name.trim()),
    createdAt: Date.now(),
  }
  await db.favoriteMeals.add(fav)
  return fav.id
}

export async function updateFavorite(
  id: string,
  name: string,
  items: MealItem[],
): Promise<void> {
  await db.favoriteMeals.update(id, {
    name: name.trim(),
    items: items.filter((i) => i.name.trim()),
  })
}

export function deleteFavorite(id: string): Promise<void> {
  return db.favoriteMeals.delete(id)
}
