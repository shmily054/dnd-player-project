import { AlertTriangle, CheckCircle2, EyeOff, Wand2 } from 'lucide-react'
import type { Character } from '@/types'
import { Badge, Btn, Panel } from '@/components/ui'

export function AuditPanel({
  character, onAction, onIgnore,
}: {
  character: Character
  onAction: (id: string) => void
  onIgnore: (id: string) => void
}) {
  const open = character.audit.filter((a) => a.status === 'open' && a.severity === 'warn')
  const done = character.audit.filter((a) => a.status !== 'open')
  if (!open.length && !done.length) return null
  return (
    <Panel
      className="audit-panel"
      title={<><AlertTriangle size={16} /> 导入校对</>}
      subtitle="旧角色数据与规则库比对结果；不会静默覆盖你的自定义内容"
      actions={<Badge tone={open.length ? 'gold' : 'green'}>{open.length ? `${open.length} 项待确认` : '已处理'}</Badge>}
    >
      {open.map((a) => (
        <div className="audit-row" key={a.id}>
          <AlertTriangle size={16} className="text-[var(--gold)] shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="audit-title">{a.title}</div>
            <div className="audit-detail">{a.detail}</div>
            <div className="audit-actions">
              {a.action && (
                <Btn size="sm" variant="gold" onClick={() => onAction(a.id)}>
                  <Wand2 size={12} /> 应用建议
                </Btn>
              )}
              <Btn size="sm" variant="ghost" onClick={() => onIgnore(a.id)}>
                <EyeOff size={12} /> 忽略
              </Btn>
            </div>
          </div>
        </div>
      ))}
      {done.length > 0 && (
        <details className="audit-done">
          <summary><CheckCircle2 size={13} /> 已自动修正 / 已处理 {done.length} 项</summary>
          {done.map((a) => (
            <div className="audit-row audit-fixed" key={a.id}>
              <CheckCircle2 size={14} className="text-[var(--green)] shrink-0 mt-0.5" />
              <div>
                <div className="audit-title">{a.title}</div>
                <div className="audit-detail">{a.detail}</div>
              </div>
            </div>
          ))}
        </details>
      )}
    </Panel>
  )
}
