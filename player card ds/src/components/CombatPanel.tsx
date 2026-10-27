import { useState } from 'react'
import { HeartPulse, Minus, Plus, Shield, Swords, Wind, Wand2, X } from 'lucide-react'
import type { Character } from '@/types'
import { CONDITIONS } from '@/types'
import {
  acBreakdown, applyDamage, formatMod, hitDiceLabel, initiativeBonus, totalHitDice,
} from '@/lib/calc'
import { Badge, Btn, NumberField, Panel, Select, Stepper } from '@/components/ui'

export function CombatPanel({ character, patch }: { character: Character; patch: (fn: (c: Character) => Character) => void }) {
  const [delta, setDelta] = useState(1)
  const [conditionDraft, setConditionDraft] = useState('')
  const ac = acBreakdown(character)
  const init = initiativeBonus(character)
  const hdTotal = totalHitDice(character)
  const concentrationOptions = character.spellcasting.spells
    .filter((s) => s.concentration || s.prepared)
    .map((s) => ({ value: s.name, label: s.name }))

  const changeHp = (fn: (current: number) => number) => {
    patch((c) => ({ ...c, hp: { ...c.hp, current: Math.max(0, Math.min(c.hp.max, fn(c.hp.current))) } }))
  }
  const damageHp = () => {
    patch((c) => ({ ...c, hp: applyDamage(c.hp, delta) }))
  }

  const addCondition = () => {
    if (!conditionDraft) return
    if (character.conditions.some((x) => x.name === conditionDraft)) return
    patch((c) => ({ ...c, conditions: [...c.conditions, { name: conditionDraft }] }))
    setConditionDraft('')
  }

  const toggleDeath = (kind: 'successes' | 'failures', i: number) => {
    patch((c) => {
      const cur = c.deathSaves[kind]
      const next = cur > i ? i : i + 1
      return { ...c, deathSaves: { ...c.deathSaves, [kind]: Math.max(0, Math.min(3, next)) } }
    })
  }

  return (
    <Panel id="combat" title="战斗状态" subtitle="HP、AC、先攻、状态与专注" actions={<Badge tone={ac.manual ? 'gold' : 'default'}>{ac.manual ? 'AC 手动' : 'AC 自动'}</Badge>}>
      <div className="hp-panel">
        <div>
          <div className="hp-big">
            <NumberField
              bare
              className="hp-current-input"
              value={character.hp.current}
              min={0}
              max={character.hp.max}
              onChange={(v) => patch((c) => ({ ...c, hp: { ...c.hp, current: v } }))}
              title="当前 HP"
            />
            <span className="sep">/</span>
            <NumberField
              bare
              className="hp-max-input"
              value={character.hp.max}
              min={1}
              max={30}
              onChange={(v) => patch((c) => ({ ...c, hp: { ...c.hp, max: v } }))}
              title="最大 HP"
            />
            <span className="hp-temp-label">临时</span>
            <NumberField className="hp-temp" value={character.hp.temp} min={0} onChange={(v) => patch((c) => ({ ...c, hp: { ...c.hp, temp: v } }))} />
          </div>
          <div className="hp-track"><span style={{ width: `${character.hp.max ? Math.min(100, (character.hp.current / character.hp.max) * 100) : 0}%` }} /></div>
          <div className="hp-controls">
            <NumberField value={delta} min={1} max={999} onChange={setDelta} />
            <Btn size="sm" variant="danger" onClick={damageHp}><Minus size={12} />受伤</Btn>
            <Btn size="sm" variant="primary" onClick={() => changeHp((v) => v + delta)}><Plus size={12} />治疗</Btn>
            <Btn size="sm" onClick={() => patch((c) => ({ ...c, hp: { ...c.hp, current: c.hp.max } }))}>回满</Btn>
          </div>
          <div className="death-saves" style={{ marginTop: 10 }}>
            <div className="death-group">
              死亡豁免 成功
              {[0, 1, 2].map((i) => (
                <button key={i} className={`death-dot success ${character.deathSaves.successes > i ? 'on' : ''}`} onClick={() => toggleDeath('successes', i)} />
              ))}
            </div>
            <div className="death-group">
              失败
              {[0, 1, 2].map((i) => (
                <button key={i} className={`death-dot failure ${character.deathSaves.failures > i ? 'on' : ''}`} onClick={() => toggleDeath('failures', i)} />
              ))}
            </div>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <span className="stat-label"><Shield size={11} /> 护甲等级</span>
            <span className="stat-value">{ac.value}</span>
            <span className="stat-hint" title={ac.parts.join('；')}>{ac.parts.join(' · ')}</span>
          </div>
          <div className="stat">
            <span className="stat-label"><Swords size={11} /> 先攻</span>
            <span className="stat-value">{formatMod(init)}</span>
            <span className="stat-hint">{character.initiative.mode === 'manual' ? '手动' : '敏捷调整值'}{character.features.some((f) => f.name === '警觉') ? ' + 警觉' : ''}</span>
          </div>
          <div className="stat">
            <span className="stat-label"><Wind size={11} /> 速度</span>
            <span className="stat-value">{character.speed} 尺</span>
            <span className="stat-hint">步行</span>
          </div>
          <div className="stat">
            <span className="stat-label"><HeartPulse size={11} /> 生命骰</span>
            <span className="stat-value">{character.hitDice.remaining} / {hdTotal}</span>
            <span className="stat-hint">{hitDiceLabel(character)}</span>
          </div>
        </div>
      </div>

      <div className="combat-settings">
        <div className="inline-setting">
          <span className="field-label">AC 模式</span>
          <Btn size="sm" onClick={() => patch((c) => {
            const nextMode = c.ac.mode === 'auto' ? 'manual' : 'auto'
            return { ...c, ac: { ...c.ac, mode: nextMode, manual: nextMode === 'manual' ? (c.ac.manual ?? acBreakdown(c).value) : c.ac.manual } }
          })}>
            {ac.manual ? '改回自动' : '手动覆盖'}
          </Btn>
          {ac.manual && (
            <NumberField value={character.ac.manual ?? ac.value} min={0} max={40} onChange={(v) => patch((c) => ({ ...c, ac: { mode: 'manual', manual: v } }))} />
          )}
        </div>
        <div className="inline-setting">
          <span className="field-label">先攻模式</span>
          <Btn size="sm" onClick={() => patch((c) => ({ ...c, initiative: { ...c.initiative, mode: c.initiative.mode === 'auto' ? 'manual' : 'auto', manual: c.initiative.manual ?? init } }))}>
            {character.initiative.mode === 'manual' ? '改回自动' : '手动覆盖'}
          </Btn>
          {character.initiative.mode === 'manual' && (
            <NumberField value={character.initiative.manual ?? 0} min={-10} max={30} onChange={(v) => patch((c) => ({ ...c, initiative: { mode: 'manual', manual: v } }))} />
          )}
        </div>
        <div className="inline-setting">
          <span className="field-label">速度</span>
          <NumberField value={character.speed} min={0} max={200} onChange={(v) => patch((c) => ({ ...c, speed: v }))} />
          <span className="hint">尺</span>
        </div>
        <div className="inline-setting">
          <span className="field-label">力竭</span>
          <Stepper value={character.exhaustion} min={0} max={6} onChange={(v) => patch((c) => ({ ...c, exhaustion: v }))} />
          <span className="hint">{character.exhaustion === 0 ? '无' : character.exhaustion >= 6 ? '死亡' : `等级 ${character.exhaustion}`}</span>
        </div>
      </div>

      <div className="combat-subsection">
        <div className="inline-setting" style={{ marginBottom: 6 }}>
          <span className="field-label"><Wand2 size={12} /> 专注</span>
          <Select
            value={character.concentration || ''}
            onChange={(v) => patch((c) => ({ ...c, concentration: v || null }))}
            options={concentrationOptions}
            placeholder="无专注"
            className="min-w-[180px]"
          />
          {character.concentration && (
            <Btn size="sm" variant="ghost" onClick={() => patch((c) => ({ ...c, concentration: null }))}>结束</Btn>
          )}
        </div>

        <div className="condition-chips">
          {character.exhaustion > 0 && (
            <span className="condition-chip exhaustion">
              力竭 {character.exhaustion} 级
              <button onClick={() => patch((c) => ({ ...c, exhaustion: Math.max(0, c.exhaustion - 1) }))} title="降低一级"><X size={11} /></button>
            </span>
          )}
          {character.conditions.map((cond, i) => (
            <span className="condition-chip" key={`${cond.name}-${i}`} title={CONDITIONS.find((x) => x.name === cond.name)?.summary}>
              {cond.name}
              <button onClick={() => patch((c) => ({ ...c, conditions: c.conditions.filter((_, j) => j !== i) }))} title="移除"><X size={11} /></button>
            </span>
          ))}
          <div className="condition-add">
            <Select
              value={conditionDraft}
              onChange={setConditionDraft}
              options={CONDITIONS.filter((x) => x.name !== '力竭').map((x) => ({ value: x.name, label: x.name }))}
              placeholder="添加状态…"
            />
            <Btn size="sm" onClick={addCondition}><Plus size={11} />添加</Btn>
          </div>
        </div>
        {character.concentration && (
          <div className="concentration-bar" style={{ marginTop: 7 }}>
            <Wand2 size={13} /> 正在专注：{character.concentration} · 受伤时体质豁免 DC = max(10, 伤害/2)
          </div>
        )}
      </div>
    </Panel>
  )
}
