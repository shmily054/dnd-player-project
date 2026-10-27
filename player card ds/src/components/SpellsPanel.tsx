import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, GripVertical, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import type { Character, SpellEntry } from '@/types'
import { ABILITIES, SPELL_LEVEL_NAMES } from '@/types'
import { reorderById } from '@/lib/reorder'
import { useReorder } from '@/lib/use-reorder'
import {
  formatMod, maxSpellLevel, preparedCount, preparedLimit, spellAttackBonus, spellSaveDC,
  suggestedSpellSlots,
} from '@/lib/calc'
import { createBlankSpell } from '@/lib/insert'
import { Badge, Btn, Empty, NumberField, Panel, Pips, Select, TextArea, TextInput } from '@/components/ui'

export function SpellsPanel({
  character, patch, onOpenSearch,
}: {
  character: Character
  patch: (fn: (c: Character) => Character) => void
  onOpenSearch: (type: string, query?: string) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const dc = spellSaveDC(character)
  const atk = spellAttackBonus(character)
  const limit = preparedLimit(character)
  const count = preparedCount(character)
  const maxLevel = maxSpellLevel(character)
  const levels = useMemo(() => {
    const set = new Set<number>()
    for (const s of character.spellcasting.spells) set.add(s.level)
    for (const [k, v] of Object.entries(character.spellcasting.slots)) if (v.total > 0) set.add(Number(k))
    if (character.spellcasting.pactSlots?.total) set.add(character.spellcasting.pactSlots.level)
    if (set.size === 0) set.add(0)
    return [...set].sort((a, b) => a - b)
  }, [character.spellcasting])
  const { drag, getHandleProps } = useReorder((activeId, overId, position) => {
    patch((c) => ({
      ...c,
      spellcasting: {
        ...c.spellcasting,
        spells: reorderById(c.spellcasting.spells, activeId, overId, position),
      },
    }))
  })

  const updateSpell = (id: string, p: Partial<SpellEntry>) => {
    patch((c) => ({ ...c, spellcasting: { ...c.spellcasting, spells: c.spellcasting.spells.map((s) => (s.id === id ? { ...s, ...p } : s)) } }))
  }
  const removeSpell = (id: string) => {
    patch((c) => ({ ...c, spellcasting: { ...c.spellcasting, spells: c.spellcasting.spells.filter((s) => s.id !== id) } }))
  }
  const addSpell = () => {
    const s = createBlankSpell()
    patch((c) => ({ ...c, spellcasting: { ...c.spellcasting, spells: [...c.spellcasting.spells, s] } }))
    setExpanded(s.id)
  }
  const syncSlots = () => {
    patch((c) => {
      const sug = suggestedSpellSlots(c)
      const slots = Object.fromEntries(Array.from({ length: 9 }, (_, i) => {
        const key = String(i + 1)
        const total = sug.slots[i] || 0
        return [key, { total, used: Math.min(total, c.spellcasting.slots[key]?.used || 0) }]
      }))
      return {
        ...c,
        spellcasting: {
          ...c.spellcasting,
          slots,
          pactSlots: sug.pact ? { total: sug.pact.count, used: Math.min(sug.pact.count, c.spellcasting.pactSlots?.used || 0), level: sug.pact.level } : null,
        },
      }
    })
  }

  return (
    <Panel
      id="spells"
      title="法术"
      subtitle="法术位、准备法术、专注与仪式标记"
      actions={
        <>
          <Btn size="sm" onClick={() => onOpenSearch('spell')}><Search size={12} /> 检索法术</Btn>
          <Btn size="sm" variant="ghost" onClick={addSpell}><Plus size={12} /> 自定义</Btn>
        </>
      }
    >
      <div className="spell-head-stats">
        <div className="stat">
          <span className="stat-label">法术豁免 DC</span>
          <span className="stat-value">{dc}</span>
          <span className="stat-hint">8 + 熟练 + {ABILITIES.find((x) => x.key === character.spellcasting.ability)?.name}</span>
        </div>
        <div className="stat">
          <span className="stat-label">法术攻击</span>
          <span className="stat-value">{formatMod(atk)}</span>
          <span className="stat-hint">熟练 + 施法属性</span>
        </div>
        <div className="stat">
          <span className="stat-label">施法属性</span>
          <Select
            value={character.spellcasting.ability}
            onChange={(v) => patch((c) => ({ ...c, spellcasting: { ...c.spellcasting, ability: v as Character['spellcasting']['ability'] } }))}
            options={ABILITIES.map((x) => ({ value: x.key, label: x.name }))}
          />
        </div>
        <div className="stat">
          <span className="stat-label">准备法术</span>
          <span className="stat-value">{count}{limit !== null ? ` / ${limit}` : ''}</span>
          <span className={`stat-hint ${limit !== null && count > limit ? 'warn-text' : ''}`}>
            {limit === null ? '已知施法者' : count > limit ? '超过准备上限' : '誓言/常备法术不计入'}
          </span>
        </div>
      </div>

      <div className="slot-box">
        <div className="slot-box-head">
          <span className="field-label">法术位</span>
          <span className="hint">点击圆点标记已消耗；数字可直接修改上限</span>
          <Btn size="sm" variant="ghost" onClick={syncSlots} title="按职业等级重新计算法术位"><RefreshCw size={12} /> 同步职业法术位</Btn>
        </div>
        <div className="slot-list">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lv) => {
            const s = character.spellcasting.slots[String(lv)] || { total: 0, used: 0 }
            if (!s.total && !character.spellcasting.pactSlots) return null
            if (!s.total) return null
            return (
              <div className="slot-row" key={lv}>
                <span className="slot-label">{lv}环</span>
                <Pips
                  total={s.total}
                  used={s.used}
                  tone="slot"
                  onChange={(used) => patch((c) => ({
                    ...c,
                    spellcasting: {
                      ...c.spellcasting,
                      slots: { ...c.spellcasting.slots, [String(lv)]: { ...s, used } },
                    },
                  }))}
                />
                <span className="slot-count">{s.total - s.used}/{s.total}</span>
                <NumberField value={s.total} min={0} max={12} onChange={(v) => patch((c) => ({
                  ...c,
                  spellcasting: {
                    ...c.spellcasting,
                    slots: { ...c.spellcasting.slots, [String(lv)]: { ...s, total: v, used: Math.min(s.used, v) } },
                  },
                }))} />
              </div>
            )
          })}
          {character.spellcasting.pactSlots && (
            <div className="slot-row pact">
              <span className="slot-label">契约 {character.spellcasting.pactSlots.level}环</span>
              <Pips
                total={character.spellcasting.pactSlots.total}
                used={character.spellcasting.pactSlots.used}
                tone="slot"
                onChange={(used) => patch((c) => ({ ...c, spellcasting: { ...c.spellcasting, pactSlots: { ...c.spellcasting.pactSlots!, used } } }))}
              />
              <span className="slot-count">{character.spellcasting.pactSlots.total - character.spellcasting.pactSlots.used}/{character.spellcasting.pactSlots.total}</span>
              <Badge tone="blue">短休恢复</Badge>
            </div>
          )}
          {!character.spellcasting.slots || Object.values(character.spellcasting.slots).every((s) => !s.total) ? (
            <div className="hint">
              当前没有法术位。若是施法职业，点击「同步职业法术位」；也可以手动设置各环上限。
            </div>
          ) : null}
        </div>
      </div>

      {character.spellcasting.spells.length === 0 ? (
        <Empty>还没有法术。点击「检索法术」按职业和环位添加，或使用「自定义」。</Empty>
      ) : (
        levels.map((lv) => {
          const spells = character.spellcasting.spells.filter((s) => s.level === lv)
          if (!spells.length) return null
          return (
            <div className="spell-level-block" key={lv}>
              <div className="spell-level-head">
                <h4>{SPELL_LEVEL_NAMES[lv] || `${lv}环`}</h4>
                <span className="hint">{spells.length} 个</span>
                {lv > 0 && (
                  <span className="slots">
                    <span>剩余法术位</span>
                    <Pips
                      total={character.spellcasting.slots[String(lv)]?.total || 0}
                      used={character.spellcasting.slots[String(lv)]?.used || 0}
                      tone="slot"
                      onChange={(used) => patch((c) => ({
                        ...c,
                        spellcasting: {
                          ...c.spellcasting,
                          slots: { ...c.spellcasting.slots, [String(lv)]: { ...(c.spellcasting.slots[String(lv)] || { total: 0 }), used } },
                        },
                      }))}
                    />
                  </span>
                )}
              </div>
              {spells.map((s) => {
                const open = expanded === s.id
                const preparedBadge = s.level === 0 ? null : s.alwaysPrepared ? <Badge tone="gold">常备</Badge> : (
                  <button className={`prep-toggle ${s.prepared ? 'on' : ''}`} onClick={() => updateSpell(s.id, { prepared: !s.prepared })}>
                    {s.prepared ? '已准备' : '未准备'}
                  </button>
                )
                return (
                  <div
                    className={`spell-row reorder-row${drag?.activeId === s.id ? ' is-dragging' : ''}${drag?.overId === s.id ? ` is-drop-${drag.position}` : ''}`}
                    key={s.id}
                    data-reorder-id={s.id}
                    data-reorder-scope={`spells:${lv}`}
                  >
                    <button
                      type="button"
                      className="reorder-handle"
                      {...getHandleProps(s.id, `spells:${lv}`)}
                      title="在同环位内拖动排序；也可使用上下方向键"
                      aria-label={`移动法术 ${s.name}`}
                    ><GripVertical size={14} /></button>
                    <div className="s-main">
                      <div className="s-name">
                        <button className="spell-name-btn" onClick={() => setExpanded(open ? null : s.id)}>
                          {s.name}
                          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        {preparedBadge}
                        {s.concentration && <Badge tone="blue">专注</Badge>}
                        {s.ritual && <Badge>仪式</Badge>}
                      </div>
                      <div className="s-meta">
                        {SPELL_LEVEL_NAMES[s.level] || `${s.level}环`}{s.school ? ` · ${s.school}` : ''}
                        {s.castingTime ? ` · ${s.castingTime}` : ''}
                        {s.range ? ` · ${s.range}` : ''}
                        {s.duration ? ` · ${s.duration}` : ''}
                      </div>
                      {!open && s.note && <div className="s-note">{s.note}</div>}
                      {open && (
                        <div className="spell-editor">
                          <div className="spell-cast-meta">
                            <div><span>施法时间：</span><TextInput value={s.castingTime || ''} onChange={(v) => updateSpell(s.id, { castingTime: v })} /></div>
                            <div><span>施法距离：</span><TextInput value={s.range || ''} onChange={(v) => updateSpell(s.id, { range: v })} /></div>
                            <div><span>法术成分：</span><TextInput value={s.components || ''} onChange={(v) => updateSpell(s.id, { components: v })} /></div>
                            <div><span>持续时间：</span><TextInput value={s.duration || ''} onChange={(v) => updateSpell(s.id, { duration: v })} /></div>
                          </div>
                          <div className="spell-detail-controls">
                            <label>环位
                              <Select value={s.level} onChange={(v) => updateSpell(s.id, { level: Number(v) })} options={SPELL_LEVEL_NAMES.map((n, i) => ({ value: i, label: n }))} />
                            </label>
                            <label>学派
                              <TextInput value={s.school || ''} onChange={(v) => updateSpell(s.id, { school: v })} />
                            </label>
                            <label className="inline-setting"><input type="checkbox" checked={!!s.alwaysPrepared} onChange={(e) => updateSpell(s.id, { alwaysPrepared: e.target.checked })} /> 常备</label>
                            <label className="inline-setting"><input type="checkbox" checked={!!s.concentration} onChange={(e) => updateSpell(s.id, { concentration: e.target.checked })} /> 专注</label>
                            <label className="inline-setting"><input type="checkbox" checked={!!s.ritual} onChange={(e) => updateSpell(s.id, { ritual: e.target.checked })} /> 仪式</label>
                          </div>
                          <div className="spell-detail">
                            {s.description || '（没有描述，可在此补充）'}
                          </div>
                          <TextArea value={s.note || ''} onChange={(v) => updateSpell(s.id, { note: v })} placeholder="备注 / 常用战术 / 伤害骰…" rows={2} />
                          {s.higherLevels && <div className="spell-detail">{s.higherLevels}</div>}
                          <div className="spell-editor-actions">
                            <Btn size="sm" variant="ghost" onClick={() => onOpenSearch('spell', s.name)}><BookOpen size={12} /> 查规则</Btn>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="s-actions">
                      <button className="icon-btn danger" onClick={() => removeSpell(s.id)} title="删除法术"><Trash2 size={13} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })
      )}

      {limit !== null && count > limit && (
        <div className="hint warn-text" style={{ marginTop: 8 }}>
          当前准备了 {count} 个法术，上限 {limit}。可以把部分法术标记为「常备」或取消准备；本卡不会阻止自定义配置。
        </div>
      )}
      {maxLevel === 0 && character.spellcasting.spells.some((s) => s.level > 0) && (
        <div className="hint gold-text" style={{ marginTop: 8 }}>
          当前没有 1 环及以上法术位，已有法术仍会显示，但暂时无法施放。
        </div>
      )}
    </Panel>
  )
}
