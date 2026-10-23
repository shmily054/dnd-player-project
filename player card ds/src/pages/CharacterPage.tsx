import type { Character } from '@/types'
import { AbilitiesPanel } from '@/components/AbilitiesPanel'
import { AttackPanel } from '@/components/AttackPanel'
import { CombatPanel } from '@/components/CombatPanel'
import { FeaturesPanel } from '@/components/FeaturesPanel'
import { IdentityPanel } from '@/components/IdentityPanel'
import { InventoryPanel } from '@/components/InventoryPanel'
import { ResourcesPanel } from '@/components/ResourcesPanel'
import { RoleplayPanel } from '@/components/RoleplayPanel'
import { SpellsPanel } from '@/components/SpellsPanel'
import { Btn } from '@/components/ui'
import { Save, Settings } from 'lucide-react'

export function CharacterPage({
  character, patch, saveState, onSaveNow, onOpenSearch, onLevelUp, onRest,
  onOpenSettings, onUploadPortrait, canLevel,
}: {
  character: Character
  patch: (fn: (c: Character) => Character) => void
  saveState: 'saved' | 'dirty' | 'saving' | 'error'
  onSaveNow: () => void
  onOpenSearch: (type: string, query?: string) => void
  onLevelUp: () => void
  onRest: (mode: 'short' | 'long') => void
  onOpenSettings: () => void
  onUploadPortrait: (file: File | undefined) => void
  canLevel: boolean
}) {
  return (
    <div className="page-wrap">
      <div className="space-y-[14px]">
        <IdentityPanel
          character={character}
          patch={patch}
          onUploadPortrait={onUploadPortrait}
          onLevelUp={onLevelUp}
          canLevel={canLevel}
        />
        <div className="sheet-actions">
          <Btn size="sm" variant={saveState === 'error' ? 'danger' : 'ghost'} onClick={onSaveNow}>
            <Save size={12} /> {saveState === 'saved' ? '立即保存' : saveState === 'saving' ? '保存中…' : '重试保存'}
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => onRest('short')}>短休</Btn>
          <Btn size="sm" variant="ghost" onClick={() => onRest('long')}>长休</Btn>
          <Btn size="sm" variant="ghost" onClick={onOpenSettings}><Settings size={12} /> 设置 / 备份</Btn>
          <span className="hint" style={{ marginLeft: 'auto' }}>
            {saveState === 'dirty' ? '有改动，800ms 后自动保存；Ctrl+S 立即保存' : ' Ctrl+K 检索规则库'}
          </span>
        </div>
        <div className="masonry">
          <div className="masonry-col">
            <AbilitiesPanel character={character} patch={patch} />
            <InventoryPanel character={character} patch={patch} onOpenSearch={onOpenSearch} />
          </div>
          <div className="masonry-col">
            <CombatPanel character={character} patch={patch} />
            <SpellsPanel character={character} patch={patch} onOpenSearch={onOpenSearch} />
          </div>
          <div className="masonry-col">
            <AttackPanel character={character} patch={patch} onOpenSearch={onOpenSearch} />
            <FeaturesPanel character={character} patch={patch} onOpenSearch={onOpenSearch} />
            <ResourcesPanel character={character} patch={patch} />
          </div>
        </div>
        <div className="roleplay-wrap">
          <RoleplayPanel character={character} patch={patch} />
        </div>
      </div>
    </div>
  )
}
