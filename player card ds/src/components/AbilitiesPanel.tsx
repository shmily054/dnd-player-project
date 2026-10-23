import type { Character } from '@/types'
import { ABILITIES, SKILLS } from '@/types'
import {
  abilityMod, formatMod, passiveScore, proficiencyBonus, saveBonus, skillBonus, totalLevel,
} from '@/lib/calc'
import { Badge, NumberField, Panel, TagList } from '@/components/ui'

export function AbilitiesPanel({ character, patch }: { character: Character; patch: (fn: (c: Character) => Character) => void }) {
  const pb = proficiencyBonus(Math.max(1, totalLevel(character)))

  const toggleSave = (key: string) => {
    patch((c) => {
      const has = c.saveProfs.includes(key as Character['saveProfs'][number])
      return { ...c, saveProfs: has ? c.saveProfs.filter((x) => x !== key) : [...c.saveProfs, key as Character['saveProfs'][number]] }
    })
  }

  const toggleSkill = (key: string, mode: 'prof' | 'exp') => {
    patch((c) => {
      if (mode === 'prof') {
        if (c.skillProfs.includes(key)) {
          return { ...c, skillProfs: c.skillProfs.filter((x) => x !== key), skillExpertise: c.skillExpertise.filter((x) => x !== key) }
        }
        return { ...c, skillProfs: [...c.skillProfs, key] }
      }
      if (c.skillExpertise.includes(key)) {
        return { ...c, skillExpertise: c.skillExpertise.filter((x) => x !== key) }
      }
      return {
        ...c,
        skillProfs: c.skillProfs.includes(key) ? c.skillProfs : [...c.skillProfs, key],
        skillExpertise: [...c.skillExpertise, key],
      }
    })
  }

  return (
    <Panel
      id="abilities"
      title="属性、豁免与技能"
      subtitle="点击「熟」切换熟练，再点「专」切换专精"
      actions={<Badge tone="green">熟练加值 {formatMod(pb)}</Badge>}
    >
      <div className="abilities-grid">
        {ABILITIES.map((a) => {
          const saveProf = character.saveProfs.includes(a.key)
          return (
            <div className="ability-card" key={a.key}>
              <div className="ab-name">{a.name} <span style={{ opacity: .55 }}>{a.en}</span></div>
              <div className="ab-score">
                <input
                  value={character.abilities[a.key]}
                  inputMode="numeric"
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(30, Number(e.target.value) || 1))
                    patch((c) => ({ ...c, abilities: { ...c.abilities, [a.key]: v } }))
                  }}
                />
              </div>
              <div className="ab-mod">{formatMod(abilityMod(character.abilities[a.key]))}</div>
              <div className={`ab-save ${saveProf ? 'on' : ''}`}>
                <button className="ability-save-btn" onClick={() => toggleSave(a.key)} title="切换豁免熟练">
                  <span className={`save-dot-small ${saveProf ? 'on' : ''}`} />
                  豁免 {formatMod(saveBonus(character, a.key))}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="skill-grid">
        {SKILLS.map((s) => {
          const prof = character.skillProfs.includes(s.key)
          const exp = character.skillExpertise.includes(s.key)
          return (
            <div className="skill-row" key={s.key}>
              <span className="sk-ability">{s.ability}</span>
              <span className="sk-name">{s.name}</span>
              <button
                className={`prof-btn ${prof ? 'prof' : ''}`}
                onClick={() => toggleSkill(s.key, 'prof')}
                title="熟练"
              >熟</button>
              <button
                className={`prof-btn ${exp ? 'exp' : ''}`}
                onClick={() => toggleSkill(s.key, 'exp')}
                title="专精（双倍熟练）"
              >专</button>
              <span className="sk-bonus">{formatMod(skillBonus(character, s.key))}</span>
            </div>
          )
        })}
      </div>

      <div className="passive-row">
        <span>被动察觉 <strong>{passiveScore(character, 'perception')}</strong></span>
        <span>被动调查 <strong>{passiveScore(character, 'investigation')}</strong></span>
        <span>被动洞悉 <strong>{passiveScore(character, 'insight')}</strong></span>
      </div>

      <div className="prof-section">
        <h4>护甲熟练</h4>
        <TagList values={character.armorProfs} onChange={(v) => patch((c) => ({ ...c, armorProfs: v }))} placeholder="添加护甲熟练…" />
      </div>
      <div className="prof-section">
        <h4>武器熟练</h4>
        <TagList
          values={character.weaponProfs}
          onChange={(v) => patch((c) => ({ ...c, weaponProfs: v }))}
          placeholder="添加武器熟练…"
          options={['简易武器', '军用武器', '所有武器', '长剑', '短剑', '匕首', '手弩', '长弓', '盾牌']}
        />
      </div>
      <div className="prof-section">
        <h4>工具熟练</h4>
        <TagList
          values={character.toolProfs}
          onChange={(v) => patch((c) => ({ ...c, toolProfs: v }))}
          placeholder="添加工具…"
          options={['盗贼工具', '工匠工具', '乐器', '赌具']}
        />
      </div>
      <div className="prof-section">
        <h4>语言</h4>
        <TagList
          values={character.languages}
          onChange={(v) => patch((c) => ({ ...c, languages: v }))}
          placeholder="添加语言…"
          options={['通用语', '精灵语', '矮人语', '龙语', '天界语', '深渊语', '炼狱语', '地精语']}
        />
      </div>
    </Panel>
  )
}
