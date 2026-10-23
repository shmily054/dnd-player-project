import { User } from 'lucide-react'
import type { Character } from '@/types'
import { acBreakdown, formatMod, initiativeBonus, totalLevel } from '@/lib/calc'

export function VitalsStrip({ character }: { character: Character }) {
  const level = totalLevel(character)
  const ac = acBreakdown(character)
  const init = initiativeBonus(character)
  const classes = character.classes.map((c) => c.name).join(' / ') || '冒险者'
  const slotEntries = Object.entries(character.spellcasting.slots)
    .filter(([, s]) => s.total > 0)
  const totalSlots = slotEntries.reduce((n, [, s]) => n + s.total, 0)
  const usedSlots = slotEntries.reduce((n, [, s]) => n + s.used, 0)
  const remainingSlots = Math.max(0, totalSlots - usedSlots)
  const lowestSlot = slotEntries[0]?.[0] ?? null
  const conditions = character.conditions.map((c) => c.name)
  const conditionText = conditions.length ? conditions.slice(0, 3).join('、') : '无状态'

  return (
    <section className="vitals" aria-label="常驻战术信息">
      <div className="vitals-id">
        {character.portrait ? (
          <img src={character.portrait} alt={`${character.name} 头像`} />
        ) : (
          <span className="vitals-portrait-fallback"><User size={18} /></span>
        )}
        <div className="vitals-id-text">
          <strong>{character.name}</strong>
          <small>{classes} · {level} 级</small>
        </div>
      </div>

      <div className="vitals-item vitals-hp">
        <span className="vitals-label">生命值</span>
        <div className="vitals-hp-line">
          <strong>{character.hp.current}</strong>
          <span>/ {character.hp.max}</span>
          <em>临时 {character.hp.temp}</em>
        </div>
        <div className="vitals-hp-track">
          <span style={{ width: `${character.hp.max ? Math.min(100, (character.hp.current / character.hp.max) * 100) : 0}%` }} />
        </div>
      </div>

      <div className="vitals-item">
        <span className="vitals-label">护甲</span>
        <strong className="vitals-value">{ac.value}</strong>
        <small>AC</small>
      </div>

      <div className="vitals-item">
        <span className="vitals-label">先攻</span>
        <strong className="vitals-value">{formatMod(init)}</strong>
        <small>Init</small>
      </div>

      <div className="vitals-item">
        <span className="vitals-label">法术位</span>
        <strong className="vitals-value">{totalSlots ? `${remainingSlots} / ${totalSlots}` : '—'}</strong>
        <small>{lowestSlot ? `${lowestSlot} 环` : '无'}</small>
      </div>

      <div className="vitals-item vitals-focus">
        <span className="vitals-label">专注</span>
        <strong className="vitals-focus-value">{character.concentration ? character.concentration : '无专注'}</strong>
        <small>状态：{conditionText}</small>
      </div>
    </section>
  )
}
