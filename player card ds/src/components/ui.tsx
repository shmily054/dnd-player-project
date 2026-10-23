import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { Check, ChevronDown, X, Minus, Plus } from 'lucide-react'

/* ---------------- Toast ---------------- */

type ToastKind = 'info' | 'success' | 'warn' | 'error'
type ToastFn = (message: string, kind?: ToastKind) => void
const ToastContext = createContext<ToastFn>(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; message: string; kind: ToastKind }[]>([])
  const toast = useCallback<ToastFn>((message, kind = 'info') => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev.slice(-4), { id, message, kind }])
    window.setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 4200)
  }, [])
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {items.map((x) => (
          <div key={x.id} className={`toast toast-${x.kind}`}>
            <span>{x.message}</span>
            <button onClick={() => setItems((prev) => prev.filter((y) => y.id !== x.id))} aria-label="关闭">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ---------------- Panel ---------------- */

export function Panel({
  id, title, subtitle, actions, children, className = '', dense = false,
}: {
  id?: string
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  dense?: boolean
}) {
  return (
    <section id={id} className={`panel ${dense ? 'panel-dense' : ''} ${className}`}>
      <header className="panel-head">
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
          {subtitle && <p className="panel-sub">{subtitle}</p>}
        </div>
        {actions && <div className="panel-actions">{actions}</div>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}

/* ---------------- Buttons ---------------- */

export function Btn({
  children, variant = 'secondary', size = 'md', className = '', type = 'button', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
  size?: 'sm' | 'md' | 'icon'
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------------- Inputs ---------------- */

export function NumberField({
  value, onChange, min, max, step = 1, className = '', title,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  title?: string
}) {
  return (
    <input
      type="number"
      title={title}
      className={`input num ${className}`}
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = e.target.value === '' ? 0 : Number(e.target.value)
        if (Number.isNaN(v)) return
        onChange(v)
      }}
    />
  )
}

export function TextInput({
  value, onChange, placeholder, className = '', ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      className={`input ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  )
}

export function TextArea({
  value, onChange, placeholder, rows = 4, className = '', autoGrow = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  className?: string
  autoGrow?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!autoGrow) return
    const el = ref.current
    if (!el) return
    const resize = () => {
      el.style.height = 'auto'
      const border = el.offsetHeight - el.clientHeight
      el.style.height = `${el.scrollHeight + border}px`
    }
    const onToggle = () => window.requestAnimationFrame(resize)
    const details = el.closest('details')
    resize()
    details?.addEventListener('toggle', onToggle)
    window.addEventListener('resize', resize)
    return () => {
      details?.removeEventListener('toggle', onToggle)
      window.removeEventListener('resize', resize)
    }
  }, [autoGrow, value])

  return (
    <textarea
      ref={ref}
      className={`textarea ${autoGrow ? 'textarea-autogrow' : ''} ${className}`}
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function Select({
  value, onChange, options, className = '', placeholder,
}: {
  value: string | number
  onChange: (v: string) => void
  options: { value: string | number; label: string }[]
  className?: string
  placeholder?: string
}) {
  return (
    <div className={`select-wrap ${className}`}>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="select-arrow" />
    </div>
  )
}

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

/* ---------------- Stepper / Pips ---------------- */

export function Stepper({
  value, onChange, min = 0, max = 999, label,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  label?: string
}) {
  return (
    <div className="stepper" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="减少">
        <Minus size={13} />
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="增加">
        <Plus size={13} />
      </button>
    </div>
  )
}

export function Pips({
  total, used, onChange, infinite = false, tone = 'default', maxPips = 30,
}: {
  total: number
  used: number
  onChange: (used: number) => void
  infinite?: boolean
  tone?: 'default' | 'hp' | 'slot' | 'resource'
  maxPips?: number
}) {
  if (infinite) return <span className="pips-infinite" title="无限使用">∞</span>
  const n = Math.max(0, Math.min(maxPips, total))
  if (n === 0) return <span className="pips-empty">—</span>
  return (
    <div className={`pips pips-${tone}`}>
      {Array.from({ length: n }, (_, i) => {
        const filled = i < used
        return (
          <button
            key={i}
            type="button"
            className={`pip ${filled ? 'used' : ''}`}
            title={`${i + 1} / ${n}`}
            onClick={() => onChange(i < used ? i : i + 1)}
          />
        )
      })}
    </div>
  )
}

export function Toggle({
  checked, onChange, label, size = 16, title,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  size?: number
  title?: string
}) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      title={title || label}
      aria-label={title || label}
    >
      <span className="toggle-box">{checked && <Check size={size - 4} />}</span>
      {label && <span>{label}</span>}
    </button>
  )
}

/* ---------------- Badge ---------------- */

export function Badge({ children, tone = 'default', className = '' }: { children: ReactNode; tone?: 'default' | 'gold' | 'green' | 'red' | 'blue'; className?: string }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>
}

/* ---------------- Modal ---------------- */

export function Modal({
  open, onClose, title, subtitle, children, footer, wide = false, huge = false,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  huge?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    d.addEventListener('cancel', onCancel)
    return () => d.removeEventListener('cancel', onCancel)
  }, [onClose])
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal-wide' : ''} ${huge ? 'modal-huge' : ''}`}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
    >
      <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭"><X size={18} /></button>
        </header>
        <div className="modal-content">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </dialog>
  )
}

/* ---------------- Misc ---------------- */

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Divider({ label }: { label?: string }) {
  return <div className="divider">{label && <span>{label}</span>}</div>
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  )
}

export function TagList({
  values, onChange, placeholder = '添加…', options,
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  options?: string[]
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v || values.includes(v)) return
    onChange([...values, v])
    setDraft('')
  }
  return (
    <div className="tag-list">
      {values.map((v) => (
        <span className="tag" key={v}>
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`移除 ${v}`}><X size={12} /></button>
        </span>
      ))}
      <input
        className="tag-input"
        list={options ? 'tag-options' : undefined}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        onBlur={add}
      />
      {options && <datalist id="tag-options">{options.map((o) => <option key={o} value={o} />)}</datalist>}
    </div>
  )
}
