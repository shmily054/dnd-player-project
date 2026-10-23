import { useEffect, useState } from 'react'
import { Database, Download, FolderOpen, HardDriveDownload, Moon, RefreshCw, RotateCcw, Sun, Upload, Settings2 } from 'lucide-react'
import type { Character, MetaResponse } from '@/types'
import { api } from '@/lib/api'
import { useToast, Badge, Btn, Field, Modal, TextInput } from '@/components/ui'

export function SettingsDialog({
  open, meta, character, theme, onTheme, onClose, onMeta, onCharacter, onRefreshList, onImportClick, onExport,
}: {
  open: boolean
  meta: MetaResponse | null
  character: Character
  theme: 'light' | 'dark'
  onTheme: (t: 'light' | 'dark') => void
  onClose: () => void
  onMeta: (m: MetaResponse) => void
  onCharacter: (c: Character) => void
  onRefreshList: () => void
  onImportClick: () => void
  onExport: () => void
}) {
  const toast = useToast()
  const [dbDir, setDbDir] = useState('')
  const [savingPath, setSavingPath] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [backups, setBackups] = useState<{ file: string; size: number; savedAt: number }[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)

  useEffect(() => {
    if (!open) return
    setDbDir(meta?.settings.databaseDir || '')
    setLoadingBackups(true)
    api.backups(character.id)
      .then((r) => setBackups(r.backups))
      .catch(() => setBackups([]))
      .finally(() => setLoadingBackups(false))
  }, [open, meta?.settings.databaseDir, character.id])

  const savePath = async () => {
    if (!dbDir.trim()) return
    setSavingPath(true)
    try {
      const res = await api.saveSettings(dbDir.trim())
      if (meta) onMeta({ ...meta, settings: res.settings, database: res.database, compendium: res.compendium, counts: res.compendium.counts })
      toast('数据库路径已更新，索引已重建', 'success')
    } catch (e) {
      toast(`路径无效：${String((e as Error).message || e)}`, 'error')
    } finally {
      setSavingPath(false)
    }
  }

  const rebuild = async () => {
    setRebuilding(true)
    try {
      const comp = await api.rebuild()
      if (meta) onMeta({ ...meta, compendium: comp, counts: comp.counts })
      toast(`索引已重建：${comp.counts.all} 条`, 'success')
    } catch (e) {
      toast(`重建失败：${String((e as Error).message || e)}`, 'error')
    } finally {
      setRebuilding(false)
    }
  }

  const restore = async (file: string) => {
    if (!confirm('用这个备份覆盖当前角色？当前版本会先自动备份。')) return
    try {
      const c = await api.restoreBackup(character.id, file)
      onCharacter(c)
      onRefreshList()
      toast('已从备份恢复', 'success')
    } catch (e) {
      toast(`恢复失败：${String((e as Error).message || e)}`, 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={<><Settings2 size={18} /> 设置与数据</>}
      subtitle="数据库路径、索引、备份和主题"
      footer={<Btn onClick={onClose}>关闭</Btn>}
    >
      <div className="settings-grid">
        <section className="settings-section">
          <h3><Database size={15} /> 规则库数据库</h3>
          <Field label="database 文件夹路径" hint="相对路径以项目根目录为基准；修改后会立即重建索引。">
            <div className="inline-setting">
              <TextInput value={dbDir} onChange={setDbDir} placeholder="../database" />
              <Btn size="sm" variant="primary" onClick={() => void savePath()} disabled={savingPath}>
                {savingPath ? '保存中…' : '保存并重建'}
              </Btn>
            </div>
          </Field>
          <div className="settings-facts">
            <Badge tone={meta?.database.exists ? 'green' : 'red'}>{meta?.database.exists ? '目录可用' : '目录不存在'}</Badge>
            <Badge>{meta?.database.mdCount || 0} 个 Markdown</Badge>
            <Badge tone="gold">{meta?.counts.all || 0} 条结构化条目</Badge>
          </div>
          <div className="settings-actions">
            <Btn size="sm" onClick={() => void rebuild()} disabled={rebuilding}>
              <RefreshCw size={12} className={rebuilding ? 'animate-spin' : ''} /> 重建索引
            </Btn>
          </div>
          {meta?.compendium.warnings?.length ? (
            <details className="settings-warnings">
              <summary>{meta.compendium.warnings.length} 条解析警告</summary>
              <ul>{meta.compendium.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </details>
          ) : null}
        </section>

        <section className="settings-section">
          <h3><HardDriveDownload size={15} /> 角色数据</h3>
          <p className="hint" style={{ wordBreak: 'break-all' }}>
            角色存档：{meta?.dataDir || 'data'}/characters/{character.id}.json
          </p>
          <div className="settings-actions">
            <Btn size="sm" onClick={onExport}><Download size={12} /> 导出 JSON</Btn>
            <Btn size="sm" onClick={onImportClick}><Upload size={12} /> 导入 JSON</Btn>
          </div>
          <p className="hint">每次自动保存前会在 data/backups/{character.id}/ 保留一份旧版本，最多 30 份。</p>
          <div className="backup-list">
            <div className="inline-setting" style={{ marginBottom: 5 }}>
              <strong style={{ fontSize: '0.78rem' }}>备份</strong>
              {loadingBackups && <span className="hint">读取中…</span>}
            </div>
            {backups.length === 0 && !loadingBackups && <span className="hint">还没有备份；第一次修改后会自动生成。</span>}
            {backups.slice(0, 8).map((b) => (
              <div className="backup-row" key={b.file}>
                <span>{new Date(b.savedAt).toLocaleString('zh-CN')}</span>
                <span className="hint">{(b.size / 1024).toFixed(1)} KB</span>
                <Btn size="sm" variant="ghost" onClick={() => void restore(b.file)}><RotateCcw size={12} /> 恢复</Btn>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3><Sun size={15} /> 外观</h3>
          <div className="theme-toggle">
            <button className={`theme-choice ${theme === 'light' ? 'active' : ''}`} onClick={() => onTheme('light')}><Sun size={16} /> 羊皮纸</button>
            <button className={`theme-choice ${theme === 'dark' ? 'active' : ''}`} onClick={() => onTheme('dark')}><Moon size={16} /> 墨夜</button>
          </div>
        </section>

        <section className="settings-section">
          <h3><FolderOpen size={15} /> 使用提示</h3>
          <ul className="settings-tips">
            <li>所有卡面字段都可以直接编辑，自动保存到磁盘。</li>
            <li>Ctrl+K 检索规则库；在法术、物品、特性面板中也有检索添加按钮。</li>
            <li>规则库只读；如果修正 Markdown 原文，点击「重建索引」即可更新。</li>
            <li>数据库正文有少量 PDF 两栏串行；结构化字段和 PDF 页码可用于回溯。</li>
          </ul>
        </section>
      </div>
    </Modal>
  )
}
