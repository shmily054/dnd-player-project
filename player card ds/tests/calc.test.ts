import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Character } from '@/types'
import {
  abilityMod, acBreakdown, applyDamage, applyLongRest, applyShortRest, attackBonus, carryCapacity,
  encumbrance, hitDiceLabel, initiativeBonus, maxSpellLevel, passiveScore,
  preparedCount, preparedLimit, proficiencyBonus, saveBonus, skillBonus,
  spellAttackBonus, spellSaveDC, totalLevel, xpInfo,
} from '@/lib/calc'
import { applyLevelUp, getLevelUpPlan } from '@/lib/level-up'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixturePath = path.resolve(here, 'fixtures', 'sample-character.json')
const base = () => JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as Character

describe('角色数值计算', () => {
  it('属性调整值与熟练加值', () => {
    expect(abilityMod(8)).toBe(-1)
    expect(abilityMod(10)).toBe(0)
    expect(abilityMod(18)).toBe(4)
    expect(proficiencyBonus(1)).toBe(2)
    expect(proficiencyBonus(4)).toBe(2)
    expect(proficiencyBonus(5)).toBe(3)
    expect(proficiencyBonus(20)).toBe(6)
  })

  it('示例圣武士的核心派生值', () => {
    const c = base()
    expect(totalLevel(c)).toBe(4)
    expect(skillBonus(c, 'athletics')).toBe(4)
    expect(skillBonus(c, 'perception')).toBe(2)
    expect(skillBonus(c, 'persuasion')).toBe(5)
    expect(saveBonus(c, 'wis')).toBe(2)
    expect(saveBonus(c, 'cha')).toBe(5)
    expect(passiveScore(c, 'perception')).toBe(12)
    expect(spellSaveDC(c)).toBe(13)
    expect(spellAttackBonus(c)).toBe(5)
    expect(initiativeBonus(c)).toBe(2)
    expect(preparedLimit(c)).toBe(5)
    expect(preparedCount(c)).toBe(3)
    expect(maxSpellLevel(c)).toBe(1)
    expect(hitDiceLabel(c)).toBe('4d10')
  })

  it('AC 分解：板条甲 + 盾牌 = 19', () => {
    const c = base()
    c.ac = { mode: 'auto', manual: null }
    const ac = acBreakdown(c)
    expect(ac.value).toBe(19)
    expect(ac.parts.join(' ')).toContain('17')
    expect(ac.parts.join(' ')).toContain('盾牌 +2')
  })

  it('负重与攻击加值', () => {
    const c = base()
    expect(carryCapacity(c)).toBe(270)
    expect(encumbrance(c).status).toBe('normal')
    const sword = c.attacks.find((a) => a.name === '魔法长剑')!
    expect(attackBonus(c, sword)).toBe(7)
  })

  it('XP 进度与升级阈值', () => {
    const c = base()
    const xp = xpInfo(c)
    expect(xp.next).toBe(6500)
    expect(xp.canLevel).toBe(false)
  })
})

describe('生命值伤害结算', () => {
  it('优先扣除临时生命值，溢出伤害再扣本体', () => {
    const c = base()
    c.hp = { max: 41, current: 41, temp: 10 }
    expect(applyDamage(c.hp, 20)).toEqual({ max: 41, current: 31, temp: 0 })
  })

  it('临时生命值足够时本体 HP 不变', () => {
    const c = base()
    c.hp = { max: 41, current: 41, temp: 10 }
    expect(applyDamage(c.hp, 5)).toEqual({ max: 41, current: 41, temp: 5 })
  })

  it('伤害超过临时值与本体 HP 时不会出现负数', () => {
    const c = base()
    c.hp = { max: 41, current: 5, temp: 3 }
    expect(applyDamage(c.hp, 20)).toEqual({ max: 41, current: 0, temp: 0 })
  })
})

describe('休息与升级', () => {
  it('短休恢复短休资源与生命骰', () => {
    const c = base()
    c.hp.current = 20
    c.hitDice.remaining = 4
    c.resources.find((r) => r.name === '引导神力')!.used = 1
    const res = applyShortRest(c, 1, 10)
    expect(res.character.hp.current).toBe(30)
    expect(res.character.hitDice.remaining).toBe(3)
    expect(res.character.resources.find((r) => r.name === '引导神力')!.used).toBe(0)
  })

  it('长休回满并降低力竭', () => {
    const c = base()
    c.hp.current = 5
    c.exhaustion = 2
    c.hitDice.remaining = 1
    c.spellcasting.slots['1'].used = 2
    c.concentration = '祝福术'
    const res = applyLongRest(c)
    expect(res.character.hp.current).toBe(res.character.hp.max)
    expect(res.character.exhaustion).toBe(1)
    expect(res.character.hitDice.remaining).toBe(3)
    expect(res.character.spellcasting.slots['1'].used).toBe(0)
    expect(res.character.concentration).toBeNull()
  })

  it('圣武士 4 → 5 级：额外攻击与 4/2 法术位', () => {
    const c = base()
    const plan = getLevelUpPlan(c, '圣武士')!
    expect(plan.newLevel).toBe(5)
    expect(plan.newFeatures).toContain('额外攻击')
    expect(plan.slotsAfter.slice(0, 2)).toEqual([4, 2])
    expect(plan.hpAverage).toBe(8)
    const res = applyLevelUp(c, '圣武士', { hpGain: 8, asi: undefined, feat: null })
    const next = res.character
    expect(totalLevel(next)).toBe(5)
    expect(next.hp.max).toBe(49)
    expect(next.spellcasting.slots['1'].total).toBe(4)
    expect(next.spellcasting.slots['2'].total).toBe(2)
    expect(next.features.some((f) => f.name === '额外攻击' && f.source === '圣武士')).toBe(true)
    expect(next.resources.find((r) => r.name === '圣疗')!.total).toBe(25)
  })
})
