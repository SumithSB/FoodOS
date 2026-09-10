// IndexedDB cache: products, resolver results, manufacturer replies,
// and a log of unresolved tokens for manual knowledge-base extension.
// Plain native IndexedDB — no extra dependency.

import type { ProductRecord } from './openFoodFacts.ts'

export interface ReplyRecord {
  key: string
  brand: string
  ingredientId: string
  resolution: 'plant' | 'animal' | 'unclear'
  note: string
  updatedAt: number
}

const DB_NAME = 'ingredient-check'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('products')) db.createObjectStore('products')
      if (!db.objectStoreNames.contains('resolver')) db.createObjectStore('resolver')
      if (!db.objectStoreNames.contains('replies')) db.createObjectStore('replies')
      if (!db.objectStoreNames.contains('unresolved')) db.createObjectStore('unresolved')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function get<T>(store: string, key: string): Promise<T | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

async function put(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value, key)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}

async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve((req.result as T[]) ?? [])
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export const getCachedProduct = (barcode: string) =>
  get<ProductRecord>('products', barcode.trim())
export const putCachedProduct = (product: ProductRecord) =>
  put('products', product.barcode, product)

export const getCachedResolution = (token: string) =>
  get<{ ruleId: string | null }>('resolver', token.trim().toLowerCase())
export const putCachedResolution = (token: string, ruleId: string | null) =>
  put('resolver', token.trim().toLowerCase(), { ruleId })

/** Log an unresolved token for manual knowledge-base extension. */
export function logUnresolved(token: string): Promise<void> {
  const key = token.trim().toLowerCase()
  if (!key) return Promise.resolve()
  return put('unresolved', `${Date.now()}-${key}`, { token: key, at: Date.now() }).catch(
    () => {},
  )
}

export const getReply = (key: string) => get<ReplyRecord>('replies', key)
export const putReply = (reply: ReplyRecord) => put('replies', reply.key, reply)
export const getAllReplies = () => getAll<ReplyRecord>('replies')
