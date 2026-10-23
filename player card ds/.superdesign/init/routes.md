# Routes — hash router

Router source: `src/lib/router.ts` (full file below). No React Router.

| URL | Page component | Layout | Notes |
|---|---|---|---|
| `#/char/:id` | `src/pages/CharacterPage.tsx` | `App.tsx` shell | Main character sheet; id is selected from the hash |
| `#/rules` | `src/pages/RulebookPage.tsx` | `App.tsx` shell | Rules library with `CompendiumExplorer` in page mode |
| `#/quick` | `src/pages/QuickRulesPage.tsx` | `App.tsx` shell | 33 quick-reference cards from `shared/quick-rules.json` |

Section anchors inside the character sheet (used by mobile nav and CSS scroll offset):
`abilities`, `combat`, `attacks`, `spells`, `resources`, `inventory`, `features`, `roleplay`.

```ts
import { useCallback, useEffect, useState } from 'react'

export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = useCallback((next: string) => {
    if (window.location.hash === next) return
    window.location.hash = next
  }, [])
  return { hash, navigate }
}

export function parseRoute(hash: string) {
  const h = hash.replace(/^#\/?/, '')
  const [page, ...rest] = h.split('/').filter(Boolean)
  return { page: page || 'char', rest }
}
```

## Rulebook page

```tsx
import { useEffect, useState } from 'react'
import { BookOpen, Database, FileText } from 'lucide-react'
import type { Character, MetaResponse, SearchResult } from '@/types'
import { api } from '@/lib/api'
import { CompendiumExplorer } from '@/components/CompendiumExplorer'
import { Badge, Panel } from '@/components/ui'

export function RulebookPage({
  character, onOpenSearch, onInsert,
}: {
  character: Character | null
  onOpenSearch: (type: string, query?: string) => void
  onInsert?: (r: SearchResult) => void
}) {
  const [meta, setMeta] = useState<MetaResponse | null>(null)
  useEffect(() => {
    api.meta().then(setMeta).catch(() => {})
  }, [])
  return (
    <div className="page-wrap">
      <Panel
        title={<><BookOpen size={17} /> 规则库</>}
        subtitle="玩家手册 + 城主指南全文检索；结构化条目可直接加入角色卡"
        actions={
          meta ? (
            <>
              <Badge tone="gold"><Database size={11} /> {meta.counts.all} 条结构化</Badge>
              <Badge><FileText size={11} /> {meta.counts.raw} 个原文文件</Badge>
            </>
          ) : null
        }
      >
        <CompendiumExplorer
          mode="page"
          character={character}
          onInsert={character ? onInsert : undefined}
          onOpenSearch={onOpenSearch}
          autoFocus
        />
      </Panel>
      <p className="hint" style={{ marginTop: 10, paddingLeft: 4 }}>
        PDF 页码来自原书提取，非印刷页码。结构化字段有解析失败风险时，以原文与页码为准。
      </p>
    </div>
  )
}
```

## Quick rules page

```tsx
import { useMemo, useState } from 'react'
import { BookOpen, Search, ShieldAlert } from 'lucide-react'
import quickRules from '@shared/quick-rules.json'
import type { QuickRulesFile } from '@/types'
import { Badge, Btn, Panel } from '@/components/ui'

const DATA = quickRules as unknown as QuickRulesFile

export function QuickRulesPage({ onOpenSearch }: { onOpenSearch: (type: string, query?: string) => void }) {
  const [active, setActive] = useState('all')
  const [q, setQ] = useState('')
  const categories = useMemo(() => {
    if (!q.trim()) return active === 'all' ? DATA.categories : DATA.categories.filter((c) => c.id === active)
    const needle = q.trim().toLowerCase()
    return DATA.categories
      .map((c) => ({ ...c, items: c.items.filter((i) => i.title.toLowerCase().includes(needle) || i.summary.some((s) => s.toLowerCase().includes(needle))) }))
      .filter((c) => c.items.length)
  }, [active, q])

  return (
    <div className="page-wrap">
      <Panel
        title={<><ShieldAlert size={17} /> 跑团速查</>}
        subtitle="常用动作、状态、休息、专注与难度；点「查看原文」可跳到规则库"
        actions={<Badge tone="gold">{DATA.categories.reduce((n, c) => n + c.items.length, 0)} 张速查卡</Badge>}
      >
        <div className="quick-toolbar">
          <div className="search-input-wrap" style={{ maxWidth: 360 }}>
            <Search size={15} />
            <input className="input" value={q} placeholder="筛选速查卡…" onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="quick-cat-nav">
          <button className={`type-tab ${active === 'all' && !q ? 'active' : ''}`} onClick={() => { setActive('all'); setQ('') }}>全部</button>
          {DATA.categories.map((c) => (
            <button key={c.id} className={`type-tab ${active === c.id ? 'active' : ''}`} onClick={() => { setActive(c.id); setQ('') }}>{c.title}</button>
          ))}
        </div>
        <div className="quick-grid">
          {categories.flatMap((cat) => cat.items.map((item) => (
            <article className="quick-card" key={`${cat.id}-${item.id}`}>
              <h3>{item.title}</h3>
              <ul>
                {item.summary.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
              <div className="q-foot">
                <span className="hint">{cat.title}{item.source ? ` · ${item.source.book}` : ''}</span>
                {item.searchName ? (
                  <Btn size="sm" variant="ghost" onClick={() => onOpenSearch('condition', item.searchName)}>
                    <BookOpen size={12} /> 状态详情
                  </Btn>
                ) : item.source ? (
                  <Btn size="sm" variant="ghost" onClick={() => onOpenSearch('raw', item.source!.query)}>
                    <BookOpen size={12} /> 查看原文
                  </Btn>
                ) : null}
              </div>
            </article>
          )))}
        </div>
        {categories.length === 0 && <div className="empty">没有匹配的速查卡。</div>}
      </Panel>
    </div>
  )
}
```
