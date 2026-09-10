// Open Food Facts lookup: barcode -> product record.
// Only barcode lookup needs connectivity; classification itself is offline.

export interface ProductRecord {
  barcode: string
  name: string | null
  brand: string | null
  ingredientsText: string | null
  allergensText: string | null
  imageUrl: string | null
}

interface OffResponse {
  status?: number
  product?: {
    product_name?: string
    brands?: string
    ingredients_text?: string
    allergens?: string
    image_url?: string
  }
}

export async function fetchProduct(barcode: string): Promise<ProductRecord | null> {
  const code = barcode.trim()
  if (!code) return null
  const url =
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json` +
    `?fields=product_name,brands,ingredients_text,allergens,image_url`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Open Food Facts request failed (${res.status})`)
  const data = (await res.json()) as OffResponse
  if (data.status !== 1 || !data.product) return null
  const p = data.product
  return {
    barcode: code,
    name: p.product_name?.trim() || null,
    brand: p.brands?.split(',')[0]?.trim() || null,
    ingredientsText: p.ingredients_text?.trim() || null,
    allergensText: p.allergens?.trim() || null,
    imageUrl: p.image_url ?? null,
  }
}
