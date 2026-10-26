import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Filter, Loader2, Plus, Search, Sparkles, X } from 'lucide-react'
import type { Character, SearchResult } from '@/types'
import { CLASS_NAMES, RARITIES, SCHOOLS } from '@/types'
import { api, type SearchParams } from '@/lib/api'
import { maxSpellLevel, totalLevel } from '@/lib/calc'
import { entrySubtitle, spellLevelLabel } from '@/lib/convert'
import { Highlight } from '@/components/Highlight'
import { Badge, Btn, Empty, Select, TextInput } from '@/components/ui'

const TYPE_LABEL: Record<string, string> = {
  all: '全部', spell: '法术', item: '魔法物品', feat: '专长', classFeature: '职业特性', speciesTrait: '种族特性', condition: '状态', equipment: '装备', raw: '规则全文',
}
const TYPE_TONE: Record<string, 'gold' | 'green' | 'blue' | 'red' | 'default'> = {
  spell: 'blue', item: 'gold', feat: 'green', classFeature: 'green', speciesTrait: 'green', condition: 'red', equipment: 'default', raw: 'default',
}
const CASTER_CLASSES = ['吟游诗人', '牧师', '德鲁伊', '圣武士', '游侠', '术士', '邪术师', '魔契师', '法师']
const SPECIES_NAMES = ['阿斯莫', '龙裔', '矮人', '精灵', '侏儒', '歌利亚', '半身人', '人类', '兽人', '提夫林']
const ITEM_KINDS = ['武器', '护甲', '盾牌', '奇物', '戒指', '权杖', '法杖', '魔杖', '药水', '卷轴']

export function CompendiumExplorer({
  mode = 'page', initialType = 'all', initialQuery = '', character, onInsert, onOpenSearch, autoFocus = false, open = true,
}: {
  mode?: 'page' | 'dialog'
  initialType?: string
  initialQuery?: string
  character?: Character | null
  onInsert?: (r: SearchResult) => void
  onOpenSearch?: (type: string, query?: string) => void
  autoFocus?: boolean
  open?: boolean
}) {
  const [q, setQ] = useState(initialQuery)
  const [type, setType] = useState(initialType || 'all')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [results, setResults] = useState<SearchResult[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [limit, setLimit] = useState(40)
  const reqId = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'dialog' && !open) return
    setType(initialType || 'all')
    setQ(initialQuery || '')
    setFilters({})
    setLimit(40)
    if (autoFocus) window.setTimeout(() => inputRef.current?.focus(), 60)
  }, [initialType, initialQuery, open, mode, autoFocus])

  const params = useMemo<SearchParams>(() => {
    const p: SearchParams = { q, type, limit }
    for (const [k, v] of Object.entries(filters)) if (v) (p as Record<string, unknown>)[k] = v
    return p
  }, [q, type, filters, limit])

  const load = useCallback(async () => {
    const id = ++reqId.current
    setLoading(true)
    setError(null)
    try {
      const res = q.trim() ? await api.search(params) : await api.browse(params)
      if (id !== reqId.current) return
      setResults(res.results)
      setCounts(res.counts as unknown as Record<string, number>)
      setTotal(res.total)
      setSelected((prev) => {
        if (prev) {
          const same = res.results.find((r) => r.uid === prev.uid)
          if (same) return same
        }
        return res.results[0] || null
      })
      if (res.error) setError(res.error)
    } catch (e) {
      if (id !== reqId.current) return
      setError(String((e as Error).message || e))
      setResults([])
      setSelected(null)
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [params, q])

  useEffect(() => {
    if (mode === 'dialog' && !open) return
    const t = window.setTimeout(() => { void load() }, q.trim() ? 180 : 0)
    return () => window.clearTimeout(t)
  }, [load, q, open, mode])

  const changeType = (t: string) => {
    setType(t)
    setFilters({})
    setLimit(40)
  }

  const setFilter = (k: string, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }))
    setLimit(40)
  }

  const isClassFeature = type === 'classFeature'
  const showLevel = type === 'spell' || type === 'all' || isClassFeature
  const showSchool = type === 'spell' || type === 'all'
  const showClass = type === 'spell' || type === 'all' || isClassFeature
  const showRarity = type === 'item' || type === 'all'
  const showKind = type === 'equipment' || type === 'item'
  const classFilterKey = isClassFeature ? 'featureClass' : 'class'
  const classOptions = isClassFeature ? [...CLASS_NAMES, '魔契师'] : CASTER_CLASSES
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className={`search-shell ${mode === 'page' ? 'rulebook-page' : ''}`}>
      <div className="search-bar">
        <div className="search-input-wrap">
          <Search size={17} />
          <input
            ref={inputRef}
            className="input"
            value={q}
            autoFocus={autoFocus}
            placeholder="搜索法术、物品、专长、职业特性、种族特性、状态、规则原文…  支持中文或英文名"
            onChange={(e) => { setQ(e.target.value); setLimit(40) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) {
                setSelected(results[0])
              }
            }}
          />
          {q && <button className="search-clear" onClick={() => setQ('')} title="清空"><X size={14} /></button>}
        </div>
        {loading && <Loader2 size={17} className="animate-spin text-[var(--gold)]" />}
      </div>

      <div className="type-tabs">
        {Object.entries(TYPE_LABEL).map(([k, label]) => (
          <button key={k} className={`type-tab ${type === k ? 'active' : ''}`} onClick={() => changeType(k)}>
            {label}
            {counts[k] !== undefined && <span className="count">{counts[k]}</span>}
          </button>
        ))}
      </div>

      <div className="filter-row">
        {showLevel && (
          <Select
            value={filters[isClassFeature ? 'featureLevel' : 'level'] || ''}
            onChange={(v) => setFilter(isClassFeature ? 'featureLevel' : 'level', v)}
            placeholder={isClassFeature ? '所有职业等级' : '所有环位'}
            options={isClassFeature
              ? Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} 级` }))
              : [
                { value: '0', label: '戏法' },
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ value: String(n), label: `${n} 环` })),
              ]}
          />
        )}
        {showSchool && (
          <Select
            value={filters.school || ''}
            onChange={(v) => setFilter('school', v)}
            placeholder="所有学派"
            options={SCHOOLS.map((s) => ({ value: s, label: s }))}
          />
        )}
        {showClass && (
          <Select
            value={filters[classFilterKey] || ''}
            onChange={(v) => setFilter(classFilterKey, v)}
            placeholder="所有职业"
            options={classOptions.map((c) => ({ value: c, label: c }))}
          />
        )}
        {type === 'speciesTrait' && (
          <Select
            value={filters.species || ''}
            onChange={(v) => setFilter('species', v)}
            placeholder="所有种族"
            options={SPECIES_NAMES.map((name) => ({ value: name, label: name }))}
          />
        )}
        {showRarity && (
          <Select
            value={filters.rarity || ''}
            onChange={(v) => setFilter('rarity', v)}
            placeholder="所有稀有度"
            options={RARITIES.map((r) => ({ value: r, label: r }))}
          />
        )}
        {showKind && (
          <Select
            value={filters.kind || ''}
            onChange={(v) => setFilter('kind', v)}
            placeholder="所有类型"
            options={(type === 'item' ? ITEM_KINDS : ['armor', 'weapon', 'shield']).map((k) => ({
              value: k,
              label: type === 'item' ? k : k === 'armor' ? '护甲' : k === 'weapon' ? '武器' : '盾牌',
            }))}
          />
        )}
        {(type === 'spell' || type === 'all') && (
          <>
            <button className={`type-tab ${filters.ritual ? 'active' : ''}`} onClick={() => setFilter('ritual', filters.ritual ? '' : '1')}>仪式</button>
            <button className={`type-tab ${filters.concentration ? 'active' : ''}`} onClick={() => setFilter('concentration', filters.concentration ? '' : '1')}>专注</button>
          </>
        )}
        <Select
          value={filters.book || ''}
          onChange={(v) => setFilter('book', v)}
          placeholder="全部书籍"
          options={[{ value: '玩家手册', label: '玩家手册' }, { value: '城主指南', label: '城主指南' }]}
        />
        {hasFilters && (
          <Btn size="sm" variant="ghost" onClick={() => setFilters({})}><Filter size={12} /> 清除筛选</Btn>
        )}
        <span className="facet-note" style={{ marginLeft: 'auto' }}>
          {loading ? '检索中…' : `共 ${total} 条${total > results.length ? `，显示前 ${results.length} 条` : ''}`}
        </span>
      </div>

      {error && <div className="hint warn-text">{error}</div>}

      <div className="search-layout">
        <div className="result-list">
          {results.length === 0 && !loading ? (
            <Empty>{q ? `没有找到与「${q}」匹配的内容。` : '没有符合条件的条目。'}</Empty>
          ) : results.map((r) => (
            <button
              key={r.uid}
              className={`result-item ${selected?.uid === r.uid ? 'active' : ''}`}
              onClick={() => setSelected(r)}
            >
              <div className="r-title">
                <Badge tone={TYPE_TONE[r.kind] || 'default'}>{TYPE_LABEL[r.kind] || r.kind}</Badge>
                <span><Highlight text={r.title} query={q} /></span>
                {r.en && <span className="hint">{r.en}</span>}
              </div>
              <div className="r-sub">{r.subtitle}</div>
              <div className="r-snippet"><Highlight text={r.snippet} query={q} /></div>
              <div className="r-page">{r.book} · {r.chapter}{r.page ? ` · PDF 第 ${r.page} 页` : ''}</div>
            </button>
          ))}
          {results.length < total && (
            <div style={{ padding: 10, textAlign: 'center' }}>
              <Btn size="sm" variant="ghost" onClick={() => setLimit((n) => Math.min(200, n + 40))}>加载更多</Btn>
            </div>
          )}
        </div>
        <div className="detail-pane">
          <ResultDetail
            result={selected}
            character={character || null}
            onInsert={onInsert}
            onOpenSearch={onOpenSearch}
            query={q}
          />
        </div>
      </div>
    </div>
  )
}

function ResultDetail({
  result, character, onInsert, onOpenSearch, query,
}: {
  result: SearchResult | null
  character: Character | null
  onInsert?: (r: SearchResult) => void
  onOpenSearch?: (type: string, query?: string) => void
  query: string
}) {
  if (!result) return <Empty>选择一个条目查看详情。</Empty>
  const e = result.entry
  const canInsert = !!e && !!onInsert
  const isSpell = e?.type === 'spell'
  const charClass = character ? [...character.classes].sort((a, b) => b.level - a.level)[0]?.name : ''
  const classHit = !isSpell || !e?.classes?.length || !charClass || e.classes.includes(charClass)
  const featureClassHit = e?.type !== 'classFeature' || !character || !e?.className || character.classes.some((c) => c.name === e.className)
  const tooHigh = isSpell && character && (e.level || 0) > maxSpellLevel(character) && (e.level || 0) > 0
  const insertLabel = e?.type === 'spell' ? '加入法术'
    : e?.type === 'feat' ? '加入特性'
      : e?.type === 'classFeature' ? '加入职业特性'
        : e?.type === 'speciesTrait' ? '加入种族特性'
          : e?.type === 'condition' ? '切换状态' : '加入物品'
  return (
    <>
      <h3>
        <Highlight text={result.title} query={query} />
        {result.en && <span className="hint">{result.en}</span>}
      </h3>
      <div className="detail-sub">{e ? entrySubtitle(e) : result.subtitle}</div>
      {e && (
        <div className="detail-meta">
          {e.type === 'spell' && e.classes?.length ? e.classes.map((c) => <Badge key={c}>{c}</Badge>) : null}
          {e.type === 'item' && e.attunement ? <Badge tone="gold">需同调</Badge> : null}
          {e.type === 'equipment' && e.kind === 'weapon' ? <Badge>伤害 {e.damage || '—'} {e.damageType}</Badge> : null}
          {e.type === 'equipment' && e.kind === 'armor' ? <Badge>AC {e.ac?.base}{e.ac?.dexCap ? `（敏捷上限 ${e.ac.dexCap}）` : ''}</Badge> : null}
          {e.type === 'equipment' && e.kind === 'shield' ? <Badge>AC +{e.ac?.acBonus ?? 2}</Badge> : null}
          {e.type === 'equipment' && e.weight ? <Badge>{e.weight} 磅</Badge> : null}
          {e.type === 'feat' && e.prerequisite ? <Badge tone="gold">先决：{e.prerequisite}</Badge> : null}
          {e.type === 'classFeature' ? <><Badge tone="green">{e.className || '职业特性'}</Badge><Badge>{e.level ?? '?'}级</Badge></> : null}
          {e.type === 'speciesTrait' ? <><Badge tone="green">{e.speciesName || '种族特性'}</Badge><Badge>{e.level ?? 1}级</Badge></> : null}
        </div>
      )}
      {e?.type === 'spell' && (
        <div className="spell-cast-meta" style={{ marginTop: 10 }}>
          <div><span>施法时间：</span>{e.castingTime || '—'}</div>
          <div><span>施法距离：</span>{e.range || '—'}</div>
          <div><span>法术成分：</span>{e.components || '—'}</div>
          <div><span>持续时间：</span>{e.duration || '—'}</div>
        </div>
      )}
      {e?.type === 'equipment' && (
        <div className="spell-cast-meta" style={{ marginTop: 10 }}>
          <div><span>类别：</span>{e.kind === 'weapon' ? '武器' : e.kind === 'shield' ? '盾牌' : '护甲'}</div>
          <div><span>价格：</span>{e.cost || '—'}</div>
          <div><span>重量：</span>{e.weight ?? '—'} 磅</div>
          <div><span>属性：</span>{e.properties?.join('、') || '—'}</div>
          {e.strengthReq ? <div><span>力量要求：</span>{e.strengthReq}</div> : null}
          {e.stealthDisadvantage ? <div><span>隐匿：</span>劣势</div> : null}
        </div>
      )}
      <div className="detail-body">
        {e ? <Highlight text={e.description || '（没有正文）'} query={query} /> : <Highlight text={result.fullText || result.snippet} query={query} />}
      </div>
      {e?.higherLevels && <div className="detail-body" style={{ borderTop: '1px dashed var(--line)', marginTop: 8, paddingTop: 8 }}>{e.higherLevels}</div>}
      <div className="detail-cite">
        <span>{result.book} · {result.chapter}{result.page ? ` · PDF 第 ${result.page} 页` : ''}</span>
        <span>页码为 PDF 分页，非印刷页码</span>
      </div>
      {isSpell && character && (
        <div className="hint" style={{ marginTop: 6 }}>
          {!classHit ? `${charClass || '当前职业'}法术列表中没有此法术，仍可作为自定义法术加入。` : tooHigh ? `当前最高可施放 ${maxSpellLevel(character)} 环，此法术暂时无法施放。` : '已确认在职业法术列表中。'}
        </div>
      )}
      {e?.type === 'classFeature' && character && !featureClassHit && (
        <div className="hint" style={{ marginTop: 6 }}>
          当前角色没有{e.className}等级，仍可作为自定义特性加入。
        </div>
      )}
      <div className="insert-bar">
        {canInsert ? (
          <Btn variant="primary" onClick={() => onInsert!(result)}>
            <Plus size={14} /> {insertLabel}
          </Btn>
        ) : onOpenSearch ? (
          <Btn variant="primary" onClick={() => onOpenSearch(result.kind === 'raw' ? 'raw' : result.kind, result.title)}>
            <BookOpen size={14} /> 在角色卡中检索添加
          </Btn>
        ) : (
          <span className="hint">在角色卡中按 Ctrl+K 检索并添加</span>
        )}
      </div>
    </>
  )
}
