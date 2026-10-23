import { useRef } from 'react'
import { Camera, Plus, Trash2, User } from 'lucide-react'
import type { Character } from '@/types'
import { ALIGNMENTS, CLASS_NAMES } from '@/types'
import {
  acBreakdown, formatMod, getClassDef, initiativeBonus, proficiencyBonus, totalLevel, xpInfo,
} from '@/lib/calc'
import { Badge, Btn, NumberField, Panel, Select, TextInput } from '@/components/ui'

export function SheetHero({
  character, patch, onUploadPortrait, onLevelUp, canLevel,
}: {
  character: Character
  patch: (fn: (c: Character) => Character) => void
  onUploadPortrait: (file: File | undefined) => void
  onLevelUp: () => void
  canLevel: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const level = totalLevel(character)
  const xp = xpInfo(character)
  const ac = acBreakdown(character)
  const pb = proficiencyBonus(Math.max(1, level))
  const init = initiativeBonus(character)

  const setClass = (index: number, patchObj: Partial<Character['classes'][number]>) => {
    patch((c) => {
      const classes = c.classes.map((x, i) => (i === index ? { ...x, ...patchObj } : x))
      if (patchObj.name) {
        const def = getClassDef(patchObj.name)
        if (def) classes[index].hitDie = def.hitDie
      }
      if (patchObj.level !== undefined) {
        const oldLevel = c.classes[index]?.level || 0
        const delta = patchObj.level - oldLevel
        const total = classes.reduce((n, x) => n + x.level, 0)
        const hitDice = Math.max(0, Math.min(total, c.hitDice.remaining + delta))
        return { ...c, classes, hitDice: { remaining: hitDice } }
      }
      return { ...c, classes }
    })
  }

  const addClass = () => {
    patch((c) => ({
      ...c,
      classes: [...c.classes, { name: '战士', subclass: '', level: 1, hitDie: 10 }],
    }))
  }

  const removeClass = (index: number) => {
    patch((c) => {
      if (c.classes.length <= 1) return c
      const classes = c.classes.filter((_, i) => i !== index)
      const total = classes.reduce((n, x) => n + x.level, 0)
      return { ...c, classes, hitDice: { remaining: Math.min(c.hitDice.remaining, total) } }
    })
  }

  return (
    <Panel
      title="冒险者身份"
      subtitle="姓名、种族、职业与等级都会直接影响派生数值"
      actions={<Badge tone={canLevel ? 'gold' : 'default'}>{canLevel ? '可以升级' : `${level} 级`}</Badge>}
    >
      <div className="sheet-hero">
        <div className="portrait-frame">
          {character.portrait ? (
            <img src={character.portrait} alt={`${character.name} 头像`} />
          ) : (
            <div className="portrait-placeholder"><User size={30} /></div>
          )}
          <button className="portrait-edit" onClick={() => fileRef.current?.click()}>
            <Camera size={11} /> 更换头像
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { onUploadPortrait(e.target.files?.[0]); e.target.value = '' }}
          />
        </div>

        <div className="min-w-0">
          <input
            className="hero-name-input"
            value={character.name}
            placeholder="角色名"
            onChange={(e) => patch((c) => ({ ...c, name: e.target.value }))}
          />
          <div className="hero-line">
            <label className="hero-inline">
              <span>玩家</span>
              <TextInput value={character.playerName} onChange={(v) => patch((c) => ({ ...c, playerName: v }))} placeholder="玩家名" />
            </label>
            <label className="hero-inline">
              <span>种族</span>
              <TextInput value={character.race.name} onChange={(v) => patch((c) => ({ ...c, race: { ...c.race, name: v } }))} placeholder="种族" />
            </label>
            <label className="hero-inline">
              <span>背景</span>
              <TextInput value={character.background} onChange={(v) => patch((c) => ({ ...c, background: v }))} placeholder="背景" />
            </label>
            <label className="hero-inline">
              <span>阵营</span>
              <Select
                value={character.alignment}
                placeholder="未设定"
                options={ALIGNMENTS.map((a) => ({ value: a, label: a }))}
                onChange={(v) => patch((c) => ({ ...c, alignment: v }))}
                className="hero-select"
              />
            </label>
          </div>

          <div className="class-list">
            {character.classes.map((cl, i) => {
              const def = getClassDef(cl.name)
              const subOptions = def?.subclasses || []
              return (
                <div className="class-row" key={`${cl.name}-${i}`}>
                  <Select
                    value={cl.name}
                    options={CLASS_NAMES.map((n) => ({ value: n, label: n }))}
                    onChange={(v) => setClass(i, { name: v })}
                  />
                  <input
                    className="input subclass-input"
                    list={`subclass-${i}`}
                    value={cl.subclass}
                    placeholder={def?.subclassLabel || '子职业'}
                    onChange={(e) => setClass(i, { subclass: e.target.value })}
                  />
                  <datalist id={`subclass-${i}`}>
                    {subOptions.map((s) => <option key={s} value={s} />)}
                  </datalist>
                  <div className="class-level">
                    <span>等级</span>
                    <NumberField value={cl.level} min={1} max={20} onChange={(v) => setClass(i, { level: v })} />
                  </div>
                  <span className="badge">d{cl.hitDie}</span>
                  {character.classes.length > 1 && (
                    <button className="icon-btn danger" onClick={() => removeClass(i)} title="移除职业"><Trash2 size={13} /></button>
                  )}
                </div>
              )
            })}
            <button className="add-class" onClick={addClass}><Plus size={12} /> 兼职 / 添加职业</button>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-badges">
            <Badge tone="gold">{level} 级</Badge>
            <Badge tone="green">熟练 {formatMod(pb)}</Badge>
            <Badge>AC {ac.value}</Badge>
            <Badge>先攻 {formatMod(init)}</Badge>
          </div>
          <div className="xp-line">
            <span>{character.xp} XP</span>
            <span>{xp.next === null ? '已满级' : `下一级 ${xp.next}`}</span>
          </div>
          <div className="xp-bar"><span style={{ width: `${Math.round(xp.progress * 100)}%` }} /></div>
          <div className="xp-text">{xp.next === null ? '20 级' : `${Math.round(xp.progress * 100)}% 到 ${xp.level + 1} 级`}</div>
          <label className="xp-input">
            <span>XP</span>
            <NumberField value={character.xp} min={0} onChange={(v) => patch((c) => ({ ...c, xp: v }))} />
          </label>
          <Btn variant={canLevel ? 'gold' : 'primary'} size="sm" onClick={onLevelUp} className={canLevel ? 'level-up-pulse' : ''}>
            升级向导
          </Btn>
        </div>
      </div>
    </Panel>
  )
}
