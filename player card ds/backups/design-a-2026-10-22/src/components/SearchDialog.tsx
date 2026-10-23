import type { Character, SearchResult } from '@/types'
import { Modal } from '@/components/ui'
import { CompendiumExplorer } from '@/components/CompendiumExplorer'

export function SearchDialog({
  open, initialType, initialQuery = '', character, onClose, onInsert,
}: {
  open: boolean
  initialType: string
  initialQuery?: string
  character: Character
  onClose: () => void
  onInsert: (r: SearchResult) => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="检索规则库"
      subtitle="Ctrl+K 随时打开 · 选择条目后可一键加入角色卡"
      huge
    >
      <CompendiumExplorer
        mode="dialog"
        open={open}
        initialType={initialType}
        initialQuery={initialQuery}
        character={character}
        onInsert={onInsert}
        autoFocus
      />
    </Modal>
  )
}
