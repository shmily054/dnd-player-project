import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { CLASS_DATA, getClassDef } from '@/lib/calc'
import { Btn, Field, Modal, Select, TextInput } from '@/components/ui'

export function NewCharacterDialog({
  open, onClose, onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (body: { name: string; className: string; subclass: string }) => void
}) {
  const [name, setName] = useState('新角色')
  const [className, setClassName] = useState('圣武士')
  const [subclass, setSubclass] = useState('')
  const def = getClassDef(className)

  useEffect(() => {
    if (!open) return
    setName('新角色')
    setClassName('圣武士')
    setSubclass('')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<><Plus size={18} /> 新建角色</>}
      subtitle="创建 1 级角色；之后可以在卡面中直接修改一切"
      footer={<><Btn onClick={onClose}>取消</Btn><Btn variant="primary" onClick={() => onCreate({ name, className, subclass })}>创建</Btn></>}
    >
      <div className="new-char-form">
        <Field label="角色名">
          <TextInput value={name} onChange={setName} placeholder="角色名" autoFocus />
        </Field>
        <Field label="职业">
          <Select
            value={className}
            onChange={(v) => { setClassName(v); setSubclass('') }}
            options={CLASS_DATA.classes.map((c) => ({ value: c.name, label: `${c.name}（d${c.hitDie}）` }))}
          />
        </Field>
        {def && (
          <Field label={`${def.subclassLabel}（可选）`} hint={def.subclassLevel === 1 ? '该职业 1 级选择子职业' : `该职业 ${def.subclassLevel} 级选择子职业；现在可留空`}>
            <input
              className="input"
              list="new-subclasses"
              value={subclass}
              placeholder="留空或输入子职业"
              onChange={(e) => setSubclass(e.target.value)}
            />
            <datalist id="new-subclasses">
              {def.subclasses.map((s) => <option key={s} value={s} />)}
            </datalist>
          </Field>
        )}
        <p className="hint">
          初始 HP 按职业生命骰取满（体质 10 时），属性均为 10，技能与背景留空；创建后直接编辑即可。
        </p>
      </div>
    </Modal>
  )
}
