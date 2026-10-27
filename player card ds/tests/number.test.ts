import { describe, expect, it } from 'vitest'
import {
  clampNumber,
  commitNumberDraft,
  formatNumberValue,
  parseNumberDraft,
} from '@/lib/number'

describe('数字输入草稿', () => {
  it('空串是“空内容”，不提交', () => {
    expect(parseNumberDraft('')).toEqual({ value: null, blank: true })
    expect(parseNumberDraft('   ')).toEqual({ value: null, blank: true })
  })

  it('允许负号、小数点等中间态', () => {
    expect(parseNumberDraft('-')).toEqual({ value: null, blank: false })
    expect(parseNumberDraft('-5')).toEqual({ value: -5, blank: false })
    expect(parseNumberDraft('0.')).toEqual({ value: 0, blank: false })
    expect(parseNumberDraft('.5')).toEqual({ value: 0.5, blank: false })
    expect(parseNumberDraft('007')).toEqual({ value: 7, blank: false })
    expect(parseNumberDraft(' 12 ')).toEqual({ value: 12, blank: false })
  })

  it('非法字符不提交', () => {
    expect(parseNumberDraft('abc')).toEqual({ value: null, blank: false })
    expect(parseNumberDraft('1e3')).toEqual({ value: null, blank: false })
    expect(parseNumberDraft('1.2.3')).toEqual({ value: null, blank: false })
  })

  it('提交时按 min/max 收进范围', () => {
    expect(clampNumber(15, 0, 12)).toBe(12)
    expect(clampNumber(-3, 0)).toBe(0)
    expect(clampNumber(7, undefined, undefined)).toBe(7)
    expect(commitNumberDraft('15', { min: 0, max: 12, previous: 3 })).toBe(12)
    expect(commitNumberDraft('-5', { min: -10, max: 30, previous: 0 })).toBe(-5)
  })

  it('空草稿默认恢复原值，zero 策略归零后受范围约束', () => {
    expect(commitNumberDraft('', { previous: 14 })).toBe(14)
    expect(commitNumberDraft('', { previous: 14, blank: 'zero' })).toBe(0)
    expect(commitNumberDraft('', { previous: 14, blank: 'zero', min: 1 })).toBe(1)
  })

  it('非法草稿提交时恢复原值', () => {
    expect(commitNumberDraft('-', { previous: 8 })).toBe(8)
    expect(commitNumberDraft('abc', { previous: 8 })).toBe(8)
  })

  it('显示时去掉浮点噪声', () => {
    expect(formatNumberValue(0.30000000000000004)).toBe('0.3')
    expect(formatNumberValue(15)).toBe('15')
    expect(formatNumberValue(Number.NaN)).toBe('0')
  })
})
