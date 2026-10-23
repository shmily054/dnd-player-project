import { useMemo } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import type { Character, Feature } from '@/types'
import { RESET_LABELS } from '@/types'
import { createBlankFeature } from '@/lib/insert'
import { Badge, Btn, Empty, NumberField, Panel, Pips, Select, TextArea, TextInput } from '@/components/ui'

export function FeaturesPanel({
  character, patch, onOpenSearch,
}: {
  character: Character
  patch: (fn: (c: Character) => Character) => void
  onOpenSearch: (type: string, query?: string) => void
}) {
  const groups = useMemo(() => {
    const map = new Map<string, Feature[]>()
    for (const f of character.features) {
      const key = f.source || '其他'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return [...map.entries()]
  }, [character.features])

  const update = (id: string, p: Partial<Feature>) => {
    patch((c) => ({ ...c, features: c.features.map((f) => (f.id === id ? { ...f, ...p } : f)) }))
  }
  const remove = (id: string) => {
    patch((c) => ({ ...c, features: c.features.filter((f) => f.id !== id) }))
  }
  const add = () => {
    patch((c) => ({ ...c, features: [...c.features, createBlankFeature()] }))
  }

  const setUses = (f: Feature, enabled: boolean) => {
    if (enabled) {
      update(f.id, { uses: { total: 1, used: 0, reset: 'long' } })
    } else {
      update(f.id, { uses: undefined })
    }
  }

  return (
    <Panel
      id="features"
      title="特性与专长"
      subtitle="按来源分组；可记录使用次数与恢复方式"
      actions={
        <>
          <Btn size="sm" onClick={() => onOpenSearch('feat')}><BookOpen size={12} /> 检索专长</Btn>
          <Btn size="sm" variant="ghost" onClick={add}><Plus size={12} /> 自定义</Btn>
        </>
      }
    >
      {character.features.length === 0 ? (
        <Empty>还没有特性。升级时会自动加入职业特性，也可以从规则库检索专长。</Empty>
      ) : (
        groups.map(([source, items]) => (
          <div className="feature-group" key={source}>
            <div className="feature-group-head">
              <h3>{source}</h3>
              <Badge>{items.length}</Badge>
            </div>
            {items.map((f) => (
              <details className="feature-card" key={f.id}>
                <summary className="f-head">
                  <div className="min-w-0">
                    <span className="f-name">{f.name}</span>
                    <span className="f-source">
                      {f.level ? ` · ${f.level} 级` : ''}
                      {f.uses ? ` · ${f.uses.infinite ? '无限' : `${f.uses.used}/${f.uses.total}`}（${RESET_LABELS[f.uses.reset]}）` : ''}
                      {f.auto ? ' · 自动' : ''}
                    </span>
                  </div>
                  {f.searchName && (
                    <button
                      className="feature-lookup"
                      onClick={(e) => { e.preventDefault(); onOpenSearch('all', f.searchName) }}
                      title="在规则库中检索"
                    ><BookOpen size={12} /></button>
                  )}
                  <button
                    className="icon-btn danger"
                    onClick={(e) => { e.preventDefault(); remove(f.id) }}
                    title="删除特性"
                  ><Trash2 size={13} /></button>
                </summary>
                <div className="feature-edit">
                  <div className="form-grid">
                    <label className="field"><span className="field-label">名称</span><TextInput value={f.name} onChange={(v) => update(f.id, { name: v })} /></label>
                    <label className="field"><span className="field-label">来源</span><TextInput value={f.source} onChange={(v) => update(f.id, { source: v })} /></label>
                    <label className="field"><span className="field-label">等级</span><NumberField value={f.level || 0} min={0} max={20} onChange={(v) => update(f.id, { level: v || undefined })} /></label>
                    <label className="field"><span className="field-label">检索名</span><TextInput value={f.searchName || ''} onChange={(v) => update(f.id, { searchName: v })} placeholder="用于查规则" /></label>
                  </div>
                  <div className="feature-desc-edit">
                    <TextArea value={f.description} onChange={(v) => update(f.id, { description: v })} rows={Math.min(10, Math.max(3, Math.ceil((f.description || '').length / 60)))} placeholder="特性描述" />
                  </div>
                  <div className="feature-uses-row">
                    {f.uses ? (
                      <>
                        <span className="field-label">使用</span>
                        <Pips
                          total={f.uses.total}
                          used={f.uses.used}
                          infinite={f.uses.infinite}
                          tone="resource"
                          onChange={(used) => update(f.id, { uses: { ...f.uses!, used } })}
                        />
                        <NumberField value={f.uses.total} min={0} max={99} onChange={(v) => update(f.id, { uses: { ...f.uses!, total: v, used: Math.min(f.uses!.used, v) } })} />
                        <Select
                          value={f.uses.reset}
                          onChange={(v) => update(f.id, { uses: { ...f.uses!, reset: v as 'short' | 'long' | 'none' } })}
                          options={[{ value: 'short', label: '短休' }, { value: 'long', label: '长休' }, { value: 'none', label: '不恢复' }]}
                        />
                        <Btn size="sm" variant="ghost" onClick={() => setUses(f, false)}>移除次数</Btn>
                      </>
                    ) : (
                      <Btn size="sm" variant="ghost" onClick={() => setUses(f, true)}><Plus size={12} /> 添加使用次数</Btn>
                    )}
                  </div>
                  {f.auto && !f.description && <p className="hint gold-text">自动添加的特性，描述尚未摘录；可点击标题栏的书本图标检索原文，或直接编辑。</p>}
                </div>
              </details>
            ))}
          </div>
        ))
      )}
    </Panel>
  )
}
