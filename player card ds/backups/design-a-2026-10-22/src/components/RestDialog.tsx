import { useEffect, useState } from 'react'
import { MoonStar, Soup } from 'lucide-react'
import type { Character } from '@/types'
import { applyLongRest, applyShortRest, abilityMod, formatMod, totalHitDice } from '@/lib/calc'
import { Badge, Btn, Modal, NumberField } from '@/components/ui'

export function RestDialog({
  open, mode, character, onClose, onApply,
}: {
  open: boolean
  mode: 'short' | 'long'
  character: Character
  onClose: () => void
  onApply: (next: Character, summary: string[]) => void
}) {
  const [dice, setDice] = useState(0)
  const [healing, setHealing] = useState(0)
  const totalHd = totalHitDice(character)
  const conMod = abilityMod(character.abilities.con)
  const avgPerDie = Math.max(1, Math.floor(((character.classes[0]?.hitDie || 8) / 2)) + 1 + conMod)
  const maxDice = Math.min(character.hitDice.remaining, totalHd)

  useEffect(() => {
    if (!open) return
    setDice(0)
    setHealing(0)
  }, [open, mode])

  const apply = () => {
    if (mode === 'short') {
      const res = applyShortRest(character, Math.max(0, Math.min(maxDice, dice)), Math.max(0, healing))
      onApply(res.character, res.summary)
    } else {
      const res = applyLongRest(character)
      onApply(res.character, res.summary)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'short' ? <><Soup size={18} /> 短休</> : <><MoonStar size={18} /> 长休</>}
      subtitle={mode === 'short' ? '至少 1 小时，可花费生命骰恢复 HP' : '至少 8 小时，恢复大部分资源'}
      footer={<><Btn onClick={onClose}>取消</Btn><Btn variant="primary" onClick={apply}>{mode === 'short' ? '完成短休' : '完成长休'}</Btn></>}
    >
      {mode === 'short' ? (
        <div className="rest-body">
          <div className="rest-summary">
            <Badge tone="red">HP {character.hp.current} / {character.hp.max}</Badge>
            <Badge>生命骰 {character.hitDice.remaining} / {totalHd}</Badge>
            <Badge tone="green">体质 {formatMod(conMod)}</Badge>
          </div>
          <div className="rest-block">
            <h3>花费生命骰</h3>
            <p className="hint">每颗生命骰恢复「骰值 + 体质调整值」。可以按平均值快速计算，也可以输入你实际掷出的总治疗量。</p>
            <div className="inline-setting">
              <span className="field-label">花费数量</span>
              <NumberField value={dice} min={0} max={maxDice} onChange={setDice} />
              <span className="hint">最多 {maxDice} 颗</span>
              <Btn size="sm" variant="ghost" onClick={() => { setDice(maxDice); setHealing(Math.max(0, maxDice * avgPerDie)) }}>按平均值填满</Btn>
            </div>
            <div className="inline-setting" style={{ marginTop: 8 }}>
              <span className="field-label">总治疗量</span>
              <NumberField value={healing} min={0} max={999} onChange={setHealing} />
              <Btn size="sm" variant="ghost" onClick={() => setHealing(Math.max(0, dice * avgPerDie))}>按平均值 {Math.max(0, dice * avgPerDie)}</Btn>
            </div>
          </div>
          <div className="rest-block">
            <h3>还会恢复</h3>
            <ul className="rest-list">
              {character.resources.filter((r) => r.reset === 'short').map((r) => <li key={r.id}>{r.name}：{r.used}/{r.total}</li>)}
              {character.spellcasting.pactSlots && <li>契约法术位 {character.spellcasting.pactSlots.used}/{character.spellcasting.pactSlots.total}</li>}
              {character.resources.every((r) => r.reset !== 'short') && !character.spellcasting.pactSlots && <li>没有短休恢复的资源</li>}
            </ul>
          </div>
        </div>
      ) : (
        <div className="rest-body">
          <div className="rest-summary">
            <Badge tone="red">HP {character.hp.current} / {character.hp.max}</Badge>
            <Badge tone="blue">法术位</Badge>
            <Badge tone="green">生命骰</Badge>
          </div>
          <div className="rest-block">
            <h3>长休将执行</h3>
            <ul className="rest-list">
              <li>HP 恢复至上限（{character.hp.max}）</li>
              <li>所有法术位与契约法术位恢复</li>
              <li>短休/长休资源恢复</li>
              <li>恢复一半生命骰（至少 1 颗），当前 {character.hitDice.remaining}/{totalHd}</li>
              {character.exhaustion > 0 && <li>力竭 {character.exhaustion} → {Math.max(0, character.exhaustion - 1)}</li>}
              <li>死亡豁免清零、专注结束</li>
            </ul>
          </div>
          <p className="hint">长休需要 8 小时，其中至少 6 小时睡眠；若被中断则按 DM 裁定处理。</p>
        </div>
      )}
    </Modal>
  )
}
