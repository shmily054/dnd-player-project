import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NumberField } from '@/components/ui'

describe('NumberField 渲染', () => {
  it('用文本输入承载数字，避免浏览器 number 控件吞掉中间态', () => {
    const html = renderToStaticMarkup(<NumberField value={15} min={1} max={20} onChange={() => {}} />)
    expect(html).toContain('type="text"')
    expect(html).toContain('inputMode="decimal"')
    expect(html).toContain('value="15"')
    expect(html).toContain('class="input num "')
  })

  it('bare 模式不套通用样式，便于沿用 HP/属性/钱币的专门 CSS', () => {
    const html = renderToStaticMarkup(
      <NumberField bare className="hp-current-input" value={7} min={0} onChange={() => {}} />,
    )
    expect(html).toContain('class="hp-current-input"')
    expect(html).not.toContain('input num')
    expect(html).toContain('value="7"')
  })

  it('非法值按 0 显示，不产生 NaN', () => {
    const html = renderToStaticMarkup(<NumberField value={Number.NaN} onChange={() => {}} />)
    expect(html).toContain('value="0"')
    expect(html).not.toContain('NaN')
  })
})
