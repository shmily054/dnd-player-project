import { useEffect, useMemo, useState } from 'react'
import { ArrowUpCircle, Check, Loader2, Search, Sparkles } from 'lucide-react'
import type { AbilityKey, Character, Feature, SearchResult } from '@/types'
import { ABILITIES } from '@/types'
import { api } from '@/lib/api'
import { totalLevel, xpInfo } from '@/lib/calc'
import { featureFromEntry } from '@/lib/convert'
import { applyLevelUp, describeNewFeatures, getLevelUpPlan } from '@/lib/level-up'
import { Badge, Btn, Empty, Modal, NumberField, Select } from '@/components/ui'

type AsiMode = 'none' | 'plus2' | 'plus1s' | 'feat'

export function LevelUpDialog({
  open, character, onClose, onApply,
}: {
  open: boolean
  character: Character
  onClose: () => void
  onApply: (next: Character, summary: string[]) => void
}) {
  const primary = [...character.classes].sort((a, b) => b.level - a.level)[0]?.name || ''
  const [className, setClassName] = useState(primary)
  const [hpMode, setHpMode] = useState<'average' | 'manual'>('average')
  const [hpManual, setHpManual] = useState(8)
  const [asiMode, setAsiMode] = useState<AsiMode>('none')
  const [asi1, setAsi1] = useState<AbilityKey>('str')
  const [asi2, setAsi2] = useState<AbilityKey>('con')
  const [subclass, setSubclass] = useState('')
  const [featQuery, setFeatQuery] = useState('')
  const [featResults, setFeatResults] = useState<SearchResult[]>([])
  const [selectedFeat, setSelectedFeat] = useState<Feature | null>(null)
  const [featLoading, setFeatLoading] = useState(false)
  const [applying, setApplying] = useState(false)

  const plan = useMemo(() => getLevelUpPlan(character, className), [character, className])

  useEffect(() => {
    if (!open) return
    const p = [...character.classes].sort((a, b) => b.level - a.level)[0]
    setClassName(p?.name || '')
    setHpMode('average')
    setAsiMode('none')
    setSubclass(p?.subclass || '')
    setFeatQuery('')
    setSelectedFeat(null)
    setApplying(false)
  }, [open, character.id])

  useEffect(() => {
    if (!plan) return
    setHpManual(plan.hpAverage)
    if (plan.classDef.subclassLevel === plan.newLevel && !subclass) setSubclass(plan.classDef.subclasses[0] || '')
  }, [plan?.className, plan?.newLevel])

  useEffect(() => {
    if (!open || asiMode !== 'feat') return
    let cancelled = false
    setFeatLoading(true)
    const t = window.setTimeout(async () => {
      try {
        const res = featQuery.trim()
          ? await api.search({ q: featQuery, type: 'feat', limit: 8 })
          : await api.browse({ type: 'feat', limit: 12 })
        if (!cancelled) setFeatResults(res.results)
      } catch {
        if (!cancelled) setFeatResults([])
      } finally {
        if (!cancelled) setFeatLoading(false)
      }
    }, 200)
    return () => { cancelled = true; window.clearTimeout(t) }
  }, [open, asiMode, featQuery])

  const hpGain = hpMode === 'manual' ? hpManual : (plan?.hpAverage || 1)
  const slotDiff = plan ? plan.slotsAfter.map((v, i) => ({ level: i + 1, delta: v - (plan.slotsBefore[i] || 0), before: plan.slotsBefore[i] || 0, after: v })).filter((x) => x.delta !== 0) : []
  const classOptions = character.classes.map((c) => ({ value: c.name, label: c.name }))

  const apply = async () => {
    if (!plan) return
    if (hpMode === 'manual' && (hpManual < plan.hpMin || hpManual > plan.hpMax)) return
    let asi: Partial<Record<AbilityKey, number>> | undefined
    if (asiMode === 'plus2') asi = { [asi1]: 2 }
    if (asiMode === 'plus1s') {
      if (asi1 === asi2) return
      asi = { [asi1]: 1, [asi2]: 1 }
    }
    let feat: Feature | null = null
    if (asiMode === 'feat') {
      if (!selectedFeat) return
      feat = selectedFeat
    }
    setApplying(true)
    try {
      const res = applyLevelUp(character, className, { hpGain, asi, feat, subclass: plan.isSubclassLevel ? subclass : undefined })
      let next = res.character
      if (res.newFeatures.length) {
        try {
          next = await describeNewFeatures(next, className, res.newFeatures, (q) => api.search({ q, type: 'raw', limit: 5 }))
        } catch {
          // 摘录失败不影响升级
        }
      }
      onApply(next, res.summary)
    } catch (e) {
      alert(String((e as Error).message || e))
    } finally {
      setApplying(false)
    }
  }

  if (!plan) {
    return (
      <Modal open={open} onClose={onClose} title="升级向导">
        <Empty>该职业已满 20 级，无法继续升级。</Empty>
      </Modal>
    )
  }

  const invalidAsi = asiMode === 'plus1s' && asi1 === asi2
  const invalidFeat = asiMode === 'feat' && !selectedFeat
  const invalidHp = hpMode === 'manual' && (hpManual < plan.hpMin || hpManual > plan.hpMax)
  const invalidSubclass = plan.isSubclassLevel && !subclass

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={<><ArrowUpCircle size={18} /> 升级向导</>}
      subtitle={`${character.name} · 当前总等级 ${totalLevel(character)}`}
      footer={
        <>
          <Btn onClick={onClose}>取消</Btn>
          <Btn variant="primary" disabled={applying || invalidAsi || invalidFeat || invalidHp || invalidSubclass} onClick={() => void apply()}>
            {applying ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} 确认升级
          </Btn>
        </>
      }
    >
      <div className="levelup-grid">
        <section>
          <div className="levelup-block">
            <h3>职业</h3>
            {classOptions.length > 1 ? (
              <Select value={className} onChange={(v) => { setClassName(v); setSubclass(''); setAsiMode('none'); setSelectedFeat(null) }} options={classOptions} />
            ) : (
              <div className="levelup-class-name">{plan.classDef.name} <span>d{plan.classDef.hitDie}</span></div>
            )}
            <p className="hint">
              {plan.currentLevel === 0 ? '新增职业等级 1' : `职业等级 ${plan.currentLevel} → ${plan.newLevel}`}
              {' · '}熟练加值 {plan.pbBefore} → {plan.pbAfter}
            </p>
            {!xpInfo(character).canLevel && (
              <p className="hint warn-text">
                当前 XP {character.xp} 尚未达到 {plan.newLevel} 级阈值；仍可手动升级，本向导不会修改 XP。
              </p>
            )}
          </div>

          <div className="levelup-block">
            <h3>生命值</h3>
            <div className="levelup-hp">
              <label className="radio-line">
                <input type="radio" checked={hpMode === 'average'} onChange={() => setHpMode('average')} />
                平均值 +{plan.hpAverage}（d{plan.classDef.hitDie} 平均 {Math.floor(plan.classDef.hitDie / 2) + 1} {plan.conMod >= 0 ? '+' : ''}{plan.conMod} 体质）
              </label>
              <label className="radio-line">
                <input type="radio" checked={hpMode === 'manual'} onChange={() => setHpMode('manual')} />
                手动输入
                {hpMode === 'manual' && (
                  <span className="inline-setting">
                    <NumberField value={hpManual} min={plan.hpMin} max={plan.hpMax} onChange={setHpManual} />
                    <span className="hint">范围 {plan.hpMin}–{plan.hpMax}</span>
                  </span>
                )}
              </label>
              <p className="hint">升级后 HP 上限 +{hpGain}；当前 HP 也会增加相应数值（除非已倒地）。</p>
            </div>
          </div>

          {plan.isSubclassLevel && (
            <div className="levelup-block">
              <h3>{plan.classDef.subclassLabel}</h3>
              <Select
                value={subclass}
                onChange={setSubclass}
                options={plan.classDef.subclasses.map((s) => ({ value: s, label: s }))}
                placeholder="选择子职业"
              />
              <p className="hint">子职业特性不会逐条自动录入，升级后可在特性卡中按名称检索。</p>
            </div>
          )}

          {plan.isAsi && (
            <div className="levelup-block">
              <h3>属性值提升 / 专长</h3>
              <div className="asi-options">
                <label className="radio-line"><input type="radio" checked={asiMode === 'none'} onChange={() => setAsiMode('none')} /> 暂不选择</label>
                <label className="radio-line"><input type="radio" checked={asiMode === 'plus2'} onChange={() => setAsiMode('plus2')} /> 一项 +2</label>
                {asiMode === 'plus2' && (
                  <Select value={asi1} onChange={(v) => setAsi1(v as AbilityKey)} options={ABILITIES.map((a) => ({ value: a.key, label: `${a.name}（当前 ${character.abilities[a.key]}）` }))} />
                )}
                <label className="radio-line"><input type="radio" checked={asiMode === 'plus1s'} onChange={() => setAsiMode('plus1s')} /> 两项各 +1</label>
                {asiMode === 'plus1s' && (
                  <div className="inline-setting">
                    <Select value={asi1} onChange={(v) => setAsi1(v as AbilityKey)} options={ABILITIES.map((a) => ({ value: a.key, label: a.name }))} />
                    <Select value={asi2} onChange={(v) => setAsi2(v as AbilityKey)} options={ABILITIES.filter((a) => a.key !== asi1).map((a) => ({ value: a.key, label: a.name }))} />
                    {invalidAsi && <span className="hint warn-text">请选择两项不同属性</span>}
                  </div>
                )}
                <label className="radio-line"><input type="radio" checked={asiMode === 'feat'} onChange={() => setAsiMode('feat')} /> 选择一个专长</label>
                {asiMode === 'feat' && (
                  <div className="feat-picker">
                    <div className="search-input-wrap">
                      <Search size={14} />
                      <input className="input" value={featQuery} placeholder="搜索专长…" onChange={(e) => setFeatQuery(e.target.value)} />
                    </div>
                    {selectedFeat && (
                      <div className="feat-selected">
                        <Badge tone="green">已选：{selectedFeat.name}</Badge>
                        <button className="link-btn" onClick={() => setSelectedFeat(null)}>清除</button>
                      </div>
                    )}
                    <div className="feat-results">
                      {featLoading ? <span className="hint">搜索中…</span> : featResults.map((r) => (
                        <button key={r.uid} className="feat-result" onClick={() => r.entry && setSelectedFeat(featureFromEntry(r.entry))}>
                          <strong>{r.title}</strong>
                          <span>{r.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="hint">属性上限 20；选择专长时不会自动应用专长内的属性加值，请升级后手动调整。</p>
            </div>
          )}
        </section>

        <aside>
          <div className="levelup-preview">
            <h3><Sparkles size={15} /> 升级预览</h3>
            <div className="preview-row"><span>职业等级</span><strong>{plan.currentLevel} → {plan.newLevel}</strong></div>
            <div className="preview-row"><span>生命上限</span><strong>{character.hp.max} → {character.hp.max + hpGain}</strong></div>
            <div className="preview-row"><span>熟练加值</span><strong>{plan.pbBefore} → {plan.pbAfter}</strong></div>
            {plan.cantripsAfter !== plan.cantripsBefore && (
              <div className="preview-row"><span>已知戏法</span><strong>{plan.cantripsBefore} → {plan.cantripsAfter}</strong></div>
            )}
            {slotDiff.length > 0 && (
              <div className="preview-block">
                <span>法术位变化</span>
                <div className="slot-diff">
                  {slotDiff.map((d) => (
                    <Badge key={d.level} tone={d.delta > 0 ? 'green' : 'red'}>
                      {d.level}环 {d.before} → {d.after}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {plan.newFeatures.length > 0 && (
              <div className="preview-block">
                <span>新特性</span>
                <ul className="preview-features">
                  {plan.newFeatures.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            )}
            {plan.newFeatures.length === 0 && slotDiff.length === 0 && (
              <p className="hint">本级没有新的职业特性或法术位变化，主要获得生命值提升。</p>
            )}
            <div className="preview-note">
              应用后会先通过自动保存写入磁盘；旧版本保存在备份中，可在设置里恢复。
            </div>
          </div>
        </aside>
      </div>
    </Modal>
  )
}
