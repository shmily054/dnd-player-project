/**
 * 数字输入框的“草稿字符串”处理。
 *
 * 受控数字输入框不能把空串直接 `Number('')` 成 0/1，否则用户永远删不掉最后一位。
 * 这里把“当前正在输入什么”和“最终提交什么”分开：
 * - `parseNumberDraft` 只判断草稿此刻能否提交成数字；
 * - `commitNumberDraft` 在失焦/回车时把草稿规范成最终值。
 */

export type BlankPolicy = 'restore' | 'zero'

export interface NumberDraftResult {
  /** 可提交的数字；null 表示草稿还不完整（空串、单个 `-`、`1.` 之外的非法字符等） */
  value: number | null
  /** 是否为“空内容”（空串或只剩符号），用于区分“删空”和“输错” */
  blank: boolean
}

const NUMERIC_RE = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/

export function parseNumberDraft(raw: string): NumberDraftResult {
  const text = String(raw ?? '').trim()
  if (text === '') return { value: null, blank: true }
  if (!NUMERIC_RE.test(text)) return { value: null, blank: false }
  const num = Number(text)
  if (!Number.isFinite(num)) return { value: null, blank: false }
  return { value: num, blank: false }
}

export function clampNumber(value: number, min?: number, max?: number): number {
  let next = value
  if (typeof min === 'number' && next < min) next = min
  if (typeof max === 'number' && next > max) next = max
  return next
}

export interface CommitNumberOptions {
  min?: number
  max?: number
  /** 提交前的当前值，草稿为空或非法时回到它 */
  previous: number
  /** 草稿为空时的策略：restore 恢复原值（默认），zero 取 0（再被 min/max 收进范围） */
  blank?: BlankPolicy
}

export function commitNumberDraft(raw: string, opts: CommitNumberOptions): number {
  const parsed = parseNumberDraft(raw)
  if (parsed.value !== null) return clampNumber(parsed.value, opts.min, opts.max)
  if (parsed.blank && opts.blank === 'zero') {
    return clampNumber(0, opts.min, opts.max)
  }
  return opts.previous
}

/** 去掉浮点运算噪声（0.30000000000000004 → 0.3），用于输入框显示 */
export function formatNumberValue(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return String(Math.round(value * 1e6) / 1e6)
}
