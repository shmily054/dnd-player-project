import { Plus, Search, Trash2 } from 'lucide-react'
import type { AbilityKey, Attack, Character } from '@/types'
import { ABILITIES } from '@/types'
import { attackBonus, damageBonus, formatMod } from '@/lib/calc'
import { createBlankAttack } from '@/lib/insert'
import { Badge, Btn, Empty, NumberField, Panel, Select, TextInput, Toggle } from '@/components/ui'

export function AttackPanel({
  character, patch, onOpenSearch,
}: {
  character: Character
  patch: (fn: (c: Character) => Character) => void
  onOpenSearch: (type: string) => void
}) {
  const update = (index: number, p: Partial<Attack>) => {
    patch((c) => ({ ...c, attacks: c.attacks.map((a, i) => (i === index ? { ...a, ...p } : a)) }))
  }
  const remove = (index: number) => {
    patch((c) => ({ ...c, attacks: c.attacks.filter((_, i) => i !== index) }))
  }
  const add = () => {
    patch((c) => ({ ...c, attacks: [...c.attacks, createBlankAttack(c)] }))
  }

  return (
    <Panel
      id="attacks"
      title="攻击"
      subtitle="命中 = d20 + 属性调整值 + 熟练 + 魔法加值；伤害自动显示属性加值"
      actions={
        <>
          <Btn size="sm" onClick={() => onOpenSearch('equipment')}><Search size={12} /> 检索武器</Btn>
          <Btn size="sm" variant="ghost" onClick={add}><Plus size={12} /> 自定义</Btn>
        </>
      }
    >
      {character.attacks.length === 0 ? (
        <Empty>还没有攻击条目。可以从装备库添加武器，或点击「自定义」手动填写。</Empty>
      ) : (
        <div className="attack-list">
          {character.attacks.map((a, i) => {
            const toHit = attackBonus(character, a)
            const dmg = damageBonus(character, a)
            return (
              <div className="attack-row" key={a.id}>
                <div className="attack-name">
                  <TextInput value={a.name} onChange={(v) => update(i, { name: v })} />
                  {a.notes && <div className="sub" title={a.notes}>{a.notes.slice(0, 40)}{a.notes.length > 40 ? '…' : ''}</div>}
                </div>
                <div className="attack-hit">
                  <Badge tone="green">{formatMod(toHit)}</Badge>
                  <span className="attack-damage">{a.damageDice}{dmg !== 0 ? formatMod(dmg) : ''} {a.damageType}</span>
                </div>
                <button className="icon-btn danger" onClick={() => remove(i)} title="删除攻击"><Trash2 size={13} /></button>
                <div className="attack-fields">
                  <label>
                    <span className="mini-label">属性</span>
                    <Select
                      value={a.ability}
                      onChange={(v) => update(i, { ability: v as AbilityKey })}
                      options={ABILITIES.map((x) => ({ value: x.key, label: x.name }))}
                    />
                  </label>
                  <label className="attack-toggle">
                    <span className="mini-label">熟练</span>
                    <Toggle checked={a.proficient} onChange={(v) => update(i, { proficient: v })} title="熟练" />
                  </label>
                  <label>
                    <span className="mini-label">魔法</span>
                    <NumberField value={a.magicBonus} min={-5} max={10} onChange={(v) => update(i, { magicBonus: v })} />
                  </label>
                  <label>
                    <span className="mini-label">伤害骰</span>
                    <TextInput value={a.damageDice} onChange={(v) => update(i, { damageDice: v })} />
                  </label>
                  <label>
                    <span className="mini-label">类型</span>
                    <TextInput value={a.damageType} onChange={(v) => update(i, { damageType: v })} />
                  </label>
                  <label>
                    <span className="mini-label">射程</span>
                    <TextInput value={a.range} onChange={(v) => update(i, { range: v })} />
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p className="hint" style={{ marginTop: 8 }}>
        提示：从「检索武器」添加的武器会自动生成攻击条目，并可在物品栏中勾选装备。
      </p>
    </Panel>
  )
}
