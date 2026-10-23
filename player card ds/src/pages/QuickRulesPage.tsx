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
