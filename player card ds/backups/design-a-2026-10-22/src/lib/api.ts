import type {
  Character, CharacterSummary, CompendiumEntry, MetaResponse, SearchResponse,
} from '@/types'

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  })
  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = { error: text } }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data as T
}

export interface SearchParams {
  q?: string
  type?: string
  level?: string | number
  school?: string
  class?: string
  rarity?: string
  kind?: string
  book?: string
  chapter?: string
  ritual?: boolean
  concentration?: boolean
  limit?: number
  offset?: number
}

function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue
    sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const api = {
  meta: () => req<MetaResponse>('/api/meta'),

  listCharacters: () => req<{ characters: CharacterSummary[] }>('/api/characters'),
  getCharacter: (id: string) => req<Character>(`/api/characters/${encodeURIComponent(id)}`),
  createCharacter: (body: Partial<Character> = {}) =>
    req<Character>('/api/characters', { method: 'POST', body: JSON.stringify(body) }),
  saveCharacter: (c: Character) =>
    req<Character>(`/api/characters/${encodeURIComponent(c.id)}`, { method: 'PUT', body: JSON.stringify(c) }),
  deleteCharacter: (id: string) =>
    req<{ ok: boolean }>(`/api/characters/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  duplicateCharacter: (id: string) =>
    req<Character>(`/api/characters/${encodeURIComponent(id)}/duplicate`, { method: 'POST' }),
  uploadPortrait: (id: string, dataUrl: string | null) =>
    req<Character>(`/api/characters/${encodeURIComponent(id)}/portrait`, { method: 'POST', body: JSON.stringify({ dataUrl }) }),
  backups: (id: string) =>
    req<{ backups: { file: string; size: number; savedAt: number }[] }>(`/api/characters/${encodeURIComponent(id)}/backups`),
  restoreBackup: (id: string, file: string) =>
    req<Character>(`/api/characters/${encodeURIComponent(id)}/restore`, { method: 'POST', body: JSON.stringify({ file }) }),

  search: (params: SearchParams) => req<SearchResponse>(`/api/search${qs(params as Record<string, unknown>)}`),
  browse: (params: SearchParams) => req<SearchResponse>(`/api/compendium${qs(params as Record<string, unknown>)}`),
  getEntry: (uid: string) => req<CompendiumEntry>(`/api/compendium/${encodeURIComponent(uid)}`),
  rebuild: () => req<MetaResponse['compendium']>('/api/compendium/rebuild', { method: 'POST' }),

  getSettings: () => req<{ settings: MetaResponse['settings']; database: MetaResponse['database'] }>('/api/settings'),
  saveSettings: (databaseDir: string) =>
    req<{ settings: MetaResponse['settings']; database: MetaResponse['database']; compendium: MetaResponse['compendium'] }>(
      '/api/settings',
      { method: 'PUT', body: JSON.stringify({ databaseDir }) },
    ),
}
