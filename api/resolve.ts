// Vercel Edge Function entry. The implementation lives in
// proxy/resolve.ts so it can be unit-tested and shared; this file only
// exposes it on the /api/resolve route.

import { handleResolve } from '../proxy/resolve.ts'

export const config = { runtime: 'edge' }

export default function handler(req: Request): Promise<Response> {
  return handleResolve(req)
}
