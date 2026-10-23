import { Plus, Trash2 } from 'lucide-react'
import type { Character } from '@/types'
import { RESET_LABELS } from '@/types'
import { createBlankResource } from '@/lib/insert'
import { Btn, Empty, NumberField, Panel, Pips, Select, TextInput } from '@/components/ui'

export function ResourcesPanel({ character, patch }: { character: Character; patch: (fn: (c: Character) => Character) => void }) {
  const update = (id: string, p: Partial<Character['resources'][number]>) => {
    patch((c) => ({ ...c, resources: c.resources.map((r) => (r.id === id ? { ...r, ...p } : r)) }))
  }
  const remove = (id: string) => {
    patch((c) => ({ ...c, resources: c.resources.filter((r) => r.id !== id) }))
  }
  const add = () => {
    patch((c) => ({ ...c, resources: [...c.resources, createBlankResource()] }))
  }

  return (
    <Panel
      id="resources"
      title="职业资源"
      subtitle="短休/长休会自动恢复对应资源"
      actions={<Btn size="sm" variant="ghost" onClick={add}><Plus size={12} /> 自定义资源</Btn>}
    >
      {character.resources.length === 0 ? (
        <Empty>没有记录职业资源。升级时会自动加入圣疗、引导神力等标准资源。</Empty>
      ) : (
        character.resources.map((r) => (
          <div className="resource-row" key={r.id}>
            <div style={{ minWidth: 150 }}>
              <div className="r-name">
                <TextInput value={r.name} onChange={(v) => update(r.id, { name: v })} className="resource-name-input" />
              </div>
              <div className="r-meta">
                {r.source && <span>{r.source} · </span>}
                {RESET_LABELS[r.reset]}
                {r.auto && <span> · 自动</span>}
              </div>
            </div>
            <div className="r-pips">
              <Pips
                total={r.total}
                used={r.used}
                infinite={r.infinite}
                tone="resource"
                onChange={(used) => update(r.id, { used })}
              />
              <span className="slot-count">{r.infinite ? '∞' : `${r.used}/${r.total}`}</span>
              <NumberField value={r.total} min={0} max={200} onChange={(v) => update(r.id, { total: v, used: Math.min(r.used, v), infinite: false })} />
              <Select
                value={r.reset}
                onChange={(v) => update(r.id, { reset: v as typeof r.reset })}
                options={[
                  { value: 'short', label: '短休恢复' },
                  { value: 'long', label: '长休恢复' },
                  { value: 'none', label: '不恢复' },
                ]}
              />
              <button className="icon-btn danger" onClick={() => remove(r.id)} title="删除资源"><Trash2 size={13} /></button>
            </div>
          </div>
        ))
      )}
    </Panel>
  )
}
