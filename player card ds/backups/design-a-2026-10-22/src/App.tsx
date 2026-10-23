import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BookOpen, Download, Moon, MoonStar, Plus, Search, Settings,
  Sun, Trash2, Copy, ArrowUpCircle, ScrollText,
} from 'lucide-react'
import type { Character, CharacterSummary, MetaResponse, SearchResult } from '@/types'
import { api } from '@/lib/api'
import { useHashRoute, parseRoute } from '@/lib/router'
import { insertEntry } from '@/lib/insert'
import { autoResourcesForLevel, getClassDef, suggestedSpellSlots, uid, xpInfo } from '@/lib/calc'
import { CharacterPage } from '@/pages/CharacterPage'
import { RulebookPage } from '@/pages/RulebookPage'
import { QuickRulesPage } from '@/pages/QuickRulesPage'
import { SearchDialog } from '@/components/SearchDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { LevelUpDialog } from '@/components/LevelUpDialog'
import { RestDialog } from '@/components/RestDialog'
import { NewCharacterDialog } from '@/components/NewCharacterDialog'
import { Btn, useToast } from '@/components/ui'

type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

export default function App() {
  const toast = useToast()
  const { hash, navigate } = useHashRoute()
  const route = parseRoute(hash)
  const [meta, setMeta] = useState<MetaResponse | null>(null)
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [character, setCharacter] = useState<Character | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('dnd-theme') === 'dark' ? 'dark' : 'light'))
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchType, setSearchType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [levelUpOpen, setLevelUpOpen] = useState(false)
  const [restMode, setRestMode] = useState<'short' | 'long' | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [booting, setBooting] = useState(true)
  const charRef = useRef<Character | null>(null)
  const savingRef = useRef(false)
  const importRef = useRef<HTMLInputElement>(null)
  const saveRef = useRef<() => Promise<void>>(async () => {})

  charRef.current = character

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('dnd-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1b1916' : '#f3ead6')
  }, [theme])

  const refreshList = useCallback(async () => {
    const r = await api.listCharacters()
    setCharacters(r.characters)
    return r.characters
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const m = await api.meta()
        if (cancelled) return
        setMeta(m)
        let list = (await api.listCharacters()).characters
        if (!list.length) {
          const created = await api.createCharacter({ name: '新角色' })
          list = (await api.listCharacters()).characters
          setCharacter(created)
          charRef.current = created
          navigate(`#/char/${created.id}`)
        }
        setCharacters(list)
      } catch (e) {
        toast(`加载失败：${String((e as Error).message || e)}`, 'error')
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => { cancelled = true }
  }, [navigate, toast])

  const save = useCallback(async () => {
    const target = charRef.current
    if (!target || savingRef.current) return
    savingRef.current = true
    setSaveState('saving')
    try {
      const saved = await api.saveCharacter(target)
      if (charRef.current === target) {
        charRef.current = saved
        setCharacter(saved)
        setSaveState('saved')
        const list = await api.listCharacters()
        setCharacters(list.characters)
      } else {
        setSaveState('dirty')
      }
    } catch (e) {
      setSaveState('error')
      toast(`保存失败：${String((e as Error).message || e)}`, 'error')
    } finally {
      savingRef.current = false
    }
  }, [toast])
  saveRef.current = save

  useEffect(() => {
    if (saveState !== 'dirty') return
    const t = window.setTimeout(() => { void saveRef.current() }, 800)
    return () => window.clearTimeout(t)
  }, [saveState, character])

  useEffect(() => {
    if (saveState === 'saved' || saveState === 'saving') return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [saveState])

  const patch = useCallback((fn: (c: Character) => Character) => {
    const cur = charRef.current
    if (!cur) return
    const next = fn(cur)
    charRef.current = next
    setCharacter(next)
    setSaveState('dirty')
  }, [])

  /** 切换当前角色：先更新 ref，再改 hash，避免路由 effect 把旧角色重新选回来 */
  const adoptCharacter = useCallback((c: Character) => {
    charRef.current = c
    setCharacter(c)
    setSaveState('saved')
    navigate(`#/char/${c.id}`)
  }, [navigate])

  const selectCharacter = useCallback(async (id: string) => {
    if (!id || id === charRef.current?.id) return
    if (saveState === 'dirty') await saveRef.current()
    try {
      const c = await api.getCharacter(id)
      charRef.current = c
      setCharacter(c)
      setSaveState('saved')
      navigate(`#/char/${c.id}`)
    } catch (e) {
      toast(`读取角色失败：${String((e as Error).message || e)}`, 'error')
    }
  }, [navigate, saveState, toast])

  // 根据 hash 选择角色
  useEffect(() => {
    if (!characters.length) return
    if (route.page !== 'char') return
    const id = route.rest[0]
    if (id) {
      if (id !== charRef.current?.id) void selectCharacter(id)
    } else if (!charRef.current) {
      void selectCharacter(characters[0].id)
    }
  }, [hash, characters, route.page, selectCharacter])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchType('all')
        setSearchQuery('')
        setSearchOpen(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openSearch = useCallback((type = 'all', query = '') => {
    setSearchType(type)
    setSearchQuery(query)
    setSearchOpen(true)
  }, [])

  const handleInsert = useCallback((result: SearchResult) => {
    if (!result.entry) {
      toast('该结果没有可插入的结构化数据', 'info')
      return
    }
    const cur = charRef.current
    if (!cur) return
    const res = insertEntry(cur, result.entry)
    if (res.changed) patch(() => res.character)
    toast(res.message, res.tone || 'success')
    if (res.changed) setSearchOpen(false)
  }, [patch, toast])

  const createNew = useCallback(async (body: { name: string; className: string; subclass: string }) => {
    const def = getClassDef(body.className)
    if (!def) return
    const base = await api.createCharacter({
      name: body.name || '新角色',
      classes: [{ name: def.name, subclass: body.subclass, level: 1, hitDie: def.hitDie }],
      saveProfs: def.saves,
      armorProfs: def.armorProfs,
      weaponProfs: def.weaponProfs,
      languages: ['通用语'],
      spellcasting: { ability: def.spellAbility || 'int', slots: {}, pactSlots: null, spells: [] },
    })
    const temp = {
      ...base,
      classes: [{ name: def.name, subclass: body.subclass, level: 1, hitDie: def.hitDie }],
    }
    const hp = Math.max(1, def.hitDie + Math.floor((base.abilities.con - 10) / 2))
    const slots = suggestedSpellSlots(temp)
    const startingFeatures = (def.levels[0]?.features || []).map((f) => ({
      id: uid('feat'),
      name: f,
      source: def.name,
      level: 1,
      description: '',
      auto: true,
      searchName: f.replace(/[（(].*$/, '').trim(),
    }))
    if (body.subclass && def.subclassLevel === 1) {
      startingFeatures.push({
        id: uid('feat'),
        name: `${def.subclassLabel}：${body.subclass}`,
        source: def.name,
        level: def.subclassLevel,
        description: '子职业特性请到规则库检索并添加。',
        auto: true,
        searchName: body.subclass,
      })
    }
    const next: Character = {
      ...base,
      hp: { max: hp, current: hp, temp: 0 },
      hitDice: { remaining: 1 },
      spellcasting: {
        ...base.spellcasting,
        ability: def.spellAbility || 'int',
        slots: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [String(i + 1), { total: slots.slots[i] || 0, used: 0 }])),
        pactSlots: slots.pact ? { total: slots.pact.count, used: 0, level: slots.pact.level } : null,
      },
      resources: autoResourcesForLevel(def, 1, temp),
      features: startingFeatures,
      speed: 30,
    }
    const saved = await api.saveCharacter(next)
    adoptCharacter(saved)
    setNewOpen(false)
    toast(`已创建${def.name}「${saved.name}」`, 'success')
    await refreshList()
  }, [navigate, refreshList, toast])

  const deleteCurrent = async () => {
    const c = charRef.current
    if (!c) return
    if (!confirm(`确定删除角色「${c.name}」？角色文件和头像会被删除，备份仍保留。`)) return
    try {
      await api.deleteCharacter(c.id)
      const list = (await api.listCharacters()).characters
      if (list.length) {
        const first = await api.getCharacter(list[0].id)
        adoptCharacter(first)
      } else {
        const created = await api.createCharacter({ name: '新角色' })
        adoptCharacter(created)
      }
      await refreshList()
      toast('角色已删除', 'success')
    } catch (e) {
      toast(`删除失败：${String((e as Error).message || e)}`, 'error')
    }
  }

  const duplicateCurrent = async () => {
    const c = charRef.current
    if (!c) return
    try {
      const copy = await api.duplicateCharacter(c.id)
      adoptCharacter(copy)
      toast('已创建角色副本', 'success')
      await refreshList()
    } catch (e) {
      toast(`复制失败：${String((e as Error).message || e)}`, 'error')
    }
  }

  const importJson = async (file: File | undefined) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      const c = await api.createCharacter(data)
      adoptCharacter(c)
      toast(`已导入角色「${c.name}」`, 'success')
      await refreshList()
    } catch (e) {
      toast(`导入失败：${String((e as Error).message || e)}`, 'error')
    }
  }

  const exportJson = () => {
    const c = charRef.current
    if (!c) return
    const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${c.name || 'character'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const uploadPortrait = async (file: File | undefined) => {
    if (!file) return
    const c = charRef.current
    if (!c) return
    try {
      const dataUrl = await resizeImage(file)
      const updated = await api.uploadPortrait(c.id, dataUrl)
      charRef.current = updated
      setCharacter(updated)
      setSaveState('saved')
      toast('头像已更新', 'success')
    } catch (e) {
      toast(`头像上传失败：${String((e as Error).message || e)}`, 'error')
    }
  }

  const handleAuditAction = (issueId: string) => {
    patch((c) => {
      const issue = c.audit.find((a) => a.id === issueId)
      if (!issue?.action) return c
      const next: Character = JSON.parse(JSON.stringify(c))
      const a = issue.action
      if (a.type === 'set-resource-total') {
        const r = next.resources.find((x) => x.id === a.resourceId)
        if (r) r.total = a.total
      } else if (a.type === 'set-resource-reset') {
        const r = next.resources.find((x) => x.id === a.resourceId)
        if (r) r.reset = a.reset
      } else if (a.type === 'convert-spell-to-feature') {
        const idx = next.spellcasting.spells.findIndex((s) => s.id === a.spellId)
        if (idx >= 0) {
          const s = next.spellcasting.spells[idx]
          next.spellcasting.spells.splice(idx, 1)
          next.features.push({
            id: `feature-smite-${Date.now()}`,
            name: s.name,
            source: '圣武士',
            level: 2,
            description: s.note || s.description || '至圣斩消耗法术位，在近战武器命中时造成额外光耀伤害。',
            searchName: s.name,
          })
        }
      }
      const target = next.audit.find((x) => x.id === issueId)
      if (target) target.status = 'applied'
      return next
    })
    toast('已应用校对建议', 'success')
  }

  const handleIgnoreAudit = (issueId: string) => {
    patch((c) => {
      const next: Character = JSON.parse(JSON.stringify(c))
      const a = next.audit.find((x) => x.id === issueId)
      if (a) a.status = 'ignored'
      return next
    })
  }

  if (booting) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center space-y-3">
          <ScrollText size={34} className="mx-auto text-[var(--gold)]" />
          <p className="serif text-lg text-[var(--brown)]">正在展开冒险者档案…</p>
        </div>
      </div>
    )
  }

  const saveLabel = saveState === 'saved' ? '已保存' : saveState === 'saving' ? '保存中…' : saveState === 'dirty' ? '有改动' : '保存失败'
  const currentId = character?.id || ''
  const canLevel = character ? xpInfo(character).canLevel : false

  const goSection = (id: string) => {
    navigate(`#/char/${currentId}`)
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => navigate(`#/char/${currentId}`)} role="button" tabIndex={0}>
          <span className="brand-mark">D</span>
          <span>角色卡 · 规则库</span>
        </div>
        <nav className="nav-tabs">
          <button className={`nav-tab ${route.page === 'char' ? 'active' : ''}`} onClick={() => navigate(`#/char/${currentId}`)}>角色卡</button>
          <button className={`nav-tab ${route.page === 'rules' ? 'active' : ''}`} onClick={() => navigate('#/rules')}>规则库</button>
          <button className={`nav-tab ${route.page === 'quick' ? 'active' : ''}`} onClick={() => navigate('#/quick')}>速查</button>
        </nav>
        <div className="topbar-spacer" />
        <div className="character-switch">
          <select value={currentId} onChange={(e) => void selectCharacter(e.target.value)} title="切换角色">
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.classLine || `${c.level} 级`}</option>
            ))}
          </select>
          <button className="mini-btn" title="新建角色" onClick={() => setNewOpen(true)}><Plus size={14} /></button>
          <button className="mini-btn" title="复制角色" onClick={() => void duplicateCurrent()}><Copy size={13} /></button>
          <button className="mini-btn" title="删除角色" onClick={() => void deleteCurrent()}><Trash2 size={13} /></button>
        </div>
        <div className="top-actions">
          <span className={`save-pill ${saveState}`}>
            <span className="save-dot" />
            {saveLabel}
          </span>
          <Btn variant="primary" size="sm" onClick={() => openSearch('all')} title="检索规则库 (Ctrl+K)">
            <Search size={14} /> <span className="hidden sm:inline">检索</span>
          </Btn>
          <Btn size="sm" onClick={() => setRestMode('short')} title="短休"><Moon size={14} /> <span className="hidden md:inline">短休</span></Btn>
          <Btn size="sm" onClick={() => setRestMode('long')} title="长休"><MoonStar size={14} /> <span className="hidden md:inline">长休</span></Btn>
          <Btn size="sm" variant={canLevel ? 'gold' : 'secondary'} className={canLevel ? 'level-up-pulse' : ''} onClick={() => setLevelUpOpen(true)} title="升级">
            <ArrowUpCircle size={14} /> <span className="hidden md:inline">升级</span>
          </Btn>
          <Btn size="icon" variant="ghost" onClick={() => setSettingsOpen(true)} title="设置与备份"><Settings size={16} /></Btn>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => { void importJson(e.target.files?.[0]); e.target.value = '' }} />
        </div>
      </header>

      {route.page === 'rules' ? (
        <RulebookPage
          character={character}
          onInsert={handleInsert}
          onOpenSearch={(type, q) => openSearch(type, q || '')}
        />
      ) : route.page === 'quick' ? (
        <QuickRulesPage onOpenSearch={(type, q) => openSearch(type, q || '')} />
      ) : character ? (
        <CharacterPage
          character={character}
          patch={patch}
          saveState={saveState}
          onSaveNow={() => void saveRef.current()}
          onOpenSearch={openSearch}
          onLevelUp={() => setLevelUpOpen(true)}
          onRest={(mode) => setRestMode(mode)}
          onOpenSettings={() => setSettingsOpen(true)}
          onUploadPortrait={(f) => void uploadPortrait(f)}
          onAuditAction={handleAuditAction}
          onIgnoreAudit={handleIgnoreAudit}
          canLevel={canLevel}
        />
      ) : (
        <div className="page-wrap">
          <div className="empty">没有可显示的角色。</div>
        </div>
      )}

      <nav className="mobile-nav">
        <button onClick={() => navigate(`#/char/${currentId}`)} className={route.page === 'char' ? 'active' : ''}><ScrollText size={16} />角色</button>
        <button onClick={() => goSection('spells')}><BookOpen size={16} />法术</button>
        <button onClick={() => goSection('inventory')}><Download size={16} />物品</button>
        <button onClick={() => goSection('features')}><SparkIcon />特性</button>
        <button onClick={() => navigate('#/rules')} className={route.page === 'rules' ? 'active' : ''}><Search size={16} />规则</button>
        <button onClick={() => navigate('#/quick')} className={route.page === 'quick' ? 'active' : ''}><Sun size={16} />速查</button>
      </nav>

      {character && (
        <>
          <SearchDialog
            open={searchOpen}
            initialType={searchType}
            initialQuery={searchQuery}
            character={character}
            onClose={() => setSearchOpen(false)}
            onInsert={handleInsert}
          />
          <LevelUpDialog
            open={levelUpOpen}
            character={character}
            onClose={() => setLevelUpOpen(false)}
            onApply={(next, summary) => {
              patch(() => next)
              setLevelUpOpen(false)
              toast(summary.join('；'), 'success')
            }}
          />
          <RestDialog
            open={restMode !== null}
            mode={restMode || 'long'}
            character={character}
            onClose={() => setRestMode(null)}
            onApply={(next, summary) => {
              patch(() => next)
              setRestMode(null)
              toast(summary.join('；'), 'success')
            }}
          />
          <SettingsDialog
            open={settingsOpen}
            meta={meta}
            character={character}
            theme={theme}
            onTheme={setTheme}
            onClose={() => setSettingsOpen(false)}
            onMeta={(m) => setMeta(m)}
            onCharacter={(c) => { charRef.current = c; setCharacter(c); setSaveState('saved') }}
            onRefreshList={() => void refreshList()}
            onImportClick={() => { setSettingsOpen(false); importRef.current?.click() }}
            onExport={exportJson}
          />
        </>
      )}

      <NewCharacterDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={(body) => void createNew(body)}
      />

      {meta?.compendium.error && (
        <div className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-[var(--red)] bg-[var(--red-soft)] px-4 py-2 text-xs text-[var(--red)] shadow-lg">
          规则库索引异常：{meta.compendium.error}
        </div>
      )}
    </div>
  )
}

function SparkIcon() {
  return <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span>
}

async function resizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const max = 512
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法处理图片')
  ctx.fillStyle = '#f3ead6'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.88)
}
