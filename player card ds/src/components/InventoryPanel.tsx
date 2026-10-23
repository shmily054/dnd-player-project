import { Plus, Search, Trash2 } from 'lucide-react'
import type { Character, Item } from '@/types'
import { COINS } from '@/types'
import { carryCapacity, coinTotalGp, encumbrance } from '@/lib/calc'
import { createBlankItem } from '@/lib/insert'
import { Badge, Btn, Empty, NumberField, Panel, TextInput, Toggle } from '@/components/ui'

export function InventoryPanel({
  character, patch, onOpenSearch,
}: {
  character: Character
  patch: (fn: (c: Character) => Character) => void
  onOpenSearch: (type: string) => void
}) {
  const enc = encumbrance(character)
  const capacity = carryCapacity(character)
  const attuned = character.inventory.filter((i) => i.attuned).length
  const update = (id: string, p: Partial<Item>) => {
    patch((c) => ({ ...c, inventory: c.inventory.map((i) => (i.id === id ? { ...i, ...p } : i)) }))
  }
  const remove = (id: string) => {
    patch((c) => ({ ...c, inventory: c.inventory.filter((i) => i.id !== id) }))
  }
  const add = () => {
    patch((c) => ({ ...c, inventory: [...c.inventory, createBlankItem()] }))
  }
  const statusLabel = enc.status === 'heavy' ? '超重' : enc.status === 'encumbered' ? '负重' : '正常'
  return (
    <Panel
      id="inventory"
      title="物品与财富"
      subtitle="装备护甲/盾牌会影响 AC；同调上限 3"
      actions={
        <>
          <Btn size="sm" onClick={() => onOpenSearch('equipment')}><Search size={12} /> 装备</Btn>
          <Btn size="sm" onClick={() => onOpenSearch('item')}><Search size={12} /> 魔法物品</Btn>
          <Btn size="sm" variant="ghost" onClick={add}><Plus size={12} /> 自定义</Btn>
        </>
      }
    >
      <div className="inventory-summary">
        <Badge tone={enc.status === 'normal' ? 'green' : 'red'}>负重 {enc.weight.toFixed(1)} / {capacity} 磅 · {statusLabel}</Badge>
        <Badge tone={attuned > 3 ? 'red' : 'default'}>同调 {attuned}/3</Badge>
        <Badge tone="gold">总财富 {coinTotalGp(character).toFixed(2)} gp</Badge>
      </div>
      {enc.status !== 'normal' && (
        <p className="hint warn-text">
          {enc.status === 'heavy'
            ? `超过力量×10（${enc.heavyAt} 磅）：速度 -20 尺，属性检定、攻击和豁免具有劣势。`
            : `超过力量×5（${enc.encumberedAt} 磅）：速度 -10 尺。`} 这是变体规则，DM 可选择不使用。
        </p>
      )}
      {attuned > 3 && <p className="hint warn-text">同调物品超过 3 件，请与 DM 确认。</p>}

      {character.inventory.length === 0 ? (
        <Empty>物品栏是空的。可以从装备库或魔法物品库添加。</Empty>
      ) : (
        <div className="inv-list">
          {character.inventory.map((item) => (
            <div className="inv-row" key={item.id}>
              <div className="inv-main">
                <Toggle checked={item.equipped} onChange={(v) => update(item.id, { equipped: v })} title="装备" />
                <div className="inv-name">
                  <TextInput value={item.name} onChange={(v) => update(item.id, { name: v })} />
                  <div className="sub">
                    {item.category}
                    {item.armor?.category === 'shield' ? ` · AC +${item.armor.acBonus ?? 2}` : ''}
                    {item.armor && item.armor.category !== 'shield' ? ` · AC ${item.armor.base}` : ''}
                    {item.weapon ? ` · ${item.weapon.damage} ${item.weapon.damageType}` : ''}
                    {item.magicBonus ? ` · +${item.magicBonus}` : ''}
                  </div>
                </div>
                <span className="inv-qty">×<NumberField value={item.qty} min={0} max={999} onChange={(v) => update(item.id, { qty: v })} /></span>
                <button className="icon-btn danger" onClick={() => remove(item.id)} title="删除物品"><Trash2 size={13} /></button>
              </div>
              <div className="inv-fields">
                <label>
                  <span className="mini-label">单重</span>
                  <NumberField value={item.weight} min={0} max={999} step={0.1} onChange={(v) => update(item.id, { weight: v })} />
                </label>
                <label className="inv-attune">
                  <span className="mini-label">同调</span>
                  <Toggle checked={item.attuned} onChange={(v) => update(item.id, { attuned: v })} title="同调" />
                </label>
                <label className="inv-desc">
                  <span className="mini-label">备注</span>
                  <TextInput value={item.description} onChange={(v) => update(item.id, { description: v })} placeholder="描述或备注" />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="coin-section">
        <h4>钱币</h4>
        <div className="coin-row">
          {COINS.map((c) => (
            <label className="coin" key={c.key} title={c.name}>
              <span>{c.label}</span>
              <input
                value={character.currency[c.key]}
                inputMode="numeric"
                onChange={(e) => patch((cur) => ({ ...cur, currency: { ...cur.currency, [c.key]: Math.max(0, Number(e.target.value) || 0) } }))}
              />
            </label>
          ))}
          <span className="hint">合计约 {coinTotalGp(character).toFixed(2)} gp</span>
        </div>
      </div>
    </Panel>
  )
}
