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
        <div className="table-wrap">
          <table className="sheet-table attack-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>属性</th>
                <th>熟练</th>
                <th>魔法</th>
                <th>伤害</th>
                <th>类型</th>
                <th>射程</th>
                <th>命中</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {character.attacks.map((a, i) => {
                const toHit = attackBonus(character, a)
                const dmg = damageBonus(character, a)
                return (
                  <tr key={a.id}>
                    <td style={{ minWidth: 150 }}>
                      <TextInput value={a.name} onChange={(v) => update(i, { name: v })} />
                      {a.notes && <div className="sub" title={a.notes}>{a.notes.slice(0, 40)}{a.notes.length > 40 ? '…' : ''}</div>}
                    </td>
                    <td>
                      <Select
                        value={a.ability}
                        onChange={(v) => update(i, { ability: v as AbilityKey })}
                        options={ABILITIES.map((x) => ({ value: x.key, label: x.name }))}
                        className="w-[76px]"
                      />
                    </td>
                    <td className="num-cell"><Toggle checked={a.proficient} onChange={(v) => update(i, { proficient: v })} /></td>
                    <td className="num-cell"><NumberField value={a.magicBonus} min={-5} max={10} onChange={(v) => update(i, { magicBonus: v })} /></td>
                    <td>
                      <TextInput value={a.damageDice} onChange={(v) => update(i, { damageDice: v })} className="w-[70px]" />
                    </td>
                    <td>
                      <TextInput value={a.damageType} onChange={(v) => update(i, { damageType: v })} className="w-[64px]" />
                    </td>
                    <td>
                      <TextInput value={a.range} onChange={(v) => update(i, { range: v })} className="w-[74px]" />
                    </td>
                    <td className="num-cell">
                      <Badge tone="green">{formatMod(toHit)}</Badge>
                      <div className="sub">{a.damageDice}{dmg !== 0 ? formatMod(dmg) : ''} {a.damageType}</div>
                    </td>
                    <td className="actions-cell">
                      <button className="icon-btn danger" onClick={() => remove(i)} title="删除攻击"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="hint" style={{ marginTop: 8 }}>
        提示：从「检索武器」添加的武器会自动生成攻击条目，并可在物品栏中勾选装备。
      </p>
    </Panel>
  )
}
