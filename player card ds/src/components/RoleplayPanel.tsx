import { Compass, Heart, Link2, Sparkles, UserRound } from 'lucide-react'
import type { Character, Roleplay } from '@/types'
import { Panel, TextArea } from '@/components/ui'

export function RoleplayPanel({ character, patch }: { character: Character; patch: (fn: (c: Character) => Character) => void }) {
  const set = (key: keyof Roleplay, value: string) => {
    patch((c) => ({ ...c, roleplay: { ...c.roleplay, [key]: value } }))
  }
  return (
    <Panel id="roleplay" title="角色扮演档案" subtitle="性格、理想、羁绊、缺陷与背景故事">
      <div className="roleplay-grid">
        <label className="roleplay-field">
          <span className="rp-label"><Sparkles size={13} /> 性格特质</span>
          <TextArea value={character.roleplay.personality} onChange={(v) => set('personality', v)} placeholder="我说话时总是…；我最在意…" rows={3} />
        </label>
        <label className="roleplay-field">
          <span className="rp-label"><Compass size={13} /> 理想</span>
          <TextArea value={character.roleplay.ideals} onChange={(v) => set('ideals', v)} placeholder="我信仰…；我决不允许…" rows={3} />
        </label>
        <label className="roleplay-field">
          <span className="rp-label"><Link2 size={13} /> 羁绊</span>
          <TextArea value={character.roleplay.bonds} onChange={(v) => set('bonds', v)} placeholder="我欠…；我誓死保护…" rows={3} />
        </label>
        <label className="roleplay-field">
          <span className="rp-label"><Heart size={13} /> 缺陷</span>
          <TextArea value={character.roleplay.flaws} onChange={(v) => set('flaws', v)} placeholder="我无法抗拒…；我总是不自觉地…" rows={3} />
        </label>
        <label className="roleplay-field span-2">
          <span className="rp-label"><UserRound size={13} /> 外貌</span>
          <TextArea value={character.roleplay.appearance} onChange={(v) => set('appearance', v)} placeholder="年龄、身高、体重、发色、瞳色、肤色、衣着、特殊印记…" rows={3} />
        </label>
        <label className="roleplay-field">
          <span className="rp-label">背景故事</span>
          <TextArea value={character.roleplay.backstory} onChange={(v) => set('backstory', v)} placeholder="出身、成为冒险者的原因、重要经历…" rows={6} />
        </label>
        <label className="roleplay-field">
          <span className="rp-label">盟友与组织</span>
          <TextArea value={character.roleplay.allies} onChange={(v) => set('allies', v)} placeholder="同伴、导师、仇敌、所属组织…" rows={3} />
          <span className="rp-label" style={{ marginTop: 8 }}>战役笔记</span>
          <TextArea value={character.roleplay.notes} onChange={(v) => set('notes', v)} placeholder="任务、线索、重要日期、待办…" rows={3} />
        </label>
      </div>
    </Panel>
  )
}
